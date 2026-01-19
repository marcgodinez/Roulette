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

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            // 1. Fetch Profile for Bonus Check + Username
            const { data: profile, error: fetchError } = await supabase
                .from('profiles')
                .select('credits, last_daily_bonus, username')
                .eq('id', user.id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('[HubData] Error fetching profile:', fetchError);
            }

            if (profile) {
                console.log('[HubData] Profile loaded:', profile);
                checkBonusStatus(profile.last_daily_bonus);
                setUsername(profile.username);
            } else {
                console.warn('[HubData] Profile missing or hidden. Attempting safe create/recover...');

                // Fallback: Upsert Profile (Do NOT overwrite if exists)
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
                    console.log('[HubData] Profile checked/created. Retrying fetch...');
                    setUsername(usernameFromMeta);
                    setDailyBonusAvailable(true);
                    // Optionally trigger a re-fetch here if we want to be sure
                }
            }
            // ... rest of fetch data (Weekly, Legendary, MyStats) same as before or slightly shifted logic inside try block
            // 2. Weekly Leaderboard
            const { data: weekly, error: weeklyError } = await supabase
                .from('weekly_leaderboard')
                .select('*')
                .limit(5);

            if (weeklyError) console.error('Weekly Leaderboard Error:', weeklyError);
            setWeeklyTop(weekly || []);

            // 3. Legendary Hits (Top 1)
            const { data: legendary, error: legendaryError } = await supabase
                .from('legendary_wins')
                .select('*')
                .limit(1);

            if (legendaryError) console.error('Legendary Wins Error:', legendaryError);
            setLegendaryTop(legendary || []);

            // 4. My Stats
            const { data: myStats, error: myStatsError } = await supabase
                .from('bet_history')
                .select('total_win')
                .eq('user_id', user.id)
                .order('total_win', { ascending: false })
                .limit(1)
                .single();

            if (myStatsError && myStatsError.code !== 'PGRST116') {
                console.error('My Best Win Error:', myStatsError);
            }

            if (myStats) {
                setMyBestWin(myStats.total_win);
            }

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
        username, // Expose username
        claimAdReward
    };
};
