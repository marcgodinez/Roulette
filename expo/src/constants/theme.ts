export const COLORS = {
    // Main Backgrounds (NEON DARK)
    BG_MAIN: '#050510',      // Pure Deep Black/Blue
    BG_SURFACE: '#12121A',   // Slightly lighter for panels
    BG_ELEVATED: '#1E1E28',  // For Popups

    // Action / Accent (NEON)
    ACCENT_GOLD: '#FCD34D',  // Neon Gold
    ACCENT_HOVER: '#F59E0B', // Amber
    ACCENT_BLUE: '#3B82F6',  // Cyber Blue
    ACCENT_PURPLE: '#A855F7', // Neon Purple

    // Typography
    TEXT_PRIMARY: '#FFFFFF',
    TEXT_SECONDARY: '#94A3B8',
    TEXT_MUTED: '#475569',

    // Betting Specific (NEON GLOWS)
    BET_RED: '#FF1111',     // Neon Red
    BET_BLACK: '#111111',   // Deep Black
    BET_GREEN: '#00FF00',   // Toxic Neon Green

    // Status
    SUCCESS: '#22C55E',     // Neon Green
    DANGER: '#EF4444',      // Neon Red
    WARNING: '#EAB308',     // Neon Yellow

    // Borders
    BORDER_SUBTLE: 'rgba(255, 255, 255, 0.1)',
    BORDER_ACCENT: '#FCD34D', // Gold Border
};

// SHADOW UTILS
export const SHADOWS = {
    NEON_GOLD: {
        shadowColor: COLORS.ACCENT_GOLD,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 5,
    },
    NEON_RED: {
        shadowColor: COLORS.BET_RED,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 5,
    },
    NEON_GREEN: {
        shadowColor: COLORS.BET_GREEN,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 5,
    },
    NEON_BLUE: {
        shadowColor: COLORS.ACCENT_BLUE,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 5,
    }
};

export const METRICS = {
    padding: 20,
    borderRadius: 16,
    iconSize: 24,
};
