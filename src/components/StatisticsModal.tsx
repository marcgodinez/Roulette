
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList } from 'react-native';
import { COLORS } from '../constants/theme';
import { RadialFrequencyChart } from './RadialFrequencyChart';
import { useGameStore } from '../store/useGameStore';
import { RED_NUMBERS } from '../constants/gameRules';
import { calculateStats } from '../utils/statsHelper';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export const StatisticsModal = ({ visible, onClose }: Props) => {
    const { history, fullHistory } = useGameStore();

    // Calculate Stats for the Log
    const { hotNumbers, coldNumbers } = useMemo(() => {
        return calculateStats(fullHistory || history);
    }, [fullHistory, history]);

    // Helper for List Item
    const renderHistoryItem = ({ item, index }: { item: any, index: number }) => {
        const num = item.number;
        const color = num === 0 ? COLORS.BET_GREEN : (RED_NUMBERS.includes(num) ? COLORS.BET_RED : COLORS.BET_BLACK);

        const isHot = hotNumbers.includes(num);
        const isCold = coldNumbers.includes(num);

        return (
            <View style={styles.logItem}>
                <View style={[styles.logBadge, { backgroundColor: color }]}>
                    <Text style={styles.logText}>{num}</Text>
                </View>
                {isHot && <Text style={styles.marker}>🔥</Text>}
                {isCold && <Text style={styles.marker}>❄️</Text>}
            </View>
        );
    };

    const HeaderComponent = () => (
        <View style={styles.headerContainer}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>SESSION ANALYSIS</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                    <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.chartContainer}>
                <RadialFrequencyChart history={fullHistory || history} limit={200} />
            </View>

            <View style={styles.logHeader}>
                <Text style={styles.logTitle}>FULL SPIN LOG</Text>
                <Text style={styles.logSubtitle}>{(fullHistory || history).length} Spins</Text>
            </View>
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>

                    <FlatList
                        data={fullHistory || history} // Fallback if fullHistory empty initially
                        keyExtractor={(_, i) => i.toString()}
                        numColumns={10}
                        contentContainerStyle={styles.listContent}
                        ListHeaderComponent={HeaderComponent}
                        renderItem={renderHistoryItem}
                        showsVerticalScrollIndicator={false}
                    />

                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Text style={styles.btnText}>CLOSE STATS</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 40,
        paddingBottom: 20,
    },
    modalContent: {
        flex: 1,
        width: '95%',
        backgroundColor: '#0F172A',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#334155',
    },
    listContent: {
        paddingBottom: 20,
        paddingHorizontal: 10,
    },
    headerContainer: {
        padding: 20,
        alignItems: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        color: COLORS.ACCENT_GOLD,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1.5,
    },
    closeIcon: {
        padding: 5,
    },
    closeText: {
        color: '#94A3B8',
        fontSize: 22,
    },
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    // LOG STYLES
    logHeader: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
        paddingBottom: 10,
        marginBottom: 10,
        marginTop: 10,
    },
    logTitle: {
        color: '#E2E8F0',
        fontWeight: 'bold',
        fontSize: 14,
    },
    logSubtitle: {
        color: '#64748B',
        fontSize: 12,
    },
    logItem: {
        flex: 1,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 2,
    },
    logBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    logText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    marker: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        fontSize: 10,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 6,
        paddingHorizontal: 2,
    },
    closeBtn: {
        backgroundColor: COLORS.ACCENT_GOLD,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 1,
    }
});
