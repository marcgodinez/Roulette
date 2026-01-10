
import { create } from 'zustand';
import { Phase } from '../types';
import { supabase } from '../services/supabase';


let syncTimeout: NodeJS.Timeout;

interface GameState {
    credits: number;
    currentBet: number;
    bets: Record<string, number>;
    lastRoundBets: Record<string, number>; // For Rebet
    betHistory: { numberId: string; amount: number }[]; // For Undo

    // History
    history: { number: number; isFire: boolean; multiplier: number | null }[]; // Recent 15
    fullHistory: { number: number; isFire: boolean; multiplier: number | null }[]; // All session
    addToHistory: (entry: { number: number; isFire: boolean; multiplier: number | null }) => void;

    currentPhase: Phase;
    bonusMode: 'NORMAL' | 'SPECTATOR';
    setBonusMode: (mode: 'NORMAL' | 'SPECTATOR') => void;
    winningNumber: number | null;
    fireNumbers: number[];
    lastWinAmount: number;
    bonusStake: number; // For Fire Multiplier calculation
    setBonusStake: (amount: number) => void;
    selectedChipValue: number;

    // Monetization
    isStoreOpen: boolean;
    setStoreOpen: (isOpen: boolean) => void;
    addCredits: (amount: number) => void;

    placeBet: (betId: string, amount: number) => boolean;
    undoLastBet: () => void;
    rebet: () => boolean;
    snapshotBets: () => void;
    clearBets: () => void;
    setPhase: (phase: Phase) => void;
    setResult: (winNum: number | null, fireNums: number[]) => void;
    updateCredits: (amount: number) => void;
    setLastWinAmount: (amount: number) => void;
    setSelectedChipValue: (value: number) => void;
    replaceBets: (newBets: Record<string, number>) => void;
    removeLosingBets: (winningIds: string[]) => void;

    // Strategies
    savedStrategies: SavedStrategy[];
    loadStrategies: () => Promise<void>;
    saveStrategy: (name: string, bets: Record<string, number>, color: string) => Promise<void>;
    applyStrategy: (strategy: SavedStrategy) => boolean;
    deleteStrategy: (id: string) => Promise<void>;

    // Supabase Actions
    loadUserProfile: () => Promise<void>;
    recordGameResult: (outcome: number) => Promise<void>;
}

export interface SavedStrategy {
    id: string;
    name: string;
    bet_data: Record<string, number>;
    color_code: string;
    total_cost: number;
}

export const useGameStore = create<GameState>((set, get) => ({
    credits: 1000,
    currentBet: 0,
    bets: {},
    lastRoundBets: {},
    betHistory: [],

    history: Array.from({ length: 15 }, () => ({
        number: Math.floor(Math.random() * 37),
        isFire: Math.random() > 0.8,
        multiplier: Math.random() > 0.8 ? [50, 100, 200][Math.floor(Math.random() * 3)] : null
    })),
    fullHistory: [], // Starts empty or could load from DB

    addToHistory: (entry) => set((state) => {
        const newFull = [entry, ...state.fullHistory];
        const newRecent = [entry, ...state.history].slice(0, 15); // Cap at 15
        return {
            fullHistory: newFull,
            history: newRecent
        };
    }),

    currentPhase: 'BETTING',
    bonusMode: 'NORMAL',
    setBonusMode: (mode) => set({ bonusMode: mode }),
    winningNumber: null,
    fireNumbers: [],
    lastWinAmount: 0,
    bonusStake: 0,
    setBonusStake: (amount) => set({ bonusStake: amount }),
    selectedChipValue: 10,

    savedStrategies: [],

    snapshotBets: () => set((state) => ({ lastRoundBets: { ...state.bets } })),

    rebet: () => {
        const { lastRoundBets, credits } = get();
        const totalCost = Object.values(lastRoundBets).reduce((a, b) => a + b, 0);

        if (totalCost === 0) return false;
        if (credits < totalCost) return false;

        set({
            bets: { ...lastRoundBets },
            currentBet: totalCost,
            betHistory: Object.entries(lastRoundBets).map(([id, amount]) => ({ numberId: id, amount }))
        });
        return true;
    },

    loadStrategies: async () => {
        const { data, error } = await supabase
            .from('saved_strategies')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            set({ savedStrategies: data as SavedStrategy[] });
        }
    },

    saveStrategy: async (name, betsToSave, color) => {
        const total_cost = Object.values(betsToSave).reduce((a, b) => a + b, 0);
        const user = await supabase.auth.getUser();
        if (!user.data.user) return;

        const { data, error } = await supabase
            .from('saved_strategies')
            .insert({
                user_id: user.data.user.id,
                name,
                bet_data: betsToSave,
                color_code: color,
                total_cost
            })
            .select()
            .single();

        if (data) {
            set((state) => ({ savedStrategies: [data as SavedStrategy, ...state.savedStrategies] }));
        }
    },

    deleteStrategy: async (id) => {
        const { error } = await supabase.from('saved_strategies').delete().match({ id });
        if (!error) {
            set((state) => ({ savedStrategies: state.savedStrategies.filter(s => s.id !== id) }));
        }
    },

    applyStrategy: (strategy) => {
        const { credits } = get();
        if (credits < strategy.total_cost) return false;

        set({
            bets: strategy.bet_data,
            currentBet: strategy.total_cost
        });
        return true;
    },

    clearBets: () => set({ bets: {}, betHistory: [], currentBet: 0 }),

    setPhase: (phase) => set({ currentPhase: phase }),

    setResult: (winNum, fireNums) =>
        set({
            winningNumber: winNum,
            fireNumbers: fireNums,
        }),

    lastWinAmount: 0,
    setLastWinAmount: (amount: number) => set({ lastWinAmount: amount }),

    placeBet: (betId, amount) => {
        const state = get();
        if (state.currentPhase !== 'BETTING') return false;
        if (state.currentBet + amount > state.credits) return false;

        const currentBetAmount = state.bets[betId] || 0;
        const newBets = { ...state.bets, [betId]: currentBetAmount + amount };
        const newHistory = [...state.betHistory, { numberId: betId, amount }];

        set({
            bets: newBets,
            betHistory: newHistory,
            currentBet: state.currentBet + amount
        });
        return true;
    },

    undoLastBet: () => {
        const state = get();
        if (state.betHistory.length === 0) return;

        const lastBet = state.betHistory[state.betHistory.length - 1];
        const newHistory = state.betHistory.slice(0, -1);

        const currentBetAmount = state.bets[lastBet.numberId];
        const newAmount = currentBetAmount - lastBet.amount;

        const newBets = { ...state.bets };
        if (newAmount <= 0) {
            delete newBets[lastBet.numberId];
        } else {
            newBets[lastBet.numberId] = newAmount;
        }

        set({
            bets: newBets,
            betHistory: newHistory,
            currentBet: state.currentBet - lastBet.amount
        });
    },

    // Modified to sync with Supabase
    updateCredits: (amount) => {
        set((state) => {
            const newCredits = state.credits + amount;
            // Debounce Sync
            clearTimeout(syncTimeout);
            syncTimeout = setTimeout(async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.from('profiles').update({ credits: newCredits }).eq('id', user.id);
                }
            }, 2000);
            return { credits: newCredits };
        });
    },

    setSelectedChipValue: (value) => set({ selectedChipValue: value }),

    replaceBets: (newBets) => set({ bets: newBets }),

    removeLosingBets: (winningIds) => {
        set((state) => {
            const newBets: Record<string, number> = {};
            winningIds.forEach(id => {
                if (state.bets[id]) {
                    newBets[id] = state.bets[id];
                }
            });
            // Update currentBet total to reflect only remaining bets? 
            // Usually currentBet tracks "Amount Bet in this round". 
            // If we remove losers, 'bets' changes. 'currentBet' technically shouldn't change for history, but for UI display logic...
            // Let's just update 'bets'. currentBet can stay or update. 
            // Updating it to match remaining chips is probably cleaner for UI if it uses currentBet to display total on table.
            const newTotal = Object.values(newBets).reduce((a, b) => a + b, 0);
            return { bets: newBets, currentBet: newTotal };
        });
    },

    isStoreOpen: false,
    setStoreOpen: (isOpen) => set({ isStoreOpen: isOpen }),

    addCredits: (amount) => {
        set((state) => {
            const newCredits = state.credits + amount;
            // Debounce Sync
            clearTimeout(syncTimeout);
            syncTimeout = setTimeout(async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.from('profiles').update({ credits: newCredits }).eq('id', user.id);
                }
            }, 2000);
            return { credits: newCredits };
        });
    },

    // New Supabase Actions
    loadUserProfile: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data, error } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', user.id)
                .single();

            if (data && !error) {
                set({ credits: data.credits });
            }
        }
    },

    recordGameResult: async (outcome: number) => {
        const state = get();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('bet_history').insert({
                user_id: user.id,
                bet_details: state.bets,
                amount: state.currentBet,
                outcome: outcome
            });
        }
    }
}));

