import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutChangeEvent, Alert } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS, withTiming, FadeIn, ZoomIn, SlideOutDown } from 'react-native-reanimated';
import { useGameStore } from '../store/useGameStore';
import { getChipColor } from '../constants/chips';

import { RED_NUMBERS } from '../constants/gameRules';

const NUMBERS = Array.from({ length: 36 }, (_, i) => i + 1); // 1-36

// Grid Layout Constants (will be measured dynamically)
const COLUMNS = 3;
const ROWS = 12;

interface Props {
    highlightedNumbers?: number[];
    isSpinning?: boolean;
    winningNumber?: number | null;

    // Controlled Mode Props (Strategy Editor)
    externalBets?: Record<string, number>;
    onExternalBet?: (id: string, amount: number) => boolean;
    externalChipValue?: number;
    disabled?: boolean;
}

export const BettingBoard: React.FC<Props> = ({
    highlightedNumbers = [],
    isSpinning = false,
    winningNumber = null,
    externalBets,
    onExternalBet,
    externalChipValue,
    disabled = false
}) => {
    const { bets: storeBets, placeBet: storePlaceBet, selectedChipValue: storeChipValue } = useGameStore();

    // specific toggle: determine if we are in "controlled" mode or "connected" mode
    const isControlled = externalBets !== undefined;

    const bets = externalBets || storeBets;
    const selectedChipValue = externalChipValue !== undefined ? externalChipValue : storeChipValue;

    const placeBet = (id: string, amount: number) => {
        if (onExternalBet) {
            return onExternalBet(id, amount);
        }
        return storePlaceBet(id, amount);
    };

    // Layout State
    const [gridMetrics, setGridMetrics] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [cellWidth, setCellWidth] = useState(0);
    const [cellHeight, setCellHeight] = useState(0);

    // Gesture State
    const activeDrag = useSharedValue(false);
    const isPrecisionMode = useSharedValue(false);
    const ghostX = useSharedValue(0);
    const ghostY = useSharedValue(0);

    // Track last "Painted" target to avoid spamming the same cell
    const lastPaintIdRef = React.useRef<string | null>(null);
    const [activeTarget, setActiveTarget] = useState<{ id: string, type: string, numbers: number[] } | null>(null);

    // Throttled Alert
    const lastAlert = React.useRef(0);
    const alertNoFunds = () => {
        const now = Date.now();
        if (now - lastAlert.current > 2000) {
            Alert.alert("Sin Créditos", "No tienes suficientes fichas.");
            lastAlert.current = now;
        }
    };

    const handlePress = (id: string) => {
        if (disabled) return;
        const success = placeBet(id, selectedChipValue);
        if (!success) alertNoFunds();
    };

    // --- HIT TESTING (Reused) ---
    const resolveBetTarget = (x: number, y: number, allowPrecision: boolean) => {
        const localX = x - gridMetrics.x;
        // Check bounds
        if (localX < 0 || localX > gridMetrics.width || y < 0 || y > gridMetrics.height) {
            return null;
        }

        const col = Math.floor(localX / cellWidth);
        const row = Math.floor(y / cellHeight);

        if (col < 0 || col >= 3 || row < 0 || row >= 12) return null;

        const baseNumber = (row * 3) + col + 1;

        // If NOT Precision Mode, always return Straight bet (Paint Mode)
        if (!allowPrecision) {
            return {
                type: 'STRAIGHT',
                numbers: [baseNumber],
                id: baseNumber.toString(),
                x: (col * cellWidth) + (cellWidth / 2),
                y: (row * cellHeight) + (cellHeight / 2)
            };
        }

        // Precision Mode Logic (Corners/Splits)
        const relX = (localX % cellWidth) / cellWidth;
        const relY = (y % cellHeight) / cellHeight;
        const HIT_SLOP = 0.25;

        // CHECK CORNERS (All 4 corners of current cell)
        const nearLeft = relX < HIT_SLOP;
        const nearRight = relX > (1 - HIT_SLOP);
        const nearTop = relY < HIT_SLOP;
        const nearBottom = relY > (1 - HIT_SLOP);

        // Helper to format ID
        const makeId = (prefix: string, nums: number[]) => {
            // Sort to ensure uniqueness (e.g. 1_2 vs 2_1)
            const sorted = [...nums].sort((a, b) => a - b);
            return `${prefix}_${sorted.join('_')}`;
        };

        // CORNERS
        if (nearLeft && nearTop && row > 0 && col > 0) {
            const numbers = [baseNumber, baseNumber - 1, baseNumber - 3, baseNumber - 4];
            return { type: 'CORNER', numbers, id: makeId('COR', numbers), x: col * cellWidth, y: row * cellHeight };
        }
        if (nearRight && nearTop && row > 0 && col < 2) {
            const numbers = [baseNumber, baseNumber + 1, baseNumber - 3, baseNumber - 2];
            return { type: 'CORNER', numbers, id: makeId('COR', numbers), x: (col + 1) * cellWidth, y: row * cellHeight };
        }
        if (nearLeft && nearBottom && row < 11 && col > 0) {
            const numbers = [baseNumber, baseNumber - 1, baseNumber + 3, baseNumber + 2];
            return { type: 'CORNER', numbers, id: makeId('COR', numbers), x: col * cellWidth, y: (row + 1) * cellHeight };
        }
        if (nearRight && nearBottom && row < 11 && col < 2) {
            const numbers = [baseNumber, baseNumber + 1, baseNumber + 3, baseNumber + 4];
            return { type: 'CORNER', numbers, id: makeId('COR', numbers), x: (col + 1) * cellWidth, y: (row + 1) * cellHeight };
        }

        // SPLITS
        // Left
        if (nearLeft && col > 0) {
            const numbers = [baseNumber, baseNumber - 1];
            return { type: 'SPLIT', numbers, id: makeId('SPLIT', numbers), x: col * cellWidth, y: (row * cellHeight) + (cellHeight / 2) };
        }
        // Right
        if (nearRight && col < 2) {
            const numbers = [baseNumber, baseNumber + 1];
            return { type: 'SPLIT', numbers, id: makeId('SPLIT', numbers), x: (col + 1) * cellWidth, y: (row * cellHeight) + (cellHeight / 2) };
        }
        // Top
        if (nearTop && row > 0) {
            const numbers = [baseNumber, baseNumber - 3];
            return { type: 'SPLIT', numbers, id: makeId('SPLIT', numbers), x: (col * cellWidth) + (cellWidth / 2), y: row * cellHeight };
        }
        // Bottom
        if (nearBottom && row < 11) {
            const numbers = [baseNumber, baseNumber + 3];
            return { type: 'SPLIT', numbers, id: makeId('SPLIT', numbers), x: (col * cellWidth) + (cellWidth / 2), y: (row + 1) * cellHeight };
        }

        // STRAIGHT (Default)
        return {
            type: 'STRAIGHT',
            numbers: [baseNumber],
            id: baseNumber.toString(),
            x: (col * cellWidth) + (cellWidth / 2),
            y: (row * cellHeight) + (cellHeight / 2)
        };
    };

    // --- GESTURES ---

    // 1. TAP: Single Click -> Place Straight Bet
    const tapGesture = Gesture.Tap()
        .onEnd((e) => {
            runOnJS(processTap)(e.x, e.y);
        });

    function processTap(x: number, y: number) {
        if (disabled) return;
        if (!gridMetrics.width) return;
        // User wants Precision (Splits/Corners) on Tap too
        const target = resolveBetTarget(x, y, true);
        if (target) {
            const success = placeBet(target.id, selectedChipValue);
            if (!success) alertNoFunds();
        }
    }

    // 2. LONG PRESS: Enter Precision Mode
    const longPressGesture = Gesture.LongPress()
        .minDuration(250)
        .maxDistance(20)
        .onStart(() => {
            isPrecisionMode.value = true;
            activeDrag.value = true; // Show Ghost
        })
        .onFinalize(() => {
            // Reset is handled by pan end
        });


    // 3. PAN: Handles both Paint (Drag) and Precision (Drag after Hold)
    // Ref to track Paint Trail during gesture
    function resetPaint() {
        lastPaintIdRef.current = null;
        setActiveTarget(null);
    }

    const panGesture = Gesture.Pan()
        .minDistance(5)
        .onStart(() => {
            if (!isPrecisionMode.value) {
                // If LongPress hasn't fired yet, it's PAINT MODE
                activeDrag.value = false;
            }
        })
        .onUpdate((e) => {
            if (isPrecisionMode.value) {
                // PRECISION: Move Ghost Chip
                runOnJS(processPrecisionDrag)(e.x, e.y);
            } else {
                // PAINT: Place bets immediately
                runOnJS(processPaintDrag)(e.x, e.y);
            }
        })
        .onEnd(() => {
            if (isPrecisionMode.value) {
                // Confirm Precision Bet
                runOnJS(confirmBet)();
            }
            // Reset
            isPrecisionMode.value = false;
            activeDrag.value = false;
            runOnJS(resetPaint)();
        });


    // --- JS HANDLERS ---

    // PAINT: Drops chips as we move (Trail)
    function processPaintDrag(x: number, y: number) {
        if (disabled) return;
        if (!gridMetrics.width) return;
        // User wants Precision (Splits/Corners) on Drag too
        const target = resolveBetTarget(x, y, true);

        if (target && target.id !== lastPaintIdRef.current) {
            const success = placeBet(target.id, selectedChipValue);
            if (success) {
                lastPaintIdRef.current = target.id;
            } else {
                alertNoFunds();
            }
        }
    }

    // PRECISION: Updates Ghost Target
    function processPrecisionDrag(x: number, y: number) {
        if (disabled) return;
        if (!gridMetrics.width) return;
        const target = resolveBetTarget(x, y, true); // ALLOW Corners/Splits
        if (target) {
            setActiveTarget(target);
            ghostX.value = withTiming(target.x, { duration: 50 });
            ghostY.value = withTiming(target.y, { duration: 50 });
        } else {
            setActiveTarget(null);
        }
    }

    function confirmBet() {
        if (activeTarget) {
            const success = placeBet(activeTarget.id, selectedChipValue);
            if (!success) alertNoFunds();
            setActiveTarget(null);
        }
    }


    const gestureConfig = Gesture.Race(tapGesture, Gesture.Simultaneous(longPressGesture, panGesture));

    const onGridLayout = (event: LayoutChangeEvent) => {
        const { x, y, width, height } = event.nativeEvent.layout;
        setGridMetrics({ x, y, width, height });
        setCellWidth(width / COLUMNS);
        setCellHeight(height / ROWS);
    };

    // Styles
    const ghostStyle = useAnimatedStyle(() => {
        return {
            opacity: activeDrag.value ? 1 : 0,
            transform: [
                { translateX: ghostX.value - 15 }, // Center chip (30px size)
                { translateY: ghostY.value - 15 },
                { scale: activeDrag.value ? 1.2 : 0 }
            ]
        };
    });


    const getBetAmount = (id: string) => bets[id] || 0;

    const renderChip = (id: string, customStyle?: object) => {
        const amount = getBetAmount(id);
        if (amount <= 0) return null;

        const chipColor = getChipColor(amount);
        const textColor = chipColor === '#000000' ? '#FFF' : '#000';

        // Format Amount (e.g. 1000 -> 1k)
        let displayAmount = amount.toString();
        if (amount >= 1000000) {
            displayAmount = (amount / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        } else if (amount >= 1000) {
            displayAmount = (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        }

        const fontSize = displayAmount.length > 3 ? 8 : 9;

        return (
            <Animated.View
                entering={FadeIn}
                exiting={SlideOutDown.duration(800)}
                style={[styles.chip, { backgroundColor: chipColor, borderColor: chipColor }, customStyle]}
            >
                <View style={[styles.chipInner, { backgroundColor: chipColor, borderColor: '#FFF' }]}>
                    <Text style={[styles.chipText, { color: textColor, fontSize }]}>{displayAmount}</Text>
                </View>
            </Animated.View>
        );
    };

    const renderDolly = () => (
        <Animated.View
            entering={ZoomIn.duration(500)}
            style={styles.dolly}
        >
            <View style={styles.dollyHandle} />
            <View style={styles.dollyBase} />
        </Animated.View>
    );

    const renderNumberCell = (num: number) => {
        const isRed = RED_NUMBERS.includes(num);
        const color = isRed ? COLORS.BET_RED : COLORS.BET_BLACK;
        const isFire = highlightedNumbers.includes(num);

        // Highlight if part of active target
        const hasBet = bets[num.toString()] !== undefined && bets[num.toString()] > 0;
        const isTargeted = activeTarget?.numbers.includes(num);
        const isWinner = winningNumber === num;

        return (
            <View
                key={num}
                style={[
                    styles.gridCell,
                    isFire && styles.fireCell,
                    (isFire && hasBet) && styles.fireBetHighlight,
                    isTargeted && styles.targetHighlight
                ]}
            >
                <TouchableOpacity
                    style={styles.cellTouch}
                    onPress={() => handlePress(num.toString())}
                >
                    <View style={[styles.numberOval, { backgroundColor: color }]}>
                        <Text style={[styles.numberText, isSpinning && { fontSize: 12 }]}>{num}</Text>
                    </View>
                    {/* OPTIONAL: Highlight winning cell bg? */}
                </TouchableOpacity>
                {renderChip(num.toString())}
                {/* RENDER DOLLY IF WINNER */}
                {isWinner && renderDolly()}
            </View>
        );
    };

    // helper for side bets
    const renderLabelCell = (label: string, id: string, flex: number = 1) => {
        return (
            <TouchableOpacity
                style={[styles.sideBetCell, { flex }]}
                onPress={() => handlePress(id)}
            >
                <Text style={styles.labelText}>{label}</Text>
                {renderChip(id)}
            </TouchableOpacity>
        );
    };

    const renderColorCell = (color: 'RED' | 'BLACK', id: string) => {
        const bgColor = color === 'RED' ? COLORS.BET_RED : COLORS.BET_BLACK;
        return (
            <TouchableOpacity
                style={styles.colorBetCell}
                onPress={() => handlePress(id)}
            >
                <View style={[styles.colorBlock, { backgroundColor: bgColor }]} />
                {renderChip(id)}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>

            {/* COLUMN 1: OUTSIDE BETS (Left Sidebar) */}
            <View style={styles.col1}>
                <View style={styles.topSpacer} />
                <View style={styles.sidebarSection}>
                    {renderLabelCell('1-18', '1-18')}
                    {renderLabelCell('EVEN', 'EVEN')}
                </View>
                <View style={styles.sidebarSection}>
                    <View style={styles.colorRow}>
                        {renderColorCell('RED', 'RED')}
                        {renderColorCell('BLACK', 'BLACK')}
                    </View>
                </View>
                <View style={styles.sidebarSection}>
                    {renderLabelCell('ODD', 'ODD')}
                    {renderLabelCell('19-36', '19-36')}
                </View>
                <View style={styles.bottomSpacer} />
            </View>

            {/* COLUMN 2: DOZENS (Middle Sidebar) */}
            <View style={styles.col2}>
                <View style={styles.topSpacer} />
                <View style={styles.dozensContainer}>
                    {renderLabelCell('1st 12', '1st12', 1)}
                    {renderLabelCell('2nd 12', '2nd12', 1)}
                    {renderLabelCell('3rd 12', '3rd12', 1)}
                </View>
                <View style={styles.bottomSpacer} />
            </View>

            {/* COLUMN 3: MAIN GRID (Inside Bets + 0 + 2to1) */}
            <View style={styles.col3}>

                {/* ROW A: ZERO */}
                <TouchableOpacity
                    style={[styles.zeroRow, highlightedNumbers.includes(0) && styles.fireCell]}
                    onPress={() => handlePress('0')}
                >
                    <View style={[styles.zeroOval, { backgroundColor: '#4CAF50' }]}>
                        <Text style={styles.numberText}>0</Text>
                    </View>
                    {renderChip('0')}
                </TouchableOpacity>

                {/* ROW B: NUMBER GRID - THE DRAG ZONE */}
                <GestureDetector gesture={gestureConfig}>
                    <Animated.View style={styles.numberGrid} onLayout={onGridLayout}>
                        {NUMBERS.map(num => renderNumberCell(num))}

                        {/* RENDER ADVANCED CHIPS */}
                        {Object.keys(bets).map(betId => {
                            if (betId.startsWith('SPLIT') || betId.startsWith('COR')) {
                                const parts = betId.split('_');
                                const type = parts[0];
                                let cx = 0, cy = 0;

                                if (type === 'SPLIT' && parts.length === 3) {
                                    const n1 = parseInt(parts[1]);
                                    const n2 = parseInt(parts[2]);
                                    const r1 = Math.floor((n1 - 1) / 3);
                                    const c1 = (n1 - 1) % 3;
                                    const r2 = Math.floor((n2 - 1) / 3);
                                    const c2 = (n2 - 1) % 3;

                                    // Calculate center of the two cells
                                    cx = ((c1 + c2) / 2) * cellWidth + cellWidth / 2;
                                    cy = ((r1 + r2) / 2) * cellHeight + cellHeight / 2;
                                }
                                else if (type === 'COR' && parts.length >= 2) {
                                    const p = parts.slice(1).map(s => parseInt(s));
                                    if (p.length < 4) return null;

                                    const n1 = p[0];
                                    const n4 = p[3]; // The furthest corner

                                    const r1 = Math.floor((n1 - 1) / 3);
                                    const c1 = (n1 - 1) % 3;
                                    const r4 = Math.floor((n4 - 1) / 3);
                                    const c4 = (n4 - 1) % 3;

                                    // Center of the 4 cells
                                    cx = ((c1 + c4) / 2) * cellWidth + cellWidth / 2;
                                    cy = ((r1 + r4) / 2) * cellHeight + cellHeight / 2;
                                } else {
                                    return null;
                                }

                                if (isNaN(cx) || isNaN(cy)) return null;

                                return (
                                    <View key={betId} style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        transform: [
                                            { translateX: cx - 12 }, // Center 24px chip (24/2 = 12)
                                            { translateY: cy - 12 }
                                        ],
                                        zIndex: 30
                                    }}>
                                        {renderChip(betId, { position: 'relative', left: 0, top: 0, margin: 0 })}
                                    </View>
                                );
                            }
                            return null;
                        })}

                        {/* GHOST CHIP overlay */}
                        <Animated.View style={[styles.ghostChip, ghostStyle]} pointerEvents="none">
                            <View style={styles.chipInner} />
                        </Animated.View>

                    </Animated.View>
                </GestureDetector>

                {/* ROW C: COLUMN BETS */}
                <View style={styles.columnsRow}>
                    {renderLabelCell('2 to 1', 'COL1', 1)}
                    {renderLabelCell('2 to 1', 'COL2', 1)}
                    {renderLabelCell('2 to 1', 'COL3', 1)}
                </View>

            </View>

        </View>
    );
};

import { COLORS, METRICS } from '../constants/theme';

// 0-14 unit height layout
const BORDER_COLOR = COLORS.BORDER_SUBTLE;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: COLORS.BG_SURFACE, // Flat dark background instead of green felt
        paddingHorizontal: 20,
        paddingVertical: 10,
        // Add top border to separate from game area?
        borderTopWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
    },
    // COLUMNS
    col1: {
        flex: 2,
        borderRightWidth: 1,
        borderColor: BORDER_COLOR,
    },
    col2: {
        flex: 1.2,
        borderRightWidth: 1,
        borderColor: BORDER_COLOR,
    },
    col3: {
        flex: 6,
    },

    // INTERNAL SPACERS
    topSpacer: { flex: 1, borderBottomWidth: 1, borderColor: BORDER_COLOR },
    bottomSpacer: { flex: 1, borderTopWidth: 1, borderColor: BORDER_COLOR },

    // SIDEBAR SECTIONS
    sidebarSection: {
        flex: 4,
        borderBottomWidth: 1,
        borderColor: BORDER_COLOR,
    },
    sideBetCell: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: BORDER_COLOR,
    },
    colorRow: {
        flex: 1,
        flexDirection: 'row',
    },
    colorBetCell: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderColor: BORDER_COLOR,
    },

    // DOZENS
    dozensContainer: { flex: 12 },

    // ZERO
    zeroRow: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: BORDER_COLOR,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
    },
    zeroOval: {
        width: '60%',
        height: '80%',
        borderRadius: 50,
        backgroundColor: COLORS.BET_GREEN,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },

    // NUMBER GRID
    numberGrid: {
        flex: 12,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gridCell: {
        width: '33.33%',
        height: '8.33%', // 1/12th
        justifyContent: 'center',
        alignItems: 'center',
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: BORDER_COLOR,
    },
    columnsRow: {
        flex: 1,
        flexDirection: 'row',
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: BORDER_COLOR,
    },

    // GEOMETRIC SHAPES & TEXT
    numberOval: {
        width: '80%',   // Not full fill
        height: '80%',
        borderRadius: 8, // Rounded Rect / Squircle
        justifyContent: 'center',
        alignItems: 'center',
        // Slight shadow/elevation for "chip" feel or just separation
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 1,
    },

    // RED/BLACK BET BLOCKS
    colorBlock: {
        width: '60%',
        height: '60%',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // TEXT
    numberText: {
        color: '#FFF',
        fontWeight: '900', // Very bold
        fontSize: 18,      // Larger
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 1,
    },
    labelText: {
        color: COLORS.ACCENT_GOLD,
        fontWeight: '700',
        fontSize: 14,
        textAlign: 'center',
        letterSpacing: 1,
    },

    // CHIPS...
    chip: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFEB3B',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FBC02D',
        zIndex: 20,
        elevation: 5,
    },
    chipInner: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FFF',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    chipText: {
        fontWeight: 'bold',
        color: '#000',
        textAlign: 'center',
    },

    cellTouch: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // HIGHLIGHTS
    fireCell: {
        backgroundColor: 'rgba(255, 69, 0, 0.2)',
        borderColor: COLORS.ACCENT_GOLD,
        borderWidth: 1,
    },
    fireBetHighlight: {
        backgroundColor: 'rgba(255, 215, 0, 0.3)',
        borderWidth: 2,
        borderColor: COLORS.ACCENT_GOLD,
    },
    targetHighlight: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    ghostChip: {
        position: 'absolute',
        width: 24, // Consistent with standard chip
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 235, 59, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
        zIndex: 100,
    },
    // DOLLY (Win Marker)
    dolly: {
        position: 'absolute',
        zIndex: 200,
        width: 24,
        height: 48,
        alignItems: 'center',
        justifyContent: 'flex-end',
        top: -10, // Offset to look like it's standing
    },
    dollyBase: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 215, 0, 0.6)', // Glassy Gold
        borderWidth: 2,
        borderColor: COLORS.ACCENT_GOLD,
        shadowColor: 'black',
        shadowOpacity: 0.5,
        shadowRadius: 2,
        elevation: 10,
    },
    dollyHandle: {
        width: 8,
        height: 24,
        backgroundColor: 'rgba(255, 215, 0, 0.8)',
        borderWidth: 1,
        borderColor: '#FFF',
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
        position: 'absolute',
        top: 0,
    }
});
