import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    Easing,
    cancelAnimation,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const WHEEL_SIZE = width * 0.75; // Smaller wheel as requested
const RADIUS = WHEEL_SIZE / 2;

// Standard European Roulette Sequence (Clockwise from 0)
const EUROPEAN_SEQUENCE = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface Props {
    isSpinning: boolean;
    winningNumber: number | null;
    fireNumbers: number[];
}

export const RouletteWheel: React.FC<Props> = ({ isSpinning, winningNumber, fireNumbers = [] }) => {
    const wheelRotation = useSharedValue(0);
    const ballRotation = useSharedValue(0);
    // Ball Radius: Start at Rim (0.95), drop to Pocket (0.76)
    const ballRadius = useSharedValue(RADIUS * 0.95);

    useEffect(() => {
        if (isSpinning && winningNumber !== null) {
            // === SINGLE SHOT SPIN LOGIC ===
            // Calculate final target immediately.

            // 0. RESET Ball Radius (if needed)
            ballRadius.value = withTiming(RADIUS * 0.95, { duration: 100 });
            // small duration just in case, usually seamless.

            cancelAnimation(wheelRotation);
            cancelAnimation(ballRotation);

            const singleSlotAngle = 360 / 37;
            const winningIndex = EUROPEAN_SEQUENCE.indexOf(winningNumber);

            // === Wheel Logic ===
            // Target: rotate ~5 times + alignment
            const currentWheel = wheelRotation.value;
            const angleOfNumber = winningIndex * singleSlotAngle;
            const alignmentOffset = 360 - angleOfNumber;

            const minSpins = 5 * 360; // 5 full spins

            const currentMod = currentWheel % 360;
            const safeCurrentMod = currentMod >= 0 ? currentMod : currentMod + 360; // Normalize 0-360

            let delta = alignmentOffset - safeCurrentMod;
            if (delta < 0) delta += 360;

            const targetWheel = currentWheel + minSpins + delta;
            const DURATION = 6500; // 6.5 Seconds Spin

            // Spin Wheel
            wheelRotation.value = withTiming(targetWheel, {
                duration: DURATION,
                easing: Easing.out(Easing.cubic) // Smooth deceleration from start
            });

            // === Ball Logic ===
            // Ball spins opposite? Or same? Usually opposite relative to wheel.
            // If wheel spins CW, Ball spins CCW.
            // visual relative speed = ball speed + wheel speed.

            const currentBall = ballRotation.value;
            const minBallSpins = 5 * 360;

            // Target: Just ensure it lands roughly aligned or just spins visually?
            // Real roulette: ball travels X distance.
            // We can just animate ball decreasing speed too.
            const targetBall = currentBall - minBallSpins; // Spin backwards

            ballRotation.value = withTiming(targetBall, {
                duration: DURATION,
                easing: Easing.out(Easing.cubic)
            });

            // Spiral In (Drop)
            // Start dropping after 2 seconds? Or gradual?
            // Ideally drops near the end.
            ballRadius.value = withTiming(RADIUS * 0.76, {
                duration: DURATION,
                easing: Easing.inOut(Easing.exp) // Late drop
            });

        } else if (!isSpinning && winningNumber === null) {
            // Reset / Idle if needed, but usually we just persist the last rotation
        }
    }, [isSpinning, winningNumber]);

    const wheelStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${wheelRotation.value}deg` }],
        };
    });

    const ballStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${ballRotation.value}deg` }],
        };
    });

    const ballPositionStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: -ballRadius.value }
            ]
        };
    });

    return (
        <View style={styles.container}>
            {/* 1. Wheel */}
            <View style={styles.shadow}>
                <Animated.View style={[wheelStyle, { width: WHEEL_SIZE, height: WHEEL_SIZE, justifyContent: 'center', alignItems: 'center' }]}>
                    <Image
                        source={require('../assets/images/roulette_wheel_transparent.png')}
                        style={styles.wheelImage}
                    />

                    {/* FIRE NUMBERS OVERLAY (Rotates WITH Wheel) */}
                    {fireNumbers.map((num) => {
                        // Calculate Angle for this number
                        const index = EUROPEAN_SEQUENCE.indexOf(num);
                        const angle = index * (360 / 37); // 37 numbers

                        // We need to place a marker at this angle at a specific radius
                        // Radius ~ 0.8 of half-width (adjust based on image)
                        const markerRadius = RADIUS * 0.78; // Adjust to match number ring position

                        return (
                            <View
                                key={num}
                                style={[
                                    styles.fireMarkerContainer,
                                    {
                                        transform: [
                                            { rotate: `${angle}deg` },
                                            { translateY: -markerRadius }
                                        ]
                                    }
                                ]}
                            >
                                <View style={styles.fireGlow} />
                            </View>
                        );
                    })}
                </Animated.View>
            </View>

            {/* 2. Ball Layer */}
            <Animated.View style={[styles.ballLayer, ballStyle]}>
                <Animated.View style={styles.pointerContainer}>
                    <Animated.View style={[styles.ballContainerDynamic, ballPositionStyle]}>
                        <View style={styles.ball} />
                    </Animated.View>
                </Animated.View>
            </Animated.View>

            {/* 3. Pointer */}
            <View style={styles.pointer} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: WHEEL_SIZE,
        height: WHEEL_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
    },
    shadow: {
        width: WHEEL_SIZE,
        height: WHEEL_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 20,
    },
    wheelImage: {
        width: WHEEL_SIZE,
        height: WHEEL_SIZE,
        resizeMode: 'contain',
    },
    ballLayer: {
        position: 'absolute',
        width: WHEEL_SIZE,
        height: WHEEL_SIZE,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
        pointerEvents: 'none',
    },
    pointerContainer: {
        // Just a Wrapper
    },
    ballContainerDynamic: {
        position: 'absolute',
        width: 14,
        height: 14,
        // TranslateY is animated
        left: -7, // Center it horizontally (width/2)
        top: 0, // Pivot is center
    },
    ball: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.9,
        shadowRadius: 2,
        elevation: 5,
    },
    pointer: {
        position: 'absolute',
        top: 0,
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 16,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: '#FFD700',
        transform: [{ rotate: '180deg' }],
        zIndex: 30,
        shadowColor: 'black',
        shadowOpacity: 0.5,
        shadowRadius: 2,
    },
    // FIRE MARKERS
    fireMarkerContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 24, // Approx number width
        height: 24,
        marginLeft: -12, // Center
        marginTop: -12, // Center
        justifyContent: 'center',
        alignItems: 'center',
        // Creating a pivot point for translateY
        // We handle rotation via parent transform, then translate UP to the radius.
    },
    fireGlow: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#FFD700', // Gold
        backgroundColor: 'rgba(255, 215, 0, 0.3)', // Semi-transparent gold
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
    }
});
