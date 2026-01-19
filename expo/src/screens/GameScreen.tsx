import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    FadeInDown,
    withRepeat,
    withSequence
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useGameStore } from '../store/useGameStore';
import { useGameEngine } from '../hooks/useGameEngine';
import { BettingBoard } from '../components/BettingBoard';
import { RouletteWheel } from '../components/RouletteWheel';
import { HistoryBar } from '../components/HistoryBar';
import { BettingControls } from '../components/BettingControls';
import { StoreModal } from '../components/StoreModal';
import { BonusGame } from '../components/BonusGame';
import { isRed } from '../constants/gameRules';
import { RacetrackBoard } from '../components/RacetrackBoard';
import { ChipSelector } from '../components/ChipSelector'; // Imported

const { height } = Dimensions.get('window');

import { COLORS, SHADOWS } from '../constants/theme';
import { AudioManager } from '../services/AudioManager';
import { formatCurrency } from '../utils/format';
import { StrategySelector } from '../components/StrategySelector';

// --- NEON ICONS ---
const RouletteIcon = ({ size = 20, color = "#FFF" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
        <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth="1.5" />
        <Circle cx="12" cy="12" r="2" fill={color} />
        <Path d="M12 2 L12 6" stroke={color} strokeWidth="1.5" />
        <Path d="M12 18 L12 22" stroke={color} strokeWidth="1.5" />
        <Path d="M2 12 L6 12" stroke={color} strokeWidth="1.5" />
        <Path d="M18 12 L22 12" stroke={color} strokeWidth="1.5" />
    </Svg>
);

export const GameScreen = ({ onBack }: { onBack: () => void }) => {
    const {
        currentPhase,
        fireNumbers,
        winningNumber,
        credits,
        lastWinAmount,
        currentBet,
        undoLastBet,
        rebet,
        selectedChipValue,
        setSelectedChipValue,
        applyStrategy
    } = useGameStore();

    const [strategiesModalOpen, setStrategiesModalOpen] = useState(false);
    const [isStoreOpen, setStoreOpen] = useState(false);
    const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
    const [viewMode, setViewMode] = useState<'GRID' | 'TRACK'>('GRID');
    const spinPulse = useSharedValue(1);

    useEffect(() => {
        AudioManager.playBackgroundMusic();
        return () => AudioManager.stopBackgroundMusic();
    }, []);

    const { prepareRound, startRound } = useGameEngine();
    const [showResultOverlay, setShowResultOverlay] = useState(false);
    const showFire = fireNumbers.length > 0 && currentPhase !== 'BETTING';

    useEffect(() => {
        const isBetting = currentPhase === 'BETTING';
        if (isBetting) {
            spinPulse.value = withRepeat(withSequence(withTiming(1.1, { duration: 700 }), withTiming(1, { duration: 700 })), -1, true);
        } else {
            spinPulse.value = 1;
        }
    }, [currentPhase]);

    const isSpinning = currentPhase === 'SPINNING';
    const isResult = currentPhase === 'RESULT';
    const isBonus = currentPhase === 'BONUS';
    const isBetting = currentPhase === 'BETTING';

    useEffect(() => {
        if (isSpinning) {
            setShowResultOverlay(false);
        } else if (isResult && winningNumber !== null) {
            const timer = setTimeout(() => {
                setShowResultOverlay(true);
            }, 500); // Faster result show
            return () => clearTimeout(timer);
        }
    }, [isSpinning, isResult, winningNumber]);

    const phaseValue = useSharedValue(0);
    useEffect(() => {
        phaseValue.value = withTiming(isSpinning ? 1 : 0, { duration: 800 });
    }, [isSpinning]);

    const topStyle = useAnimatedStyle(() => ({ flex: 0.28 }));
    const bottomStyle = useAnimatedStyle(() => ({ flex: 0.72 }));

    const overlayStyle = useAnimatedStyle(() => {
        const opacity = interpolate(phaseValue.value, [0, 1], [0, 0.7]);
        return { opacity, zIndex: phaseValue.value > 0.1 ? 100 : -1 };
    });

    const cameraStyle = useAnimatedStyle(() => {
        const rotateX = interpolate(phaseValue.value, [0, 1], [40, 0]);
        const scale = interpolate(phaseValue.value, [0, 1], [0.65, 1.1]); // Less zoom in neon mode to keep context
        const translateY = interpolate(phaseValue.value, [0, 1], [0, 150]);
        return { transform: [{ perspective: 1000 }, { rotateX: `${rotateX}deg` }, { scale }, { translateY }], zIndex: 200 };
    });

    const fireOverlayStyle = useAnimatedStyle(() => ({ opacity: withTiming(showFire ? 1 : 0, { duration: 500 }) }));

    const handleSpin = async () => {
        if (currentBet === 0) {
            Alert.alert("Place Your Bets", "You need to place at least one chip to spin the wheel!");
            return;
        }
        const isValid = await useGameStore.getState().validateSession();
        if (isValid === false) return;
        if (prepareRound()) startRound();
    };

    if (isBonus) {
        return <View style={styles.container}><BonusGame /></View>;
    }

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <View style={[styles.headerLeft, { alignItems: 'flex-start' }]}>
                    <View style={styles.creditsBox}>
                        <View style={styles.chipIcon}><View style={styles.chipInner} /></View>
                        <Text style={styles.creditsText}>{formatCurrency(credits || 0)}</Text>
                    </View>
                </View>
                <View style={{ flex: 1 }} />
                <View style={[styles.headerLeft, { alignItems: 'flex-end' }]}>
                    <TouchableOpacity style={styles.shopButton} onPress={() => setStoreOpen(true)}>
                        <Text style={styles.shopButtonText}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ height: 100 }} />

            {/* TOP CONTAINER */}
            <Animated.View style={[styles.topContainer, topStyle]}>
                <Animated.View style={[styles.wheelWrapper, cameraStyle]}>
                    <View style={styles.wheelCasing}>
                        <View style={styles.casingInnerOutline}>
                            <RouletteWheel isSpinning={isSpinning} winningNumber={winningNumber} fireNumbers={fireNumbers} />
                        </View>
                    </View>
                </Animated.View>

                {/* LEFT ACTIONS (View Mode & Favorites) */}
                <View style={styles.leftActions}>
                    <TouchableOpacity style={styles.sideActionBtn} onPress={() => setViewMode(prev => prev === 'GRID' ? 'TRACK' : 'GRID')}>
                        {viewMode === 'GRID' ? <RouletteIcon size={22} color={COLORS.ACCENT_GOLD} /> : <Ionicons name="grid-outline" size={20} color={COLORS.ACCENT_GOLD} />}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sideActionBtn} onPress={() => setStrategiesModalOpen(true)}>
                        <Ionicons name="heart-outline" size={20} color={COLORS.BET_RED} />
                    </TouchableOpacity>
                </View>

                {/* RIGHT ACTIONS (Betting Tools) */}
                <View style={styles.sideActions}>
                    <TouchableOpacity style={[styles.sideActionBtn, !isBetting && styles.disabledSideBtn]} onPress={undoLastBet} disabled={!isBetting}>
                        <Ionicons name="arrow-undo" size={20} color={COLORS.ACCENT_BLUE} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.sideActionBtn, !isBetting && styles.disabledSideBtn]} onPress={() => useGameStore.getState().clearBets()} disabled={!isBetting}>
                        <Ionicons name="trash-outline" size={20} color={COLORS.DANGER} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.sideActionBtn, (!isBetting || currentBet > 0) && styles.disabledSideBtn]} onPress={rebet} disabled={!isBetting || currentBet > 0}>
                        <Ionicons name="reload" size={20} color={COLORS.SUCCESS} />
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* HISTORY BAR */}
            <View style={{ height: 60, zIndex: 15, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                <HistoryBar />
            </View>

            {/* BOTTOM CONTAINER */}
            <Animated.View style={[styles.bottomContainer, bottomStyle]}>
                <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, overlayStyle]} pointerEvents="none" />

                <View style={{ flex: 1, width: '100%', alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginTop: 5, backgroundColor: 'transparent' }}
                    onLayout={(event) => setBoardSize(event.nativeEvent.layout)}>
                    {viewMode === 'GRID' ? (
                        /* NEON BOARD CONTAINER */
                        <View style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.BORDER_SUBTLE, backgroundColor: 'rgba(20,20,30,0.5)' }}>
                            <BettingBoard highlightedNumbers={fireNumbers} disabled={!isBetting} />
                        </View>
                    ) : (
                        boardSize.height > 0 && <RacetrackBoard width={boardSize.width} height={boardSize.height} />
                    )}
                </View>

                <BettingControls currentBet={currentBet} onSpin={handleSpin} isBetting={isBetting} selectedChipValue={selectedChipValue} onSelectChip={setSelectedChipValue} />
            </Animated.View>

            {/* FIRE OVERLAY */}
            <Animated.View style={[styles.fireOverlay, fireOverlayStyle]} pointerEvents="none">
                <View style={[styles.fireContainerPanel, SHADOWS.NEON_RED]}>
                    <Text style={styles.fireTitle}>MEGA FIRE 🔥</Text>
                    <View style={styles.fireNumbersRow}>
                        {fireNumbers.map((num, i) => (
                            <Animated.View key={i} style={[styles.fireBubble, { backgroundColor: num === 0 ? COLORS.BET_GREEN : isRed(num) ? COLORS.BET_RED : COLORS.BET_BLACK }, SHADOWS.NEON_GOLD]} entering={FadeInDown.delay(i * 50).springify()}>
                                <Text style={styles.fireNumberText}>{num}</Text>
                            </Animated.View>
                        ))}
                    </View>
                </View>
            </Animated.View>

            {/* RESULT OVERLAY */}
            {isResult && showResultOverlay && winningNumber !== null && (
                <View style={[styles.resultOverlay, SHADOWS.NEON_GOLD]}>
                    <Text style={styles.resultTitle}>WINNER</Text>
                    <View style={[styles.resultCircle, { backgroundColor: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(winningNumber) ? COLORS.BET_RED : winningNumber === 0 ? COLORS.BET_GREEN : COLORS.BET_BLACK }, SHADOWS.NEON_BLUE]}>
                        <Text style={styles.resultNumber}>{winningNumber}</Text>
                    </View>
                    {lastWinAmount > 0 ? <Text style={styles.winAmount}>YOU WON {formatCurrency(lastWinAmount)}</Text> : <Text style={styles.loseText}>No Win</Text>}
                </View>
            )}

            {/* CHIP SELECTOR (Moved for Z-INDEX FIX) */}
            {isBetting && (
                <ChipSelector
                    selectedChipValue={selectedChipValue}
                    onSelectChip={setSelectedChipValue}
                    style={{ position: 'absolute', left: 20, bottom: 20, zIndex: 9999 }}
                />
            )}

            <StoreModal visible={isStoreOpen} onHome={onBack} />
            <StrategySelector visible={strategiesModalOpen} onClose={() => setStrategiesModalOpen(false)} />
        </View >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.BG_MAIN },
    header: { position: 'absolute', top: 0, left: 0, right: 0, height: 100, paddingTop: 40, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 200 },
    headerLeft: {},
    creditsBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.BORDER_ACCENT, ...SHADOWS.NEON_GOLD },
    creditsText: { color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: 'bold', marginLeft: 10, textShadowColor: COLORS.ACCENT_GOLD, textShadowRadius: 10 },
    shopButton: { marginLeft: 10, backgroundColor: COLORS.ACCENT_GOLD, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFF', ...SHADOWS.NEON_GOLD },
    shopButtonText: { color: '#000', fontSize: 20, fontWeight: 'bold', marginTop: -2 },
    chipIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.ACCENT_GOLD, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFF' },
    chipInner: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: '#000', borderStyle: 'dashed' },

    topContainer: { alignItems: 'center', justifyContent: 'center', overflow: 'visible', zIndex: 10 },
    wheelWrapper: { justifyContent: 'center', alignItems: 'center' },
    wheelCasing: { padding: 10, backgroundColor: '#111', borderRadius: 150, borderWidth: 4, borderColor: '#333', ...SHADOWS.NEON_BLUE }, // Cyber Casing
    casingInnerOutline: { borderRadius: 135, borderWidth: 2, borderColor: COLORS.ACCENT_BLUE, padding: 5, shadowColor: COLORS.ACCENT_BLUE, shadowRadius: 10, shadowOpacity: 1 },

    sideActions: { position: 'absolute', right: 15, top: 10, zIndex: 50, gap: 12 },
    leftActions: { position: 'absolute', left: 15, top: 10, zIndex: 50, gap: 12 }, // NEW LEFT STYLES
    sideActionBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', ...SHADOWS.NEON_BLUE },
    disabledSideBtn: { opacity: 0.3, backgroundColor: 'rgba(0,0,0,0.2)', shadowOpacity: 0 },

    bottomContainer: { zIndex: 300 },

    fireOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-start', paddingTop: 180, alignItems: 'center', zIndex: 2000, backgroundColor: 'rgba(0,0,0,0.6)' },
    fireContainerPanel: { backgroundColor: 'rgba(10,10,10,0.95)', padding: 20, borderRadius: 20, borderWidth: 2, borderColor: COLORS.BET_RED, alignItems: 'center', width: '90%', maxWidth: 400 },
    fireTitle: { color: COLORS.BET_RED, fontSize: 28, fontWeight: '900', textShadowColor: COLORS.BET_RED, textShadowRadius: 15, marginBottom: 15, letterSpacing: 2 },
    fireNumbersRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
    fireBubble: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
    fireNumberText: { color: '#FFF', fontWeight: 'bold', fontSize: 20 },

    resultOverlay: { position: 'absolute', top: '30%', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.95)', padding: 40, borderRadius: 24, borderWidth: 3, borderColor: COLORS.ACCENT_GOLD, zIndex: 10000 },
    resultTitle: { color: COLORS.ACCENT_GOLD, fontSize: 28, fontWeight: '900', marginBottom: 15, letterSpacing: 2, textShadowColor: COLORS.ACCENT_GOLD, textShadowRadius: 10 },
    resultCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#FFF', marginBottom: 15 },
    resultNumber: { color: '#FFF', fontSize: 40, fontWeight: '900', textShadowColor: '#FFF', textShadowRadius: 10 },
    winAmount: { color: COLORS.SUCCESS, fontSize: 26, fontWeight: 'bold', textShadowColor: COLORS.SUCCESS, textShadowRadius: 10 },
    loseText: { color: COLORS.DANGER, fontSize: 24, fontWeight: 'bold', textShadowColor: COLORS.DANGER, textShadowRadius: 10 },
});
