/**
 * Formats a number as a currency string with thousands separators.
 * Uses 'es-ES' locale style: 1.000.000
 * @param amount The number to format
 * @returns Formatted string
 */
export const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return '0';

    // Force 'de-DE' or 'es-ES' which use dots for thousands
    return amount.toLocaleString('es-ES', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
};

/**
 * Formats a large number with K/M suffixes.
 * @param num Number to format
 */
export const formatCompactNumber = (num: number): string => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toString();
};
