export type Phase = 'BETTING' | 'FIRE_REVEAL' | 'SPINNING' | 'RESULT' | 'BONUS';

export interface Bet {
    numberId: string;
    amount: number;
}

export interface SavedStrategy {
    id: string;
    name: string;
    bet_data: Record<string, number>;
    color_code: string;
    total_cost: number;
}
