
export interface PresetStrategy {
    id: string;
    name: string;
    description: string;
    color_code: string;
    totalUnits: number;
    bets: { [key: string]: number }; // BetID -> Units
}

export const PRESET_STRATEGIES: PresetStrategy[] = [
    {
        id: 'JAMES_BOND',
        name: 'The James Bond',
        description: 'Cover 2/3 of the table. High risk, high reward.',
        color_code: '#3b82f6', // Blue
        totalUnits: 20,
        bets: {
            '19-36': 14,
            'LINE_13_18': 5, // Requires Engine Support
            '0': 1
        }
    },
    {
        id: 'RED_SNAKE',
        name: 'The Red Snake',
        description: 'A zigzag pattern covering 12 red numbers.',
        color_code: '#ef4444', // Red
        totalUnits: 12,
        bets: {
            '1': 1, '5': 1, '9': 1, '12': 1,
            '14': 1, '16': 1, '19': 1, '23': 1,
            '27': 1, '30': 1, '32': 1, '34': 1
        }
    },
    {
        id: 'VOISINS_ZERO',
        name: 'Voisins du Zéro',
        description: 'The neighbors of zero (9 chip bet).',
        color_code: '#eab308', // Gold
        totalUnits: 9,
        bets: {
            'STREET_0_2_3': 2, // 0, 2, 3
            'COR_25_26_28_29': 2, // Corner 25-29 (25,26,28,29)
            'SPLIT_4_7': 1,
            'SPLIT_12_15': 1,
            'SPLIT_18_21': 1,
            'SPLIT_19_22': 1,
            'SPLIT_32_35': 1
        }
    }
];
