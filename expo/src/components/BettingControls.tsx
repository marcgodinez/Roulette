import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { formatCurrency } from '../utils/format';

import { ChipSelector } from './ChipSelector';

interface Props {
    currentBet: number;
    onSpin: () => void;
    isBetting: boolean;
    selectedChipValue: number;
    onSelectChip: (value: number) => void;
}

export const BettingControls: React.FC<Props> = ({
    currentBet,
    onSpin,
    isBetting,
    selectedChipValue,
    onSelectChip
}) => {
    return (
        <View style={styles.container}>

            {/* CHIP SELECTOR (Left) */}


            {/* TOTAL BET DISPLAY (Right) */}
            <View style={styles.betInfo}>
                <Text style={styles.betLabel}>TOTAL BET</Text>
                <Text style={styles.betValue}>{formatCurrency(currentBet)}</Text>
            </View>

            {/* SPIN BUTTON (Center) */}
            <TouchableOpacity
                style={[styles.spinButton, isBetting ? styles.activeSpin : styles.disabledSpin]}
                onPress={onSpin}
                disabled={!isBetting}
                activeOpacity={0.8}
            >
                {isBetting ? (
                    <Text style={styles.spinText}>SPIN</Text>
                ) : (
                    <Ionicons name="hourglass-outline" size={30} color="#FFF" />
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 100, // Taller footer
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(5, 5, 10, 0.9)', // Darker footer background
        borderTopWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
        position: 'relative',
        zIndex: 100,
        width: '100%'
    },
    betInfo: {
        position: 'absolute',
        right: 20,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    betLabel: {
        color: COLORS.TEXT_SECONDARY,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 2
    },
    betValue: {
        color: COLORS.ACCENT_GOLD,
        fontSize: 20,
        fontWeight: '900',
        textShadowColor: COLORS.ACCENT_GOLD,
        textShadowRadius: 8
    },
    spinButton: {
        width: 75,
        height: 75,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        marginBottom: 10
    },
    activeSpin: {
        backgroundColor: COLORS.SUCCESS,
        borderColor: '#DCFCE7', // Light green border
        ...SHADOWS.NEON_GREEN // Glow
    },
    disabledSpin: {
        backgroundColor: '#1E293B',
        borderColor: '#334155',
        opacity: 0.8
    },
    spinText: {
        color: '#000', // Black text on Neon Green is very readable
        fontWeight: '900',
        fontSize: 18,
        letterSpacing: 1,
    }
});
