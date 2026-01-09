import { create } from 'zustand';
import { Phase } from '../types';

interface GameState {
    credits: number;
    currentBet: number;
    bets: Record<string, number>;
    betHistory: { numberId: string; amount: number }[];
    currentPhase: Phase;
    winningNumber: number | null;
    fireNumbers: number[];
    lastWinAmount: number;
    selectedChipValue: number;

    placeBet: (betId: string, amount: number) => boolean;
    undoLastBet: () => void;
    clearBets: () => void;
    setPhase: (phase: Phase) => void;
    setResult: (winNum: number, fireNums: number[]) => void;
    updateCredits: (amount: number) => void;
    setLastWinAmount: (amount: number) => void;
    setSelectedChipValue: (value: number) => void;
    replaceBets: (newBets: Record<string, number>) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
    credits: 5000, // Starting credits
    currentBet: 0,
    bets: {},
    betHistory: [],
    currentPhase: 'BETTING',
    winningNumber: null,
    fireNumbers: [],
    selectedChipValue: 10,


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
        // Check against total limit (Initial Credits)
        // Since we don't deduct credits yet, state.credits IS the initial credits for this round.
        if (state.currentBet + amount > state.credits) return false;

        const currentBetAmount = state.bets[betId] || 0;
        const newBets = { ...state.bets, [betId]: currentBetAmount + amount };
        const newHistory = [...state.betHistory, { numberId: betId, amount }];

        set({
            bets: newBets,
            betHistory: newHistory,
            // credits: Unchanged until spin
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
            // credits: Unchanged
            currentBet: state.currentBet - lastBet.amount
        });
    },

    updateCredits: (amount) => set((state) => ({ credits: state.credits + amount })),

    setSelectedChipValue: (value) => set({ selectedChipValue: value }),

    replaceBets: (newBets) => set({ bets: newBets }),
}));
