import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, FlatList, Dimensions } from 'react-native';
import { BettingBoard } from './BettingBoard';
import { RadialFrequencyChart } from './RadialFrequencyChart';
import { useGameStore } from '../store/useGameStore';
import { COLORS, METRICS } from '../constants/theme';
import { RED_NUMBERS } from '../constants/gameRules';

const { width } = Dimensions.get('window');

interface Props {
    visible: boolean;
    onClose: () => void;
}

type Tab = 'OVERVIEW' | 'HEATMAP' | 'LOG';

export const StatsModal: React.FC<Props> = ({ visible, onClose }) => {
    const { fullHistory, history } = useGameStore();
    const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');

    const stats = useMemo(() => {
        const counts: Record<number, number> = {};
        let total = 0;

        // Initialize 0-36
        for (let i = 0; i <= 36; i++) counts[i] = 0;

        fullHistory.forEach(entry => {
            counts[entry.number] = (counts[entry.number] || 0) + 1;
            total++;
        });

        const sorted = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([num, count]) => ({ num: parseInt(num), count }));

        const hot = sorted.slice(0, 5).filter(i => i.count > 0);
        const cold = sorted.slice(-5).reverse().filter(i => i.count === 0 || i.count < sorted[0].count / 4);

        return { counts, hot, cold, total };
    }, [fullHistory]);

    // RENDER HELPERS
    const renderTabBtn = (tab: Tab, label: string) => (
        <TouchableOpacity
            style={[styles.tabBtn, activeTab === tab && styles.activeTabBtn]}
            onPress={() => setActiveTab(tab)}
        >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{label}</Text>
        </TouchableOpacity>
    );

    const renderLogItem = ({ item }: { item: any }) => {
        const num = item.number;
        const color = num === 0 ? COLORS.BET_GREEN : (RED_NUMBERS.includes(num) ? COLORS.BET_RED : COLORS.BET_BLACK);
        const count = stats.counts[num];
        const isHot = stats.hot.find(h => h.num === num);

        return (
            <View style={styles.logItem}>
                <View style={[styles.logBadge, { backgroundColor: color }]}>
                    <Text style={styles.logText}>{num}</Text>
                </View>
                {isHot && <Text style={styles.marker}>🔥</Text>}
                {/* Optional: Show count? */}
            </View>
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.content}>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>SESSION ANALYTICS 📊</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabsRow}>
                        {renderTabBtn('OVERVIEW', 'OVERVIEW')}
                        {renderTabBtn('HEATMAP', 'HEATMAP')}
                        {renderTabBtn('LOG', 'LOG')}
                    </View>

                    <View style={styles.body}>
                        {activeTab === 'OVERVIEW' && (
                            <ScrollView contentContainerStyle={styles.scrollBody}>
                                <Text style={styles.sectionTitle}>HOT & COLD (Last {stats.total})</Text>
                                {/* Key Stats */}
                                <View style={styles.kpiRow}>
                                    <View style={styles.kpiBox}>
                                        <Text style={styles.kpiLabel}>HOT 🔥</Text>
                                        <View style={styles.ballRow}>
                                            {stats.hot.map((item, i) => (
                                                <View key={i} style={[styles.ball, { backgroundColor: item.count >= 4 ? COLORS.BET_RED : COLORS.ACCENT_HOVER }]}>
                                                    <Text style={styles.ballText}>{item.num}</Text>
                                                    <View style={styles.tinyBadge}><Text style={styles.tinyText}>{item.count}</Text></View>
                                                </View>
                                            ))}
                                            {stats.hot.length === 0 && <Text style={styles.emptyText}>-</Text>}
                                        </View>
                                    </View>
                                    <View style={styles.kpiBox}>
                                        <Text style={styles.kpiLabel}>COLD ❄️</Text>
                                        <View style={styles.ballRow}>
                                            {stats.cold.map((item, i) => (
                                                <View key={i} style={[styles.ball, { backgroundColor: COLORS.BG_ELEVATED, borderColor: COLORS.BORDER_SUBTLE }]}>
                                                    <Text style={styles.ballText}>{item.num}</Text>
                                                </View>
                                            ))}
                                            {stats.cold.length === 0 && <Text style={styles.emptyText}>-</Text>}
                                        </View>
                                    </View>
                                </View>

                                {/* Radial Chart */}
                                <Text style={styles.sectionTitle}>FREQUENCY WHEEL</Text>
                                <View style={styles.chartWrapper}>
                                    <RadialFrequencyChart history={fullHistory} limit={200} />
                                </View>
                            </ScrollView>
                        )}

                        {activeTab === 'HEATMAP' && (
                            <View style={styles.heatmapContainer}>
                                <Text style={styles.legend}>
                                    <Text style={{ color: COLORS.BET_RED }}>RED</Text> = Hot
                                    {'  •  '}
                                    <Text style={{ color: COLORS.ACCENT_HOVER }}>GOLD</Text> = Warm
                                    {'  •  '}
                                    <Text style={{ color: COLORS.TEXT_MUTED }}>GREY</Text> = Cold
                                </Text>
                                <View style={styles.boardWrapper}>
                                    <BettingBoard
                                        heatmapData={stats.counts}
                                        disabled={true}
                                    />
                                </View>
                            </View>
                        )}

                        {activeTab === 'LOG' && (
                            <FlatList
                                data={fullHistory}
                                keyExtractor={(_, i) => i.toString()}
                                numColumns={8}
                                contentContainerStyle={styles.logList}
                                renderItem={renderLogItem}
                            />
                        )}
                    </View>

                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        padding: 10,
        paddingTop: 60, // Avoid Notch
    },
    content: {
        flex: 1,
        backgroundColor: COLORS.BG_MAIN,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.ACCENT_GOLD,
        overflow: 'hidden',
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: COLORS.BG_SURFACE,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.BORDER_SUBTLE,
    },
    title: {
        color: COLORS.ACCENT_GOLD,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    closeBtn: {
        padding: 5,
    },
    closeText: {
        color: COLORS.TEXT_MUTED,
        fontSize: 20,
        fontWeight: 'bold',
    },
    // TABS
    tabsRow: {
        flexDirection: 'row',
        backgroundColor: '#0F172A',
        padding: 4,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTabBtn: {
        borderBottomColor: COLORS.ACCENT_GOLD,
        backgroundColor: 'rgba(255, 215, 0, 0.05)',
    },
    tabText: {
        color: COLORS.TEXT_SECONDARY,
        fontWeight: 'bold',
        fontSize: 12,
    },
    activeTabText: {
        color: COLORS.ACCENT_GOLD,
    },
    // BODY
    body: {
        flex: 1,
        padding: 0,
    },
    scrollBody: {
        padding: 20,
        alignItems: 'center',
    },
    sectionTitle: {
        color: COLORS.TEXT_SECONDARY,
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 10,
        letterSpacing: 1,
        textAlign: 'center',
    },
    // KPI
    kpiRow: {
        flexDirection: 'row',
        gap: 15,
        alignSelf: 'stretch',
        marginBottom: 10,
    },
    kpiBox: {
        flex: 1,
        backgroundColor: COLORS.BG_SURFACE,
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE
    },
    kpiLabel: {
        color: COLORS.TEXT_SECONDARY,
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    ballRow: {
        flexDirection: 'row',
        gap: 5,
        flexWrap: 'wrap',
        justifyContent: 'center',
        minHeight: 30,
    },
    ball: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)'
    },
    ballText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 12,
    },
    tinyBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FFF',
        width: 12,
        height: 12,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tinyText: {
        color: '#000',
        fontSize: 8,
        fontWeight: 'bold',
    },
    emptyText: {
        color: COLORS.TEXT_MUTED,
        fontSize: 12,
    },
    chartWrapper: {
        marginTop: 10,
        transform: [{ scale: 0.9 }] // Fit better
    },
    // HEATMAP
    heatmapContainer: {
        flex: 1,
        padding: 10,
    },
    boardWrapper: {
        flex: 1,
        minHeight: 500, // Ensure enough space
    },
    legend: {
        color: COLORS.TEXT_MUTED,
        textAlign: 'center',
        fontSize: 10,
        marginBottom: 5,
    },
    // LOG
    logList: {
        padding: 10,
    },
    logItem: {
        flex: 1,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 2,
    },
    logBadge: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    logText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    marker: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        fontSize: 10,
    }
});
