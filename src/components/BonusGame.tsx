import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useGameStore } from '../store/useGameStore';
import { COLORS } from '../constants/theme';
import { isRed } from '../constants/gameRules';

const GRID_SIZE = 12; // 3x4

export const BonusGame = () => {
    const {
        winningNumber,
        bets,
        updateCredits,
        setPhase,
        setResult,
        addToHistory,
        bonusMode,
        credits
    } = useGameStore();

    const [grid, setGrid] = useState<(number | null)[]>(Array(GRID_SIZE).fill(null));
    const [spinsLeft, setSpinsLeft] = useState(3);
    const [gameMsg, setGameMsg] = useState('BONUS ROUND STARTED');
    const [showResult, setShowResult] = useState(false);
    const [finalStats, setFinalStats] = useState({ multiplier: 0, payout: 0 });

    const isSpectator = bonusMode === 'SPECTATOR';

    const handleComplete = useCallback(() => {
        setPhase('BETTING');
        setResult(null, []); // Clear result
    }, [setPhase, setResult]);

    const finishBonus = useCallback((finalGrid: (number | null)[]) => {
        // Calculate Payout
        const totalMultiplier = finalGrid.reduce((acc, val) => acc + (val || 0), 0);

        // Base Bet for calculation
        // If Spectator, assume 10 chips for demo
        const originalBet = winningNumber !== null ? (bets[winningNumber.toString()] || 0) : 0;
        const betForCalc = isSpectator ? 10 : originalBet;

        const payout = totalMultiplier * betForCalc;

        setFinalStats({ multiplier: totalMultiplier, payout });
        setShowResult(true);

        if (!isSpectator) {
            updateCredits(payout);
        }

        // Add to History
        addToHistory({
            number: winningNumber || 0,
            isFire: true,
            multiplier: totalMultiplier
        });

    }, [bets, winningNumber, updateCredits, addToHistory, isSpectator]);

    useEffect(() => {
        if (spinsLeft <= 0) {
            finishBonus(grid);
            return;
        }

        const isFull = grid.every(cell => cell !== null);
        if (isFull) {
            finishBonus(grid);
            return;
        }

        const interval = setTimeout(() => {
            const emptyIndices = grid.map((val, idx) => val === null ? idx : -1).filter(idx => idx !== -1);
            if (emptyIndices.length === 0) return;

            const shouldLand = Math.random() > 0.3; // 70% chance

            if (shouldLand) {
                const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
                const multipliers = [2, 3, 5, 10, 15, 20, 50, 100];
                const val = multipliers[Math.floor(Math.random() * multipliers.length)];

                const newGrid = [...grid];
                newGrid[randomIndex] = val;
                setGrid(newGrid);
                setSpinsLeft(3); // Reset spins on hit
                setGameMsg(`Dropped ${val}x!`);
            } else {
                setSpinsLeft(prev => prev - 1);
                setGameMsg('No drop...');
            }

        }, 1500);

        return () => clearTimeout(interval);
    }, [spinsLeft, grid, finishBonus]);

    // RESULT SCREEN
    if (showResult) {
        const numColor = winningNumber === 0 ? COLORS.BET_GREEN : (isRed(winningNumber!) ? COLORS.BET_RED : COLORS.BET_BLACK);

        return (
            <View style={styles.resultContainer}>
                <Text style={styles.resultTitle}>{isSpectator ? "MISSED WIN" : "BIG WIN!"}</Text>

                <View style={[styles.resultBubble, { backgroundColor: numColor }]}>
                    <Text style={styles.resultNumber}>{winningNumber}</Text>
                </View>

                <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Total Multiplier</Text>
                    <Text style={styles.statValue}>{finalStats.multiplier}x</Text>
                </View>

                <View style={styles.statRow}>
                    <Text style={styles.statLabel}>{isSpectator ? "Potential Payout" : "Total Win"}</Text>
                    <Text style={[styles.statValue, { color: COLORS.ACCENT_GOLD }]}>
                        {finalStats.payout}
                    </Text>
                </View>

                {isSpectator && (
                    <Text style={styles.spectatorHint}>
                        Turn auto-bet ON for Fire Numbers to never miss out!
                    </Text>
                )}

                <TouchableOpacity style={styles.continueBtn} onPress={handleComplete}>
                    <Text style={styles.continueText}>CONTINUE</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // GAMEPLAY SCREEN
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{isSpectator ? "SPECTATOR MODE" : "MEGA FIRE BONUS"}</Text>
            {isSpectator && <Text style={styles.subTitle}>You didn't bet on {winningNumber}!</Text>}

            <View style={styles.headerRow}>
                <Text style={styles.spins}>SPINS: {spinsLeft}</Text>
                <Text style={styles.msg}>{gameMsg}</Text>
            </View>

            <View style={styles.gridContainer}>
                {grid.map((val, index) => (
                    <View key={index} style={[styles.cell, val ? styles.activeCell : null]}>
                        <Text style={styles.cellText}>{val ? `${val}x` : ''}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '90%',
        padding: 20,
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.95)',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.ACCENT_GOLD,
        alignSelf: 'center',
        marginVertical: 40,
        zIndex: 100,
    },
    title: {
        color: COLORS.ACCENT_GOLD,
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'center',
    },
    subTitle: {
        color: COLORS.TEXT_SECONDARY,
        fontSize: 14,
        marginBottom: 10,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    spins: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    msg: {
        color: COLORS.ACCENT_GOLD,
        fontSize: 16,
        fontStyle: 'italic',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
    },
    cell: {
        width: 60,
        height: 60,
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#444',
    },
    activeCell: {
        backgroundColor: COLORS.ACCENT_GOLD, // or gradient
        borderColor: '#FFF',
        shadowColor: COLORS.ACCENT_GOLD,
        shadowRadius: 10,
        elevation: 5,
    },
    cellText: {
        color: '#000',
        fontWeight: '900',
        fontSize: 16,
    },

    // RESULT SCREEN
    resultContainer: {
        width: '85%',
        padding: 30,
        alignItems: 'center',
        backgroundColor: '#111',
        borderRadius: 20,
        borderWidth: 3,
        borderColor: COLORS.ACCENT_GOLD,
        alignSelf: 'center',
        marginVertical: 50,
        zIndex: 200,
    },
    resultTitle: {
        color: '#FFF',
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    resultBubble: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 3,
        borderColor: '#FFF',
    },
    resultNumber: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: 'bold',
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        paddingBottom: 5,
    },
    statLabel: {
        color: COLORS.TEXT_SECONDARY,
        fontSize: 16,
    },
    statValue: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    spectatorHint: {
        color: COLORS.BET_RED, // Reddish
        textAlign: 'center',
        marginTop: 15,
        fontStyle: 'italic',
    },
    continueBtn: {
        marginTop: 30,
        backgroundColor: COLORS.ACCENT_GOLD,
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 25,
    },
    continueText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
