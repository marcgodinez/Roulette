import { supabase } from './supabase';
import { Alert } from 'react-native';
import { SavedStrategy } from '../types';
import { Config } from '../config/Config';

export interface SpinResult {
    winningNumber: number;
    fireNumbers: number[];
    totalWin: number;
    newBalance: number;
    bonusStake: number;
    xpEarned: number;
    newLevel: number;
    levelUpBonus: number;
    error?: string;
}

export interface BonusResult {
    success: boolean;
    newBalance: number;
    reward: number;
    error?: string;
}

class ApiClient {
    /**
     * Helper to get the current session token for custom headers
     */
    private async getCustomAuthHeader(): Promise<{ 'x-custom-auth': string }> {
        const { data: { session } } = await supabase.auth.getSession();
        return {
            'x-custom-auth': session?.access_token || ''
        };
    }

    /**
     * Calls the 'spin' Edge Function
     */
    /**
     * Calls the 'spin' Edge Function
     * Uses raw fetch to ensure headers match Android implementation exactly (Auth = AnonKey, x-custom-auth = UserToken)
     */
    async spin(bets: Record<string, number>): Promise<SpinResult | null> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            if (!token) {
                console.error('[API] Spin Failed: No active session');
                Alert.alert('Error', 'Please log in to play');
                return null;
            }

            console.log('[ApiClient] Spinning with bets:', JSON.stringify(bets));

            const response = await fetch(`${Config.SUPABASE_URL}/functions/v1/spin`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${Config.SUPABASE_ANON_KEY}`,
                    'apikey': Config.SUPABASE_ANON_KEY,
                    'x-custom-auth': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ bets })
            });

            console.log('[ApiClient] Spin response status:', response.status);
            const data = await response.json();
            console.log('[ApiClient] Spin response data:', JSON.stringify(data));

            if (!response.ok) {
                throw new Error(data.error || `Server Error: ${response.status}`);
            }

            if (data.error) throw new Error(data.error);

            return data as SpinResult;
        } catch (e: any) {
            console.error('[API] Spin Failed:', e);
            Alert.alert('Error', e.message || 'Failed to connect to server');
            return null;
        }
    }

    /**
     * Calls the 'claim-bonus' Edge Function
     */
    async claimDailyBonus(): Promise<BonusResult | null> {
        try {
            const headers = await this.getCustomAuthHeader();
            const { data, error } = await supabase.functions.invoke('claim-bonus', {
                headers
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            return data as BonusResult;
        } catch (e: any) {
            console.error('[API] Claim Bonus Failed:', e);
            Alert.alert('Bonus Error', e.message || 'Could not claim bonus');
            return null;
        }
    }

    /**
     * Calls the 'ad-reward' Edge Function
     */
    async claimAdReward(token?: string): Promise<BonusResult | null> {
        try {
            const headers = await this.getCustomAuthHeader();
            const { data, error } = await supabase.functions.invoke('ad-reward', {
                body: { token },
                headers
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            return data as BonusResult;
        } catch (e: any) {
            console.error('[API] Ad Reward Failed:', e);
            return null;
        }
    }

    /**
     * Calls the 'purchase-pack' Edge Function
     */
    async purchasePack(amount: number, productId: string, transactionId: string): Promise<BonusResult | null> {
        try {
            const headers = await this.getCustomAuthHeader();
            const { data, error } = await supabase.functions.invoke('purchase-pack', {
                body: { amount, productId, transactionId },
                headers
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            return data as BonusResult;
        } catch (e: any) {
            console.error('[API] Purchase Pack Failed:', e);
            Alert.alert('Purchase Error', e.message || 'Failed to process purchase');
            return null;
        }
    }

    // --- Database Operations ---

    async fetchGameHistory(limit: number = 100): Promise<{ number: number; isFire: boolean; multiplier: number | null }[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('bet_history')
            .select('winning_number, is_fire, multiplier')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[API] Fetch History Failed:', error);
            return [];
        }

        return (data || []).map((d: any) => ({
            number: d.winning_number,
            isFire: d.is_fire || false,
            multiplier: d.multiplier
        }));
    }

    async fetchStrategies(): Promise<SavedStrategy[]> {
        const { data, error } = await supabase
            .from('saved_strategies')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[API] Fetch Strategies Failed:', error);
            return [];
        }
        return data as SavedStrategy[];
    }

    async saveStrategy(name: string, betsToSave: Record<string, number>, color: string): Promise<SavedStrategy | null> {
        const total_cost = Object.values(betsToSave).reduce((a, b) => a + b, 0);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('saved_strategies')
            .insert({
                user_id: user.id,
                name,
                bet_data: betsToSave,
                color_code: color,
                total_cost
            })
            .select()
            .single();

        if (error) {
            console.error('[API] Save Strategy Failed:', error);
            Alert.alert('Error', 'Failed to save strategy');
            return null;
        }
        return data as SavedStrategy;
    }

    async deleteStrategy(id: string): Promise<boolean> {
        const { error } = await supabase.from('saved_strategies').delete().eq('id', id);
        if (error) {
            console.error('[API] Delete Strategy Failed:', error);
            return false;
        }
        return true;
    }

    async fetchUserProfile(): Promise<any | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('credits, is_vip, is_ad_free, vip_expiry, last_daily_bonus, username, xp')
            .eq('id', user.id)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') {
                console.error('[API] Fetch Profile Failed:', error);
            }
            return null;
        }
        return data;
    }

    async fetchMyLeague(): Promise<any | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('league_entries')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') {
                console.error('[API] Fetch My League Failed:', error);
            }
            return null;
        }
        return data;
    }

    async fetchLeagueLeaderboard(tier: string, division: number): Promise<any[]> {
        // Fetch top 50 in this specific league cohort
        const { data, error } = await supabase
            .from('league_entries')
            .select('*, profiles:user_id(username)')
            .eq('tier', tier)
            .eq('division', division)
            .order('weekly_profit', { ascending: false })
            .limit(50);

        if (error) {
            console.error('[API] Fetch League Leaderboard Failed:', error);
            return [];
        }

        // Flatten structure for easier consumption
        return (data || []).map((entry: any) => ({
            ...entry,
            username: entry.profiles?.username || 'Unknown Player'
        }));
    }

    async fetchWeeklyLeaderboard(): Promise<any[]> {
        const { data, error } = await supabase
            .from('weekly_leaderboard')
            .select('*')
            .limit(5);

        if (error) {
            console.error('[API] Fetch Weekly Leaderboard Failed:', error);
            return [];
        }
        return data || [];
    }

    async fetchLegendaryWins(): Promise<any[]> {
        const { data, error } = await supabase
            .from('legendary_wins')
            .select('*')
            .limit(1);

        if (error) {
            console.error('[API] Fetch Legendary Wins Failed:', error);
            return [];
        }
        return data || [];
    }

    async fetchMyBestWin(): Promise<number> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return 0;

        const { data, error } = await supabase
            .from('bet_history')
            .select('total_win')
            .eq('user_id', user.id)
            .order('total_win', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') {
                console.error('[API] Fetch Best Win Failed:', error);
            }
            return 0;
        }
        return data?.total_win || 0;
    }

    async recordGameResult(winningNumber: number, isFire: boolean, multiplier: number, totalWin: number): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('bet_history').insert({
            user_id: user.id,
            winning_number: winningNumber,
            is_fire: isFire,
            multiplier: multiplier,
            outcome: totalWin,
            amount: 0 // Bonus Game context
        });

        if (error) {
            console.error('[API] Record Game Result Failed:', error);
        }
    }

    async getEmailByUsername(username: string): Promise<string | null> {
        const { data, error } = await supabase
            .rpc('get_email_by_username', { username_input: username });

        if (error) {
            console.error('[API] Get Email Failed:', error);
            return null;
        }
        return data as string;
    }
}

export const apiClient = new ApiClient();
