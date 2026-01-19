import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutChangeEvent, Alert } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS, withTiming, FadeIn, ZoomIn, SlideOutDown } from 'react-native-reanimated';
import { useGameStore } from '../store/useGameStore';
import { getChipColor } from '../constants/chips';
import { HapticManager } from '../services/HapticManager';
import { RED_NUMBERS } from '../constants/gameRules';
import { COLORS, METRICS, SHADOWS } from '../constants/theme';

const NUMBERS = Array.from({ length: 36 }, (_, i) => i + 1); // 1-36

// Grid Layout Constants (will be measured dynamically)
const COLUMNS = 3;
const ROWS = 13; // 0 (Zero) + 12 (1-36)

interface Props {
    highlightedNumbers?: number[];
    isSpinning?: boolean;
    winningNumber?: number | null;
    externalBets?: Record<string, number>;
    onExternalBet?: (id: string, amount: number) => boolean;
    externalChipValue?: number;
    disabled?: boolean;
    heatmapData?: Record<number, number>; // Number -> Count
}

export const BettingBoard: React.FC<Props> = ({
    highlightedNumbers = [],
    isSpinning = false,
    winningNumber = null,
    externalBets,
    onExternalBet,
    externalChipValue,
    disabled = false,
    heatmapData
}) => {
    const { bets: storeBets, placeBet: storePlaceBet, selectedChipValue: storeChipValue } = useGameStore();
    const isControlled = externalBets !== undefined;
    const bets = externalBets || storeBets;
    const selectedChipValue = externalChipValue !== undefined ? externalChipValue : storeChipValue;

    const placeBet = (id: string, amount: number) => {
        if (onExternalBet) return onExternalBet(id, amount);
        const success = storePlaceBet(id, amount);
        if (success) HapticManager.playChipSound();
        return success;
    };

    const [gridMetrics, setGridMetrics] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [cellWidth, setCellWidth] = useState(0);
    const [cellHeight, setCellHeight] = useState(0);

    // Gesture State
    const activeDrag = useSharedValue(false);
    const isPrecisionMode = useSharedValue(false);
    const ghostX = useSharedValue(0);
    const ghostY = useSharedValue(0);
    const lastPaintIdRef = React.useRef<string | null>(null);
    const [activeTarget, setActiveTarget] = useState<{ id: string, type: string, numbers: number[] } | null>(null);
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

    // --- HIT TESTING ---
    const resolveBetTarget = (x: number, y: number, allowPrecision: boolean) => {
        const localX = x - gridMetrics.x;
        const localY = y - gridMetrics.y;

        if (localX < 0 || localX > gridMetrics.width || localY < 0 || localY > gridMetrics.height) return null;

        const col = Math.floor(localX / cellWidth);
        const row = Math.floor(localY / cellHeight);

        if (col < 0 || col >= 3 || row < 0 || row >= 13) return null;

        const isZeroRow = row === 0;
        const logicalRow = row - 1;
        const baseNumber = isZeroRow ? 0 : (logicalRow * 3) + col + 1;

        const relX = (localX % cellWidth) / cellWidth;
        const relY = (localY % cellHeight) / cellHeight;
        const HIT_SLOP = 0.25;

        const nearLeft = relX < HIT_SLOP;
        const nearRight = relX > (1 - HIT_SLOP);
        const nearTop = relY < HIT_SLOP;
        const nearBottom = relY > (1 - HIT_SLOP);

        const makeId = (prefix: string, nums: number[]) => {
            const sorted = [...nums].sort((a, b) => a - b);
            return `${prefix}_${sorted.join('_')}`;
        };

        if (isZeroRow) {
            if (!allowPrecision || (!nearBottom)) {
                return { type: 'STRAIGHT', numbers: [0], id: '0', x: 1.5 * cellWidth, y: 0.5 * cellHeight };
            }
            if (nearBottom) {
                const belowNum = col + 1;
                const numbers = [0, belowNum];
                return { type: 'SPLIT', numbers, id: makeId('SPLIT', numbers), x: (col * cellWidth) + (cellWidth / 2), y: cellHeight };
            }
            return { type: 'STRAIGHT', numbers: [0], id: '0', x: 1.5 * cellWidth, y: 0.5 * cellHeight };
        }

        // ROW > 0 Logic
        // STREET / SIXLINE (Left Edge)
        if (allowPrecision && nearLeft && col === 0) {
            if (nearTop && logicalRow > 0) {
                const startPrev = baseNumber - 3;
                const startCurr = baseNumber;
                const numbers = [startPrev, startPrev + 1, startPrev + 2, startCurr, startCurr + 1, startCurr + 2];
                return { type: 'SIXLINE', numbers, id: makeId('SIXLINE', numbers), x: 0, y: row * cellHeight };
            }
            if (nearBottom && logicalRow < 11) {
                const startCurr = baseNumber;
                const startNext = baseNumber + 3;
                const numbers = [startCurr, startCurr + 1, startCurr + 2, startNext, startNext + 1, startNext + 2];
                return { type: 'SIXLINE', numbers, id: makeId('SIXLINE', numbers), x: 0, y: (row + 1) * cellHeight };
            }
            const numbers = [baseNumber, baseNumber + 1, baseNumber + 2];
            return { type: 'STREET', numbers, id: makeId('STREET', numbers), x: 0, y: (row * cellHeight) + (cellHeight / 2) };
        }

        if (!allowPrecision) {
            return { type: 'STRAIGHT', numbers: [baseNumber], id: baseNumber.toString(), x: (col * cellWidth) + (cellWidth / 2), y: (row * cellHeight) + (cellHeight / 2) };
        }

        // CORNER / SPLIT Logic (simplified for brevity, logic remains same as old file)
        if (nearLeft && nearTop && logicalRow > 0 && col > 0) {
            const numbers = [baseNumber, baseNumber - 1, baseNumber - 3, baseNumber - 4];
            return { type: 'CORNER', numbers, id: makeId('COR', numbers), x: col * cellWidth, y: row * cellHeight };
        }
        if (nearRight && nearTop && logicalRow > 0 && col < 2) {
            const numbers = [baseNumber, baseNumber + 1, baseNumber - 3, baseNumber - 2];
            return { type: 'CORNER', numbers, id: makeId('COR', numbers), x: (col + 1) * cellWidth, y: row * cellHeight };
        }
        if (nearLeft && nearBottom && logicalRow < 11 && col > 0) {
            const numbers = [baseNumber, baseNumber - 1, baseNumber + 3, baseNumber + 2];
            return { type: 'CORNER', numbers, id: makeId('COR', numbers), x: col * cellWidth, y: (row + 1) * cellHeight };
        }
        if (nearRight && nearBottom && logicalRow < 11 && col < 2) {
            const numbers = [baseNumber, baseNumber + 1, baseNumber + 3, baseNumber + 4];
            return { type: 'CORNER', numbers, id: makeId('COR', numbers), x: (col + 1) * cellWidth, y: (row + 1) * cellHeight };
        }
        if (nearLeft && col > 0) {
            const numbers = [baseNumber, baseNumber - 1];
            return { type: 'SPLIT', numbers, id: makeId('SPLIT', numbers), x: col * cellWidth, y: (row * cellHeight) + (cellHeight / 2) };
        }
        if (nearRight && col < 2) {
            const numbers = [baseNumber, baseNumber + 1];
            return { type: 'SPLIT', numbers, id: makeId('SPLIT', numbers), x: (col + 1) * cellWidth, y: (row * cellHeight) + (cellHeight / 2) };
        }
        if (nearTop && logicalRow > 0) {
            const numbers = [baseNumber, baseNumber - 3];
            return { type: 'SPLIT', numbers, id: makeId('SPLIT', numbers), x: (col * cellWidth) + (cellWidth / 2), y: row * cellHeight };
        }
        if (nearBottom && logicalRow < 11) {
            const numbers = [baseNumber, baseNumber + 3];
            return { type: 'SPLIT', numbers, id: makeId('SPLIT', numbers), x: (col * cellWidth) + (cellWidth / 2), y: (row + 1) * cellHeight };
        }

        // Zero Corner/Trios
        if (nearTop && logicalRow === 0) {
            if (col === 1 && nearLeft) {
                const numbers = [0, 1, 2];
                return { type: 'TRIO', numbers, id: makeId('TRIO', numbers), x: col * cellWidth, y: row * cellHeight };
            }
            if (col === 1 && nearRight) {
                const numbers = [0, 2, 3];
                return { type: 'TRIO', numbers, id: makeId('TRIO', numbers), x: (col + 1) * cellWidth, y: row * cellHeight };
            }
            const numbers = [0, baseNumber]; // Split
            return { type: 'SPLIT', numbers, id: makeId('SPLIT', numbers), x: (col * cellWidth) + (cellWidth / 2), y: row * cellHeight };
        }

        return { type: 'STRAIGHT', numbers: [baseNumber], id: baseNumber.toString(), x: (col * cellWidth) + (cellWidth / 2), y: (row * cellHeight) + (cellHeight / 2) };
    };

    // --- GESTURES (JS Interop) ---
    const tapGesture = Gesture.Tap().onEnd((e) => runOnJS(processTap)(e.x, e.y));
    function processTap(x: number, y: number) {
        if (disabled || !gridMetrics.width) return;
        const target = resolveBetTarget(x, y, true);
        if (target) {
            const success = placeBet(target.id, selectedChipValue);
            if (!success) alertNoFunds();
        }
    }

    const longPressGesture = Gesture.LongPress().minDuration(250).maxDistance(20)
        .onStart(() => {
            isPrecisionMode.value = true;
            activeDrag.value = true;
        });

    const panGesture = Gesture.Pan().minDistance(5)
        .onStart(() => {
            if (!isPrecisionMode.value) activeDrag.value = false;
        })
        .onUpdate((e) => {
            if (isPrecisionMode.value) runOnJS(processPrecisionDrag)(e.x, e.y);
            else runOnJS(processPaintDrag)(e.x, e.y);
        })
        .onEnd(() => {
            if (isPrecisionMode.value) runOnJS(confirmBet)();
            isPrecisionMode.value = false;
            activeDrag.value = false;
            runOnJS(resetPaint)();
        });

    function resetPaint() { lastPaintIdRef.current = null; setActiveTarget(null); }
    function processPaintDrag(x: number, y: number) {
        if (disabled || !gridMetrics.width) return;
        const target = resolveBetTarget(x, y, true);
        if (target && target.id !== lastPaintIdRef.current) {
            const success = placeBet(target.id, selectedChipValue);
            if (success) lastPaintIdRef.current = target.id;
            else alertNoFunds();
        }
    }
    function processPrecisionDrag(x: number, y: number) {
        if (disabled || !gridMetrics.width) return;
        const target = resolveBetTarget(x, y, true);
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

    const ghostStyle = useAnimatedStyle(() => ({
        opacity: activeDrag.value ? 1 : 0,
        transform: [{ translateX: ghostX.value - 18 }, { translateY: ghostY.value - 18 }, { scale: activeDrag.value ? 1.2 : 0 }]
    }));

    const renderChip = (id: string, customStyle?: object) => {
        const amount = bets[id] || 0;
        if (amount <= 0) return null;
        const chipColor = getChipColor(amount);
        const textColor = chipColor === '#000000' ? '#FFF' : '#000';
        let displayAmount = amount.toString();
        if (amount >= 1e6) displayAmount = (amount / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
        else if (amount >= 1e3) displayAmount = (amount / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
        const fontSize = displayAmount.length > 3 ? 10 : 12;

        return (
            <Animated.View entering={FadeIn} leaving={SlideOutDown.duration(800)} style={[styles.chip, { backgroundColor: chipColor, borderColor: chipColor }, customStyle]}>
                <View style={[styles.chipInner, { backgroundColor: chipColor, borderColor: '#FFF' }]}>
                    <Text style={[styles.chipText, { color: textColor, fontSize }]}>{displayAmount}</Text>
                </View>
            </Animated.View>
        );
    };

    const renderDolly = () => (
        <Animated.View entering={ZoomIn.duration(500)} style={styles.dolly}>
            <View style={styles.dollyHandle} /><View style={styles.dollyBase} />
        </Animated.View>
    );

    const renderNumberCell = (num: number) => {
        const isRedNum = RED_NUMBERS.includes(num);
        const borderColor = isRedNum ? COLORS.BET_RED : '#334155'; // Red vs Slate Border

        // Filled background for better visibility
        let backgroundColor = isRedNum
            ? 'rgba(200, 0, 0, 0.6)'
            : 'rgba(30, 30, 40, 0.8)';

        let countBadge = null;
        if (heatmapData) {
            const count = heatmapData[num] || 0;
            if (count > 0) {
                if (count >= 4) backgroundColor = COLORS.BET_RED;
                else if (count >= 2) backgroundColor = COLORS.ACCENT_HOVER;
                else backgroundColor = 'rgba(255, 255, 255, 0.1)';
                countBadge = (<View style={styles.countBadge}><Text style={styles.countText}>{count}</Text></View>);
            }
        }

        const isFire = highlightedNumbers.includes(num);
        const hasBet = bets[num.toString()] !== undefined && bets[num.toString()] > 0;
        const isTargeted = activeTarget?.numbers.includes(num);
        const isWinner = winningNumber === num;

        return (
            <View key={num} style={[
                styles.gridCell,
                { borderColor, backgroundColor },
                isFire && styles.fireCell,
                (isFire && hasBet) && styles.fireBetHighlight,
                isTargeted && styles.targetHighlight
            ]}>
                <View style={styles.cellTouch} pointerEvents="none">
                    <Text style={[styles.numberText, isSpinning && { fontSize: 12 }]}>{num}</Text>
                    {countBadge}
                </View>
                {isWinner && renderDolly()}
            </View>
        );
    };

    const renderLabelCell = (label: string, id: string, flex: number = 1) => (
        <TouchableOpacity style={[styles.sideBetCell, { flex, position: 'relative' }]} onPress={() => handlePress(id)}>
            <Text style={styles.labelText}>{label}</Text>
            {renderChip(id, { position: 'absolute', top: '50%', left: '50%', marginLeft: -18, marginTop: -18, zIndex: 10 })}
        </TouchableOpacity>
    );

    const renderColorCell = (color: 'RED' | 'BLACK', id: string) => {
        const bg = color === 'RED' ? COLORS.BET_RED : COLORS.BET_BLACK;
        return (
            <TouchableOpacity style={[styles.colorBetCell, { position: 'relative' }]} onPress={() => handlePress(id)}>
                <View style={[styles.colorBlock, { backgroundColor: bg }]} />
                {renderChip(id, { position: 'absolute', top: '50%', left: '50%', marginLeft: -18, marginTop: -18, zIndex: 10 })}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* SIDEBARS */}
            <View style={styles.col1}>
                <View style={styles.topSpacer} />
                <View style={styles.sidebarSection}>{renderLabelCell('1-18', '1-18')}{renderLabelCell('EVEN', 'EVEN')}</View>
                <View style={styles.sidebarSection}><View style={styles.colorRow}>{renderColorCell('RED', 'RED')}{renderColorCell('BLACK', 'BLACK')}</View></View>
                <View style={styles.sidebarSection}>{renderLabelCell('ODD', 'ODD')}{renderLabelCell('19-36', '19-36')}</View>
                <View style={styles.bottomSpacer} />
            </View>

            <View style={styles.col2}>
                <View style={styles.topSpacer} />
                <View style={styles.dozensContainer}>{renderLabelCell('1st 12', '1st12', 1)}{renderLabelCell('2nd 12', '2nd12', 1)}{renderLabelCell('3rd 12', '3rd12', 1)}</View>
                <View style={styles.bottomSpacer} />
            </View>

            <View style={styles.col3}>
                <GestureDetector gesture={gestureConfig}>
                    <Animated.View style={{ flex: 13, width: '100%' }} onLayout={onGridLayout}>
                        {/* ZERO ROW */}
                        <View style={[styles.zeroRow, highlightedNumbers.includes(0) && styles.fireCell]}>
                            <View style={[styles.zeroOval, { width: '80%', height: '80%' }]}>
                                <Text style={styles.numberText}>0</Text>
                            </View>
                            {!heatmapData && renderChip('0', { position: 'absolute', top: '50%', left: '50%', marginLeft: -18, marginTop: -18, zIndex: 10 })}
                        </View>
                        {/* 1-36 GRID */}
                        <View style={styles.numberGrid}>{NUMBERS.map(num => renderNumberCell(num))}</View>
                        {/* CHIPS RENDERER */}
                        {Object.keys(bets).map(betId => {
                            // CRITICAL FIX: Only parse numeric bets, IGNORE labels like '1st12'
                            if (!/^\d+$/.test(betId)) return null;

                            let cx = 0, cy = 0;
                            // Numeric Logic Only (Straight Bets)
                            if (betId === '0') { return null; /* Handled by zeroRow */ }
                            const n = parseInt(betId);
                            cx = ((n - 1) % 3) + 0.5; cy = Math.floor((n - 1) / 3) + 1 + 0.5;

                            return (
                                <View key={betId} style={{ position: 'absolute', left: cx * cellWidth - 18, top: cy * cellHeight - 18, zIndex: 30 }}>
                                    {renderChip(betId, { margin: 0 })}
                                </View>
                            );
                        })}
                        {/* Re-add overlay for Splits/Corners if format is known (Skipping complex logic for brevity unless requested)
                            Actually, strict check `/^\d+$/` skips Splits/Corners. We need to allow them if they follow the pattern.
                            Pattern: `SPLIT_1_2` etc.
                        */}
                        {Object.keys(bets).map(betId => {
                            if (!betId.includes('_')) return null; // Skip if handled above or is text
                            // ... Chip Logic ...
                            let cx = 0, cy = 0;
                            if (betId.startsWith('SPLIT') || betId.startsWith('COR') || betId.startsWith('TRIO') || betId.startsWith('STREET') || betId.startsWith('SIXLINE')) {
                                const nums = betId.split('_').slice(1).map(Number);
                                // Centroid Logic Re-impled
                                const points = nums.map(n => {
                                    if (n === 0) return { c: 1.5, r: 0.5 };
                                    return { c: ((n - 1) % 3) + 0.5, r: Math.floor((n - 1) / 3) + 1 + 0.5 };
                                });
                                let sumC = 0, sumR = 0; points.forEach(p => { sumC += p.c; sumR += p.r });
                                cx = sumC / points.length; cy = sumR / points.length;
                                // Edges
                                if (betId.startsWith('STREET')) cx = 0;
                                if (betId.startsWith('SIXLINE')) cx = 0;
                                if (betId.startsWith('TRIO')) { if (nums.includes(1)) { cx = 1; cy = 1; } else { cx = 2; cy = 1; } }
                            }
                            if (cx === 0 && cy === 0) return null;
                            return (
                                <View key={betId} style={{ position: 'absolute', left: cx * cellWidth - 18, top: cy * cellHeight - 18, zIndex: 30 }}>
                                    {renderChip(betId, { margin: 0 })}
                                </View>
                            );
                        })}

                        <Animated.View style={[styles.ghostChip, ghostStyle]} pointerEvents="none"><View style={styles.chipInner} /></Animated.View>
                    </Animated.View>
                </GestureDetector>

                <View style={styles.columnsRow}>
                    {renderLabelCell('2:1', 'COL1', 1)}{renderLabelCell('2:1', 'COL2', 1)}{renderLabelCell('2:1', 'COL3', 1)}
                </View>
            </View>
        </View>
    );
};

// STYLES
const B_COLOR = 'rgba(255, 255, 255, 0.1)';

const styles = StyleSheet.create({
    container: {
        flex: 1, flexDirection: 'row', backgroundColor: 'transparent',
        borderWidth: 1, borderColor: B_COLOR, borderRadius: 12, overflow: 'hidden'
    },
    col1: { flex: 2.5, borderRightWidth: 1, borderColor: B_COLOR },
    col2: { flex: 1.2, borderRightWidth: 1, borderColor: B_COLOR },
    col3: { flex: 6 },
    topSpacer: { flex: 1, borderBottomWidth: 1, borderColor: B_COLOR },
    bottomSpacer: { flex: 1, borderTopWidth: 1, borderColor: B_COLOR },

    // TEXT
    labelText: { color: COLORS.TEXT_PRIMARY, fontWeight: 'bold', fontSize: 13, transform: [{ rotate: '90deg' }], width: 60, textAlign: 'center' },
    numberText: { color: '#FFF', fontSize: 20, fontWeight: '900' },

    // CELLS
    sidebarSection: { flex: 4, borderBottomWidth: 1, borderColor: B_COLOR, alignItems: 'center', justifyContent: 'center' },
    sideBetCell: { flex: 1, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderColor: B_COLOR, width: '100%' },
    colorRow: { flex: 1, flexDirection: 'row', width: '100%' },
    colorBetCell: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderColor: B_COLOR },
    colorBlock: { width: 30, height: 40, borderRadius: 4, transform: [{ rotate: '90deg' }] },

    dozensContainer: { flex: 12 },

    zeroRow: { flex: 1, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderColor: B_COLOR },
    zeroOval: {
        width: '75%', height: '70%', borderRadius: 25,
        backgroundColor: 'rgba(0, 200, 0, 0.4)', // Filled Green
        borderWidth: 2, borderColor: COLORS.BET_GREEN,
        justifyContent: 'center', alignItems: 'center'
    },

    numberGrid: { flex: 12, flexDirection: 'row', flexWrap: 'wrap' },
    gridCell: {
        width: '33.33%', height: '8.33%', justifyContent: 'center', alignItems: 'center',
        borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)'
    },
    glowBorder: {
        borderColor: COLORS.BET_RED, borderWidth: 1
    },
    cellTouch: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    columnsRow: { flex: 1, flexDirection: 'row', borderTopWidth: 1, borderColor: B_COLOR },

    // UTILS
    fireCell: { backgroundColor: 'rgba(255, 69, 0, 0.2)', borderColor: COLORS.ACCENT_GOLD, borderWidth: 2 },
    fireBetHighlight: { backgroundColor: 'rgba(255, 215, 0, 0.4)' },
    targetHighlight: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },

    chip: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 4, elevation: 5 },
    chipInner: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
    chipText: { fontWeight: 'bold' },

    ghostChip: { position: 'absolute', width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.4)', justifyContent: 'center', alignItems: 'center' },

    dolly: { position: 'absolute', zIndex: 100, alignItems: 'center', justifyContent: 'center' },
    dollyBase: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: COLORS.ACCENT_GOLD },
    dollyHandle: { width: 8, height: 16, backgroundColor: COLORS.ACCENT_GOLD, borderRadius: 4, marginBottom: -8 },

    countBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: COLORS.ACCENT_GOLD, width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
    countText: { fontSize: 8, fontWeight: 'bold', color: '#000' }
});
