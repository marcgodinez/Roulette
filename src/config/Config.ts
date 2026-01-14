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
            identifier: 'coins_tiny',
            product: {
                priceString: '$0.99',
                title: 'Starter Stash',
                description: '1,000 Coins',
            },
            offeringIdentifier: 'default',
            credits: 1000
        },
        {
            identifier: 'coins_small',
            product: {
                priceString: '$4.99',
                title: 'Coin Pouch',
                description: '10,000 Coins',
            },
            offeringIdentifier: 'default',
            credits: 10000
        },
        {
            identifier: 'coins_medium',
            product: {
                priceString: '$9.99',
                title: 'Briefcase',
                description: '25,000 Coins',
            },
            offeringIdentifier: 'default',
            credits: 25000
        },
        {
            identifier: 'coins_large',
            product: {
                priceString: '$19.99',
                title: 'Bank Vault',
                description: '60,000 Coins',
            },
            offeringIdentifier: 'default',
            credits: 60000
        },
        {
            identifier: 'coins_huge',
            product: {
                priceString: '$49.99',
                title: 'Mega Vault',
                description: '200,000 Coins (Best Value)',
            },
            offeringIdentifier: 'default',
            credits: 200000
        },
        {
            identifier: 'coins_tycoon',
            product: {
                priceString: '$99.99',
                title: 'Tycoon Status',
                description: '2,000,000 Coins (Ultimate)',
            },
            offeringIdentifier: 'default',
            credits: 2000000
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

