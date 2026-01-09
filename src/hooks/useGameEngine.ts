import { useGameStore } from '../store/useGameStore';
import { PAYOUTS, isRed, getColumn, getDozen } from '../constants/gameRules';

export const useGameEngine = () => {
    const {
        credits,
        bets,
        updateCredits,
        setPhase,
        setResult,
        setLastWinAmount,
        clearBets,
        replaceBets
    } = useGameStore();

    const triggerSpin = () => {
        // 1. Validate if bets exist
        const totalBetAmount = Object.values(bets).reduce((sum, amount) => sum + amount, 0);
        if (totalBetAmount === 0) {
            console.warn('No bets placed');
            return;
        }

        if (totalBetAmount > credits) {
            console.warn('Insufficient credits');
            return;
        }

        // 2. Deduct total bet amount
        updateCredits(-totalBetAmount);

        // 3. Generate Fire Numbers (1 to 10 unique numbers)
        const fireCount = Math.floor(Math.random() * 10) + 1;
        const fireNumbers: number[] = [];
        while (fireNumbers.length < fireCount) {
            const num = Math.floor(Math.random() * 37); // 0-36
            if (!fireNumbers.includes(num)) {
                fireNumbers.push(num);
            }
        }
        // Sort them for display "in order"
        fireNumbers.sort((a, b) => a - b);

        // 4. Transition to SPINNING
        setPhase('SPINNING');

        // IMMEDIATE RESULT GENERATION (No Phase 1)
        const winningNumber = Math.floor(Math.random() * 37);

        // We set the result immediately so the wheel knows where to go.
        setResult(winningNumber, fireNumbers);

        // Wait for Spin Animation Duration (4000ms) before resolving
        setTimeout(() => {
            setPhase('RESULT');
            resolveRound(winningNumber, fireNumbers, bets);
        }, 4000); // Sync with RouletteWheel duration
    };

    const resolveRound = (
        winningNumber: number,
        fireNumbers: number[],
        currentBets: Record<string, number>
    ) => {
        let totalWin = 0;
        let bonusTriggered = false;
        const winningBets: Record<string, number> = {};

        Object.keys(currentBets).forEach(betId => {
            const amount = currentBets[betId];
            if (amount <= 0) return;

            let didWin = false;
            let multiplier = 0;

            // 1. STRAIGHT UP (Single Number) "0", "1", "36"
            if (!isNaN(parseInt(betId)) && !betId.includes('_') && !isNaN(Number(betId))) {
                const betNum = parseInt(betId);
                if (betNum === winningNumber) {
                    didWin = true;
                    // CHECK BONUS
                    if (fireNumbers.includes(winningNumber)) {
                        bonusTriggered = true;
                        multiplier = PAYOUTS.STRAIGHT;
                    } else {
                        multiplier = PAYOUTS.STRAIGHT;
                    }
                }
            }
            // 2. SPLIT "SPLIT_1_2"
            else if (betId.startsWith('SPLIT')) {
                const parts = betId.split('_');
                const n1 = parseInt(parts[1]);
                const n2 = parseInt(parts[2]);
                if (winningNumber === n1 || winningNumber === n2) {
                    didWin = true;
                    multiplier = PAYOUTS.SPLIT;
                }
            }
            // 3. CORNER "COR_1_2_4_5"
            else if (betId.startsWith('COR')) {
                const parts = betId.split('_').slice(1).map(n => parseInt(n));
                if (parts.includes(winningNumber)) {
                    didWin = true;
                    multiplier = PAYOUTS.CORNER;
                }
            }
            // 4. COLORS
            else if (betId === 'RED') {
                if (isRed(winningNumber)) {
                    didWin = true;
                    multiplier = PAYOUTS.EVEN_CHANCE;
                }
            }
            else if (betId === 'BLACK') {
                if (winningNumber !== 0 && !isRed(winningNumber)) {
                    didWin = true;
                    multiplier = PAYOUTS.EVEN_CHANCE;
                }
            }
            // 5. EVEN/ODD
            else if (betId === 'EVEN') {
                if (winningNumber !== 0 && winningNumber % 2 === 0) {
                    didWin = true;
                    multiplier = PAYOUTS.EVEN_CHANCE;
                }
            }
            else if (betId === 'ODD') {
                if (winningNumber !== 0 && winningNumber % 2 !== 0) {
                    didWin = true;
                    multiplier = PAYOUTS.EVEN_CHANCE;
                }
            }
            // 6. 19-36 / 1-18
            else if (betId === '1-18') {
                if (winningNumber >= 1 && winningNumber <= 18) {
                    didWin = true;
                    multiplier = PAYOUTS.EVEN_CHANCE;
                }
            }
            else if (betId === '19-36') {
                if (winningNumber >= 19 && winningNumber <= 36) {
                    didWin = true;
                    multiplier = PAYOUTS.EVEN_CHANCE;
                }
            }
            // 7. COLUMNS
            else if (betId.startsWith('COL')) {
                if (getColumn(winningNumber) === betId) {
                    didWin = true;
                    multiplier = PAYOUTS.COLUMN;
                }
            }
            // 8. DOZENS
            else if (betId.endsWith('12')) { // 1st12, 2nd12, 3rd12
                if (getDozen(winningNumber) === betId) {
                    didWin = true;
                    multiplier = PAYOUTS.DOZEN;
                }
            }

            if (didWin) {
                const profit = amount * multiplier;
                totalWin += profit + amount; // Total credit return
                winningBets[betId] = profit; // Visual only shows profit
            }
        });

        // VISUAL UPDATE: Remove losers, show winners with profit value
        replaceBets(winningBets);

        if (bonusTriggered) {
            setTimeout(() => {
                setPhase('BONUS');
                updateCredits(totalWin);
                setLastWinAmount(totalWin);
            }, 1000);
            return;
        }

        if (totalWin > 0) {
            updateCredits(totalWin);
            setLastWinAmount(totalWin);
        } else {
            setLastWinAmount(0);
        }

        // WAIT 2 SECONDS THEN CLEAR
        setTimeout(() => {
            clearBets();
            setPhase('BETTING');
            setResult(winningNumber, []);
            setLastWinAmount(0);
        }, 2000);
    };

    return {
        triggerSpin
    };
};
