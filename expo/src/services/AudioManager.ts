import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { useAudioStore } from '../store/useAudioStore';

class AudioManagerService {
    private bgmSound: Audio.Sound | null = null;
    private currentBgmType: 'CASINO' | 'SPIN' | 'FIRE' | null = null;
    private sfxCache: Record<string, Audio.Sound> = {};

    // Mapping of asset names to require() calls
    // NOTE: In React Native, require() must be static strings depending on bundler.
    // We will assume these files EXIST in assets/audio/
    private assets = {
        bgm_casino: require('../../assets/audio/bgm_casino.mp3'),
        bgm_spin: require('../../assets/audio/bgm_spin.mp3'),
        bgm_fire: require('../../assets/audio/bgm_fire.mp3'),
        sfx_win: require('../../assets/audio/sfx_win.mp3'),
        sfx_chip: require('../../assets/audio/sfx_chip.mp3'),
    };

    async initialize() {
        try {
            console.log('[AudioManager] Configuring Audio Mode...');
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                staysActiveInBackground: false,
                interruptionModeIOS: InterruptionModeIOS.DuckOthers,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
                playThroughEarpieceAndroid: false,
            });
            console.log('[AudioManager] Audio Mode Configured');
        } catch (error) {
            console.warn('AudioManager: Init failed', error);
        }
    }

    async playBGM(type: 'CASINO' | 'SPIN' | 'FIRE') {
        if (this.currentBgmType === type) return;

        const { isMuted, bgmVolume } = useAudioStore.getState();
        console.log(`[AudioManager] playBGM request: ${type}, muted=${isMuted}, vol=${bgmVolume}`);

        if (isMuted) {
            console.log('[AudioManager] Muted, aborting play.');
            return;
        }

        try {
            // Unload previous
            if (this.bgmSound) {
                console.log('[AudioManager] Unloading previous sound...');
                await this.bgmSound.unloadAsync();
                this.bgmSound = null;
            }

            // Load new
            const source = type === 'CASINO' ? this.assets.bgm_casino
                : type === 'SPIN' ? this.assets.bgm_spin
                    : this.assets.bgm_fire;

            console.log(`[AudioManager] Loading asset for ${type}...`);
            const { sound } = await Audio.Sound.createAsync(
                source,
                {
                    shouldPlay: true,
                    isLooping: true,
                    volume: bgmVolume,
                }
            );
            console.log('[AudioManager] Sound playing!');

            this.bgmSound = sound;
            this.currentBgmType = type;

        } catch (error) {
            // Suppress error if file missing
            console.warn(`AudioManager: Failed to play BGM ${type}`, error);
        }
    }

    async stopBGM() {
        if (this.bgmSound) {
            try {
                await this.bgmSound.stopAsync();
            } catch (ignore) { }
        }
    }

    async playSFX(name: 'sfx_win' | 'sfx_chip') {
        const { isMuted, sfxVolume } = useAudioStore.getState();
        if (isMuted) return;

        try {
            const { sound } = await Audio.Sound.createAsync(
                this.assets[name],
                { shouldPlay: true, volume: sfxVolume }
            );
            // Fire and forget, let it garbage collect naturally or unload after finish
            sound.setOnPlaybackStatusUpdate(async (status) => {
                if (status.isLoaded && status.didJustFinish) {
                    await sound.unloadAsync();
                }
            });
        } catch (error) {
            console.warn(`AudioManager: Failed to play SFX ${name}`, error);
        }
    }

    async updateVolumes() {
        const { bgmVolume, isMuted } = useAudioStore.getState();
        if (this.bgmSound) {
            try {
                await this.bgmSound.setVolumeAsync(isMuted ? 0 : bgmVolume);
            } catch (error) { }
        }
    }
    // --- ALIASES FOR COMPATIBILITY ---
    async playBackgroundMusic() {
        return this.playBGM('CASINO');
    }

    async stopBackgroundMusic() {
        return this.stopBGM();
    }
}

export const AudioManager = new AudioManagerService();
