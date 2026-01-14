import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Switch, Alert } from 'react-native';
import { CustomSlider } from './CustomSlider';
import { useAudioStore } from '../store/useAudioStore';
import { AudioManager } from '../services/AudioManager';
import { HapticManager } from '../services/HapticManager';
import { useAuth } from '../hooks/useAuth';
import { COLORS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    visible: boolean;
    onClose: () => void;
}

// ... imports remain the same

export const SettingsModal = ({ visible, onClose }: Props) => {
    const { bgmVolume, sfxVolume, isMuted, setBgmVolume, setSfxVolume, toggleMutes } = useAudioStore();
    const { signOut } = useAuth();
    const [hapticsEnabled, setHapticsEnabled] = useState(HapticManager.isEnabled);

    // NAVIGATION STATE
    const [currentView, setCurrentView] = useState<'MAIN' | 'ACCOUNT'>('MAIN');

    // Reset view when opening/closing
    React.useEffect(() => {
        if (visible) setCurrentView('MAIN');
    }, [visible]);

    const handleBgmChange = (val: number) => {
        setBgmVolume(val);
        AudioManager.updateVolumes();
    };

    const handleSfxChange = (val: number) => {
        setSfxVolume(val);
    };

    const toggleHaptics = () => {
        HapticManager.isEnabled = !HapticManager.isEnabled;
        setHapticsEnabled(HapticManager.isEnabled);
        if (HapticManager.isEnabled) HapticManager.trigger('selection');
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "Are you sure? This will permanently delete your stats and credits. This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "DELETE",
                    style: "destructive",
                    onPress: async () => {
                        onClose();
                        signOut();
                        Alert.alert("Account Deleted", "Your account data has been cleared.");
                    }
                }
            ]
        );
    };

    const renderMainView = () => (
        <>
            <Text style={styles.title}>SETTINGS</Text>

            {/* MUTE TOGGLE */}
            <View style={styles.row}>
                <Text style={styles.label}>MUTE AUDIO</Text>
                <Switch
                    value={isMuted}
                    onValueChange={() => {
                        toggleMutes();
                        setTimeout(() => AudioManager.updateVolumes(), 100);
                    }}
                    trackColor={{ false: '#767577', true: COLORS.ACCENT_GOLD }}
                    thumbColor={isMuted ? '#f4f3f4' : '#f4f3f4'}
                />
            </View>

            {/* HAPTICS TOGGLE */}
            <View style={styles.row}>
                <Text style={styles.label}>VIBRATION</Text>
                <Switch
                    value={hapticsEnabled}
                    onValueChange={toggleHaptics}
                    trackColor={{ false: '#767577', true: COLORS.ACCENT_GOLD }}
                    thumbColor={'#f4f3f4'}
                />
            </View>

            {/* BGM SLIDER */}
            <View style={styles.sliderContainer}>
                <View style={styles.row}>
                    <Ionicons name="musical-notes" size={20} color={COLORS.TEXT_SECONDARY} />
                    <Text style={styles.label}> MUSIC ({Math.round(bgmVolume * 100)}%)</Text>
                </View>
                <CustomSlider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={1}
                    value={bgmVolume}
                    onValueChange={handleBgmChange}
                    minimumTrackTintColor={COLORS.ACCENT_GOLD}
                    maximumTrackTintColor="#FFFFFF"
                    thumbTintColor={COLORS.ACCENT_GOLD}
                    disabled={isMuted}
                />
            </View>

            {/* SFX SLIDER */}
            <View style={styles.sliderContainer}>
                <View style={styles.row}>
                    <Ionicons name="game-controller" size={20} color={COLORS.TEXT_SECONDARY} />
                    <Text style={styles.label}> SFX ({Math.round(sfxVolume * 100)}%)</Text>
                </View>
                <CustomSlider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={1}
                    value={sfxVolume}
                    onValueChange={handleSfxChange}
                    minimumTrackTintColor={COLORS.ACCENT_GOLD}
                    maximumTrackTintColor="#FFFFFF"
                    thumbTintColor={COLORS.ACCENT_GOLD}
                    disabled={isMuted}
                />
            </View>

            {/* NAVIGATE TO ACCOUNT SETTINGS */}
            <TouchableOpacity
                style={styles.accountNavBtn}
                onPress={() => setCurrentView('ACCOUNT')}
            >
                <Text style={styles.accountNavText}>ACCOUNT SETTINGS &gt;</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeText}>CLOSE</Text>
            </TouchableOpacity>
        </>
    );

    const renderAccountView = () => (
        <>
            <Text style={styles.title}>ACCOUNT</Text>

            <Text style={styles.warningText}>
                Manage your session and data.
            </Text>

            {/* LOGOUT BUTTON */}
            <TouchableOpacity style={styles.logoutBtn} onPress={() => { onClose(); signOut(); }}>
                <Text style={styles.logoutText}>LOG OUT</Text>
            </TouchableOpacity>

            {/* DELETE ACCOUNT */}
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
                <Text style={styles.deleteText}>DELETE ACCOUNT</Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }} />

            {/* BACK BUTTON */}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setCurrentView('MAIN')}>
                <Text style={styles.closeText}>&lt; BACK</Text>
            </TouchableOpacity>
        </>
    );

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {currentView === 'MAIN' ? renderMainView() : renderAccountView()}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: 300,
        backgroundColor: COLORS.BG_SURFACE,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.ACCENT_GOLD,
        textAlign: 'center',
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: {
        color: COLORS.TEXT_PRIMARY,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    sliderContainer: {
        marginBottom: 20,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    closeBtn: {
        backgroundColor: COLORS.BG_MAIN,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.BORDER_SUBTLE,
        marginTop: 10,
    },
    closeText: {
        color: COLORS.TEXT_SECONDARY,
        fontWeight: 'bold',
    },
    logoutBtn: {
        backgroundColor: '#8B0000', // Deep red
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 5,
        borderWidth: 1,
        borderColor: '#FF4444'
    },
    logoutText: {
        color: '#FFDDDD',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    deleteBtn: {
        marginTop: 10,
        padding: 10,
        alignItems: 'center',
    },
    deleteText: {
        color: COLORS.TEXT_SECONDARY,
        fontSize: 12,
        textDecorationLine: 'underline',
    },
    accountNavBtn: {
        backgroundColor: COLORS.BG_MAIN,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 10,
        borderWidth: 1,
        borderColor: COLORS.ACCENT_GOLD,
    },
    accountNavText: {
        color: COLORS.ACCENT_GOLD,
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 0.5,
    },
    warningText: {
        color: COLORS.TEXT_SECONDARY,
        textAlign: 'center',
        marginBottom: 20,
        fontSize: 14,
        fontStyle: 'italic',
    }
});
