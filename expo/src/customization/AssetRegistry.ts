export interface GameAsset {
    id: string;
    name: string;
    type: 'TABLE_SKIN' | 'CHIP_SET' | 'WHEEL_VARIANT';
    value: string; // Hex code, image path, or style identifier
    price: number;
    previewColor?: string; // For UI display
}

export const TABLE_SKINS: Record<string, GameAsset> = {
    CLASSIC_GREEN: {
        id: 'table_classic_green',
        name: 'Classic Green',
        type: 'TABLE_SKIN',
        value: '#0F3317',
        price: 0,
        previewColor: '#0F3317'
    },
    ROYAL_RED: {
        id: 'table_royal_red',
        name: 'Royal Red',
        type: 'TABLE_SKIN',
        value: '#4A0E0E',
        price: 1000,
        previewColor: '#4A0E0E'
    },
    OCEAN_BLUE: {
        id: 'table_ocean_blue',
        name: 'Ocean Blue',
        type: 'TABLE_SKIN',
        value: '#0E2A4A',
        price: 1000,
        previewColor: '#0E2A4A'
    },
    CYBER_PURPLE: {
        id: 'table_cyber_purple',
        name: 'Cyberpunk',
        type: 'TABLE_SKIN',
        value: '#2A0E4A',
        price: 2500,
        previewColor: '#2A0E4A'
    },
    LUXURY_BLACK: {
        id: 'table_luxury_black',
        name: 'Vegas Black',
        type: 'TABLE_SKIN',
        value: '#111111',
        price: 5000,
        previewColor: '#111111'
    }
};

export const CHIP_SETS: Record<string, GameAsset> = {
    STANDARD: {
        id: 'chip_standard',
        name: 'Standard Casino',
        type: 'CHIP_SET',
        value: 'standard',
        price: 0
    },
    NEON: {
        id: 'chip_neon',
        name: 'Neon Lights',
        type: 'CHIP_SET',
        value: 'neon',
        price: 2000
    },
    GOLD: {
        id: 'chip_gold',
        name: 'Solid Gold',
        type: 'CHIP_SET',
        value: 'gold',
        price: 10000
    }
};

export const WHEEL_VARIANTS: Record<string, GameAsset> = {
    CLASSIC: {
        id: 'wheel_classic',
        name: 'Classic Wood',
        type: 'WHEEL_VARIANT',
        value: 'classic',
        price: 0
    },
    MODERN: {
        id: 'wheel_modern',
        name: 'Modern Steel',
        type: 'WHEEL_VARIANT',
        value: 'modern',
        price: 1500
    }
};

export const ALL_ASSETS = {
    ...TABLE_SKINS,
    ...CHIP_SETS,
    ...WHEEL_VARIANTS
};
