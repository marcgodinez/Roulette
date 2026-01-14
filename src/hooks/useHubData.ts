import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';
import { Alert } from 'react-native';
import { NotificationManager } from '../services/NotificationManager';

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
            // 1. Update Profile (Add Credits + Set Timestamp)
            const { data: profile } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', user.id)
                .single();

            if (!profile) return;

            const newCredits = (profile.credits || 0) + BONUS_AMOUNT;
            const now = new Date().toISOString();

            const { error } = await supabase
                .from('profiles')
                .update({ credits: newCredits, last_daily_bonus: now })
                .eq('id', user.id);

            if (error) throw error;

            Alert.alert("Daily Bonus", `You claimed ${BONUS_AMOUNT} credits!`);
            NotificationManager.scheduleBonusNotification();
            fetchData();
        } catch (e: any) {
            Alert.alert("Error", e.message);
        }
    };

    const claimAdReward = async () => {
        if (!user) return;
        try {
            const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
            if (!profile) return;

            const newCredits = (profile.credits || 0) + 500; // 500 Coins for Ad
            const { error } = await supabase.from('profiles').update({ credits: newCredits }).eq('id', user.id);

            if (error) throw error;

            Alert.alert("Reward Earned", "You received 500 coins!");
            fetchData();
        } catch (e: any) {
            console.error("Ad Reward Error", e);
            Alert.alert("Error", "Could not claim reward.");
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
