import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Switch } from 'react-native';
import { CustomSlider } from './CustomSlider';
import { useAudioStore } from '../store/useAudioStore';
import { AudioManager } from '../services/AudioManager';
import { useAuth } from '../hooks/useAuth';
import { COLORS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export const SettingsModal = ({ visible, onClose }: Props) => {
    const { bgmVolume, sfxVolume, isMuted, setBgmVolume, setSfxVolume, toggleMutes } = useAudioStore();
    const { signOut } = useAuth();

    const handleBgmChange = (val: number) => {
        setBgmVolume(val);
        AudioManager.updateVolumes();
    };

    const handleSfxChange = (val: number) => {
        setSfxVolume(val);
        // AudioManager doesn't persist SFX volume immediately, but it reads store on play
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.container}>
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

                    {/* LOGOUT BUTTON */}
                    <TouchableOpacity style={styles.logoutBtn} onPress={() => { onClose(); signOut(); }}>
                        <Text style={styles.logoutText}>LOG OUT</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Text style={styles.closeText}>CLOSE</Text>
                    </TouchableOpacity>
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
});
