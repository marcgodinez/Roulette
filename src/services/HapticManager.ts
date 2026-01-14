import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { AudioManager } from './AudioManager';

class HapticManagerService {
    isEnabled: boolean = true;

    trigger = (type: 'impactLight' | 'impactMedium' | 'impactHeavy' | 'notificationSuccess' | 'notificationError' | 'selection') => {
        if (!this.isEnabled || Platform.OS === 'web') return;

        try {
            switch (type) {
                case 'impactLight':
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    break;
                case 'impactMedium':
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    break;
                case 'impactHeavy':
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    break;
                case 'notificationSuccess':
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    break;
                case 'notificationError':
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    break;
                case 'selection':
                    Haptics.selectionAsync();
                    break;
            }
        } catch (error) {
            console.warn('Haptic Error', error);
        }
    }

    // Semantic helpers for the game
    private lastChipTime = 0;
    playChipSound = () => {
        const now = Date.now();
        if (now - this.lastChipTime > 80) { // Throttle: Max 1 sound every 80ms
            this.trigger('selection');
            AudioManager.playSFX('sfx_chip');
            this.lastChipTime = now;
        }
    };
    playSpinTick = () => this.trigger('impactLight');
    playBallLand = () => this.trigger('impactHeavy');
    playWin = () => this.trigger('notificationSuccess');
}

export const HapticManager = new HapticManagerService();
