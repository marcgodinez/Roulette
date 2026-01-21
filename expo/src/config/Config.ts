export const Config = {
    // Feature Flags
    IS_MOCK_MODE: false, // Force Mock Mode for Expo Go or unexpected failures

    // Economy
    INITIAL_COINS: 5000,
    AD_REWARD_COINS: 500,
    BET_LIMITS: {
        MIN: 10,
        MAX: 5000,
    },

    // RevenueCat (Purchases)
    REVENUECAT_ANDROID_KEY: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '',
    REVENUECAT_IOS_KEY: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '',

    // AdMob (Ads)
    ADMOB_UNIT_ID: process.env.EXPO_PUBLIC_ADMOB_UNIT_ID || 'ca-app-pub-1182495378626576/2255121410',

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
        },
        {
            identifier: 'no_ads_bundle',
            product: {
                priceString: '$14.99',
                title: 'No Ads + Coins',
                description: 'Remove Ads Forever + 50,000 Coins',
            },
            offeringIdentifier: 'default',
            credits: 50000,
            isNoAds: true
        }
    ],

    // Supabase
    SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zvfxffixyojoddqwtpow.supabase.co',
    SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',

    // Auth
    GOOGLE_WEB_CLIENT_ID: '298592772070-64apivvpind6ino85f5skpv4f8vfof4l.apps.googleusercontent.com',
    GOOGLE_ANDROID_CLIENT_ID: '298592772070-o3ac7csrpaqcvr4hes59dcghenhlh64t.apps.googleusercontent.com',
    GOOGLE_IOS_CLIENT_ID: '298592772070-7r5vgdlvnrr4p1fufhist8b0bdeepvg8.apps.googleusercontent.com',
};
