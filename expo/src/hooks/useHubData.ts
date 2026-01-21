import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';
import { Alert } from 'react-native';
import { NotificationManager } from '../services/NotificationManager';
import { apiClient } from '../services/ApiClient';

const BONUS_AMOUNT = 1000;
const BONUS_COOLDOWN_HOURS = 24;

export const useHubData = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    // ...

    useEffect(() => {
        // Request Permissions on mount
        NotificationManager.registerForPushNotificationsAsync();
    }, []);

    // Data States
    const [weeklyTop, setWeeklyTop] = useState<any[]>([]);
    const [legendaryTop, setLegendaryTop] = useState<any[]>([]);
    const [myBestWin, setMyBestWin] = useState<number>(0);
    const [dailyBonusAvailable, setDailyBonusAvailable] = useState(false);
    const [nextBonusTime, setNextBonusTime] = useState<Date | null>(null);
    const [username, setUsername] = useState<string | null>(null);

    // League States
    const [myLeague, setMyLeague] = useState<any | null>(null);
    const [leagueLeaderboard, setLeagueLeaderboard] = useState<any[]>([]);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            // 1. Fetch Profile
            const profile = await apiClient.fetchUserProfile();

            if (profile) {
                console.log('[HubData] Profile loaded:', profile);
                checkBonusStatus(profile.last_daily_bonus);
                setUsername(profile.username);
            } else {
                console.warn('[HubData] Profile missing. Attempting safe create/recover...');
                // Fallback: Upsert Profile
                const usernameFromMeta = user.user_metadata?.username || user.email?.split('@')[0] || 'Player';
                const { error: insertError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        email: user.email,
                        username: usernameFromMeta,
                        credits: 1000
                    }, { onConflict: 'id', ignoreDuplicates: true });

                if (insertError) {
                    console.error('[HubData] Profile creation/recovery failed:', insertError);
                } else {
                    console.log('[HubData] Profile checked/created.');
                    setUsername(usernameFromMeta);
                    setDailyBonusAvailable(true);
                }
            }

            // 2. Match League Logic
            const leagueEntry = await apiClient.fetchMyLeague();
            setMyLeague(leagueEntry);

            let leagueBoard: any[] = [];
            if (leagueEntry) {
                leagueBoard = await apiClient.fetchLeagueLeaderboard(leagueEntry.tier, leagueEntry.division);
            } else {
                // Default to Iron 4 view
                leagueBoard = await apiClient.fetchLeagueLeaderboard('IRON', 4);
            }
            setLeagueLeaderboard(leagueBoard);

            // 3. Other Leaderboards & Stats
            const [weekly, legendary, bestWin] = await Promise.all([
                apiClient.fetchWeeklyLeaderboard(),
                apiClient.fetchLegendaryWins(),
                apiClient.fetchMyBestWin()
            ]);

            setWeeklyTop(weekly);
            setLegendaryTop(legendary);
            setMyBestWin(bestWin);


        } catch (error) {
            console.error('Error fetching hub data:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const checkBonusStatus = (lastBonusStr: string | null) => {
        if (!lastBonusStr) {
            setDailyBonusAvailable(true);
            return;
        }

        const lastBonus = new Date(lastBonusStr);
        const now = new Date();
        const diffMs = now.getTime() - lastBonus.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours >= BONUS_COOLDOWN_HOURS) {
            setDailyBonusAvailable(true);
        } else {
            setDailyBonusAvailable(false);
            // Calculate next time
            const nextTime = new Date(lastBonus.getTime() + (BONUS_COOLDOWN_HOURS * 60 * 60 * 1000));
            setNextBonusTime(nextTime);
        }
    };

    const claimBonus = async () => {
        if (!user || !dailyBonusAvailable) return;

        try {
            const result = await apiClient.claimDailyBonus();

            if (result) {
                Alert.alert("Daily Bonus", `You claimed ${result.reward} credits!`);
                NotificationManager.scheduleBonusNotification();
                fetchData();
            }
        } catch (e: any) {
            // Already alerted in ApiClient? No, apiClient catches and alerts.
            // But if it returned null, we might want to ensure we don't double alert if possible, 
            // but ApiClient handles generic errors.
        }
    };

    const claimAdReward = async () => {
        if (!user) return;
        try {
            const result = await apiClient.claimAdReward();

            if (result) {
                Alert.alert("Reward Earned", `You received ${result.reward} coins!`);
                fetchData();
            }
        } catch (e: any) {
            console.error("Ad Reward Error", e);
        }
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        weeklyTop,
        legendaryTop,
        myBestWin,
        dailyBonusAvailable,
        nextBonusTime,
        claimBonus,
        refresh: fetchData,
        loading,
        username,
        claimAdReward,
        myLeague,
        leagueLeaderboard
    };
};
