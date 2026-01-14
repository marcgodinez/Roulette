import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, ScrollView, Modal, FlatList, Alert } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    FadeInDown,
    withRepeat,
    withSequence
} from 'react-native-reanimated';
import { useGameStore } from '../store/useGameStore';
import { useAuth } from '../hooks/useAuth';
import { useGameEngine } from '../hooks/useGameEngine';
import { BettingBoard } from '../components/BettingBoard';
import { RouletteWheel } from '../components/RouletteWheel';
import { HistoryBar } from '../components/HistoryBar'; // New Import
import { StoreModal } from '../components/StoreModal';
import { BonusGame } from '../components/BonusGame';
import { CHIPS } from '../constants/chips';
import { isRed } from '../constants/gameRules';
import { RacetrackBoard } from '../components/RacetrackBoard';

const { height } = Dimensions.get('window');

import { COLORS, METRICS } from '../constants/theme';
import { AudioManager } from '../services/AudioManager';
import { HapticManager } from '../services/HapticManager';
import { AdManager } from '../services/AdManager';
import { formatCurrency } from '../utils/format';
import { StrategySelector } from '../components/StrategySelector';
// StatsModal handled by HistoryBar now

export const GameScreen = ({ onBack }: { onBack: () => void }) => {
    // Consolidated Store Access
    const {
        currentPhase,
        fireNumbers,
        winningNumber,
        credits,
        lastWinAmount,
        currentBet,
        undoLastBet,
        rebet, // New
        selectedChipValue,
        setSelectedChipValue,
        // Monetization
        isStoreOpen,
        setStoreOpen,
        // Strategies
        savedStrategies,
        loadStrategies,
        applyStrategy,
        deleteStrategy
    } = useGameStore();

    const { triggerSpin } = useGameEngine();

    // Local state for overlays
    const [showResultOverlay, setShowResultOverlay] = useState(false);
    const [strategiesModalOpen, setStrategiesModalOpen] = useState(false);
    const [showFire, setShowFire] = useState(false);
    const [viewMode, setViewMode] = useState<'GRID' | 'TRACK'>('GRID');
    const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });

    const spinCount = React.useRef(0);

    useEffect(() => {
        loadStrategies();
        AudioManager.initialize().then(() => {
            AudioManager.playBGM('CASINO');
        });
        AdManager.loadInterstitial(); // Preload
    }, []);

    // Ad Logic on Spin End (or Start)
    // User requested: "after first spin" and "every X spins".
    // We'll Trigger it when betting box re-opens (i.e., Phase goes BACK to BETTING) or when Spin Starts?
    // "After 1st spin" usually means after result.
    // Let's hook into `isResult` becoming true.

    useEffect(() => {
        if (currentPhase === 'RESULT') {
            spinCount.current += 1;
            const count = spinCount.current;

            // Logic: 1st spin, then every 5 spins (6, 11, 16...)
            // User said: "despues de la primera" (1) and "cada X" (say, 5).
            // So: 1, 6, 11, 16...
            if (count === 1 || (count - 1) % 5 === 0) {
                // Delay slightly so user sees the win first? 
                // Or show it when they close the result overlay?
                // Let's show it after a short delay to not block the "You Won" euphoria immediately.
                setTimeout(() => {
                    AdManager.showInterstitial();
                }, 3000);
            }
        }
    }, [currentPhase]);

    const handleApplyStrategy = (strategy: any) => {
        const success = applyStrategy(strategy);
        if (success) {
            setStrategiesModalOpen(false);
        } else {
            // Alert user (Custom alert or standard)
            // For now, let's assume store handles it or we show simple alert
            // But we can't import Alert easily if not imported.
            // Let's rely on visual feedback or add Alert import if needed.
            // Actually, I'll add Alert import.
        }
    };

    const isSpinning = currentPhase === 'SPINNING';
    const isResult = currentPhase === 'RESULT';
    const isBonus = currentPhase === 'BONUS';
    const isBetting = currentPhase === 'BETTING';

    // Timer for Result Overlay
    useEffect(() => {
        if (isSpinning) {
            setShowResultOverlay(false);
        } else if (isResult && winningNumber !== null) {
            const timer = setTimeout(() => {
                setShowResultOverlay(true);
            }, 4000); // Wait for ball to settle (approx)
            return () => clearTimeout(timer);
        }
    }, [isSpinning, isResult, winningNumber]);

    // Fire Visibility Timer
    useEffect(() => {
        if (isSpinning) {
            setShowFire(true);
            const timer = setTimeout(() => setShowFire(false), 3500);
            return () => clearTimeout(timer);
        } else {
            setShowFire(false);
        }
    }, [isSpinning]);

    // Phase Animation Logic (0=Betting/Result, 1=Spinning)
    // Only compress during SPINNING. Expand back for RESULT.
    const phaseValue = useSharedValue(0);
    useEffect(() => {
        phaseValue.value = withTiming(isSpinning ? 1 : 0, { duration: 800 });
    }, [isSpinning]);

    // Animated Styles
    const topStyle = useAnimatedStyle(() => {
        // Betting/Result: 0.20 (Balanced)
        // Spinning: 0.45 (Reduced from 0.55 to keep board visible)
        const flex = interpolate(phaseValue.value, [0, 1], [0.20, 0.45]);
        return { flex };
    });

    const bottomStyle = useAnimatedStyle(() => {
        // Betting/Result: 0.80 (Large but not overwhelming)
        // Spinning: 0.55 (Increased from 0.45 so grid doesn't squash)
        const flex = interpolate(phaseValue.value, [0, 1], [0.80, 0.55]);
        const opacity = interpolate(phaseValue.value, [0, 1], [1, 0.9]);
        return { flex, opacity };
    });

    const cameraStyle = useAnimatedStyle(() => {
        const rotateX = interpolate(phaseValue.value, [0, 1], [55, 0]);
        const scale = interpolate(phaseValue.value, [0, 1], [0.65, 1]);
        const translateY = interpolate(phaseValue.value, [0, 1], [0, 0]); // Removed offset
        return {
            transform: [
                { perspective: 1000 },
                { rotateX: `${rotateX}deg` },
                { scale },
                { translateY }
            ]
        };
    });

    const fireOverlayStyle = useAnimatedStyle(() => {
        return {
            opacity: withTiming(showFire ? 1 : 0, { duration: 500 })
        };
    });

    const handleSpin = () => {
        if (currentBet === 0) {
            Alert.alert("Place Your Bets", "You need to place at least one chip to spin the wheel!");
            return;
        }
        HapticManager.trigger('selection');
        triggerSpin();
    };

    // Spin Pulse Animation
    const spinPulse = useSharedValue(1);
    useEffect(() => {
        if (isBetting) {
            spinPulse.value = withRepeat(
                withSequence(
                    withTiming(1.1, { duration: 700 }),
                    withTiming(1, { duration: 700 })
                ),
                -1,
                true
            );
        } else {
            spinPulse.value = 1;
        }
    }, [isBetting]);

    const spinButtonStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: spinPulse.value }]
        };
    });

    if (isBonus) {
        return (
            <View style={styles.container}>
                <BonusGame />
            </View>
        );
    }

    return (
        <View style={styles.container}>

            {/* TOP CONTAINER (WHEEL) */}
            <Animated.View style={[styles.topContainer, topStyle]}>

                {/* 3D Wrapper */}
                <Animated.View style={[styles.wheelWrapper, cameraStyle]}>

                    {/* WHEEL CASING / STRUCTURE */}
                    <View style={styles.wheelCasing}>
                        <View style={styles.casingInnerOutline}>
                            <RouletteWheel
                                isSpinning={isSpinning}
                                winningNumber={winningNumber}
                                fireNumbers={fireNumbers}
                            />
                        </View>
                    </View>



                </Animated.View>

                {/* FIRE OVERLAY */}
                {/* FIRE OVERLAY MOVED TO ROOT */}

            </Animated.View>

            {/* HISTORY BAR */}
            <HistoryBar />

            {/* HEADER (Absolute Top) */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={onBack} style={styles.homeButton}>
                        <Text style={styles.homeButtonText}>⌂</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.creditsBox}>
                        <View style={styles.chipIcon}>
                            <View style={styles.chipInner} />
                        </View>
                        <Text style={styles.creditsText}>{formatCurrency(credits || 0)}</Text>
                    </View>

                    {/* SHOP BUTTON */}
                    <TouchableOpacity
                        style={styles.shopButton}
                        onPress={() => setStoreOpen(true)}
                    >
                        <Text style={styles.shopButtonText}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* BOTTOM CONTAINER (BOARD) */}
            <Animated.View style={[styles.bottomContainer, bottomStyle]}>

                {/* SPIN BUTTON (Relocated) */}
                {/* SPIN BUTTON (Relocated & Animated) */}
                {isBetting && (
                    <Animated.View style={[styles.spinButtonContainerMoved, spinButtonStyle]}>
                        <TouchableOpacity style={styles.spinButton} onPress={handleSpin}>
                            <Text style={styles.spinText}>SPIN</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}
                {/* CENTERED BOARD AREA */}
                <View
                    style={{
                        flex: 1,
                        width: '95%', // Slight horizontal margin
                        alignSelf: 'center',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: COLORS.BG_SURFACE, // Defined backing
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: COLORS.BORDER_SUBTLE,
                        marginVertical: 10,
                        overflow: 'hidden', // Clip board corners
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5,
                    }}
                    onLayout={(event) => {
                        const { width, height } = event.nativeEvent.layout;
                        setBoardSize({ width, height });
                    }}
                >
                    {viewMode === 'GRID' ? (
                        <BettingBoard
                            highlightedNumbers={fireNumbers}
                            disabled={!isBetting}
                        />
                    ) : (
                        boardSize.height > 0 && (
                            <RacetrackBoard
                                width={boardSize.width}
                                height={boardSize.height}
                            />
                        )
                    )}
                </View>

                {/* BOTTOM BAR (Chips & Controls) */}
                <View style={styles.bottomBar}>

                    {/* TOGGLE VIEW */}
                    <TouchableOpacity
                        style={styles.utilityButton}
                        onPress={() => setViewMode(prev => prev === 'GRID' ? 'TRACK' : 'GRID')}
                    >
                        <Text style={styles.utilityButtonText}>{viewMode === 'GRID' ? 'TRACK' : 'GRID'}</Text>
                    </TouchableOpacity>

                    {/* UNDO */}
                    <TouchableOpacity
                        style={[styles.utilityButton, (!isBetting) && styles.disabledBtn]}
                        onPress={undoLastBet}
                        disabled={!isBetting}
                    >
                        <Text style={styles.utilityButtonText}>UNDO</Text>
                    </TouchableOpacity>

                    {/* REBET */}
                    <TouchableOpacity
                        style={[styles.utilityButton, (!isBetting || currentBet > 0) && styles.disabledBtn]}
                        onPress={() => {
                            rebet();
                        }}
                        disabled={!isBetting || currentBet > 0}
                    >
                        <Text style={styles.utilityButtonText}>REBET</Text>
                    </TouchableOpacity>

                    {/* STRATEGIES (Quick Load) */}
                    <TouchableOpacity
                        style={[styles.utilityButton, (!isBetting) && styles.disabledBtn]}
                        onPress={() => setStrategiesModalOpen(true)}
                        disabled={!isBetting}
                    >
                        <Text style={styles.utilityButtonText}>⭐</Text>
                    </TouchableOpacity>

                    {/* CHIPS */}
                    <View style={styles.chipSelector}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                            {CHIPS.map((chip) => {
                                const isSelected = selectedChipValue === chip.value;
                                return (
                                    <TouchableOpacity
                                        key={chip.value}
                                        style={[
                                            styles.chipOption,
                                            { backgroundColor: chip.color, borderColor: isSelected ? COLORS.ACCENT_GOLD : COLORS.BORDER_SUBTLE },
                                            isSelected && styles.selectedChip
                                        ]}
                                        onPress={() => setSelectedChipValue(chip.value)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.chipInnerDecor}>
                                            <Text style={[styles.chipLabel, { color: chip.color === '#000000' ? '#FFF' : '#000' }]}>{chip.label}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* TOTAL BET */}
                    <View style={styles.totalBetBox}>
                        <Text style={styles.totalBetLabel}>BET</Text>
                        <Text style={styles.totalBetValue}>{formatCurrency(currentBet)}</Text>
                    </View>

                </View>

            </Animated.View>

            {/* FIRE OVERLAY (Root Level) */}
            <Animated.View style={[styles.fireOverlay, fireOverlayStyle]} pointerEvents="none">
                <View style={styles.fireContainerPanel}>
                    <Text style={styles.fireTitle}>MEGA FIRE 🔥</Text>
                    <View style={styles.fireNumbersRow}>
                        {fireNumbers.map((num, i) => (
                            <Animated.View
                                key={i}
                                style={[
                                    styles.fireBubble,
                                    { backgroundColor: num === 0 ? COLORS.BET_GREEN : isRed(num) ? COLORS.BET_RED : COLORS.BET_BLACK }
                                ]}
                                entering={FadeInDown.delay(i * 50).springify()}
                            >
                                <Text style={styles.fireNumberText}>{num}</Text>
                            </Animated.View>
                        ))}
                    </View>
                </View>
            </Animated.View>

            {/* RESULT OVERLAY (Root Level) */}
            {
                isResult && showResultOverlay && winningNumber !== null && (
                    <View style={styles.resultOverlay}>
                        <Text style={styles.resultTitle}>WINNER</Text>
                        <View style={[styles.resultCircle, { backgroundColor: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(winningNumber) ? COLORS.BET_RED : winningNumber === 0 ? COLORS.BET_GREEN : COLORS.BET_BLACK }]}>
                            <Text style={styles.resultNumber}>{winningNumber}</Text>
                        </View>
                        {lastWinAmount > 0 ? (
                            <Text style={styles.winAmount}>YOU WON {formatCurrency(lastWinAmount)}</Text>
                        ) : (
                            <Text style={styles.loseText}>No Win</Text>
                        )}
                    </View>
                )
            }

            {/* STRATEGY MODAL */}
            <StrategySelector
                visible={strategiesModalOpen}
                onClose={() => setStrategiesModalOpen(false)}
            />

            <StoreModal visible={isStoreOpen} />

        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BG_MAIN,
    },
    // HEADER
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 100, // Safe Area Top
        paddingTop: 40,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 200,
    },
    headerLeft: {
        justifyContent: 'center',
    },
    homeButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.BG_ELEVATED,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },
    homeButtonText: {
        color: COLORS.ACCENT_GOLD,
        fontSize: 28,
        marginTop: -4, // Optical correction
        fontWeight: 'bold',
    },
    creditsBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.BG_SURFACE,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
    },
    creditsText: {
        color: COLORS.TEXT_PRIMARY,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    shopButton: {
        marginLeft: 10,
        backgroundColor: COLORS.ACCENT_GOLD,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.ACCENT_HOVER,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 3,
    },
    shopButtonText: {
        color: COLORS.BG_MAIN,
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: -2,
    },
    chipIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.ACCENT_GOLD,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.ACCENT_HOVER,
    },
    chipInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.BG_MAIN,
        borderStyle: 'dashed',
    },

    // TOP (WHEEL Section)
    topContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
        zIndex: 10,
        paddingTop: 80, // Compensate for Header
    },
    wheelWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    wheelCasing: {
        padding: 15,
        backgroundColor: '#2D1B15', // Darker wood
        borderRadius: 150, // Circular
        borderWidth: 8,
        borderColor: '#4E342E',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 20,
    },
    casingInnerOutline: {
        borderRadius: 135,
        borderWidth: 2,
        borderColor: COLORS.ACCENT_GOLD,
        padding: 5,
    },

    spinButtonContainerMoved: {
        position: 'absolute',
        left: 15,
        top: -130,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    spinButton: {
        backgroundColor: COLORS.SUCCESS,
        width: 65,
        height: 65,
        borderRadius: 32.5,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.ACCENT_GOLD,
        elevation: 8,
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 5,
    },
    spinText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    disabledBtn: {
        opacity: 0.5,
        backgroundColor: COLORS.BG_SURFACE,
    },

    // BOTTOM (BOARD)
    bottomContainer: {
        zIndex: 20, // Ensure it's above TopContainer so Spin Button is clickable
        // No explicit background
    },

    // FIRE OVERLAY
    fireOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 150,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    fireContainerPanel: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        padding: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.ACCENT_GOLD,
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    fireTitle: {
        color: '#FF4500',
        fontSize: 22,
        fontWeight: 'bold',
        textShadowColor: 'orange',
        textShadowRadius: 5,
        marginBottom: 10,
    },
    fireNumbersRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
    },
    fireBubble: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FFF',
        elevation: 3,
    },
    fireNumberText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 18,
    },

    // RESULT OVERLAY
    resultOverlay: {
        position: 'absolute',
        top: '30%', // Centered vertically
        alignSelf: 'center', // Center horizontally
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.9)', // Darker BG
        padding: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.ACCENT_GOLD,
        zIndex: 10000, // Max Z-Index
        elevation: 1000, // Android Elevation
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
    },
    resultTitle: {
        color: COLORS.ACCENT_GOLD,
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    resultCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.BG_SURFACE,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFF',
        marginBottom: 10,
    },
    resultNumber: {
        color: '#FFF',
        fontSize: 36,
        fontWeight: 'bold',
    },
    winAmount: {
        color: COLORS.SUCCESS,
        fontSize: 24,
        fontWeight: 'bold',
    },
    loseText: {
        color: COLORS.DANGER,
        fontSize: 20,
    },

    // BOTTOM BAR
    bottomBar: {
        height: 50, // Reduced from 70 to 50
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.BG_SURFACE,
        borderTopWidth: 1,
        borderTopColor: COLORS.BORDER_SUBTLE,
        paddingHorizontal: 15,
        paddingBottom: 10, // Reduced padding
        paddingTop: 5,
        marginTop: 'auto', // Push to bottom
    },
    utilityButton: {
        width: 40, // Reduced from 50
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.BG_MAIN,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
    },
    utilityButtonText: {
        color: COLORS.TEXT_SECONDARY,
        fontSize: 10, // Reduced font
        fontWeight: 'bold',
        textAlign: 'center',
    },
    chipSelector: {
        flex: 1,
        height: 50, // Reduced from 60
    },
    chipScroll: {
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    chipOption: {
        width: 40, // Reduced from 50
        height: 40,
        borderRadius: 20,
        marginHorizontal: 4, // Tighter spacing
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        elevation: 4,
    },
    selectedChip: {
        transform: [{ scale: 1.15 }], // Slightly less scale
        borderWidth: 2,
        borderColor: COLORS.ACCENT_GOLD,
        zIndex: 10,
        elevation: 10,
    },
    chipInnerDecor: {
        width: 28, // Reduced from 38
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chipLabel: {
        fontSize: 9, // Reduced font
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 1,
    },
    totalBetBox: {
        marginLeft: 10,
        paddingHorizontal: 8, // Reduced padding
        height: 36, // Reduced height
        justifyContent: 'center',
        alignItems: 'flex-end',
        borderLeftWidth: 1,
        borderLeftColor: COLORS.BORDER_SUBTLE,
    },
    totalBetLabel: {
        color: COLORS.TEXT_SECONDARY,
        fontSize: 9,
        fontWeight: 'bold',
    },
    totalBetValue: {
        color: COLORS.ACCENT_GOLD,
        fontSize: 14, // Reduced font
        fontWeight: 'bold',
    },
    // MODAL STYLES
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxHeight: '80%',
        backgroundColor: COLORS.BG_SURFACE,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
    },
    modalTitle: {
        color: COLORS.ACCENT_GOLD,
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    strategyList: {
        marginBottom: 20,
    },
    emptyText: {
        color: COLORS.TEXT_SECONDARY,
        textAlign: 'center',
        padding: 20,
    },
    strategyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.BG_MAIN,
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
    },
    colorBadge: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 12,
    },
    strategyInfo: {
        flex: 1,
    },
    strategyName: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    strategyCost: {
        color: COLORS.TEXT_SECONDARY,
        fontSize: 12,
    },
    playStrategyBtn: {
        backgroundColor: COLORS.ACCENT_GOLD,
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
    playStrategyText: {
        color: COLORS.BG_MAIN,
        fontWeight: 'bold',
        fontSize: 12,
    },
    closeModalBtn: {
        padding: 15,
        backgroundColor: COLORS.BG_MAIN,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
    },
    closeModalText: {
        color: COLORS.TEXT_SECONDARY,
        fontWeight: 'bold',
    },
});
