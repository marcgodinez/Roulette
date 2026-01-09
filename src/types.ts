export type Phase = 'BETTING' | 'SPINNING' | 'RESULT' | 'BONUS';

export interface Bet {
    numberId: string;
    amount: number;
}
