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
    initialize: async () => console.log('[AdManager-MOCK] Initialized'),
    loadRewarded: () => console.log('[AdManager-MOCK] Loading Rewarded...'),
    showRewarded: async (): Promise<boolean> => {
        console.log('[AdManager-MOCK] Showing Rewarded Ad...');
        await new Promise(r => setTimeout(r, 1500));
        console.log('[AdManager-MOCK] Reward Earned!');
        return true;
    }
};

// --- REAL IMPLEMENTATION ---
let RealAdManager: any = null;

if (!isExpoGo) {
    try {
        const { MobileAds, RewardedAd, RewardedAdEventType, TestIds } = require('react-native-google-mobile-ads');

        const rewardedId = __DEV__
            ? TestIds.REWARDED
            : Platform.select({
                ios: 'ca-app-pub-3940256099942544/1712485313', // Replace with Real ID
                android: 'ca-app-pub-1182495378626576/2255121410', // Real Android ID
            }) || TestIds.REWARDED;

        let rewarded: any = null;
        let isLoaded = false;
        let isLoading = false;

        RealAdManager = {
            initialize: async () => {
                try {
                    await MobileAds().initialize();
                    console.log('[AdManager] SDK Initialized');
                    RealAdManager.loadRewarded();
                } catch (e) {
                    console.error('[AdManager] Init Failed:', e);
                }
            },

            loadRewarded: () => {
                if (isLoaded || isLoading) return;
                isLoading = true;

                try {
                    console.log('[AdManager] Loading new ad...');
                    rewarded = RewardedAd.createForAdRequest(rewardedId, {
                        requestNonPersonalizedAdsOnly: true
                    });

                    rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
                        console.log('[AdManager] Ad Loaded');
                        isLoaded = true;
                        isLoading = false;
                    });

                    rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
                        console.log('[AdManager] Reward Earned');
                    });

                    rewarded.load();
                } catch (e) {
                    console.error('[AdManager] Load Failed:', e);
                    isLoading = false;
                }
            },

            showRewarded: (): Promise<boolean> => {
                return new Promise((resolve) => {
                    if (!isLoaded || !rewarded) {
                        console.log('[AdManager] Ad not ready, reloading...');
                        RealAdManager.loadRewarded();
                        resolve(false);
                        return;
                    }

                    let earned = false;
                    const unsubscribeReward = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
                        earned = true;
                    });

                    const unsubscribeClosed = rewarded.addAdEventListener(RewardedAdEventType.CLOSED, () => {
                        console.log('[AdManager] Ad Closed');
                        unsubscribeReward();
                        unsubscribeClosed();
                        isLoaded = false;
                        rewarded = null;

                        // Preload next
                        setTimeout(() => RealAdManager.loadRewarded(), 1000);

                        resolve(earned);
                    });

                    try {
                        rewarded.show();
                    } catch (e) {
                        console.error('[AdManager] Show Failed:', e);
                        resolve(false);
                    }
                });
            }
        };

    } catch (e) {
        console.warn('[AdManager] Native module not found (Web/Go?). Using Mock.');
    }
}

export const AdManager = (RealAdManager || MockAdManager);
