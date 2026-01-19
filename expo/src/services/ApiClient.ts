import { supabase } from './supabase';
import { Alert } from 'react-native';

export interface SpinResult {
    winningNumber: number;
    fireNumbers: number[];
    totalWin: number;
    newBalance: number;
    bonusStake: number;
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
     * Calls the 'spin' Edge Function
     * @param bets Object containing bet IDs and amounts
     */
    async spin(bets: Record<string, number>): Promise<SpinResult | null> {
        try {
            const { data, error } = await supabase.functions.invoke('spin', {
                body: { bets }
            });

            if (error) throw error;
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
            const { data, error } = await supabase.functions.invoke('claim-bonus');

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
     * @param token Optional validation token from ad network
     */
    async claimAdReward(token?: string): Promise<BonusResult | null> {
        try {
            const { data, error } = await supabase.functions.invoke('ad-reward', {
                body: { token }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            return data as BonusResult;
        } catch (e: any) {
            console.error('[API] Ad Reward Failed:', e);
            // Don't alert here, let the manager handle UI
            return null;
        }
    }
}

export const apiClient = new ApiClient();
