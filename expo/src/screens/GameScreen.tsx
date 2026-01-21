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
import { ChipSelector } from '../components/ChipSelector';
import { LevelUpModal } from '../components/LevelUpModal';

const { height } = Dimensions.get('window');

import { COLORS, SHADOWS } from '../constants/theme';
import { AudioManager } from '../services/AudioManager';
import { formatCurrency } from '../utils/format';
import { StrategySelector } from '../components/StrategySelector';
import { useCustomizationStore } from '../store/useCustomizationStore';
import { ALL_ASSETS } from '../customization/AssetRegistry';
import { CustomizationModal } from '../components/CustomizationModal';

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
        applyStrategy,
        debugFireMode
    } = useGameStore();

    const [strategiesModalOpen, setStrategiesModalOpen] = useState(false);
    const [customizationModalOpen, setCustomizationModalOpen] = useState(false); // NEW STATE
    const [isStoreOpen, setStoreOpen] = useState(false);
    const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
    const [viewMode, setViewMode] = useState<'GRID' | 'TRACK'>('GRID');
    const spinPulse = useSharedValue(1);

    // Customization
    const { equippedTableId } = useCustomizationStore();
    const tableAsset = ALL_ASSETS[Object.keys(ALL_ASSETS).find(k => ALL_ASSETS[k].id === equippedTableId) || 'CLASSIC_GREEN'];
    const tableColor = tableAsset?.value || '#0F3317';


    useEffect(() => {
        AudioManager.playBgm();
        return () => { AudioManager.stopBgm(); };
    }, []);

    const { prepareRound, startRound } = useGameEngine();
    const [showResultOverlay, setShowResultOverlay] = useState(false);

    const isSpinning = currentPhase === 'SPINNING';
    const isResult = currentPhase === 'RESULT';
    const isBonus = currentPhase === 'BONUS';
    const isBetting = currentPhase === 'BETTING';
    const isFireReveal = currentPhase === 'FIRE_REVEAL';

    // VISIBILITY LOGIC
    const [fireOverlayVisible, setFireOverlayVisible] = useState(false);
    const [isWheelExiting, setIsWheelExiting] = useState(false); // NEW STATE

    // Manage Fire Overlay Visibility
    useEffect(() => {
        if (isFireReveal) {
            setFireOverlayVisible(true);
            // Hide Fire overlay shortly before spin starts so user can see highlights on board
            const timer = setTimeout(() => setFireOverlayVisible(false), 2000);
            return () => clearTimeout(timer);
        } else {
            setFireOverlayVisible(false);
        }
    }, [isFireReveal]);

    // Manage Result Overlay Visibility Sequence
    useEffect(() => {
        if (isSpinning) {
            setShowResultOverlay(false);
            setIsWheelExiting(false); // Reset exit state
        } else if (isResult && winningNumber !== null) {
            // Sequence:
            // 1. Wheel shows winning number for 2 seconds.
            // 2. Wheel fades out.
            // 3. Result Overlay appears.

            const fadeWheelTimer = setTimeout(() => {
                setIsWheelExiting(true);
            }, 2000);

            const showOverlayTimer = setTimeout(() => {
                setShowResultOverlay(true);
            }, 2800); // 2000ms + 800ms fade transition

            return () => { clearTimeout(fadeWheelTimer); clearTimeout(showOverlayTimer); };
        } else if (isBetting || isFireReveal) {
            setShowResultOverlay(false);
            setIsWheelExiting(false);
        }
    }, [isSpinning, isResult, winningNumber, isBetting, isFireReveal]);

    // LOGIC: When should the wheel be visible?
    // It is visible during SPIN, and during RESULT until we trigger the exit (fade out)
    const shouldShowWheel = isSpinning || (isResult && !isWheelExiting);

    const wheelOpacityStyle = useAnimatedStyle(() => ({
        opacity: withTiming(shouldShowWheel ? 1 : 0, { duration: 800 })
    }));

    // LOGIC: Board Transparency
    // Transparent when wheel is visible. Opaque otherwise.
    const boardBackgroundStyle = useAnimatedStyle(() => ({
        backgroundColor: withTiming(shouldShowWheel ? 'rgba(20,20,30,0.3)' : 'rgba(20,20,30,0.95)', { duration: 800 })
    }));

    useEffect(() => {
        const isBetting = currentPhase === 'BETTING';
        if (isBetting) {
            spinPulse.value = withRepeat(withSequence(withTiming(1.1, { duration: 700 }), withTiming(1, { duration: 700 })), -1, true);
        } else {
            spinPulse.value = 1;
        }
    }, [currentPhase]);

    const phaseValue = useSharedValue(0);
    useEffect(() => {
        phaseValue.value = withTiming(shouldShowWheel ? 1 : 0, { duration: 800 });
    }, [shouldShowWheel]);

    const topStyle = useAnimatedStyle(() => ({
        flex: 0.28,
        zIndex: (isSpinning || isResult) ? 500 : 10
    }));
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

    const fireOverlayStyle = useAnimatedStyle(() => ({ opacity: withTiming(fireOverlayVisible ? 1 : 0, { duration: 500 }) }));

    const handleSpin = async () => {
        if (currentBet === 0) {
            Alert.alert("Place Your Bets", "You need to place at least one chip to spin the wheel!");
            return;
        }
        const isValid = await useGameStore.getState().validateSession();
        if (isValid === false) return;

        if (await prepareRound()) {
            startRound();
        }
    };

    if (isBonus) {
        return <View style={styles.container}><BonusGame /></View>;
    }

    return (
        <View style={styles.container}>
            {/* BACKGROUND WHEEL - Only visible when game is active */}
            <Animated.View style={[styles.wheelBackground, cameraStyle, wheelOpacityStyle]}>
                <View style={styles.wheelCasing}>
                    <View style={styles.casingInnerOutline}>
                        <RouletteWheel isSpinning={isSpinning} winningNumber={winningNumber} fireNumbers={fireNumbers} />
                    </View>
                </View>
            </Animated.View>

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

            {/* MAIN CONTENT LAYER (Z: 10) */}
            <View style={styles.mainContent}>

                {/* MIDDLE ROW: TOOLBAR + BOARD */}
                <View style={styles.middleRow}>
                    {/* LEFT SIDEBAR TOOLBAR */}
                    <View style={styles.sideToolbar}>
                        <TouchableOpacity style={styles.sideActionBtn} onPress={() => setViewMode(prev => prev === 'GRID' ? 'TRACK' : 'GRID')}>
                            {viewMode === 'GRID' ? <RouletteIcon size={22} color={COLORS.ACCENT_GOLD} /> : <Ionicons name="grid-outline" size={20} color={COLORS.ACCENT_GOLD} />}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.sideActionBtn} onPress={() => setStrategiesModalOpen(true)}>
                            <Ionicons name="heart-outline" size={20} color={COLORS.BET_RED} />
                        </TouchableOpacity>

                        <View style={{ height: 10 }} />

                        <TouchableOpacity style={[styles.sideActionBtn, !isBetting && styles.disabledSideBtn]} onPress={undoLastBet} disabled={!isBetting}>
                            <Ionicons name="arrow-undo" size={20} color={COLORS.ACCENT_BLUE} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.sideActionBtn, !isBetting && styles.disabledSideBtn]} onPress={() => useGameStore.getState().clearBets()} disabled={!isBetting}>
                            <Ionicons name="trash-outline" size={20} color={COLORS.DANGER} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.sideActionBtn, (!isBetting || currentBet > 0) && styles.disabledSideBtn]} onPress={rebet} disabled={!isBetting || currentBet > 0}>
                            <Ionicons name="reload" size={20} color={COLORS.SUCCESS} />
                        </TouchableOpacity>

                        {/* DEBUG BUTTON */}
                        <TouchableOpacity style={[styles.sideActionBtn, { borderColor: COLORS.ACCENT_GOLD, marginTop: 10 }]} onPress={() => {
                            const { setBonusStake, setBonusMode, setPhase } = useGameStore.getState();
                            setBonusStake(100);
                            setBonusMode('DEBUG');
                            setPhase('BONUS');
                        }}>
                            <Ionicons name="bug-outline" size={20} color={COLORS.ACCENT_GOLD} />
                        </TouchableOpacity>

                        {/* CUSTOMIZE BUTTON */}
                        <TouchableOpacity
                            style={[styles.sideActionBtn, { borderColor: COLORS.ACCENT_BLUE, marginTop: 10 }]}
                            onPress={() => setCustomizationModalOpen(true)}
                        >
                            <Ionicons name="color-palette-outline" size={20} color={COLORS.ACCENT_BLUE} />
                        </TouchableOpacity>

                        {/* DEBUG FIRE BUTTON */}
                        <TouchableOpacity
                            style={[styles.sideActionBtn, debugFireMode && { borderColor: COLORS.BET_RED, backgroundColor: 'rgba(255,50,50,0.2)' }]}
                            onPress={() => useGameStore.getState().toggleDebugFire()}
                        >
                            <Ionicons name="flame" size={20} color={debugFireMode ? COLORS.BET_RED : COLORS.ACCENT_GOLD} />
                        </TouchableOpacity>
                    </View>

                    {/* BOARD CONTAINER */}
                    <View style={styles.boardContainerWrapper} onLayout={(event) => setBoardSize(event.nativeEvent.layout)}>
                        {viewMode === 'GRID' ? (
                            <Animated.View style={[styles.neonBoardContainer, boardBackgroundStyle, { backgroundColor: tableColor }]}>
                                <BettingBoard highlightedNumbers={fireNumbers} disabled={!isBetting} />
                            </Animated.View>
                        ) : (
                            boardSize.height > 0 && <RacetrackBoard width={boardSize.width} height={boardSize.height} />
                        )}
                    </View>
                </View>

                {/* BOTTOM SECTION */}
                <View style={styles.bottomSection}>
                    {/* HISTORY BAR */}
                    <View style={styles.historyBarWrapper}>
                        <HistoryBar />
                    </View>

                    {/* CONTROLS */}
                    <BettingControls currentBet={currentBet} onSpin={handleSpin} isBetting={isBetting} selectedChipValue={selectedChipValue} onSelectChip={setSelectedChipValue} />
                </View>
            </View>

            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }, overlayStyle]} pointerEvents="none" />

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
                <View style={styles.resultScreenWrapper}>
                    <View style={[styles.resultBox, SHADOWS.NEON_GOLD]}>
                        <Text style={styles.resultTitle}>WINNER</Text>
                        <View style={[styles.resultCircle, { backgroundColor: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(winningNumber) ? COLORS.BET_RED : winningNumber === 0 ? COLORS.BET_GREEN : COLORS.BET_BLACK }, SHADOWS.NEON_BLUE]}>
                            <Text style={styles.resultNumber}>{winningNumber}</Text>
                        </View>

                        {/* Hide Total Win if Fire Hit (It will be shown in Bonus Game) */}
                        {winningNumber !== null && fireNumbers.includes(winningNumber) ? (
                            <Text style={[styles.winAmount, { color: COLORS.BET_RED, fontSize: 24 }]}>FIRE HIT! 🔥</Text>
                        ) : lastWinAmount > 0 ? (
                            <Text style={styles.winAmount}>YOU WON {formatCurrency(lastWinAmount)}</Text>
                        ) : (
                            <Text style={styles.loseText}>No Win</Text>
                        )}
                    </View>
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

            <LevelUpModal />

            <StoreModal visible={isStoreOpen} onHome={onBack} />
            <StrategySelector visible={strategiesModalOpen} onClose={() => setStrategiesModalOpen(false)} />
            <CustomizationModal visible={customizationModalOpen} onClose={() => setCustomizationModalOpen(false)} />
        </View >
    );
};

import Constants from 'expo-constants';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.BG_MAIN },
    // Header with adjusted height and padding for better component fit
    header: { position: 'absolute', top: 0, left: 0, right: 0, minHeight: 80, paddingTop: Constants.statusBarHeight, paddingBottom: 5, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2000, elevation: 50 },
    headerLeft: {},
    creditsBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.BORDER_ACCENT, ...SHADOWS.NEON_GOLD },
    creditsText: { color: COLORS.TEXT_PRIMARY, fontSize: 16, fontWeight: 'bold', marginLeft: 10, textShadowColor: COLORS.ACCENT_GOLD, textShadowRadius: 10 },
    shopButton: { marginLeft: 10, backgroundColor: COLORS.ACCENT_GOLD, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFF', ...SHADOWS.NEON_GOLD },
    shopButtonText: { color: '#000', fontSize: 20, fontWeight: 'bold', marginTop: -2 },
    chipIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.ACCENT_GOLD, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFF' },
    chipInner: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: '#000', borderStyle: 'dashed' },

    // WHEEL BACKGROUND
    // Centered absolutely on screen
    wheelBackground: { position: 'absolute', top: 60, left: 0, right: 0, justifyContent: 'center', alignItems: 'center', zIndex: 0 },
    wheelWrapper: { justifyContent: 'center', alignItems: 'center' },
    wheelCasing: { padding: 10, backgroundColor: '#111', borderRadius: 150, borderWidth: 4, borderColor: '#333', ...SHADOWS.NEON_BLUE },
    casingInnerOutline: { borderRadius: 135, borderWidth: 2, borderColor: COLORS.ACCENT_BLUE, padding: 5, shadowColor: COLORS.ACCENT_BLUE, shadowRadius: 10, shadowOpacity: 1 },

    // MAIN CONTENT
    // Reduced paddingTop to 85 to move board closer to header
    mainContent: { flex: 1, paddingTop: 120, paddingBottom: 10, zIndex: 10 },
    middleRow: { flex: 1, flexDirection: 'row', paddingHorizontal: 10, paddingBottom: 10 },

    sideToolbar: { width: 45, alignItems: 'center', justifyContent: 'center', gap: 8 },
    sideActionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', ...SHADOWS.NEON_BLUE },
    disabledSideBtn: { opacity: 0.3, backgroundColor: 'rgba(0,0,0,0.2)', shadowOpacity: 0 },

    boardContainerWrapper: { flex: 1, marginLeft: 10 },
    neonBoardContainer: { width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

    bottomSection: { zIndex: 20 },
    // Removed borders to fix "strange line" issue and reduced marginBottom
    historyBarWrapper: { height: 50, marginBottom: 15, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 8 },

    fireOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 2000, backgroundColor: 'rgba(0,0,0,0.6)' },
    fireContainerPanel: { backgroundColor: 'rgba(10,10,10,0.95)', padding: 20, borderRadius: 20, borderWidth: 2, borderColor: COLORS.BET_RED, alignItems: 'center', width: '90%', maxWidth: 400 },
    fireTitle: { color: COLORS.BET_RED, fontSize: 28, fontWeight: '900', textShadowColor: COLORS.BET_RED, textShadowRadius: 15, marginBottom: 15, letterSpacing: 2 },
    fireNumbersRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
    fireBubble: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
    fireNumberText: { color: '#FFF', fontWeight: 'bold', fontSize: 20 },

    resultScreenWrapper: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.5)' }, // moved dimming bg here?
    resultBox: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.95)', padding: 40, borderRadius: 24, borderWidth: 3, borderColor: COLORS.ACCENT_GOLD },
    resultTitle: { color: COLORS.ACCENT_GOLD, fontSize: 28, fontWeight: '900', marginBottom: 15, letterSpacing: 2, textShadowColor: COLORS.ACCENT_GOLD, textShadowRadius: 10 },
    resultCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#FFF', marginBottom: 15 },
    resultNumber: { color: '#FFF', fontSize: 40, fontWeight: '900', textShadowColor: '#FFF', textShadowRadius: 10 },
    winAmount: { color: COLORS.SUCCESS, fontSize: 26, fontWeight: 'bold', textShadowColor: COLORS.SUCCESS, textShadowRadius: 10 },
    loseText: { color: COLORS.DANGER, fontSize: 24, fontWeight: 'bold', textShadowColor: COLORS.DANGER, textShadowRadius: 10 },
});
