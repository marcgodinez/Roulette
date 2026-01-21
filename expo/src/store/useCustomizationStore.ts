import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TABLE_SKINS, CHIP_SETS, WHEEL_VARIANTS, GameAsset } from '../customization/AssetRegistry';

interface CustomizationState {
    equippedTableId: string;
    equippedChipId: string;
    equippedWheelId: string;

    ownedAssetIds: string[];

    // Actions
    equipAsset: (assetId: string, type: GameAsset['type']) => void;
    purchaseAsset: (assetId: string, price: number) => boolean; // Returns success/fail
    isOwned: (assetId: string) => boolean;
}

export const useCustomizationStore = create<CustomizationState>()(
    persist(
        (set, get) => ({
            equippedTableId: TABLE_SKINS.CLASSIC_GREEN.id,
            equippedChipId: CHIP_SETS.STANDARD.id,
            equippedWheelId: WHEEL_VARIANTS.CLASSIC.id,

            ownedAssetIds: [
                TABLE_SKINS.CLASSIC_GREEN.id,
                CHIP_SETS.STANDARD.id,
                WHEEL_VARIANTS.CLASSIC.id
            ],

            equipAsset: (assetId, type) => {
                if (!get().isOwned(assetId)) return;

                switch (type) {
                    case 'TABLE_SKIN':
                        set({ equippedTableId: assetId });
                        break;
                    case 'CHIP_SET':
                        set({ equippedChipId: assetId });
                        break;
                    case 'WHEEL_VARIANT':
                        set({ equippedWheelId: assetId });
                        break;
                }
            },

            purchaseAsset: (assetId, price) => {
                const state = get();
                if (state.ownedAssetIds.includes(assetId)) return true; // Already owned

                // Note: Actual credit deduction should happen in useGameStore or via a transaction
                // This store just tracks ownership. 
                // We will assume the caller checks credits before calling this.

                set((state) => ({
                    ownedAssetIds: [...state.ownedAssetIds, assetId]
                }));
                return true;
            },

            isOwned: (assetId) => {
                return get().ownedAssetIds.includes(assetId);
            }
        }),
        {
            name: 'user-customization-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
