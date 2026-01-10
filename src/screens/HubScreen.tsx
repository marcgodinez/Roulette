import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Image } from 'react-native';
import { useHubData } from '../hooks/useHubData';
import { useGameStore } from '../store/useGameStore';
import { useAuth } from '../hooks/useAuth';
import { StoreModal } from '../components/StoreModal';

import { COLORS, METRICS } from '../constants/theme';

export const HubScreen = ({ onPlay, onStrategy }: { onPlay: () => void, onStrategy: () => void }) => {
    const {
        weeklyTop,
        legendaryTop,
        myBestWin,
        dailyBonusAvailable,
        nextBonusTime,
        claimBonus,
        refresh,
        loading
    } = useHubData();

    const { credits, setStoreOpen, isStoreOpen } = useGameStore();
    const { user, signOut } = useAuth();
    const [tab, setTab] = useState<'WEEKLY' | 'LEGENDARY'>('WEEKLY');

    // Helper to mask email
    const maskEmail = (email: string) => {
        if (!email) return 'Anonymous';
        const [name, domain] = email.split('@');
        return `${name.substring(0, 3)}***@${domain}`;
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} colors={[COLORS.ACCENT_GOLD]} tintColor={COLORS.ACCENT_GOLD} />}
            >

                {/* HEADER */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcomeText}>WELCOME BACK</Text>
                        <Text style={styles.userEmail}>{maskEmail(user?.email || '')}</Text>
                    </View>
                    <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
                        <Text style={styles.logoutText}>LOGOUT</Text>
                    </TouchableOpacity>
                </View>

                {/* CREDIT CARD */}
                <View style={styles.creditCard}>
                    <Text style={styles.creditLabel}>TOTAL BALANCE</Text>
                    <View style={styles.creditRow}>
                        <Text style={styles.creditValue}>{credits.toLocaleString()}</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={() => setStoreOpen(true)}>
                            <Text style={styles.addBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ACTIONS */}
                <View style={styles.actionsRow}>
                    {/* DAILY BONUS */}
                    <TouchableOpacity
                        style={[styles.actionCard, !dailyBonusAvailable && styles.disabledCard]}
                        onPress={claimBonus}
                        disabled={!dailyBonusAvailable}
                    >
                        <Text style={styles.actionIcon}>🎁</Text>
                        {dailyBonusAvailable ? (
                            <>
                                <Text style={styles.actionTitle}>CLAIM GIFT</Text>
                                <Text style={styles.actionSub}>+1,000 Coins</Text>
                            </>
                        ) : (
                            <>
                                <Text style={styles.actionTitle}>WAITING...</Text>
                                <Text style={styles.actionSub}>Check back later</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* FREE COINS */}
                    <TouchableOpacity style={styles.actionCard} onPress={() => setStoreOpen(true)}>
                        <Text style={styles.actionIcon}>📺</Text>
                        <Text style={styles.actionTitle}>FREE COINS</Text>
                        <Text style={styles.actionSub}>Watch Ads</Text>
                    </TouchableOpacity>
                </View>

                {/* PLAY BUTTON */}
                <TouchableOpacity style={styles.playButton} onPress={onPlay}>
                    <Text style={styles.playText}>ENTER ROULETTE</Text>
                </TouchableOpacity>

                {/* STRATEGY LAB BUTTON */}
                <TouchableOpacity style={styles.strategyButton} onPress={onStrategy}>
                    <Text style={styles.strategyText}>STRATEGY LAB 🧪</Text>
                </TouchableOpacity>

                {/* MY STATS */}
                <View style={styles.statsRow}>
                    <Text style={styles.statLabel}>MY BEST WIN:</Text>
                    <Text style={styles.statValue}>{myBestWin > 0 ? `+${myBestWin.toLocaleString()}` : '-'}</Text>
                </View>

                {/* LEADERBOARDS */}
                <View style={styles.leaderboardContainer}>
                    <View style={styles.tabs}>
                        <TouchableOpacity
                            style={[styles.tab, tab === 'WEEKLY' && styles.activeTab]}
                            onPress={() => setTab('WEEKLY')}
                        >
                            <Text style={[styles.tabText, tab === 'WEEKLY' && styles.activeTabText]}>WEEKLY KINGS</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, tab === 'LEGENDARY' && styles.activeTab]}
                            onPress={() => setTab('LEGENDARY')}
                        >
                            <Text style={[styles.tabText, tab === 'LEGENDARY' && styles.activeTabText]}>LEGENDARY</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.listContainer}>
                        {tab === 'WEEKLY' ? (
                            weeklyTop.length === 0 ? (
                                <Text style={styles.emptyText}>No kings this week yet.</Text>
                            ) : (
                                weeklyTop.map((item, index) => (
                                    <View key={index} style={styles.rankRow}>
                                        <View style={[styles.rankBadge, index === 0 && styles.goldBadge]}>
                                            <Text style={styles.rankText}>#{index + 1}</Text>
                                        </View>
                                        <Text style={styles.rankUser}>{maskEmail(item.email)}</Text>
                                        <Text style={styles.rankScore}>+{item.total_profit?.toLocaleString()}</Text>
                                    </View>
                                ))
                            )
                        ) : (
                            legendaryTop.length === 0 ? (
                                <Text style={styles.emptyText}>No legends yet.</Text>
                            ) : (
                                <View style={styles.legendCard}>
                                    <Text style={styles.legendTitle}>🏆 BIGGEST HIT 🏆</Text>
                                    <View style={styles.legendDivider} />
                                    <Text style={styles.legendScore}>{legendaryTop[0].max_win?.toLocaleString()}</Text>
                                    <Text style={styles.legendUser}>{maskEmail(legendaryTop[0].email)}</Text>
                                </View>
                            )
                        )}
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            <StoreModal visible={isStoreOpen} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BG_MAIN,
    },
    scroll: {
        padding: METRICS.padding,
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    welcomeText: {
        color: COLORS.TEXT_SECONDARY,
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 4,
    },
    userEmail: {
        color: COLORS.TEXT_PRIMARY,
        fontSize: 18,
        fontWeight: 'bold',
    },
    logoutBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: COLORS.BG_SURFACE,
        borderRadius: METRICS.borderRadius,
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
    },
    logoutText: {
        color: COLORS.TEXT_MUTED,
        fontSize: 10,
        fontWeight: 'bold',
    },
    creditCard: {
        backgroundColor: COLORS.BG_SURFACE,
        borderRadius: METRICS.borderRadius,
        padding: 24,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
    },
    creditLabel: {
        color: COLORS.TEXT_SECONDARY,
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        letterSpacing: 1,
    },
    creditRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    creditValue: {
        color: COLORS.ACCENT_GOLD,
        fontSize: 40,
        fontWeight: 'bold',
    },
    addBtn: {
        backgroundColor: COLORS.ACCENT_GOLD,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 15,
    },
    addBtnText: {
        color: COLORS.BG_MAIN,
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: -2,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    actionCard: {
        width: '48%',
        backgroundColor: COLORS.BG_SURFACE,
        borderRadius: METRICS.borderRadius,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
    },
    disabledCard: {
        opacity: 0.5,
    },
    actionIcon: {
        fontSize: 28,
        marginBottom: 10,
    },
    actionTitle: {
        color: COLORS.TEXT_PRIMARY,
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    actionSub: {
        color: COLORS.TEXT_SECONDARY,
        fontSize: 11,
    },
    playButton: {
        backgroundColor: COLORS.ACCENT_GOLD,
        borderRadius: METRICS.borderRadius,
        paddingVertical: 20,
        alignItems: 'center',
        marginBottom: 25,
        shadowColor: COLORS.ACCENT_GOLD,
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    playText: {
        color: COLORS.BG_MAIN,
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    strategyButton: {
        backgroundColor: COLORS.BG_SURFACE,
        borderRadius: METRICS.borderRadius,
        paddingVertical: 15,
        alignItems: 'center',
        marginBottom: 25,
        borderWidth: 1,
        borderColor: COLORS.ACCENT_GOLD,
    },
    strategyText: {
        color: COLORS.ACCENT_GOLD,
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: COLORS.BG_SURFACE,
        padding: 16,
        borderRadius: METRICS.borderRadius,
        marginBottom: 25,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.ACCENT_GOLD,
    },
    statLabel: {
        color: COLORS.TEXT_SECONDARY,
        fontWeight: 'bold',
    },
    statValue: {
        color: COLORS.ACCENT_GOLD,
        fontWeight: 'bold',
        fontSize: 16,
    },
    leaderboardContainer: {
        flex: 1,
    },
    tabs: {
        flexDirection: 'row',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.BORDER_SUBTLE,
    },
    tab: {
        flex: 1,
        paddingBottom: 15,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: COLORS.ACCENT_GOLD,
    },
    tabText: {
        color: COLORS.TEXT_MUTED,
        fontWeight: 'bold',
        fontSize: 12,
        letterSpacing: 1,
    },
    activeTabText: {
        color: COLORS.ACCENT_GOLD,
    },
    listContainer: {
        backgroundColor: COLORS.BG_SURFACE,
        borderRadius: METRICS.borderRadius,
        padding: 10,
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
    },
    emptyText: {
        color: COLORS.TEXT_MUTED,
        textAlign: 'center',
        padding: 20,
        fontStyle: 'italic',
    },
    rankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.BORDER_SUBTLE,
    },
    rankBadge: {
        width: 24,
        height: 24,
        backgroundColor: COLORS.BG_MAIN,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    goldBadge: {
        backgroundColor: COLORS.ACCENT_GOLD,
    },
    rankText: {
        color: COLORS.TEXT_PRIMARY,
        fontWeight: 'bold',
        fontSize: 10,
    },
    rankUser: {
        flex: 1,
        color: COLORS.TEXT_PRIMARY,
        fontWeight: '600',
        fontSize: 14,
    },
    rankScore: {
        color: COLORS.ACCENT_GOLD,
        fontWeight: 'bold',
    },
    legendCard: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: COLORS.BG_SURFACE,
        borderRadius: METRICS.borderRadius,
    },
    legendTitle: {
        color: COLORS.ACCENT_GOLD,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
        letterSpacing: 2,
    },
    legendDivider: {
        width: 40,
        height: 2,
        backgroundColor: COLORS.BORDER_SUBTLE,
        marginBottom: 15,
    },
    legendScore: {
        color: COLORS.TEXT_PRIMARY,
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    legendUser: {
        color: COLORS.TEXT_SECONDARY,
        fontSize: 14,
    },
});
