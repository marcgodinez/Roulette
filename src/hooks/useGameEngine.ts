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
        replaceBets,
        setStoreOpen,
        recordGameResult
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

        // 3. Generate Fire Numbers (Weighted Probability)
        const r = Math.random() * 100;
        let min = 1;
        let max = 5;

        // 80% chance: 1-5 numbers (Common)
        // 15% chance: 6-10 numbers (Uncommon)
        // 5% chance: 11-15 numbers (Rare)
        if (r >= 80 && r < 95) {
            min = 6;
            max = 10;
        } else if (r >= 95) {
            min = 11;
            max = 15;
        }

        const fireCount = Math.floor(Math.random() * (max - min + 1)) + min;

        const allNumbers = Array.from({ length: 37 }, (_, i) => i);
        // Fisher-Yates Shuffle
        for (let i = allNumbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allNumbers[i], allNumbers[j]] = [allNumbers[j], allNumbers[i]];
        }
        const fireNumbers = allNumbers.slice(0, fireCount).sort((a, b) => a - b);

        // Snapshot bets for Rebet feature
        useGameStore.getState().snapshotBets();

        // 4. Transition to SPINNING
        setPhase('SPINNING');

        // IMMEDIATE RESULT GENERATION (No Phase 1)
        const winningNumber = Math.floor(Math.random() * 37);

        // We set the result immediately so the wheel knows where to go.
        setResult(winningNumber, fireNumbers);

        // Wait for Spin Animation Duration (6500ms) before resolving
        setTimeout(() => {
            setPhase('RESULT');
            resolveRound(winningNumber, fireNumbers, bets);
        }, 6500); // Sync with RouletteWheel duration
    };


    const resolveRound = (
        winningNumber: number,
        fireNumbers: number[],
        currentBets: Record<string, number>
    ) => {
        let totalWin = 0;
        let bonusTriggered = false;
        let calculatedBonusStake = 0;

        // Identify Winning Bets (IDs) to keep on board during sweep
        const winningBetIds: string[] = [];

        const isFireHit = fireNumbers.includes(winningNumber);

        Object.keys(currentBets).forEach(betId => {
            const amount = currentBets[betId];
            if (amount <= 0) return;

            let didWin = false;
            let multiplier = 0;
            let isInsideBet = false;
            let coverage = 1;

            // 1. STRAIGHT UP (Single Number) "0", "1", "36"
            if (!isNaN(parseInt(betId)) && !betId.includes('_') && !isNaN(Number(betId))) {
                isInsideBet = true;
                coverage = 1;
                const betNum = parseInt(betId);
                if (betNum === winningNumber) {
                    didWin = true;
                    multiplier = PAYOUTS.STRAIGHT;
                }
            }
            // 2. SPLIT "SPLIT_1_2"
            else if (betId.startsWith('SPLIT')) {
                isInsideBet = true;
                coverage = 2;
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
                isInsideBet = true;
                coverage = 4;
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
            // 9. LINE BETS "LINE_13_18"
            else if (betId.startsWith('LINE')) {
                const parts = betId.split('_'); // LINE, 13, 18
                if (parts.length === 3) {
                    const start = parseInt(parts[1]);
                    const end = parseInt(parts[2]);
                    if (winningNumber >= start && winningNumber <= end) {
                        didWin = true;
                        multiplier = PAYOUTS.LINE;
                        isInsideBet = true; // Technically inside (or outside? usually line is inside table)
                        coverage = 6;
                    }
                }
            }
            // 10. STREET BETS "STREET_1_3" or "STREET_0_2_3"
            else if (betId.startsWith('STREET')) {
                const parts = betId.split('_').slice(1).map(n => parseInt(n));
                // Handle ranges or specific lists
                // If standard street 1-3, parts might be [1, 3] or [1, 2, 3] depending on how we define it.
                // For safety, checks if number is in parts OR in range if parts has 2 and gap matches
                // For now, let's assume we pass ALL numbers or Range.
                // Voisins sends STREET_0_2_3 -> [0, 2, 3].
                if (parts.includes(winningNumber)) {
                    didWin = true;
                    multiplier = PAYOUTS.STREET;
                    isInsideBet = true;
                    coverage = 3;
                }
                // Fallback for "STREET_1_3" meaning 1,2,3?
                // Let's rely on explicit numbering for Trio, or range for standard?
                // Standard Street is 3 sequential numbers. 
                // If input is STREET_1_3... let's check range?
                else if (parts.length === 2 && (parts[1] - parts[0] === 2)) {
                    if (winningNumber >= parts[0] && winningNumber <= parts[1]) {
                        didWin = true;
                        multiplier = PAYOUTS.STREET;
                        isInsideBet = true;
                        coverage = 3;
                    }
                }
            }

            if (didWin) {
                // FIRE + INSIDE BET -> ACCUMULATE BONUS STAKE
                if (isFireHit && isInsideBet) {
                    calculatedBonusStake += (amount / coverage);
                    winningBetIds.push(betId); // Keep chips
                }
                // STANDARD WIN (Outside Bet OR Non-Fire Inside Bet)
                else {
                    const profit = amount * multiplier;
                    totalWin += profit + amount;
                    winningBetIds.push(betId);
                }
            }
        });

        // Resolve Fire Bonus Trigger
        if (isFireHit) {
            useGameStore.getState().setBonusStake(calculatedBonusStake);

            if (calculatedBonusStake > 0) {
                bonusTriggered = true;
                useGameStore.getState().setBonusMode('NORMAL');
            } else {
                bonusTriggered = true;
                useGameStore.getState().setBonusMode('SPECTATOR');
            }
        } else {
            useGameStore.getState().setBonusStake(0);
        }

        // T+0s: Spin Ended. Result Phase is already ACTIVE (set in triggerSpin). 
        // Dolly should appear now via React Prop (GameScreen passing winningNumber to BettingBoard).

        // T+1.5s: SWEEP LOSING CHIPS
        setTimeout(() => {
            const { removeLosingBets } = useGameStore.getState();
            removeLosingBets(winningBetIds);
        }, 1500);

        // T+4.0s: PAYOUT & FINISH
        setTimeout(() => {
            const { addToHistory, clearBets, updateCredits, setPhase, setLastWinAmount, recordGameResult } = useGameStore.getState();

            if (bonusTriggered) {
                setPhase('BONUS');
                if (totalWin > 0) {
                    updateCredits(totalWin);
                }
                clearBets();
                return;
            }

            if (totalWin > 0) {
                updateCredits(totalWin);
                setLastWinAmount(totalWin);
            } else {
                setLastWinAmount(0);
            }

            // ADD TO HISTORY (Standard Round)
            addToHistory({
                number: winningNumber,
                isFire: fireNumbers.includes(winningNumber),
                multiplier: null
            });

            // Record Result
            recordGameResult(winningNumber, fireNumbers.includes(winningNumber), null, totalWin);

            // Clear all bets
            clearBets();
        }, 4000);

        // T+5.0s: RESET TO BETTING
        setTimeout(() => {
            // If we went to bonus, don't auto-reset phase here!
            if (!bonusTriggered) {
                setPhase('BETTING');
                setResult(null, []); // Clear result
                setLastWinAmount(0);

                // Bankruptcy Check
                const { credits: currentCredits } = useGameStore.getState();
                if (currentCredits === 0 && totalWin === 0) {
                    setTimeout(() => setStoreOpen(true), 500);
                }
            }
        }, 5000);
    };

    return {
        triggerSpin
    };
};
