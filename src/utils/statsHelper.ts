
export const calculateStats = (history: { number: number }[]) => {
    // 1. Count Frequencies
    const counts = Array(37).fill(0);
    history.forEach(item => {
        if (item.number >= 0 && item.number <= 36) {
            counts[item.number]++;
        }
    });

    const frequencyList = counts.map((count, num) => ({ num, count }));

    // 2. Sort frequencies
    const sorted = [...frequencyList].sort((a, b) => b.count - a.count);
    const maxCount = sorted[0]?.count || 1;

    // 3. Hot Numbers (Top 5)
    // Filter out those with 0 counts? Usually Hot numbers have counts. 
    // If all 0, no hot numbers? Or just first 5? First 5 is fine.
    const hotNumbers = sorted.slice(0, 5).map(item => item.num);

    // 4. Cold Numbers (Bottom 5 or 0 counts)
    // Strategy: Prioritize 0 counts. Then low counts.
    // Logic matches previous implementation.
    let coldNumbers = sorted.filter(item => item.count === 0).map(item => item.num);

    // If we have fewer than 5 zeros, fill with lowest frequency
    if (coldNumbers.length < 5) {
        // Take from the end of the sorted list (lowest freq)
        const candidates = sorted.slice().reverse(); // Low to High
        for (const cand of candidates) {
            if (coldNumbers.length >= 5) break;
            if (!coldNumbers.includes(cand.num)) {
                coldNumbers.push(cand.num);
            }
        }
    }
    // Limit to 5
    coldNumbers = coldNumbers.slice(0, 5);

    return {
        counts,
        maxCount,
        hotNumbers,
        coldNumbers
    };
};
