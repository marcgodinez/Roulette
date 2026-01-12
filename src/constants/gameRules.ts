export const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export const PAYOUTS = {
    STRAIGHT: 29, // Mega Blaze Rule (Standard is 35)
    SPLIT: 17,
    STREET: 11, // 3 numbers
    CORNER: 8,  // 4 numbers
    LINE: 5,    // 6 numbers
    COLUMN: 2,
    DOZEN: 2,
    EVEN_CHANCE: 1, // Red/Black, Odd/Even, High/Low
};

export const isRed = (num: number) => RED_NUMBERS.includes(num);

export const getColumn = (num: number) => {
    if (num === 0) return null;
    if (num % 3 === 1) return 'COL1';
    if (num % 3 === 2) return 'COL2';
    if (num % 3 === 0) return 'COL3';
    return null;
};

export const getDozen = (num: number) => {
    if (num >= 1 && num <= 12) return '1st12';
    if (num >= 13 && num <= 24) return '2nd12';
    if (num >= 25 && num <= 36) return '3rd12';
    return null;
};

export const EUROPEAN_SEQUENCE = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];
