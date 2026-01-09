import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, ScrollView, ImageBackground } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    FadeInDown
} from 'react-native-reanimated';
import { useGameStore } from '../store/useGameStore';
import { useGameEngine } from '../hooks/useGameEngine';
import { BettingBoard } from '../components/BettingBoard';
import { RouletteWheel } from '../components/RouletteWheel';
import { BonusGame } from '../components/BonusGame';

const { height } = Dimensions.get('window');

import { CHIPS } from '../constants/chips';

export const GameScreen = () => {
    // Consolidated Store Access
    const {
        currentPhase,
        fireNumbers,
        winningNumber,
        credits,
        lastWinAmount,
        currentBet,
        undoLastBet,
        selectedChipValue,
        setSelectedChipValue
    } = useGameStore();

    const { triggerSpin } = useGameEngine();

    // Local state for overlays
    const [showResultOverlay, setShowResultOverlay] = useState(false);

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

    // Phase Animation Logic (0=Betting, 1=Spinning)
    const phaseValue = useSharedValue(0);
    useEffect(() => {
        phaseValue.value = withTiming((isSpinning || isResult) ? 1 : 0, { duration: 800 });
    }, [isSpinning, isResult]);

    // Animated Styles
    const topStyle = useAnimatedStyle(() => {
        // Reduced height for Wheel during Betting (0.25)
        // During Spinning, we give it 55% now (instead of 70%) to keep board visible
        const flex = interpolate(phaseValue.value, [0, 1], [0.25, 0.55]);
        return { flex };
    });

    const bottomStyle = useAnimatedStyle(() => {
        // Increased height for Board: 75% Betting -> 45% Spinning (was 30%)
        // This ensures the numbers don't collapse too much.
        const flex = interpolate(phaseValue.value, [0, 1], [0.75, 0.45]);
        // Opacity: Keep it mostly visible (0.8) so user can track bets
        const opacity = interpolate(phaseValue.value, [0, 1], [1, 0.8]);
        return { flex, opacity };
    });

    const cameraStyle = useAnimatedStyle(() => {
        const rotateX = interpolate(phaseValue.value, [0, 1], [55, 0]);
        // Reduce scale to 0.65 during betting to fit small top section
        const scale = interpolate(phaseValue.value, [0, 1], [0.65, 1]);
        // Move DOWN (positive Y) during betting to position nicely in the small window
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
        <ImageBackground
            source={require('../assets/casino_bg.png')}
            style={styles.container}
            resizeMode="cover"
        >

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

                {/* FIRE OVERLAY - STAGGERED ANIMATION */}
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

                {/* RESULT OVERLAY */}
                {isResult && showResultOverlay && winningNumber !== null && (
                    <View style={styles.resultOverlay}>
                        <Text style={styles.resultTitle}>WINNER</Text>
                        <View style={[styles.resultCircle, { backgroundColor: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(winningNumber) ? '#D32F2F' : winningNumber === 0 ? '#4CAF50' : '#212121' }]}>
                            <Text style={styles.resultNumber}>{winningNumber}</Text>
                        </View>
                        {lastWinAmount > 0 ? (
                            <Text style={styles.winAmount}>YOU WON {lastWinAmount}</Text>
                        ) : (
                            <Text style={styles.loseText}>No Win</Text>
                        )}
                    </View>
                )}

            </Animated.View>

            {/* HEADER (Absolute Top) */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.logo}>ROULETTE</Text>
                </View>
                <View style={styles.creditsBox}>
                    <View style={styles.chipIcon}>
                        <View style={styles.chipInner} />
                    </View>
                    <Text style={styles.creditsText}>{credits.toLocaleString()}</Text>
                </View>
            </View>

            {/* BOTTOM CONTAINER (BOARD) */}
            <Animated.View style={[styles.bottomContainer, bottomStyle]}>
                <BettingBoard highlightedNumbers={fireNumbers} />

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
                                            { backgroundColor: chip.color, borderColor: isSelected ? '#FFF' : 'rgba(0,0,0,0.2)' },
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

        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000', // Fallback
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
        color: '#FFD700',
        fontSize: 22,
        fontWeight: 'bold',
        textShadowColor: 'black',
        textShadowRadius: 2,
    },
    creditsBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#444',
    },
    creditsText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    chipIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E65100',
    },
    chipInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#FFF',
        borderStyle: 'dashed',
    },

    // TOP (WHEEL Section)
    topContainer: {
        // backgroundColor: 'transparent', // Let BG show through? Or semi-transparent dark?
        // Let's use semi-transparent to dim the wheel area slightly vs background
        // backgroundColor: 'rgba(0,0,0,0.3)', 
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible', // Allow wheel to overflow if needed, or cut? 
        zIndex: 10,
        // No border bottom anymore, maybe a shadow?
    },
    wheelWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    // NEW CASING STYLES
    wheelCasing: {
        padding: 15,
        backgroundColor: '#3E2723', // Dark Wood
        borderRadius: 150, // Circular
        borderWidth: 8,
        borderColor: '#5D4037', // Light Wood Border
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 20,
    },
    casingInnerOutline: {
        borderRadius: 135,
        borderWidth: 2,
        borderColor: '#FFD700', // Gold Trim
        padding: 5,
    },

    spinButtonContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        bottom: -20, // Offset button slightly
    },
    spinButton: {
        backgroundColor: 'rgba(0, 200, 83, 0.95)',
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFD700',
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
        backgroundColor: '#555',
    },

    // BOTTOM (BOARD)
    bottomContainer: {
        // backgroundColor: 'rgba(0,0,0,0.85)', // Darken board background to make it readable over image
        // Actually BettingBoard handles its own background? 
        // BettingBoard.tsx uses '#0e4d26'. 
        // Let's keep it opaque for now to ensure readability.
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
        color: '#FF6F00',
        fontSize: 20,
        fontWeight: 'bold',
        textShadowColor: '#FFD700',
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
        backgroundColor: '#FF3D00',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFD700',
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
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.9)',
        padding: 30,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFD700',
        zIndex: 300,
        elevation: 20,
    },
    resultTitle: {
        color: '#FFD700',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    resultCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#222',
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
        color: '#00E676',
        fontSize: 24,
        fontWeight: 'bold',
    },
    loseText: {
        color: '#FF5252',
        fontSize: 20,
    },

    // BOTTOM BAR
    bottomBar: {
        height: 90,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingHorizontal: 15,
        paddingBottom: 15,
        paddingTop: 10,
    },
    utilityButton: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#333',
        borderRadius: 25,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#555',
    },
    utilityButtonText: {
        color: '#BBB',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    chipSelector: {
        flex: 1,
        height: 60,
    },
    chipScroll: {
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    chipOption: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginHorizontal: 6,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        elevation: 4,
    },
    selectedChip: {
        transform: [{ scale: 1.2 }],
        borderWidth: 3,
        borderColor: '#FFD700',
        zIndex: 10,
        elevation: 10,
    },
    chipInnerDecor: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.6)',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chipLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowRadius: 1,
    },
    totalBetBox: {
        marginLeft: 10,
        paddingHorizontal: 12,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-end',
        borderLeftWidth: 1,
        borderLeftColor: '#444',
    },
    totalBetLabel: {
        color: '#888',
        fontSize: 10,
        fontWeight: 'bold',
    },
    totalBetValue: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
