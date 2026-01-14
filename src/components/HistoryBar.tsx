import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useGameStore } from '../store/useGameStore';
import { COLORS } from '../constants/theme';
import { RED_NUMBERS } from '../constants/gameRules';
import { StatsModal } from './StatsModal';

export const HistoryBar = () => {
    const { history, fullHistory } = useGameStore();
    const [modalVisible, setModalVisible] = useState(false);
    const [statsVisible, setStatsVisible] = useState(false);

    // if (history.length === 0) return null; // Removed to allow empty/loading state

    const getNumberColor = (num: number) => {
        if (num === 0) return COLORS.BET_GREEN;
        if (RED_NUMBERS.includes(num)) return COLORS.BET_RED;
        return COLORS.BET_BLACK;
    };

    const renderHistoryItem = (item: any, index: number, isGrid = false) => {
        const bgColor = getNumberColor(item.number);
        return (
            <View key={index} style={[
                styles.bubble,
                { backgroundColor: bgColor },
                item.isFire && styles.fireBubble,
                isGrid && styles.gridBubble
            ]}>
                <Text style={styles.numberText}>{item.number}</Text>

                {/* Multiplier Badge */}
                {item.isFire && item.multiplier && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.multiplier}x</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* STATS BUTTON (Fixed Left) */}
            <TouchableOpacity style={styles.statsBtn} onPress={() => setStatsVisible(true)}>
                <Text style={styles.statsText}>📊</Text>
            </TouchableOpacity>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Render History Items */}
                {history.map((item, index) => renderHistoryItem(item, index))}

                {/* SEE MORE BUTTON */}
                <TouchableOpacity style={styles.seeMoreBtn} onPress={() => setModalVisible(true)}>
                    <Text style={styles.seeMoreText}>+</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* FULL HISTORY MODAL */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Game History</Text>

                        <FlatList
                            data={fullHistory}
                            keyExtractor={(_, i) => i.toString()}
                            numColumns={6}
                            contentContainerStyle={styles.historyGrid}
                            renderItem={({ item, index }) => renderHistoryItem(item, index, true)}
                        />

                        <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                            <Text style={styles.closeText}>CLOSE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* UNIFIED STATS MODAL */}
            <StatsModal visible={statsVisible} onClose={() => setStatsVisible(false)} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 70, // Increased to fit badges
        backgroundColor: 'transparent',
        flexDirection: 'row', // Row layout
        alignItems: 'center',
        marginVertical: 5,
        paddingLeft: 10,
    },
    // NEW STATS BTN
    statsBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.ACCENT_GOLD,
        marginRight: 10,
    },
    statsText: {
        fontSize: 18,
    },
    scrollContent: {
        paddingRight: 15,
        paddingVertical: 15, // Push bubbles down to make room for top badges
        alignItems: 'center',
        gap: 10,
    },
    bubble: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'visible', // For badge
    },
    gridBubble: {
        margin: 5,
        width: 45,
        height: 45,
        borderRadius: 22.5,
    },
    fireBubble: {
        borderColor: COLORS.ACCENT_GOLD,
        borderWidth: 2,
        shadowColor: COLORS.ACCENT_GOLD,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
        elevation: 5,
    },
    numberText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    badge: {
        position: 'absolute',
        top: -10,
        right: -8,
        zIndex: 10, // Ensure on top
        backgroundColor: COLORS.ACCENT_GOLD,
        borderRadius: 8,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderWidth: 1,
        borderColor: '#000',
    },
    badgeText: {
        color: '#000',
        fontSize: 9,
        fontWeight: '900',
    },

    // SEE MORE
    seeMoreBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.BG_SURFACE,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
    },
    seeMoreText: {
        color: COLORS.TEXT_SECONDARY,
        fontSize: 20,
        fontWeight: 'bold',
    },

    // MODAL
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
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
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
    },
    modalTitle: {
        color: COLORS.ACCENT_GOLD,
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    historyGrid: {
        paddingBottom: 20,
        alignItems: 'center'
    },
    closeBtn: {
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 30,
        backgroundColor: COLORS.BG_MAIN,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
    },
    closeText: {
        color: COLORS.TEXT_SECONDARY,
        fontWeight: 'bold',
    },
});
