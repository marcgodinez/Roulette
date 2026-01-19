import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useGameStore } from '../store/useGameStore';
import { monetizationManager } from '../services/MonetizationManager';
import { Config } from '../config/Config';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';

interface Package {
    identifier: string;
    product: {
        priceString: string;
        title: string;
        description: string;
    };
    credits?: number;
    isNoAds?: boolean;
}

interface Props {
    visible: boolean;
    onHome: () => void;
}

export const StoreModal: React.FC<Props> = ({ visible, onHome }) => {
    const { setStoreOpen, addCredits } = useGameStore();
    const { signOut } = useAuth();
    const [loading, setLoading] = useState(false);
    const [packages, setPackages] = useState<Package[]>([]);

    useEffect(() => {
        if (visible) {
            loadPackages();
        }
    }, [visible]);

    const loadPackages = async () => {
        setLoading(true);
        try {
            const pkgs = await monetizationManager.getPackages();
            setPackages(pkgs);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (pkg: Package) => {
        setLoading(true);
        try {
            const success = await monetizationManager.purchasePackage(pkg.identifier);
            if (success) {
                const amount = Config.MOCK_PACKAGES.find(p => p.identifier === pkg.identifier)?.credits || 1000;
                addCredits(amount);
                Alert.alert("Success", `You purchased ${formatCurrency(amount)} coins!`);
            }
        } catch (e) {
            Alert.alert("Error", "Purchase failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleWatchAd = async () => {
        const reward = await monetizationManager.showRewardedAd();
        if (reward) {
            addCredits(reward);
            Alert.alert("Reward", `You earned ${reward} coins!`);
        }
    };

    const handleLogout = async () => {
        try {
            setStoreOpen(false);
            onHome();
            await signOut();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "Are you sure you want to delete your account? This action cannot be undone.",
            [{ text: "Cancel", style: 'cancel' }, { text: "Delete", style: 'destructive', onPress: () => Alert.alert("Account Deletion", "Please contact support.") }]
        );
    };

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={() => setStoreOpen(false)}>
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>GAME MENU</Text>
                        <TouchableOpacity onPress={() => setStoreOpen(false)} style={styles.closeBtn}>
                            <Ionicons name="close" size={28} color={COLORS.TEXT_MUTED} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.content}>
                        {/* 1. NAVIGATION */}
                        <TouchableOpacity style={[styles.navButton, SHADOWS.NEON_GOLD]} onPress={() => { setStoreOpen(false); onHome(); }}>
                            <Ionicons name="home" size={20} color="#000" style={{ marginRight: 10 }} />
                            <Text style={styles.navButtonText}>GO HOME</Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        {/* 2. ECONOMY */}
                        <Text style={styles.sectionTitle}>FREE COINS</Text>
                        <TouchableOpacity style={[styles.adButton, SHADOWS.NEON_GREEN]} onPress={handleWatchAd}>
                            <Ionicons name="videocam" size={20} color={COLORS.SUCCESS} style={{ marginRight: 10 }} />
                            <Text style={styles.adBtnText}>WATCH AD (+1,000)</Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />
                        <Text style={styles.sectionTitle}>BUY COINS</Text>
                        {loading ? (
                            <ActivityIndicator size="large" color="#FFD700" />
                        ) : (
                            <View style={styles.packagesContainer}>
                                {packages.map((pkg) => (
                                    <TouchableOpacity
                                        key={pkg.identifier}
                                        style={[
                                            styles.packageCard,
                                            pkg.isNoAds && styles.premiumPackageCard
                                        ]}
                                        onPress={() => handlePurchase(pkg)}
                                    >
                                        <View>
                                            <Text style={[styles.pkgTitle, pkg.isNoAds && { color: COLORS.ACCENT_GOLD }]}>{pkg.product.title}</Text>
                                            <Text style={styles.pkgDesc}>{pkg.product.description}</Text>
                                            {pkg.isNoAds && <Text style={styles.premiumBadge}>✨ NO ADS INCLUDED</Text>}
                                        </View>
                                        <View style={[styles.priceBtn, pkg.isNoAds && styles.premiumPriceBtn]}>
                                            <Text style={[styles.priceText, pkg.isNoAds && { color: '#000' }]}>{pkg.product.priceString}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        <View style={styles.divider} />
                        <Text style={styles.sectionTitle}>PROFILE</Text>
                        <TouchableOpacity style={styles.outlineButton} onPress={handleLogout}>
                            <Ionicons name="log-out-outline" size={20} color={COLORS.TEXT_PRIMARY} style={{ marginRight: 8 }} />
                            <Text style={styles.outlineBtnText}>LOG OUT</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.outlineButton, { borderColor: COLORS.DANGER, marginTop: 10 }]} onPress={handleDeleteAccount}>
                            <Ionicons name="trash-outline" size={20} color={COLORS.DANGER} style={{ marginRight: 8 }} />
                            <Text style={[styles.outlineBtnText, { color: COLORS.DANGER }]}>DELETE ACCOUNT</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    <View style={styles.footer}><Text style={styles.versionText}>v1.0.0</Text></View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.9)' },
    modalView: { width: '90%', height: '85%', backgroundColor: '#050505', borderRadius: 20, borderWidth: 2, borderColor: COLORS.ACCENT_GOLD, overflow: 'hidden' }, // Darker BG + Gold Border
    header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderBottomWidth: 1, borderBottomColor: COLORS.BORDER_SUBTLE },
    title: { color: COLORS.ACCENT_GOLD, fontSize: 20, fontWeight: 'bold', letterSpacing: 2, textShadowColor: COLORS.ACCENT_GOLD, textShadowRadius: 10 },
    closeBtn: { position: 'absolute', right: 20 },
    content: { padding: 20 },
    sectionTitle: { color: COLORS.TEXT_SECONDARY, fontSize: 12, fontWeight: 'bold', marginBottom: 10, letterSpacing: 2, marginTop: 10 },
    divider: { width: '100%', height: 1, backgroundColor: COLORS.BORDER_SUBTLE, marginVertical: 20 },

    navButton: { backgroundColor: COLORS.ACCENT_GOLD, width: '100%', paddingVertical: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    navButtonText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

    adButton: { backgroundColor: 'rgba(34, 197, 94, 0.1)', width: '100%', paddingVertical: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.SUCCESS },
    adBtnText: { color: COLORS.SUCCESS, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },

    packagesContainer: { width: '100%', gap: 10 },
    packageCard: { width: '100%', flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 15, alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: COLORS.BORDER_ACCENT },
    pkgTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    pkgDesc: { color: '#AAA', fontSize: 12, marginTop: 2 },
    priceBtn: { backgroundColor: 'rgba(252, 211, 77, 0.2)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15, borderWidth: 1, borderColor: COLORS.ACCENT_GOLD },
    priceText: { color: COLORS.ACCENT_GOLD, fontWeight: 'bold', fontSize: 14 },

    premiumPackageCard: {
        borderColor: COLORS.ACCENT_GOLD,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderWidth: 2,
        ...SHADOWS.NEON_GOLD
    },
    premiumPriceBtn: {
        backgroundColor: COLORS.ACCENT_GOLD,
        borderColor: '#FFF'
    },
    premiumBadge: {
        color: COLORS.SUCCESS,
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 4,
        letterSpacing: 1
    },

    outlineButton: { width: '100%', paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.BORDER_SUBTLE, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
    outlineBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
    footer: { padding: 15, alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.BORDER_SUBTLE },
    versionText: { color: '#555', fontSize: 10 }
});
