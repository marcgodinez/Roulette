import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Check if we are in Expo Go
// In case appOwnership is undefined in some contexts, we default to false, 
// BUT if the native module is missing, we must catch that too.
const isExpoGo = Constants.appOwnership === 'expo';

// Test IDs for development
const TEST_ID_REWARDED = 'ca-app-pub-3940256099942544/5224354917';
const TEST_ID_INTERSTITIAL = 'ca-app-pub-3940256099942544/1033173712';

// --- MOCK IMPLEMENTATION ---
const MockAdManager = {
    loadRewarded: () => console.log('[AdManager-MOCK] Loading Rewarded Ad...'),
    showRewarded: async (): Promise<boolean> => {
        console.log('[AdManager-MOCK] Showing Rewarded Ad...');
        await new Promise(r => setTimeout(r, 2000));
        console.log('[AdManager-MOCK] Reward Earned!');
        return true;
    },
    loadInterstitial: () => console.log('[AdManager-MOCK] Loading Interstitial...'),
    showInterstitial: async () => {
        console.log('[AdManager-MOCK] Showing Interstitial...');
        await new Promise(r => setTimeout(r, 2000));
        console.log('[AdManager-MOCK] Interstitial Closed');
    }
};

// --- REAL IMPLEMENTATION (Lazy Loaded) ---
let RealAdManager: any = null;

// Try to initialize RealAdManager
if (!isExpoGo) {
    try {
        // Dynamic require to prevent crash in Expo Go
        const { RewardedAd, RewardedAdEventType, InterstitialAd, AdEventType, TestIds } = require('react-native-google-mobile-ads');

        const rewardedId = __DEV__
            ? TestIds.REWARDED
            : Platform.select({
                ios: 'ca-app-pub-YOUR_IOS_REWARDED_ID',
                android: 'ca-app-pub-YOUR_ANDROID_REWARDED_ID',
            }) || TestIds.REWARDED;

        const interstitialId = __DEV__
            ? TestIds.INTERSTITIAL
            : Platform.select({
                ios: 'ca-app-pub-YOUR_IOS_INTERSTITIAL_ID',
                android: 'ca-app-pub-YOUR_ANDROID_INTERSTITIAL_ID',
            }) || TestIds.INTERSTITIAL;

        let rewarded: any = null;
        let interstitial: any = null;

        RealAdManager = {
            loadRewarded: () => {
                if (rewarded) return;
                try {
                    rewarded = RewardedAd.createForAdRequest(rewardedId, { requestNonPersonalizedAdsOnly: true });
                    rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => console.log('[AdManager] Rewarded Loaded'));
                    rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => console.log('[AdManager] Reward Earned'));
                    rewarded.load();
                } catch (e) { console.warn(e); }
            },

            showRewarded: (): Promise<boolean> => {
                return new Promise((resolve) => {
                    if (!rewarded) {
                        RealAdManager.loadRewarded();
                        resolve(false);
                        return;
                    }
                    let earned = false;
                    const unsubscribeReward = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => { earned = true; });
                    const unsubscribeClosed = rewarded.addAdEventListener(RewardedAdEventType.CLOSED, () => {
                        unsubscribeReward();
                        unsubscribeClosed();
                        rewarded = null;
                        RealAdManager.loadRewarded();
                        resolve(earned);
                    });
                    try { rewarded.show(); } catch (error) { resolve(false); }
                });
            },

            loadInterstitial: () => {
                if (interstitial) return;
                try {
                    interstitial = InterstitialAd.createForAdRequest(interstitialId, { requestNonPersonalizedAdsOnly: true });
                    interstitial.addAdEventListener(AdEventType.LOADED, () => console.log('[AdManager] Interstitial Loaded'));
                    interstitial.load();
                } catch (e) { console.warn(e); }
            },

            showInterstitial: () => {
                if (!interstitial) {
                    RealAdManager.loadInterstitial();
                    return;
                }
                const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
                    unsubscribeClosed();
                    interstitial = null;
                    RealAdManager.loadInterstitial();
                });
                try { interstitial.show(); } catch (error) { console.error(error); }
            }
        };

    } catch (e) {
        console.warn('[AdManager] Native module not found. Falling back to Mock.');
    }
}

// Export the selected manager
export const AdManager = (RealAdManager || MockAdManager);
