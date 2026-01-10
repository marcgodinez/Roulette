import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useGameStore } from '../store/useGameStore';
import { monetizationManager } from '../services/MonetizationManager';
import { Config } from '../config/Config';

interface Package {
    identifier: string;
    product: {
        priceString: string;
        title: string;
        description: string;
    };
    credits?: number; // Helper from config
}

export const StoreModal = ({ visible }: { visible: boolean }) => {
    const { setStoreOpen, addCredits } = useGameStore();
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
                // Find credit amount from Config or default
                const amount = Config.MOCK_PACKAGES.find(p => p.identifier === pkg.identifier)?.credits || 1000;
                addCredits(amount);
                Alert.alert("Success", `You purchased ${amount.toLocaleString()} coins!`);
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

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={() => setStoreOpen(false)}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>TREASURY</Text>
                        <TouchableOpacity onPress={() => setStoreOpen(false)} style={styles.closeBtn}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.content}>

                        {/* AD SECTION */}
                        <View style={styles.adSection}>
                            <Text style={styles.sectionTitle}>FREE COINS</Text>
                            <TouchableOpacity style={styles.adButton} onPress={handleWatchAd}>
                                <Text style={styles.adBtnText}>📺 WATCH AD (+1,000)</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.divider} />

                        {/* PACKAGES SECTION */}
                        <Text style={styles.sectionTitle}>COIN STORE</Text>
                        {loading ? (
                            <ActivityIndicator size="large" color="#FFD700" />
                        ) : (
                            packages.map((pkg) => (
                                <TouchableOpacity
                                    key={pkg.identifier}
                                    style={styles.packageCard}
                                    onPress={() => handlePurchase(pkg)}
                                >
                                    <View style={styles.pkgInfo}>
                                        <Text style={styles.pkgTitle}>{pkg.product.title}</Text>
                                        <Text style={styles.pkgDesc}>{pkg.product.description}</Text>
                                    </View>
                                    <View style={styles.priceBtn}>
                                        <Text style={styles.priceText}>{pkg.product.priceString}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}

                    </ScrollView>

                </View>
            </View>
        </Modal>
    );
};

import { COLORS, METRICS } from '../constants/theme';

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    modalView: {
        width: '90%',
        height: '70%',
        backgroundColor: COLORS.BG_MAIN,
        borderRadius: METRICS.borderRadius,
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
        overflow: 'hidden',
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
        backgroundColor: COLORS.BG_SURFACE,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.BORDER_SUBTLE,
    },
    title: {
        color: COLORS.ACCENT_GOLD,
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    closeBtn: {
        position: 'absolute',
        right: 15,
    },
    closeText: {
        color: COLORS.TEXT_MUTED,
        fontSize: 24,
        fontWeight: 'bold',
    },
    content: {
        padding: METRICS.padding,
        alignItems: 'center',
    },
    sectionTitle: {
        color: COLORS.TEXT_SECONDARY,
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 15,
        letterSpacing: 1,
    },

    // AD
    adSection: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    adButton: {
        backgroundColor: COLORS.BG_SURFACE,
        width: '100%',
        paddingVertical: 15,
        borderRadius: METRICS.borderRadius,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.SUCCESS,
        shadowColor: COLORS.SUCCESS,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    adBtnText: {
        color: COLORS.SUCCESS,
        fontSize: 18,
        fontWeight: 'bold',
    },

    divider: {
        width: '100%',
        height: 1,
        backgroundColor: COLORS.BORDER_SUBTLE,
        marginBottom: 20,
    },

    // PACKAGES
    packageCard: {
        width: '100%',
        flexDirection: 'row',
        backgroundColor: COLORS.BG_SURFACE,
        borderRadius: METRICS.borderRadius,
        padding: 15,
        marginBottom: 15,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
    },
    pkgInfo: {
        flex: 1,
    },
    pkgTitle: {
        color: COLORS.TEXT_PRIMARY,
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    pkgDesc: {
        color: COLORS.TEXT_MUTED,
        fontSize: 12,
    },
    priceBtn: {
        backgroundColor: COLORS.ACCENT_GOLD,
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
    },
    priceText: {
        color: COLORS.BG_MAIN,
        fontWeight: 'bold',
        fontSize: 14,
    },
});
