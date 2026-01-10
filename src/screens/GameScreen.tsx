import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, ScrollView, Modal, FlatList, Alert } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    FadeInDown
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

const { height } = Dimensions.get('window');

import { COLORS, METRICS } from '../constants/theme';

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

    useEffect(() => {
        loadStrategies();
    }, []);

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

    // Phase Animation Logic (0=Betting/Result, 1=Spinning)
    // Only compress during SPINNING. Expand back for RESULT.
    const phaseValue = useSharedValue(0);
    useEffect(() => {
        phaseValue.value = withTiming(isSpinning ? 1 : 0, { duration: 800 });
    }, [isSpinning]);

    // Animated Styles
    const topStyle = useAnimatedStyle(() => {
        // Betting/Result: 0.35 (Standard)
        // Spinning: 0.55 (Expanded Wheel)
        const flex = interpolate(phaseValue.value, [0, 1], [0.35, 0.55]);
        return { flex };
    });

    const bottomStyle = useAnimatedStyle(() => {
        // Betting/Result: 0.65 (Standard)
        // Spinning: 0.45 (Compressed Board)
        const flex = interpolate(phaseValue.value, [0, 1], [0.65, 0.45]);
        const opacity = interpolate(phaseValue.value, [0, 1], [1, 0.9]); // Slight fade to focus wheel
        return { flex, opacity };
    });

    const cameraStyle = useAnimatedStyle(() => {
        const rotateX = interpolate(phaseValue.value, [0, 1], [55, 0]);
        const scale = interpolate(phaseValue.value, [0, 1], [0.65, 1]);
        const translateY = interpolate(phaseValue.value, [0, 1], [40, 0]);
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
            opacity: withTiming(isSpinning ? 1 : 0, { duration: 500 })
        };
    });

    const handleSpin = () => {
        triggerSpin();
    };

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
                            />
                        </View>
                    </View>

                    {/* Spin Button */}
                    {isBetting && (
                        <View style={styles.spinButtonContainer}>
                            <TouchableOpacity style={styles.spinButton} onPress={handleSpin}>
                                <Text style={styles.spinText}>SPIN</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                </Animated.View>

                {/* FIRE OVERLAY */}
                <Animated.View style={[styles.fireOverlay, fireOverlayStyle]} pointerEvents="none">
                    <Text style={styles.fireTitle}>MEGA FIRE 🔥</Text>
                    <View style={styles.fireNumbersRow}>
                        {fireNumbers.map((num, i) => (
                            <Animated.View
                                key={i}
                                style={styles.fireBubble}
                                entering={FadeInDown.delay(i * 300).springify()}
                            >
                                <Text style={styles.fireNumberText}>{num}</Text>
                            </Animated.View>
                        ))}
                    </View>
                </Animated.View>

            </Animated.View>

            {/* HISTORY BAR */}
            <HistoryBar />

            {/* HEADER (Absolute Top) */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.logo}>ROULETTE</Text>
                    <TouchableOpacity onPress={onBack} style={styles.logoutBtn}>
                        <Text style={styles.logoutText}>HOME ⌂</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.creditsBox}>
                        <View style={styles.chipIcon}>
                            <View style={styles.chipInner} />
                        </View>
                        <Text style={styles.creditsText}>{credits.toLocaleString()}</Text>
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
                <BettingBoard
                    highlightedNumbers={fireNumbers}
                    disabled={!isBetting}
                />

                {/* BOTTOM BAR (Chips & Controls) */}
                <View style={styles.bottomBar}>

                    {/* UNDO */}
                    <TouchableOpacity
                        style={[styles.utilityButton, (!isBetting) && styles.disabledBtn]}
                        onPress={undoLastBet}
                        disabled={!isBetting}
                    >
                        <Text style={styles.utilityButtonText}>↩ Undo</Text>
                    </TouchableOpacity>

                    {/* REBET */}
                    <TouchableOpacity
                        style={[styles.utilityButton, (!isBetting || currentBet > 0) && styles.disabledBtn]}
                        onPress={() => {
                            rebet();
                        }}
                        disabled={!isBetting || currentBet > 0}
                    >
                        <Text style={styles.utilityButtonText}>↻ Rebet</Text>
                    </TouchableOpacity>

                    {/* STRATEGIES (Quick Load) */}
                    <TouchableOpacity
                        style={[styles.utilityButton, (!isBetting) && styles.disabledBtn]}
                        onPress={() => setStrategiesModalOpen(true)}
                        disabled={!isBetting}
                    >
                        <Text style={styles.utilityButtonText}>★</Text>
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
                        <Text style={styles.totalBetValue}>{currentBet}</Text>
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
                            <Text style={styles.winAmount}>YOU WON {lastWinAmount}</Text>
                        ) : (
                            <Text style={styles.loseText}>No Win</Text>
                        )}
                    </View>
                )
            }

            {/* STRATEGY MODAL */}
            <Modal visible={strategiesModalOpen} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Quick Load Strategy</Text>
                        <FlatList
                            data={savedStrategies}
                            keyExtractor={item => item.id}
                            style={styles.strategyList}
                            ListEmptyComponent={<Text style={styles.emptyText}>No saved strategies yet.</Text>}
                            renderItem={({ item }) => (
                                <View style={styles.strategyRow}>
                                    <View style={[styles.colorBadge, { backgroundColor: item.color_code }]} />
                                    <View style={styles.strategyInfo}>
                                        <Text style={styles.strategyName}>{item.name}</Text>
                                        <Text style={styles.strategyCost}>Cost: {item.total_cost}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.playStrategyBtn}
                                        onPress={() => {
                                            if (credits < item.total_cost) {
                                                Alert.alert("Insufficient Funds", "You don't have enough credits for this strategy.");
                                            } else {
                                                handleApplyStrategy(item);
                                            }
                                        }}
                                    >
                                        <Text style={styles.playStrategyText}>PLAY</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                        <TouchableOpacity style={styles.closeModalBtn} onPress={() => setStrategiesModalOpen(false)}>
                            <Text style={styles.closeModalText}>CLOSE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

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
    logo: {
        color: COLORS.ACCENT_GOLD,
        fontSize: 22,
        fontWeight: 'bold',
    },
    logoutBtn: {
        marginTop: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: COLORS.BG_SURFACE,
        borderRadius: METRICS.borderRadius,
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
        alignSelf: 'flex-start',
    },
    logoutText: {
        color: COLORS.TEXT_SECONDARY,
        fontSize: 10,
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

    spinButtonContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        bottom: -20,
    },
    spinButton: {
        backgroundColor: COLORS.SUCCESS,
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: COLORS.ACCENT_GOLD,
        elevation: 10,
        shadowColor: 'black',
        shadowOpacity: 0.5,
        shadowRadius: 5,
    },
    spinText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    disabledBtn: {
        opacity: 0.5,
        backgroundColor: COLORS.BG_SURFACE,
    },

    // BOTTOM (BOARD)
    bottomContainer: {
        // No explicit background, let it be transparent over BG_MAIN
    },

    // FIRE OVERLAY
    fireOverlay: {
        position: 'absolute',
        top: 100,
        alignItems: 'center',
        zIndex: 150,
        width: '100%',
    },
    fireTitle: {
        color: COLORS.DANGER, // Example accent
        fontSize: 20,
        fontWeight: 'bold',
        textShadowColor: COLORS.ACCENT_GOLD,
        textShadowRadius: 10,
        marginBottom: 10,
    },
    fireNumbersRow: {
        flexDirection: 'row',
        gap: 10,
    },
    fireBubble: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.BET_RED,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.ACCENT_GOLD,
        elevation: 5,
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
        height: 70, // Reduced from 90
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.BG_SURFACE,
        borderTopWidth: 1,
        borderTopColor: COLORS.BORDER_SUBTLE,
        paddingHorizontal: 15,
        paddingBottom: 10, // Reduced padding
        paddingTop: 5,
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
        fontSize: 9, // Reduced font
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
