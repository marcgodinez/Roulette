import { Alert, Platform } from 'react-native';
import { Config } from '../config/Config';

// Mock Interfaces if packages are missing
interface Package {
    identifier: string;
    product: {
        priceString: string;
        title: string;
        description: string;
    };
    offeringIdentifier: string;
}

// Global Mocks
const MOCK_PACKAGES: Package[] = Config.MOCK_PACKAGES;

class MonetizationManager {
    isInitialized = false;

    async initialize() {
        if (this.isInitialized) return;

        if (Config.IS_MOCK_MODE) {
            console.log('[Monetization] Initialized in MOCK MODE');
            this.isInitialized = true;
            return;
        }

        // Real Initialization logic would go here
        // forcing mock for now to prevent crashes in Expo Go
        this.isInitialized = true;
    }

    async getPackages(): Promise<Package[]> {
        if (!this.isInitialized) await this.initialize();

        if (Config.IS_MOCK_MODE) {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));
            return MOCK_PACKAGES;
        }

        return MOCK_PACKAGES; // Fallback
    }

    async purchasePackage(packageIdentifier: string): Promise<boolean> {
        if (Config.IS_MOCK_MODE) {
            console.log(`[Monetization] Mock Purchase: ${packageIdentifier}`);
            // Simulate processing
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Random success/fail (mostly success)
            return true;
        }
        return false;
    }

    async showRewardedAd(): Promise<number | null> {
        if (Config.IS_MOCK_MODE) {
            console.log('[Monetization] Showing Mock Ad...');

            return new Promise((resolve) => {
                // Simulate ad duration
                Alert.alert(
                    "Watching Ad...",
                    "Imagine a video playing here for 5 seconds.",
                    [
                        {
                            text: "Close (Reward)",
                            onPress: () => {
                                console.log('[Monetization] Ad Completed');
                                resolve(1000); // Reward amount
                            }
                        },
                        {
                            text: "Cancel",
                            onPress: () => resolve(null),
                            style: "cancel"
                        }
                    ]
                );
            });
        }
        return null;
    }
}

export const monetizationManager = new MonetizationManager();
