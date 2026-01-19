import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    cancelAnimation,
    withSequence,
    withSpring,
    withDelay,
    withRepeat,
    useDerivedValue,
    runOnJS
} from 'react-native-reanimated';
import { useGameStore } from '../store/useGameStore';
import { COLORS } from '../constants/theme';

const GRID_SIZE = 12; // 4 Cols x 3 Rows
const COLS = 4;
const ROWS = 3;

// HELPER: NEON COLORS
const getNeonStyle = (val: number) => {
    // Return: { borderColor, shadowColor, textColor }
    if (val >= 100) return { color: '#D946EF', shadow: '#F0ABFC' }; // Fuchsia
    if (val >= 50) return { color: '#EF4444', shadow: '#FCA5A5' }; // Red
    if (val >= 20) return { color: '#EAB308', shadow: '#FDE047' }; // Yellow/Gold
    if (val >= 10) return { color: '#22C55E', shadow: '#86EFAC' }; // Green
    return { color: '#3B82F6', shadow: '#93C5FD' }; // Blue (5x)
};

const RenderBall = ({ val, size = 50, isRain = false }: { val: number, size?: number, isRain?: boolean }) => {
    const { color, shadow } = getNeonStyle(val);
    const fontSize = size * 0.45;
    const displayVal = String(val);

    return (
        <View style={{
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: 'rgba(20,20,20,0.9)',
            borderWidth: 2,
            borderColor: color,
            alignItems: 'center', justifyContent: 'center',
            // NEON GLOW EFFECTS
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: isRain ? 0.3 : 0.8,
            shadowRadius: isRain ? 5 : 10,
            elevation: isRain ? 3 : 10,
            opacity: isRain ? 0.8 : 1
        }}>
            {/* Internal Gloss */}
            <View style={{
                position: 'absolute', top: 3, left: size * 0.2, width: size * 0.4, height: size * 0.2,
                backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, transform: [{ rotate: '-45deg' }]
            }} />

            {/* NEON TEXT */}
            <Text style={{
                color: '#FFF',
                fontSize: fontSize,
                fontWeight: '900',
                textShadowColor: color,
                textShadowRadius: 10
            }}>
                {displayVal}
            </Text>
        </View>
    );
};

// COMPONENT: LOCKED CELL (THE PRIZE)
const LockedCell = ({ val }: { val: number }) => {
    const translateY = useSharedValue(-120);
    const scaleY = useSharedValue(1.3);
    const scaleX = useSharedValue(0.8);

    useEffect(() => {
        translateY.value = withSpring(0, { mass: 0.8, damping: 12, stiffness: 250 });
        scaleY.value = withSequence(
            withDelay(50, withTiming(0.7, { duration: 100 })),
            withSpring(1, { damping: 10, stiffness: 150 })
        );
        scaleX.value = withSequence(
            withDelay(50, withTiming(1.3, { duration: 100 })),
            withSpring(1, { damping: 10, stiffness: 150 })
        );
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }, { scaleY: scaleY.value }, { scaleX: scaleX.value }]
    }));

    return (
        <Animated.View style={[style, { zIndex: 100 }]}>
            <RenderBall val={val} size={58} />
        </Animated.View>
    );
};

// COMPONENT: RAIN COLUMN
const RainColumn = ({ cells, isFull, isActive }: any) => {
    const CELL_HEIGHT = 70;
    const STRIP_LENGTH = 30;
    const VIEW_HEIGHT = CELL_HEIGHT * 3;
    const STRIP_PIXEL_HEIGHT = CELL_HEIGHT * STRIP_LENGTH;

    const rainData = useMemo(() => {
        const body = Array(25).fill(0).map(() => {
            if (Math.random() > 0.4) return null;
            return [5, 10, 20, 50, 2, 5, 8][Math.floor(Math.random() * 7)];
        });
        const tail = Array(5).fill(null);
        return [...tail, ...body];
    }, [isActive]);

    const translateY = useSharedValue(-STRIP_PIXEL_HEIGHT);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (!isFull && isActive) {
            translateY.value = -STRIP_PIXEL_HEIGHT;
            opacity.value = 1;
            translateY.value = withTiming(0, { duration: 2000, easing: Easing.linear });
        } else {
            opacity.value = withTiming(0, { duration: 300 });
        }
    }, [isFull, isActive]);

    const rainStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value
    }));

    return (
        <View style={styles.column}>
            {/* RAIN LAYER */}
            {!isFull ? (
                <View style={[styles.rainContainer, { height: VIEW_HEIGHT }]}>
                    <Animated.View style={[styles.rainStrip, rainStyle]}>
                        {rainData.map((val, i) => (
                            <View key={i} style={[styles.rainItem, { height: CELL_HEIGHT }]}>
                                {val !== null ? (
                                    <View style={{ transform: [{ scale: 0.8 }] }}>
                                        <RenderBall val={val} size={50} isRain={true} />
                                    </View>
                                ) : null}
                            </View>
                        ))}
                    </Animated.View>
                </View>
            ) : null}

            {/* CELLS LAYER */}
            {cells.map((cell: any, r: number) => (
                <View key={r} style={[styles.cellSlot, { height: CELL_HEIGHT }]}>
                    {cell.isLocked && cell.value !== null ? (
                        <LockedCell val={cell.value} />
                    ) : (
                        <View style={styles.emptyCell} />
                    )}
                </View>
            ))}
        </View>
    );
};

// COMPONENT: RESULT ANIMATION
const ResultPanel = ({ multiplier, prize, onCollect }: { multiplier: number, prize: number, onCollect: () => void }) => {
    const [count, setCount] = useState(0);
    const [showPrize, setShowPrize] = useState(false);

    useEffect(() => {
        let startTimestamp = Date.now();
        const duration = 1500; // 1.5s to count up

        const interval = setInterval(() => {
            const now = Date.now();
            const elapsed = now - startTimestamp;
            const progress = Math.min(elapsed / duration, 1);

            // Ease Out Quad
            const easedProgress = 1 - (1 - progress) * (1 - progress);

            const currentVal = Math.floor(easedProgress * multiplier);
            setCount(currentVal);

            if (progress >= 1) {
                clearInterval(interval);
                setShowPrize(true);
            }
        }, 30);

        return () => clearInterval(interval);
    }, [multiplier]);

    return (
        <View style={styles.resultPanel}>
            {!showPrize ? (
                <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.statusText, { color: '#AAA' }]}>TOTAL MULTIPLIER</Text>
                    <Text style={styles.counterText}>{String(count)}x</Text>
                </View>
            ) : (
                <View style={{ alignItems: 'center' }}>
                    <Text style={styles.winLabel}>TOTAL WIN</Text>
                    <Text style={styles.finalPrizeText}>${String(prize)}</Text>
                    <TouchableOpacity activeOpacity={0.8} style={styles.collectBtn} onPress={onCollect}>
                        <Text style={styles.collectText}>COLLECT</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

// MAIN COMPONENT
export const BonusGame = () => {
    const {
        winningNumber,
        updateCredits,
        setPhase,
        setResult,
        addToHistory,
        bonusMode,
        bonusStake,
        recordGameResult
    } = useGameStore();

    // STATE
    const [grid, setGrid] = useState<{ value: number | null, isLocked: boolean }[]>(
        Array(GRID_SIZE).fill({ value: null, isLocked: false })
    );

    const [lives, setLives] = useState(3);
    const [isActive, setIsActive] = useState(false);
    const [gameStatus, setGameStatus] = useState<'IDLE' | 'PLAYING' | 'FINISHED'>('PLAYING');

    // Result Data
    const [finalStats, setFinalStats] = useState({ multiplier: 0, payout: 0 });

    const isSpectator = bonusMode === 'SPECTATOR';
    const activeStake = isSpectator ? 10 : bonusStake;

    const [cycleTrigger, setCycleTrigger] = useState(0);

    useEffect(() => {
        if (gameStatus !== 'PLAYING') return;
        if (lives <= 0) {
            endGame();
            return;
        }

        setIsActive(true);

        const emptyIndices = grid.map((c: any, i: number) => ({ ...c, idx: i })).filter((c: any) => !c.isLocked).map((c: any) => c.idx);

        if (emptyIndices.length === 0) {
            endGame();
            return;
        }

        const hits: { idx: number, val: number }[] = [];
        // 60% Hit Chance
        if (Math.random() < 0.60) {
            const numHits = Math.random() > 0.85 ? 2 : 1;
            const available = [...emptyIndices];
            for (let i = 0; i < numHits; i++) {
                if (available.length > 0) {
                    const randIdx = Math.floor(Math.random() * available.length);
                    const targetIdx = available[randIdx];
                    available.splice(randIdx, 1);

                    const r = Math.random() * 100;
                    let v = 5;
                    if (r < 50) v = 5;
                    else if (r < 75) v = 10;
                    else if (r < 90) v = 20;
                    else if (r < 98) v = 50;
                    else v = 100;

                    hits.push({ idx: targetIdx, val: v });
                }
            }
        }

        const timeouts: NodeJS.Timeout[] = [];
        hits.forEach((hit) => {
            const delay = 500 + Math.random() * 1000;
            const t = setTimeout(() => {
                setLives(3);
                setGrid((prev: any) => {
                    const next = [...prev];
                    next[hit.idx] = { value: hit.val, isLocked: true };
                    return next;
                });
            }, delay);
            timeouts.push(t);
        });

        const endTimer = setTimeout(() => {
            setIsActive(false);
            const didHit = hits.length > 0;
            let nextLives = didHit ? 3 : lives - 1;

            if (!didHit) {
                setLives((prev: number) => {
                    const n = prev - 1;
                    if (n < 0) return 0;
                    return n;
                });
            }

            if (nextLives > 0) {
                const waitTime = didHit ? 1500 : 1000;
                setTimeout(() => setCycleTrigger(c => c + 1), waitTime);
            } else {
                setTimeout(() => endGame(), 1000);
            }

        }, 2000);

        return () => {
            clearTimeout(endTimer);
            timeouts.forEach(clearTimeout);
        };
    }, [cycleTrigger, gameStatus]);

    const handleSkip = () => {
        endGame(true);
    };

    const endGame = (instant = false) => {
        setIsActive(false);

        let finalGrid = [...grid];
        if (instant) {
            finalGrid = grid.map(c => {
                if (c.isLocked) return c;
                return Math.random() > 0.7 ? { value: 5, isLocked: true } : { value: null, isLocked: false };
            });
            setGrid(finalGrid);
        }

        const stats = finalGrid.reduce((acc, c) => acc + (c.isLocked && c.value ? c.value : 0), 0);
        const payout = stats * activeStake;

        setFinalStats({ multiplier: stats, payout });
        setGameStatus('FINISHED');

        if (!isSpectator) updateCredits(payout);
        addToHistory({ number: winningNumber || 100, isFire: true, multiplier: stats }); // Default 100 if null, ensures primitive
        recordGameResult(winningNumber || 100, true, stats, payout);
    };

    const renderColumns = () => {
        const columns = [];
        for (let c = 0; c < COLS; c++) {
            const colCells = [];
            let lockedCount = 0;
            for (let r = 0; r < ROWS; r++) {
                const idx = r * COLS + c;
                const cell = grid[idx];
                if (cell.isLocked) lockedCount++;
                colCells.push({ ...cell, idx });
            }
            const isFull = lockedCount === ROWS;
            columns.push(
                <RainColumn
                    key={c}
                    cells={colCells}
                    isFull={isFull}
                    isActive={isActive}
                />
            );
        }
        return columns;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>FIRE DROP</Text>
                <View style={styles.livesContainer}>
                    {[1, 2, 3].map(i => (
                        <View key={i} style={[styles.lifeDot, i > lives ? styles.lifeLost : null]} />
                    ))}
                </View>
                {/* Status Indicator during Play */}
                <Text style={styles.statusText}>
                    {gameStatus === 'PLAYING' ? "MULTIPLIERS RAINING..." : "BONUS COMPLETE"}
                </Text>
            </View>

            <View style={styles.gridContainer}>
                {renderColumns()}
            </View>

            <View style={styles.footer}>
                {gameStatus === 'PLAYING' ? (
                    <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                        <Text style={styles.skipText}>SKIP TO RESULT</Text>
                    </TouchableOpacity>
                ) : (
                    <ResultPanel
                        multiplier={finalStats.multiplier}
                        prize={finalStats.payout}
                        onCollect={() => { setPhase('BETTING'); setResult(null, []); }}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(5, 5, 10, 0.98)', // Very dark blue/black background
        justifyContent: 'center', alignItems: 'center'
    },
    header: { alignItems: 'center', marginBottom: 20 },
    title: {
        fontSize: 32,
        color: '#FF4444',
        fontWeight: '900',
        textShadowColor: '#FF0000',
        textShadowRadius: 20,
        letterSpacing: 3,
        marginBottom: 5
    },
    statusText: {
        color: '#666',
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 5,
        letterSpacing: 1
    },
    livesContainer: { flexDirection: 'row', gap: 8, marginTop: 5 },
    lifeDot: {
        width: 12, height: 12, borderRadius: 6,
        backgroundColor: '#22C55E', // Green Neon
        borderWidth: 1, borderColor: '#FFF',
        shadowColor: '#22C55E', shadowRadius: 10, shadowOpacity: 1, elevation: 5
    },
    lifeLost: {
        backgroundColor: '#333', borderColor: '#444',
        shadowOpacity: 0, elevation: 0
    },

    gridContainer: {
        flexDirection: 'row',
        backgroundColor: '#000',
        padding: 5,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#333', // Subtle border, focus on content
        // Outer Glow
        shadowColor: '#FF4444', shadowOpacity: 0.2, shadowRadius: 30
    },
    column: {
        width: 75,
        marginHorizontal: 3,
        backgroundColor: '#0a0a0a',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        height: 210,
        borderWidth: 1,
        borderColor: '#222'
    },
    rainContainer: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        overflow: 'hidden',
    },
    rainStrip: {
        position: 'absolute',
        left: 0, right: 0,
        alignItems: 'center',
    },
    rainItem: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    },

    cellSlot: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        borderBottomWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    emptyCell: {
        width: '100%', height: '100%'
    },

    // Footer & Results
    footer: {
        marginTop: 30,
        height: 120, // Check height to ensure space for result
        justifyContent: 'center',
        width: '100%',
        alignItems: 'center'
    },
    skipBtn: {
        paddingVertical: 12, paddingHorizontal: 25,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    skipText: { color: '#888', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },

    // Result Panel
    resultPanel: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%'
    },
    counterText: {
        fontSize: 42,
        fontWeight: '900',
        color: '#FFF',
        textShadowColor: '#3B82F6', textShadowRadius: 20
    },
    winLabel: {
        color: '#AAA', fontSize: 14, fontWeight: 'bold', letterSpacing: 2, marginBottom: 5
    },
    finalPrizeText: {
        fontSize: 56,
        fontWeight: '900',
        color: '#FFF',
        textShadowColor: '#FFF', textShadowRadius: 30, // WHITE NEON
        marginBottom: 10
    },
    collectBtn: {
        backgroundColor: '#FFF',
        paddingHorizontal: 40,
        paddingVertical: 12,
        borderRadius: 30,
        shadowColor: '#FFF', shadowOpacity: 0.5, shadowRadius: 15, elevation: 10
    },
    collectText: {
        color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 1
    }
});
