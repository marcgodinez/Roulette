import { create } from 'zustand';
import { Phase, SavedStrategy } from '../types';
import { supabase } from '../services/supabase';
import { apiClient } from '../services/ApiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

import { Config } from '../config/Config';
import { AudioManager } from '../services/AudioManager';

const SESSION_ID_KEY = 'roulette_session_id';

let syncTimeout: NodeJS.Timeout;

interface GameState {
    credits: number;
    // VIP & Profile Props
    isVip: boolean;
    isAdFree: boolean; // New State
    setAdFree: (active: boolean) => void;
    vipExpiry: string | null;
    lastDailyBonus: string | null;
    xp: number;

    currentBet: number;
    bets: Record<string, number>;
    lastRoundBets: Record<string, number>; // For Rebet
    betHistory: { numberId: string; amount: number }[]; // For Undo

    // History
    history: { number: number; isFire: boolean; multiplier: number | null }[]; // Recent 15
    fullHistory: { number: number; isFire: boolean; multiplier: number | null }[]; // All session
    addToHistory: (entry: { number: number; isFire: boolean; multiplier: number | null }) => void;

    currentPhase: Phase;
    bonusMode: 'NORMAL' | 'SPECTATOR' | 'DEBUG';
    setBonusMode: (mode: 'NORMAL' | 'SPECTATOR' | 'DEBUG') => void;
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
    addXp: (amount: number) => void;

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
    toggleDebugFire: () => void;
    debugFireMode: boolean;

    // Level Up State
    levelUpPayload: { level: number; bonus: number } | null;
    setLevelUpPayload: (payload: { level: number; bonus: number } | null) => void;

    // Strategies
    savedStrategies: SavedStrategy[];
    loadStrategies: () => Promise<void>;
    saveStrategy: (name: string, bets: Record<string, number>, color: string) => Promise<void>;
    applyStrategy: (strategy: SavedStrategy) => boolean;
    deleteStrategy: (id: string) => Promise<void>;

    // Supabase Actions
    loadUserProfile: () => Promise<void>;
    initializeHistory: () => Promise<void>;
    validateSession: () => Promise<boolean>;
    recordGameResult: (winningNumber: number, isFire: boolean, multiplier: number, totalWin: number) => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
    credits: 1000,
    isVip: false,
    isAdFree: false, // Default false
    // setAdFree defined below with persistence
    vipExpiry: null,
    lastDailyBonus: null,
    xp: 0,
    currentBet: 0,
    bets: {},
    lastRoundBets: {},
    betHistory: [],

    history: [],
    fullHistory: [],

    addToHistory: (entry) => set((state) => {
        const newFull = [entry, ...state.fullHistory].slice(0, 100); // Cap at 100
        const newRecent = [entry, ...state.history].slice(0, 15); // Cap at 15
        return {
            fullHistory: newFull,
            history: newRecent
        };
    }),

    currentPhase: 'BETTING',
    bonusMode: 'NORMAL',
    setBonusMode: (mode: 'NORMAL' | 'SPECTATOR' | 'DEBUG') => set({ bonusMode: mode }),

    debugFireMode: false,
    toggleDebugFire: () => set((state) => ({ debugFireMode: !state.debugFireMode })),

    levelUpPayload: null,
    setLevelUpPayload: (payload) => set({ levelUpPayload: payload }),

    setCredits: (amount: number) => set({ credits: amount }),
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
        const strategies = await apiClient.fetchStrategies();
        set({ savedStrategies: strategies });
    },

    saveStrategy: async (name, betsToSave, color) => {
        const result = await apiClient.saveStrategy(name, betsToSave, color);
        if (result) {
            set((state) => ({ savedStrategies: [result, ...state.savedStrategies] }));
        }
    },

    deleteStrategy: async (id) => {
        const success = await apiClient.deleteStrategy(id);
        if (success) {
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

    setLastWinAmount: (amount: number) => set({ lastWinAmount: amount }),

    placeBet: (betId, amount) => {
        const state = get();
        // Optimistic check? Or strict check? Strict check here is too slow (async).
        // validation should happen before spin or periodically.
        if (state.currentPhase !== 'BETTING') return false;
        if (state.currentBet + amount > state.credits) return false;

        const currentBetAmount = state.bets[betId] || 0;
        if (currentBetAmount + amount > Config.BET_LIMITS.MAX) {
            Alert.alert("Max Limit Reached", `Max bet per spot is ${Config.BET_LIMITS.MAX}`);
            return false;
        }

        const newBets = { ...state.bets, [betId]: currentBetAmount + amount };
        const newHistory = [...state.betHistory, { numberId: betId, amount }];

        AudioManager.playSfx('chip'); // Play sound

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

    addXp: (amount: number) => set((state) => ({ xp: (state.xp || 0) + amount })),

    // Updated Supabase Actions
    loadUserProfile: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const data = await apiClient.fetchUserProfile();

            if (data) {
                set({
                    credits: data.credits,
                    isVip: data.is_vip || false,
                    isAdFree: data.is_ad_free || false, // Load persistence
                    vipExpiry: data.vip_expiry,
                    lastDailyBonus: data.last_daily_bonus,
                    xp: data.xp || 0
                });
            }
        }
    },

    setAdFree: async (active: boolean) => {
        set({ isAdFree: active });
        // Persist to Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('profiles').update({ is_ad_free: active }).eq('id', user.id);
        }
    },

    initializeHistory: async () => {
        const historyData = await apiClient.fetchGameHistory(100);
        set({
            fullHistory: historyData,
            history: historyData.slice(0, 15)
        });
    },

    validateSession: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        // 1. Get Local ID
        const localId = await AsyncStorage.getItem(SESSION_ID_KEY);
        if (!localId) return true; // Loose check if no local ID yet

        // 2. Get DB ID
        const { data, error } = await supabase
            .from('profiles')
            .select('active_session_id')
            .eq('id', user.id)
            .single();

        if (error || !data) return true; // Fail safe

        if (data.active_session_id && data.active_session_id !== localId) {
            // Mismatch!
            Alert.alert("Sesión Cerrada", "Tu cuenta se ha abierto en otro dispositivo.");
            await supabase.auth.signOut();
            return false;
        }
        return true;
    },

    recordGameResult: async (winningNumber, isFire, multiplier, totalWin) => {
        await apiClient.recordGameResult(winningNumber, isFire, multiplier, totalWin);
    }
}));
