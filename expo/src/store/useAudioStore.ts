import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AudioState {
    bgmVolume: number; // 0.0 to 1.0
    sfxVolume: number; // 0.0 to 1.0
    isMuted: boolean;
    setBgmVolume: (vol: number) => void;
    setSfxVolume: (vol: number) => void;
    toggleMutes: () => void;
}

export const useAudioStore = create<AudioState>()(
    persist(
        (set, get) => ({
            bgmVolume: 0.5,
            sfxVolume: 0.8,
            isMuted: false,

            setBgmVolume: (vol) => set({ bgmVolume: Math.max(0, Math.min(1, vol)) }),
            setSfxVolume: (vol) => set({ sfxVolume: Math.max(0, Math.min(1, vol)) }),
            toggleMutes: () => set((state) => ({ isMuted: !state.isMuted })),
        }),
        {
            name: 'audio-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
