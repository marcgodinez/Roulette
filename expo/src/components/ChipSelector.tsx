import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolate,
    Extrapolate
} from 'react-native-reanimated';
import { CHIPS } from '../constants/chips'; // Ensure this matches actual path
import { COLORS } from '../constants/theme';
import { HapticManager } from '../services/HapticManager';

const { width, height } = Dimensions.get('window');

interface Props {
    selectedChipValue: number;
    onSelectChip: (value: number) => void;
    style?: any;
}

export const ChipSelector: React.FC<Props> = ({ selectedChipValue, onSelectChip, style }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const animation = useSharedValue(0);

    useEffect(() => {
        animation.value = withSpring(isOpen ? 1 : 0, { damping: 15, stiffness: 100 });
    }, [isOpen]);

    const toggleMenu = () => {
        HapticManager.trigger('selection');
        setIsOpen(!isOpen);
    };

    const handleSelect = (value: number) => {
        HapticManager.trigger('selection');
        onSelectChip(value);
        setIsOpen(false);
    };

    const selectedChip = CHIPS.find(c => c.value === selectedChipValue) || CHIPS[0];

    // RADIAL CONFIG
    // Fan out from Bottom-Left: Up (-90) to Right (0)
    const RADIUS = 140; // Increased from 90 to 140 for more separation
    const START_ANGLE = -90; // Up
    const END_ANGLE = 0; // Right

    return (
        <View style={[styles.container, style]} pointerEvents="box-none">

            {/* BACKDROP (Click Outside) */}
            {isOpen && (
                <View
                    style={{
                        position: 'absolute',
                        top: -height,
                        left: -width,
                        width: width * 2,
                        height: height * 2,
                        zIndex: 0
                    }}
                    onTouchStart={() => setIsOpen(false)} // For plain View
                >
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => setIsOpen(false)}
                    />
                </View>
            )}

            {/* CHIP OPTIONS */}
            {CHIPS.map((chip, index) => {
                // Calculate angle for this chip
                // We want to skip the selected char? No, show all, maybe highlight selected.
                // Or just show expanding list.

                const range = END_ANGLE - START_ANGLE;
                const step = range / (CHIPS.length - 1);
                const angleDeg = START_ANGLE + (index * step);
                const angleRad = angleDeg * (Math.PI / 180);

                const finalX = Math.cos(angleRad) * RADIUS;
                const finalY = Math.sin(angleRad) * RADIUS;

                const animatedStyle = useAnimatedStyle(() => {
                    const translateX = interpolate(animation.value, [0, 1], [0, finalX]);
                    const translateY = interpolate(animation.value, [0, 1], [0, finalY]);
                    const scale = interpolate(animation.value, [0, 1], [0, 1]);
                    const opacity = interpolate(animation.value, [0, 0.5, 1], [0, 0, 1]);

                    return {
                        transform: [
                            { translateX },
                            { translateY },
                            { scale }
                        ],
                        opacity
                    };
                });

                const isSelected = chip.value === selectedChipValue;

                return (
                    <Animated.View
                        key={chip.value}
                        style={[styles.menuItem, animatedStyle]}
                        pointerEvents={isOpen ? 'auto' : 'none'}
                    >
                        <TouchableOpacity
                            style={[
                                styles.chipOption,
                                { backgroundColor: chip.color, borderColor: isSelected ? COLORS.ACCENT_GOLD : 'rgba(255,255,255,0.2)' }
                            ]}
                            onPress={() => handleSelect(chip.value)}
                        >
                            <View style={styles.chipInner}>
                                <Text style={[styles.chipText, { color: chip.color === '#000000' ? '#FFF' : '#000' }]}>
                                    {chip.label}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                );
            })}

            {/* MAIN TOGGLE (Selected Chip) */}
            <TouchableOpacity
                style={[
                    styles.mainToggle,
                    { backgroundColor: selectedChip.color }
                ]}
                onPress={toggleMenu}
                activeOpacity={0.9}
            >
                <View style={[styles.chipInner, { borderColor: '#FFF' }]}>
                    <Text style={[styles.mainChipText, { color: selectedChip.color === '#000000' ? '#FFF' : '#000' }]}>
                        {selectedChip.label}
                    </Text>
                </View>
                {/* Decoration ring when open */}
                {isOpen && <View style={styles.activeRing} />}
            </TouchableOpacity>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        // Position controlled by parent or style prop
        zIndex: 100, // Top priority
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainToggle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.BORDER_SUBTLE,
        elevation: 10,
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        zIndex: 101, // Above items
    },
    activeRing: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: COLORS.ACCENT_GOLD,
        zIndex: -1,
    },
    mainChipText: {
        fontSize: 14,
        fontWeight: '900',
    },
    menuItem: {
        position: 'absolute',
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 102, // items
    },
    chipOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 3,
    },
    chipInner: {
        width: '80%',
        height: '80%',
        borderRadius: 50,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chipText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
});
