export const Config = {
    // Feature Flags
    IS_MOCK_MODE: true, // Force Mock Mode for Expo Go or unexpected failures

    // RevenueCat (Purchases)
    REVENUECAT_API_KEY: 'appl_placeholder_key_revenuecat',

    // AdMob (Ads)
    // Test Unit ID for Rewarded Video (Android)
    ADMOB_UNIT_ID: 'ca-app-pub-3940256099942544/5224354917',

    // Mock Data
    MOCK_PACKAGES: [
        {
            identifier: 'coins_small',
            product: {
                priceString: '$0.99',
                title: 'Small Pile',
                description: '1,000 Coins to get you started',
            },
            offeringIdentifier: 'default',
            credits: 1000
        },
        {
            identifier: 'coins_medium',
            product: {
                priceString: '$4.99',
                title: 'Suitcase',
                description: '6,000 Coins (20% Bonus)',
            },
            offeringIdentifier: 'default',
            credits: 6000
        },
        {
            identifier: 'coins_large',
            product: {
                priceString: '$9.99',
                title: 'Vault',
                description: '15,000 Coins (50% Bonus)',
            },
            offeringIdentifier: 'default',
            credits: 15000
        }
    ],

    // Supabase
    SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zvfxffixyojoddqwtpow.supabase.co',
    SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_5njgQ2pUedFPBy9Tlcjkwg_Af1jVUPC',

    // Google Auth (Replace with your actual Client IDs from Google Cloud Console)
    GOOGLE_WEB_CLIENT_ID: '98592772070-64apivvpind6ino85f5skpv4f8vfof4l.apps.googleusercontent.com',
    GOOGLE_ANDROID_CLIENT_ID: '98592772070-64apivvpind6ino85f5skpv4f8vfof4l.apps.googleusercontent.com',
    GOOGLE_IOS_CLIENT_ID: '98592772070-64apivvpind6ino85f5skpv4f8vfof4l.apps.googleusercontent.com',
};

