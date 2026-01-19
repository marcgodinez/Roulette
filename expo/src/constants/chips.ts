export const CHIPS = [
    { value: 10, color: '#2196F3', label: '10' },     // Blue
    { value: 50, color: '#4CAF50', label: '50' },     // Green
    { value: 100, color: '#F44336', label: '100' },   // Red
    { value: 500, color: '#9C27B0', label: '500' },   // Purple
    { value: 1000, color: '#FF9800', label: '1k' },   // Orange
    { value: 5000, color: '#000000', label: '5k' }    // Black
];

export const getChipColor = (amount: number): string => {
    // Find the highest chip value that is <= amount
    // Since CHIPS is sorted ascending, we reverse or findLast
    // But Array.findLast might not be available in all RN envs, so let's just loop backwards.
    for (let i = CHIPS.length - 1; i >= 0; i--) {
        if (amount >= CHIPS[i].value) {
            return CHIPS[i].color;
        }
    }
    return CHIPS[0].color; // Default to lowest
};
