import { Audio } from 'expo-av';

class AudioManagerService {
    private bgmSound: Audio.Sound | null = null;
    private sfx: Record<string, Audio.Sound> = {};

    async initialize() {
        await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
        });

        // Preload sounds
        try {
            await this.loadBgm();
            await this.loadSfx();
        } catch (error) {
            console.error("Audio Load Error", error);
        }
    }

    private async loadBgm() {
        const { sound } = await Audio.Sound.createAsync(
            require('../../assets/audio/bgm_casino.mp3'),
            { isLooping: true, volume: 0.5 }
        );
        this.bgmSound = sound;
    }

    private async loadSfx() {
        const sounds = {
            chip: require('../../assets/audio/sfx_chip.mp3'),
            win: require('../../assets/audio/sfx_win.mp3'),
            spin: require('../../assets/audio/bgm_spin.mp3'), // Short spin loop
        };

        for (const [key, source] of Object.entries(sounds)) {
            const { sound } = await Audio.Sound.createAsync(source);
            this.sfx[key] = sound;
        }
    }

    async playBgm() {
        if (this.bgmSound) {
            await this.bgmSound.playAsync();
        }
    }

    async stopBgm() {
        if (this.bgmSound) {
            await this.bgmSound.stopAsync();
        }
    }

    async playSfx(name: string) {
        const sound = this.sfx[name];
        if (sound) {
            await sound.replayAsync();
        }
    }
}

export const AudioManager = new AudioManagerService();
