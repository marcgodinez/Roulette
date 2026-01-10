import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, Modal, Alert, ScrollView } from 'react-native';
import { BettingBoard } from '../components/BettingBoard';
import { useGameStore } from '../store/useGameStore';
import { COLORS, METRICS } from '../constants/theme';
import { CHIPS } from '../constants/chips';

export const StrategyEditor = ({ onClose }: { onClose: () => void }) => {
    const { saveStrategy } = useGameStore();

    // Local State for "Sandbox" Mode
    const [localBets, setLocalBets] = useState<Record<string, number>>({});
    const [localChipValue, setLocalChipValue] = useState(10);
    const [activeColor, setActiveColor] = useState('#FFD700'); // Default Gold

    // Modal State
    const [isSaveModalOpen, setSaveModalOpen] = useState(false);
    const [strategyName, setStrategyName] = useState('');

    const handlePlaceBet = (id: string, amount: number) => {
        setLocalBets(prev => {
            const current = prev[id] || 0;
            return { ...prev, [id]: current + amount };
        });
        return true; // Always success in sandbox
    };

    const handleClear = () => {
        setLocalBets({});
    };

    const handleSave = async () => {
        if (!strategyName.trim()) {
            Alert.alert("Error", "Please enter a name for your strategy.");
            return;
        }
        if (Object.keys(localBets).length === 0) {
            Alert.alert("Error", "Place at least one bet.");
            return;
        }

        await saveStrategy(strategyName, localBets, activeColor);
        Alert.alert("Success", "Strategy saved!");
        setSaveModalOpen(false);
        onClose(); // Exit editor
    };

    const totalCost = Object.values(localBets).reduce((a, b) => a + b, 0);

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <Text style={styles.title}>Strategy Lab</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <Text style={styles.closeText}>EXIT</Text>
                </TouchableOpacity>
            </View>

            {/* BOARD (Controlled Mode) */}
            <View style={styles.boardContainer}>
                <BettingBoard
                    externalBets={localBets}
                    onExternalBet={handlePlaceBet}
                    externalChipValue={localChipValue}
                />
            </View>

            {/* CONTROLS */}
            <View style={styles.controls}>

                {/* Chip Selector */}
                <View style={styles.chipRow}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {CHIPS.map(chip => (
                            <TouchableOpacity
                                key={chip.value}
                                style={[styles.chipOpt, localChipValue === chip.value && styles.activeChip]}
                                onPress={() => setLocalChipValue(chip.value)}
                            >
                                <View style={[styles.chipInner, { backgroundColor: chip.color }]}>
                                    <Text style={styles.chipText}>{chip.label}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Actions */}
                <View style={styles.actionRow}>
                    <View style={styles.infoBox}>
                        <Text style={styles.infoLabel}>TOTAL COST</Text>
                        <Text style={styles.infoValue}>{totalCost}</Text>
                    </View>

                    <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                        <Text style={styles.btnText}>Clear</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.saveBtn} onPress={() => setSaveModalOpen(true)}>
                        <Text style={styles.saveText}>SAVE STRATEGY</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* SAVE MODAL */}
            <Modal visible={isSaveModalOpen} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Save Strategy</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Strategy Name (e.g. My Lucky 8)"
                            placeholderTextColor={COLORS.TEXT_SECONDARY}
                            value={strategyName}
                            onChangeText={setStrategyName}
                        />

                        {/* Color Picker */}
                        <View style={styles.colorPicker}>
                            {['#FFD700', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'].map(color => (
                                <TouchableOpacity
                                    key={color}
                                    style={[styles.colorOption, { backgroundColor: color }, activeColor === color && styles.activeColor]}
                                    onPress={() => setActiveColor(color)}
                                />
                            ))}
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setSaveModalOpen(false)} style={styles.cancelBtn}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSave} style={styles.confirmBtn}>
                                <Text style={styles.confirmText}>SAVE</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BG_MAIN,
        paddingTop: 40, // Safe area
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 60,
        borderBottomWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
    },
    title: {
        color: COLORS.ACCENT_GOLD,
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    closeBtn: {
        padding: 8,
        backgroundColor: COLORS.BG_SURFACE,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
    },
    closeText: {
        color: COLORS.TEXT_SECONDARY,
        fontSize: 12,
        fontWeight: 'bold',
    },
    boardContainer: {
        flex: 1,
    },
    controls: {
        height: 140,
        backgroundColor: COLORS.BG_SURFACE,
        borderTopWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
        padding: 15,
    },
    chipRow: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    chipOpt: {
        marginRight: 10,
        padding: 2,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    activeChip: {
        borderColor: COLORS.ACCENT_GOLD,
    },
    chipInner: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        borderStyle: 'dashed',
    },
    chipText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    infoBox: {
        alignItems: 'flex-start',
    },
    infoLabel: {
        color: COLORS.TEXT_SECONDARY,
        fontSize: 10,
        fontWeight: 'bold',
    },
    infoValue: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    clearBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.DANGER,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    btnText: {
        color: COLORS.DANGER,
        fontWeight: 'bold',
    },
    saveBtn: {
        paddingVertical: 10,
        paddingHorizontal: 30,
        backgroundColor: COLORS.ACCENT_GOLD,
        borderRadius: 8,
    },
    saveText: {
        color: COLORS.BG_MAIN,
        fontWeight: 'bold',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        backgroundColor: COLORS.BG_SURFACE,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
    },
    modalTitle: {
        color: COLORS.ACCENT_GOLD,
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        backgroundColor: COLORS.BG_MAIN,
        color: '#FFF',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
        marginBottom: 20,
        fontSize: 16,
    },
    colorPicker: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    activeColor: {
        borderColor: '#FFF',
        borderWidth: 3,
        transform: [{ scale: 1.1 }],
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
    },
    cancelBtn: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
        alignItems: 'center',
    },
    cancelText: {
        color: COLORS.TEXT_SECONDARY,
        fontWeight: 'bold',
    },
    confirmBtn: {
        flex: 1,
        padding: 15,
        backgroundColor: COLORS.ACCENT_GOLD,
        borderRadius: 8,
        alignItems: 'center',
    },
    confirmText: {
        color: COLORS.BG_MAIN,
        fontWeight: 'bold',
    },
});
