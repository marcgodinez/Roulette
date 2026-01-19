import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { useGameStore } from '../store/useGameStore';
import { COLORS, METRICS, SHADOWS } from '../constants/theme';
import { PRESET_STRATEGIES, PresetStrategy } from '../constants/strategies_presets';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export const StrategySelector: React.FC<Props> = ({ visible, onClose }) => {
    const { savedStrategies, applyStrategy, credits, selectedChipValue, deleteStrategy } = useGameStore();
    const [activeTab, setActiveTab] = useState<'MY_STRATEGIES' | 'PRESETS'>('MY_STRATEGIES');

    const handleApplySaved = (strategy: any) => {
        // Strategy from DB already has 'amounts' in bets (absolute values)
        // Check cost
        if (credits < strategy.total_cost) {
            Alert.alert("Insufficient Funds", "You don't have enough credits for this strategy.");
            return;
        }
        const success = applyStrategy(strategy);
        if (success) onClose();
    };

    const handleApplyPreset = (preset: PresetStrategy) => {
        // Convert Units -> Amounts based on Selected Chip Value
        const totalCostCoordinates = preset.totalUnits * selectedChipValue;

        if (credits < totalCostCoordinates) {
            Alert.alert(
                "Insufficient Funds",
                `This strategy requires ${totalCostCoordinates} credits (${preset.totalUnits} units × ${selectedChipValue} chip value).`
            );
            return;
        }

        // Construct bets object with calculated amounts
        const newBets: Record<string, number> = {};
        Object.entries(preset.bets).forEach(([betId, units]) => {
            newBets[betId] = units * selectedChipValue;
        });

        // Create a temporary strategy object to pass to store
        // Assuming applyStrategy can handle a shape like { bets: ... } 
        // OR we might need to manually call replaceBets. 
        // Let's assume applyStrategy takes { bets: Record<string,number> }. 
        // If applyStrategy expects a full DB object, we might mock it.

        // Actually, looking at GameScreen, handling is: `applyStrategy(item)`.
        // Let's assume we can pass a constructed object.
        // Strategy payload conforming to SavedStrategy interface
        const strategyPayload = {
            id: 'PRESET_' + preset.id, // Dummy ID
            name: preset.name,
            bet_data: newBets,
            color_code: preset.color_code,
            total_cost: totalCostCoordinates
        };

        const success = applyStrategy(strategyPayload);
        if (success) onClose();
    };

    const renderHeader = () => (
        <View style={styles.tabsContainer}>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'MY_STRATEGIES' && styles.activeTab]}
                onPress={() => setActiveTab('MY_STRATEGIES')}
            >
                <Text style={[styles.tabText, activeTab === 'MY_STRATEGIES' && styles.activeTabText]}>My Strategies</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'PRESETS' && styles.activeTab]}
                onPress={() => setActiveTab('PRESETS')}
            >
                <Text style={[styles.tabText, activeTab === 'PRESETS' && styles.activeTabText]}>Famous Presets</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Quick Load Strategy</Text>

                    {renderHeader()}

                    {activeTab === 'MY_STRATEGIES' ? (
                        <FlatList
                            data={savedStrategies}
                            keyExtractor={item => item.id}
                            style={styles.list}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={<Text style={styles.emptyText}>No saved strategies yet.</Text>}
                            renderItem={({ item }) => (
                                <View style={styles.strategyRow}>
                                    <View style={[styles.colorBadge, { backgroundColor: item.color_code }]} />
                                    <View style={styles.strategyInfo}>
                                        <Text style={styles.strategyName}>{item.name}</Text>
                                        <Text style={styles.strategySub}>Cost: {item.total_cost}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.playBtn}
                                        onPress={() => handleApplySaved(item)}
                                    >
                                        <Text style={styles.playBtnText}>PLAY</Text>
                                    </TouchableOpacity>
                                    {/* Optional: Delete button? */}
                                </View>
                            )}
                        />
                    ) : (
                        <FlatList
                            data={PRESET_STRATEGIES}
                            keyExtractor={item => item.id}
                            style={styles.list}
                            contentContainerStyle={styles.listContent}
                            renderItem={({ item }) => {
                                const cost = item.totalUnits * selectedChipValue;
                                return (
                                    <View style={styles.strategyRow}>
                                        <View style={[styles.colorBadge, { backgroundColor: item.color_code }]} />
                                        <View style={styles.strategyInfo}>
                                            <Text style={styles.strategyName}>{item.name}</Text>
                                            <Text style={styles.strategySub}>{item.description}</Text>
                                            <Text style={styles.strategyCost}>Requires {cost} credits ({item.totalUnits}u)</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.playBtn}
                                            onPress={() => handleApplyPreset(item)}
                                        >
                                            <Text style={styles.playBtnText}>APPLY</Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            }}
                        />
                    )}

                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Text style={styles.closeBtnText}>CLOSE</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};



// ... (imports remain the same)

// ... (component logic remains the same until styles)

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)', // Darker overlay
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        width: '100%',
        maxWidth: 500,
        backgroundColor: 'rgba(15, 15, 20, 0.95)', // Deep dark background
        borderRadius: 24,
        padding: 24,
        borderWidth: 2,
        borderColor: COLORS.ACCENT_GOLD,
        maxHeight: '80%',
        ...SHADOWS.NEON_GOLD // Neon Glow
    },
    modalTitle: {
        color: COLORS.ACCENT_GOLD,
        fontSize: 22,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 20,
        letterSpacing: 1,
        textShadowColor: COLORS.ACCENT_GOLD,
        textShadowRadius: 10
    },
    tabsContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)'
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center'
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: COLORS.ACCENT_GOLD
    },
    tabText: {
        color: COLORS.TEXT_SECONDARY,
        fontWeight: 'bold',
        fontSize: 14
    },
    activeTabText: {
        color: COLORS.ACCENT_GOLD,
        textShadowColor: COLORS.ACCENT_GOLD,
        textShadowRadius: 5
    },
    list: {
        marginBottom: 10
    },
    listContent: {
        paddingBottom: 20
    },
    emptyText: {
        color: COLORS.TEXT_SECONDARY,
        textAlign: 'center',
        marginTop: 20,
        fontStyle: 'italic'
    },
    strategyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    colorBadge: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: 14,
        borderWidth: 1,
        borderColor: '#FFF'
    },
    strategyInfo: {
        flex: 1
    },
    strategyName: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 2
    },
    strategySub: {
        color: COLORS.TEXT_SECONDARY,
        fontSize: 12
    },
    strategyCost: {
        color: COLORS.ACCENT_GOLD,
        fontSize: 12,
        marginTop: 4,
        fontWeight: 'bold'
    },
    playBtn: {
        backgroundColor: 'rgba(0, 200, 0, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        marginLeft: 10,
        borderWidth: 1,
        borderColor: COLORS.SUCCESS,
        ...SHADOWS.NEON_GREEN
    },
    playBtnText: {
        color: COLORS.SUCCESS,
        fontWeight: 'bold',
        fontSize: 12
    },
    closeBtn: {
        backgroundColor: 'transparent',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
        marginTop: 10
    },
    closeBtnText: {
        color: COLORS.TEXT_SECONDARY,
        fontWeight: 'bold'
    }
});
