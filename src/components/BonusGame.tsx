import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useGameStore } from '../store/useGameStore';

const GRID_SIZE = 12; // 3x4
const ANIMATION_DELAY = 1000; // Faster than 2s for better feel, but we'll stick to logic close to prompt
// Prompt said "Every 2 seconds".

export const BonusGame = () => {
    const {
        winningNumber,
        bets,
        updateCredits,
        setPhase,
        setResult // used to reset logic later if needed
    } = useGameStore();

    const [grid, setGrid] = useState<(number | null)[]>(Array(GRID_SIZE).fill(null));
    const [spinsLeft, setSpinsLeft] = useState(3);
    const [gameMsg, setGameMsg] = useState('BONUS ROUND STARTED');

    const finishBonus = useCallback((finalGrid: (number | null)[]) => {
        // Calculate Payout
        // Sum multipliers
        const totalMultiplier = finalGrid.reduce((acc, val) => acc + (val || 0), 0);

        // Original Bet
        const originalBet = winningNumber !== null ? (bets[winningNumber.toString()] || 0) : 0;

        const payout = totalMultiplier * originalBet;

        setGameMsg(`WIN: ${payout} CREDITS`);

        // Delay finish
        setTimeout(() => {
            updateCredits(payout);
            // Reset Phase
            setPhase('BETTING');
            setResult(-1, []); // clear result state
        }, 2000);

    }, [bets, winningNumber, updateCredits, setPhase, setResult]);

    useEffect(() => {
        if (spinsLeft <= 0) {
            finishBonus(grid);
            return;
        }

        // Check if grid is full
        const isFull = grid.every(cell => cell !== null);
        if (isFull) {
            finishBonus(grid);
            return;
        }

        const interval = setTimeout(() => {
            // Drop Logic
            // Chance to land a multiplier. Let's say 60% chance to land at least one?
            // Or pick one random slot.
            const emptyIndices = grid.map((val, idx) => val === null ? idx : -1).filter(idx => idx !== -1);

            if (emptyIndices.length === 0) return; // Should be handled by isFull check

            // Random logic: 
            // 50% chance to NOT land anything?
            const shouldLand = Math.random() > 0.3; // 70% chance to land

            if (shouldLand) {
                // Pick random empty slot
                const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
                // Pick random multiplier
                const multipliers = [2, 3, 5, 10, 15, 20, 50];
                const val = multipliers[Math.floor(Math.random() * multipliers.length)];

                const newGrid = [...grid];
                newGrid[randomIndex] = val;
                setGrid(newGrid);
                setSpinsLeft(3); // Reset spins
                setGameMsg(`Dropped ${val}x!`);
            } else {
                setSpinsLeft(prev => prev - 1);
                setGameMsg('No drop...');
            }

        }, 2000);

        return () => clearTimeout(interval);
    }, [spinsLeft, grid, finishBonus]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>MEGA FIRE BONUS</Text>
            <Text style={styles.spins}>SPINS LEFT: {spinsLeft}</Text>
            <Text style={styles.msg}>{gameMsg}</Text>

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
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#000',
        borderRadius: 20,
        borderWidth: 4,
        borderColor: '#FF4500',
        alignSelf: 'center',
        margin: 20,
    },
    title: {
        color: '#FFD700',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    spins: {
        color: '#FFF',
        fontSize: 18,
        marginBottom: 5,
    },
    msg: {
        color: '#AAA',
        marginBottom: 15,
        fontStyle: 'italic',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: 240, // 3 cols * 80
        justifyContent: 'center',
    },
    cell: {
        width: 70,
        height: 70,
        backgroundColor: '#222',
        margin: 5,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#444',
    },
    activeCell: {
        backgroundColor: '#FF8C00', // Orange background for multiplier
        borderColor: '#FFD700',
        shadowColor: '#FFF',
        shadowRadius: 5,
        elevation: 5,
    },
    cellText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 18,
    }
});
