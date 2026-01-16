import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Image } from 'react-native';
import { useHubData } from '../hooks/useHubData';
import { useGameStore } from '../store/useGameStore';
import { useAuth } from '../hooks/useAuth';
import { StoreModal } from '../components/StoreModal';
import { SettingsModal } from '../components/SettingsModal';
import { Ionicons } from '@expo/vector-icons';
import { NewsTicker } from '../components/NewsTicker';
import { usePresence } from '../hooks/usePresence';
import { formatCurrency } from '../utils/format';
import { AdManager } from '../services/AdManager';

import { COLORS, METRICS, SHADOWS } from '../constants/theme';

export const HubScreen = ({ onPlay, onStrategy }: { onPlay: () => void, onStrategy: () => void }) => {
    const {
        weeklyTop,
        legendaryTop,
        myBestWin,
        dailyBonusAvailable,
        nextBonusTime,
        claimBonus,
        refresh,
        loading,
        username,
        claimAdReward
    } = useHubData();

    const { credits, setStoreOpen, isStoreOpen, isAdFree } = useGameStore();
    const { user, signOut } = useAuth();
    const onlineCount = usePresence(); // Hook
    const [tab, setTab] = useState<'WEEKLY' | 'LEGENDARY'>('WEEKLY');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [adLoading, setAdLoading] = useState(false);

    useEffect(() => {
        AdManager.loadRewarded();
    }, []);

    const handleWatchAd = async () => {
        setAdLoading(true);
        const earned = await AdManager.showRewarded();
        setAdLoading(false);
        if (earned) {
            claimAdReward();
        }
    };




    return (
        <View style={styles.container}>
            <NewsTicker />
            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} colors={[COLORS.ACCENT_GOLD]} tintColor={COLORS.ACCENT_GOLD} />}
            >
                {/* HEADER */}
                <View style={styles.header}>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.welcomeText}>WELCOME BACK</Text>
                        <Text style={styles.userEmail} numberOfLines={1} adjustsFontSizeToFit>
                            {username
                                ? username.toUpperCase()
                                : (user?.user_metadata?.username?.toUpperCase() || user?.email?.split('@')[0]?.toUpperCase() || 'ANONYMOUS')}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => setSettingsOpen(true)} style={styles.settingsBtn}>
                        <Ionicons name="settings-sharp" size={24} color={COLORS.ACCENT_GOLD} />
                    </TouchableOpacity>
                </View>

                {/* CREDIT CARD */}
                <View style={styles.creditCard}>
                    <Text style={styles.creditLabel}>TOTAL BALANCE</Text>
                    <View style={styles.creditRow}>
                        <Text style={styles.creditValue}>{formatCurrency(credits || 0)}</Text>
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
                    {!isAdFree && (
                        <TouchableOpacity
                            style={[styles.actionCard, adLoading && styles.disabledCard]}
                            onPress={handleWatchAd}
                            disabled={adLoading}
                        >
                            <Text style={styles.actionIcon}>📺</Text>
                            <Text style={styles.actionTitle}>FREE COINS</Text>
                            <Text style={styles.actionSub}>{adLoading ? 'Loading Ad...' : 'Watch Video'}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* PLAY BUTTON */}
                <TouchableOpacity style={styles.playButton} onPress={onPlay}>
                    <Text style={styles.playText}>ENTER ROULETTE</Text>
                </TouchableOpacity>

                {/* STRATEGY LAB BUTTON */}
                <TouchableOpacity style={styles.strategyButton} onPress={onStrategy}>
                    <Text style={styles.strategyText}>STRATEGY LAB 🧪</Text>
                </TouchableOpacity>

                {/* INFO ROW: BEST WIN + ONLINE */}
                <View style={styles.statsRow}>
                    <View>
                        <Text style={styles.statLabel}>MY BEST WIN</Text>
                        <Text style={styles.statValue}>{myBestWin > 0 ? `+${formatCurrency(myBestWin)}` : '-'}</Text>
                    </View>
                    <View style={styles.onlineContainer}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.onlineText}>{onlineCount} LIVE</Text>
                    </View>
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
                                        <Text style={styles.rankUser}>{item.username}</Text>
                                        <Text style={styles.rankScore}>+{formatCurrency(item.total_profit)}</Text>
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

                                    <View style={styles.legendDetailsRow}>
                                        <View style={[styles.legendNumberBadge,
                                        legendaryTop[0].winning_number === 0 ? { backgroundColor: COLORS.BET_GREEN } :
                                            [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(legendaryTop[0].winning_number) ?
                                                { backgroundColor: COLORS.BET_RED } : { backgroundColor: COLORS.BET_BLACK }
                                        ]}>
                                            <Text style={styles.legendNumberText}>{legendaryTop[0].winning_number}</Text>
                                        </View>

                                        {legendaryTop[0].is_fire && (
                                            <View style={styles.legendFireBadge}>
                                                <Text style={styles.legendFireText}>🔥 {legendaryTop[0].multiplier}x</Text>
                                            </View>
                                        )}
                                    </View>

                                    <Text style={styles.legendScore}>+{formatCurrency(legendaryTop[0].max_win)}</Text>
                                    <Text style={styles.legendUser}>{legendaryTop[0].username}</Text>
                                </View>
                            )
                        )}
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView >

            <StoreModal visible={isStoreOpen} onHome={() => { }} />
            <SettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </View >
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
    settingsBtn: {
        width: 40,
        height: 40,
        borderRadius: METRICS.borderRadius,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        ...SHADOWS.NEON_GOLD
    },
    creditCard: {
        backgroundColor: 'rgba(10, 10, 15, 0.8)',
        borderRadius: METRICS.borderRadius,
        padding: 24,
        marginBottom: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.ACCENT_GOLD,
        ...SHADOWS.NEON_GOLD
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
        textShadowColor: COLORS.ACCENT_GOLD,
        textShadowRadius: 10
    },
    addBtn: {
        backgroundColor: COLORS.ACCENT_GOLD,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 15,
        borderWidth: 1,
        borderColor: '#FFF',
        ...SHADOWS.NEON_GOLD
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
        backgroundColor: 'rgba(20, 20, 30, 0.8)',
        borderRadius: METRICS.borderRadius,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: COLORS.ACCENT_BLUE,
        shadowOpacity: 0.1,
        shadowRadius: 10
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
        borderWidth: 1,
        borderColor: '#FFF',
        ...SHADOWS.NEON_GOLD
    },
    playText: {
        color: '#000',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    strategyButton: {
        backgroundColor: 'rgba(20, 20, 30, 0.8)',
        borderRadius: METRICS.borderRadius,
        paddingVertical: 15,
        alignItems: 'center',
        marginBottom: 25,
        borderWidth: 1,
        borderColor: COLORS.ACCENT_GOLD,
        ...SHADOWS.NEON_BLUE
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
        backgroundColor: 'rgba(20, 20, 30, 0.6)',
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
    legendDetailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    legendNumberBadge: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 2,
        borderColor: COLORS.ACCENT_GOLD
    },
    legendNumberText: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 16
    },
    legendFireBadge: {
        backgroundColor: 'rgba(255, 69, 0, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FF4500'
    },
    legendFireText: {
        color: '#FF4500', // Fire Orange
        fontWeight: 'bold',
        fontSize: 14
    },
    onlineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        opacity: 0.8
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00FF00',
        marginRight: 6,
        shadowColor: '#00FF00',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 5
    },
    onlineText: {
        color: COLORS.TEXT_SECONDARY,
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1
    },
    headerTextContainer: {
        flex: 1,
        marginRight: 10
    }
});
