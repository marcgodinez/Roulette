import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import Animated, {
    ZoomIn,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { COLORS, SHADOWS } from '../constants/theme';
import { formatCurrency } from '../utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../store/useGameStore';
import { AdManager } from '../services/AdManager';

export const LevelUpModal = () => {
    const { levelUpPayload, setLevelUpPayload, addCredits } = useGameStore();
    const [multiplier, setMultiplier] = useState(1);
    const [loadingAd, setLoadingAd] = useState(false);

    // Reset when modal opens
    useEffect(() => {
        if (levelUpPayload) {
            setMultiplier(1);
            // Preload rewarded ad just in case
            AdManager.loadRewarded();
        }
    }, [levelUpPayload]);

    if (!levelUpPayload) return null;

    const { level, bonus } = levelUpPayload;
    const currentTotal = bonus * multiplier;

    // Logic: 1 -> 2 (x2) -> 8 (x4 of previous)
    const nextMultiplier = multiplier === 1 ? 2 : 8;
    const canMultiply = multiplier < 8;

    const handleWatchAd = async () => {
        if (!canMultiply) return;
        setLoadingAd(true);
        const earned = await AdManager.showRewarded();
        setLoadingAd(false);

        if (earned) {
            // If 1, go to 2. If 2, go to 8.
            setMultiplier(prev => prev === 1 ? 2 : 8);
        }
    };

    const handleCollect = () => {
        // Base bonus is already granted by backend.
        // We only grant the EXTRA gained from multipliers.
        const extraCoins = currentTotal - bonus;
        if (extraCoins > 0) {
            addCredits(extraCoins);
        }
        setLevelUpPayload(null);
    };

    return (
        <Modal
            transparent
            visible={!!levelUpPayload}
            animationType="fade"
            onRequestClose={handleCollect}
        >
            <View style={styles.overlay}>
                <View style={styles.backdrop} />

                <Animated.View entering={ZoomIn.duration(400)} style={styles.container}>

                    {/* Header Icon */}
                    <View style={styles.iconContainer}>
                        <Ionicons name="star" size={50} color={COLORS.ACCENT_GOLD} />
                        {multiplier > 1 && (
                            <View style={styles.multiplierBadge}>
                                <Text style={styles.multiplierText}>x{multiplier}</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.title}>LEVEL UP!</Text>
                    <Text style={styles.levelText}>You reached Level {level}</Text>

                    {/* Reward Box */}
                    <View style={styles.rewardBox}>
                        <Text style={styles.rewardLabel}>REWARD</Text>
                        <Text style={[styles.rewardAmount, multiplier > 1 && { color: COLORS.ACCENT_GOLD }]}>
                            +{formatCurrency(currentTotal)}
                        </Text>
                        <Text style={[styles.currencyLabel, multiplier > 1 && { color: COLORS.ACCENT_GOLD }]}>COINS</Text>
                    </View>

                    {/* ACTIONS */}
                    <View style={styles.actionsContainer}>
                        {canMultiply && (
                            <TouchableOpacity
                                style={[styles.adButton, loadingAd && styles.disabledBtn]}
                                onPress={handleWatchAd}
                                disabled={loadingAd}
                            >
                                {loadingAd ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                            <Ionicons name="videocam" size={20} color="#000" />
                                            <Text style={styles.adButtonText}>
                                                GET x{nextMultiplier} {nextMultiplier === 8 ? 'TOTAL' : ''}
                                            </Text>
                                        </View>
                                        <Text style={styles.adSubText}>Watch Video</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.collectButton} onPress={handleCollect} disabled={loadingAd}>
                            <Text style={styles.collectButtonText}>
                                {canMultiply ? "NO THANKS, COLLECT" : "COLLECT REWARD"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.85)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        width: '85%',
        maxWidth: 400,
        backgroundColor: '#1A1A24',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.ACCENT_GOLD,
        ...SHADOWS.NEON_GOLD,
        shadowOpacity: 0.6,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: COLORS.ACCENT_GOLD,
    },
    multiplierBadge: {
        position: 'absolute',
        top: -5,
        right: -10,
        backgroundColor: COLORS.BET_RED,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFF',
        transform: [{ rotate: '15deg' }]
    },
    multiplierText: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 14,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: COLORS.ACCENT_GOLD,
        marginBottom: 10,
        letterSpacing: 2,
        textShadowColor: COLORS.ACCENT_GOLD,
        textShadowRadius: 10,
    },
    levelText: {
        fontSize: 18,
        color: '#FFF',
        marginBottom: 25,
        textAlign: 'center',
        opacity: 0.9,
    },
    rewardBox: {
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    rewardLabel: {
        fontSize: 12,
        color: COLORS.TEXT_SECONDARY,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 5,
    },
    rewardAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: COLORS.SUCCESS,
        textShadowColor: COLORS.SUCCESS,
        textShadowRadius: 10,
    },
    currencyLabel: {
        fontSize: 14,
        color: COLORS.SUCCESS,
        fontWeight: 'bold',
        marginTop: -5,
    },
    actionsContainer: {
        width: '100%',
        gap: 15,
    },
    adButton: {
        backgroundColor: COLORS.ACCENT_GOLD,
        paddingVertical: 12,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
        ...SHADOWS.NEON_GOLD,
    },
    adButtonText: {
        color: '#000',
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 1,
    },
    adSubText: {
        color: '#333',
        fontSize: 12,
        fontWeight: 'bold',
    },
    collectButton: {
        paddingVertical: 12,
        width: '100%',
        alignItems: 'center',
    },
    collectButtonText: {
        color: COLORS.TEXT_SECONDARY,
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
        textDecorationLine: 'underline',
    },
    disabledBtn: {
        opacity: 0.7,
    }
});
