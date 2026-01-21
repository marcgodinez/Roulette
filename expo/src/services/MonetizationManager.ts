import { Alert, Platform } from 'react-native';
import { Config } from '../config/Config';
import { useGameStore } from '../store/useGameStore';
import Purchases, { PurchasesPackage } from 'react-native-purchases';

// Mock Interfaces if packages are missing
export interface Package {
    identifier: string;
    product: {
        priceString: string;
        title: string;
        description: string;
    };
    offeringIdentifier: string;
    credits?: number;
    isNoAds?: boolean;
}

// Global Mocks (Note: Config.MOCK_PACKAGES should ideally conform to the Package interface)
const MOCK_PACKAGES: Package[] = Config.MOCK_PACKAGES;

class MonetizationManager {
    isInitialized = false;
    packagesMap: Record<string, PurchasesPackage> = {};

    async initialize() {
        if (this.isInitialized) return;

        // Explicit Mock Mode override or missing API key
        const apiKey = Platform.OS === 'ios'
            ? Config.REVENUECAT_IOS_KEY
            : Config.REVENUECAT_ANDROID_KEY;

        if (Config.IS_MOCK_MODE || !apiKey || apiKey.includes('placeholder')) {
            console.log('[Monetization] MOCK MODE ACTIVE (due to config or missing API key)');
            this.isInitialized = true;
            return;
        }

        try {
            await Purchases.configure({ apiKey });
            this.isInitialized = true;
            console.log('[Monetization] RevenueCat Initialized');
        } catch (e) {
            console.error('[Monetization] Init Error:', e);
            // If initialization fails, we might want to fall back to mock mode
            this.isInitialized = true; // Mark as initialized to prevent re-attempts, but effectively in a "failed" state
        }
    }

    getCreditsForId(id: string): number {
        const match = Config.MOCK_PACKAGES.find(p => p.identifier === id);
        // @ts-ignore - MOCK_PACKAGES might not strictly conform to Package with credits/isNoAds
        return match ? match.credits || 0 : 0;
    }

    async getPackages(): Promise<Package[]> {
        if (!this.isInitialized) await this.initialize();

        const apiKey = Platform.OS === 'ios' ? Config.REVENUECAT_IOS_KEY : Config.REVENUECAT_ANDROID_KEY;
        if (Config.IS_MOCK_MODE || !apiKey || apiKey.includes('placeholder')) {
            if (Config.IS_MOCK_MODE) await new Promise(r => setTimeout(r, 500));
            // @ts-ignore
            return Config.MOCK_PACKAGES;
        }

        try {
            const offerings = await Purchases.getOfferings();
            const current = offerings.current;

            if (current && current.availablePackages.length > 0) {
                this.packagesMap = {};
                return current.availablePackages.map(pkg => {
                    this.packagesMap[pkg.identifier] = pkg;
                    const credits = this.getCreditsForId(pkg.identifier);
                    const isNoAds = pkg.identifier.includes('no_ads');
                    return {
                        identifier: pkg.identifier,
                        product: {
                            priceString: pkg.product.priceString,
                            title: pkg.product.title,
                            description: pkg.product.description
                        },
                        offeringIdentifier: pkg.offeringIdentifier,
                        credits,
                        isNoAds
                    };
                });
            }
        } catch (e) {
            console.error('[Monetization] Fetch Packages Error:', e);
        }

        // Fallback to mock packages if real fetch fails or no offerings
        // @ts-ignore
        return Config.MOCK_PACKAGES;
    }

    async purchasePackage(packageIdentifier: string): Promise<boolean> {
        const apiKey = Platform.OS === 'ios' ? Config.REVENUECAT_IOS_KEY : Config.REVENUECAT_ANDROID_KEY;

        if (Config.IS_MOCK_MODE || !apiKey || apiKey.includes('placeholder')) {
            console.log(`[Monetization] Mock Purchase: ${packageIdentifier}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            const pkg = Config.MOCK_PACKAGES.find(p => p.identifier === packageIdentifier);
            if (pkg) {
                this.grantRewards(pkg.identifier);
                return true;
            }
            return false;
        }

        try {
            const pkg = this.packagesMap[packageIdentifier];
            if (!pkg) {
                Alert.alert("Error", "Product not found.");
                return false;
            }

            const { customerInfo } = await Purchases.purchasePackage(pkg);

            // Success! Grant Rewards.
            // Ideally verify entitlement here, but for consumables/credits we trust the transaction completion for now.
            this.grantRewards(packageIdentifier);
            return true;

        } catch (e: any) {
            if (!e.userCancelled) {
                Alert.alert("Purchase Failed", e.message);
            }
            return false;
        }
    }

    grantRewards(id: string) {
        const credits = this.getCreditsForId(id);
        const isNoAds = id.includes('no_ads');

        if (credits > 0) {
            useGameStore.getState().addCredits(credits);
            Alert.alert("Success", `Added ${credits.toLocaleString()} Credits!`);
        }
        if (isNoAds) {
            useGameStore.getState().setAdFree(true);
        }
    }

    async showRewardedAd(): Promise<number | null> {
        // This file is MonetizationManager, but AdManager handles generic ads.
        // The previous code had mock logic.
        // For now, return null to force use of AdManager elsewhere if structured that way.
        // Assuming HubScreen uses AdManager directly.
        return null;
    }
}

export const monetizationManager = new MonetizationManager();
