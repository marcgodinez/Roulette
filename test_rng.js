const counts = {};
const TOTAL_SPINS = 100000;

// Initialize counts
for (let i = 0; i <= 36; i++) {
    counts[i] = 0;
}

// Simulate Spins
for (let i = 0; i < TOTAL_SPINS; i++) {
    const winningNumber = Math.floor(Math.random() * 37);
    counts[winningNumber]++;
}

// Analyze
console.log(`Simulated ${TOTAL_SPINS} spins.`);
console.log("Distribution:");
let min = TOTAL_SPINS, max = 0;
let minNum = -1, maxNum = -1;

Object.keys(counts).forEach(num => {
    const count = counts[num];
    const percentage = (count / TOTAL_SPINS) * 100;
    // Expected: ~2.7% (1/37)
    if (count < min) { min = count; minNum = num; }
    if (count > max) { max = count; maxNum = num; }
    // console.log(`Number ${num}: ${count} (${percentage.toFixed(2)}%)`);
});

const expected = TOTAL_SPINS / 37;
const deviationMin = ((expected - min) / expected) * 100;
const deviationMax = ((max - expected) / expected) * 100;

console.log(`Expected Count per Number: ${expected.toFixed(0)}`);
console.log(`Min: Number ${minNum} (${min}) - Deviation: -${deviationMin.toFixed(2)}%`);
console.log(`Max: Number ${maxNum} (${max}) - Deviation: +${deviationMax.toFixed(2)}%`);

if (deviationMax < 5 && deviationMin < 5) {
    console.log("RESULT: PASSED (Distribution is uniform within 5% deviation)");
} else {
    console.log("RESULT: WARNING (High deviation detected)");
}
