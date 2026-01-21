import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';
import { useCustomizationStore } from '../store/useCustomizationStore';
import { ALL_ASSETS, CHIP_SETS, TABLE_SKINS, WHEEL_VARIANTS, GameAsset } from '../customization/AssetRegistry';
import { formatCurrency } from '../utils/format';
import { useGameStore } from '../store/useGameStore';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export const CustomizationModal: React.FC<Props> = ({ visible, onClose }) => {
    const [activeTab, setActiveTab] = useState<'TABLE' | 'CHIPS' | 'WHEEL'>('TABLE');
    const { equippedTableId, equippedChipId, equippedWheelId, ownedAssetIds, equipAsset, purchaseAsset, isOwned } = useCustomizationStore();
    const { credits, addCredits } = useGameStore(); // We would deduct credits here in a real implementation

    const getAssetsForTab = () => {
        switch (activeTab) {
            case 'TABLE': return Object.values(TABLE_SKINS);
            case 'CHIPS': return Object.values(CHIP_SETS);
            case 'WHEEL': return Object.values(WHEEL_VARIANTS);
            default: return [];
        }
    };

    const isEquipped = (asset: GameAsset) => {
        switch (asset.type) {
            case 'TABLE_SKIN': return equippedTableId === asset.id;
            case 'CHIP_SET': return equippedChipId === asset.id;
            case 'WHEEL_VARIANT': return equippedWheelId === asset.id;
            default: return false;
        }
    };

    const handleAction = (asset: GameAsset) => {
        if (isOwned(asset.id)) {
            equipAsset(asset.id, asset.type);
        } else {
            // Purchase Logic
            if (credits >= asset.price) {
                // Deduct credits (Client-side mock for now)
                useGameStore.getState().addCredits(-asset.price);
                purchaseAsset(asset.id, asset.price);
                equipAsset(asset.id, asset.type); // Auto-equip on buy
            } else {
                // Show Error?
            }
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>CUSTOMIZE</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabsRow}>
                        {['TABLE', 'CHIPS', 'WHEEL'].map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, activeTab === tab && styles.activeTab]}
                                onPress={() => setActiveTab(tab as any)}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Content */}
                    <ScrollView contentContainerStyle={styles.listContent}>
                        {getAssetsForTab().map((asset) => {
                            const owned = isOwned(asset.id);
                            const equipped = isEquipped(asset);

                            return (
                                <View key={asset.id} style={[styles.assetCard, equipped && styles.equippedCard]}>
                                    <View style={[styles.previewBox, { backgroundColor: asset.previewColor || '#333' }]}>
                                        {/* Ideally render a mini preview image here */}
                                        <Text style={{ fontSize: 30 }}>{asset.type === 'CHIP_SET' ? '🪙' : asset.type === 'TABLE_SKIN' ? '🟩' : '🎡'}</Text>
                                    </View>

                                    <View style={styles.infoCol}>
                                        <Text style={styles.assetName}>{asset.name}</Text>
                                        <Text style={styles.assetPrice}>
                                            {owned ? 'OWNED' : formatCurrency(asset.price)}
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.actionBtn, owned ? styles.equipBtn : styles.buyBtn, equipped && styles.equippedBtn]}
                                        onPress={() => handleAction(asset)}
                                        disabled={equipped || (!owned && credits < asset.price)}
                                    >
                                        <Text style={styles.actionBtnText}>
                                            {equipped ? 'EQUIPPED' : owned ? 'EQUIP' : 'BUY'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    container: { width: '90%', maxHeight: '80%', backgroundColor: COLORS.BG_MAIN, borderRadius: 20, borderWidth: 1, borderColor: COLORS.BORDER_ACCENT, overflow: 'hidden' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#333', backgroundColor: '#000' },
    title: { color: COLORS.ACCENT_GOLD, fontSize: 22, fontWeight: 'bold', letterSpacing: 1 },
    closeBtn: { padding: 5 },

    tabsRow: { flexDirection: 'row', backgroundColor: '#111' },
    tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 2, borderColor: 'transparent' },
    activeTab: { borderColor: COLORS.ACCENT_GOLD, backgroundColor: 'rgba(255, 215, 0, 0.05)' },
    tabText: { color: '#666', fontWeight: 'bold' },
    activeTabText: { color: COLORS.ACCENT_GOLD },

    listContent: { padding: 15, gap: 15 },
    assetCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    equippedCard: { borderColor: COLORS.SUCCESS, backgroundColor: 'rgba(0, 255, 0, 0.05)' },

    previewBox: { width: 60, height: 60, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    infoCol: { flex: 1 },
    assetName: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    assetPrice: { color: COLORS.ACCENT_GOLD, fontSize: 14 },

    actionBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, minWidth: 80, alignItems: 'center' },
    buyBtn: { backgroundColor: COLORS.ACCENT_GOLD },
    equipBtn: { backgroundColor: '#333', borderWidth: 1, borderColor: '#666' },
    equippedBtn: { backgroundColor: 'transparent', borderColor: 'transparent' },
    actionBtnText: { color: '#000', fontWeight: 'bold', fontSize: 12 },
});
