import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';
import { Alert } from 'react-native';

const BONUS_AMOUNT = 1000;
const BONUS_COOLDOWN_HOURS = 24;

export const useHubData = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);

    // Data States
    const [weeklyTop, setWeeklyTop] = useState<any[]>([]);
    const [legendaryTop, setLegendaryTop] = useState<any[]>([]);
    const [myBestWin, setMyBestWin] = useState<number>(0);
    const [dailyBonusAvailable, setDailyBonusAvailable] = useState(false);
    const [nextBonusTime, setNextBonusTime] = useState<Date | null>(null);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            // 1. Fetch Profile for Bonus Check
            const { data: profile } = await supabase
                .from('profiles')
                .select('credits, last_daily_bonus')
                .eq('id', user.id)
                .single();

            if (profile) {
                checkBonusStatus(profile.last_daily_bonus);
            }

            // 2. Weekly Leaderboard
            const { data: weekly } = await supabase
                .from('weekly_leaderboard')
                .select('*')
                .limit(5);
            setWeeklyTop(weekly || []);

            // 3. Legendary Hits (Top 1)
            const { data: legendary } = await supabase
                .from('legendary_wins')
                .select('*')
                .limit(1);
            setLegendaryTop(legendary || []);

            // 4. My Stats
            const { data: myStats } = await supabase
                .from('bet_history')
                .select('outcome')
                .eq('user_id', user.id)
                .order('outcome', { ascending: false })
                .limit(1)
                .single();

            if (myStats) {
                setMyBestWin(myStats.outcome);
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
            // We need to fetch current credits first or use an RPC. 
            // For simplicity, let's just do a direct update. Race conditions are minor risk here.
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
            fetchData(); // Refresh

        } catch (e: any) {
            Alert.alert("Error", e.message);
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
        loading
    };
};
