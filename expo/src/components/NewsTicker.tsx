import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft, useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { COLORS } from '../constants/theme';
import { useRealtimeFeed } from '../hooks/useRealtimeFeed';
import { formatCurrency } from '../utils/format';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const NewsTicker = () => {
    const news = useRealtimeFeed();
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (news.length === 0) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % news.length);
        }, 5000); // Change every 5 seconds

        return () => clearInterval(interval);
    }, [news.length]);

    if (news.length === 0) {
        return null; // Hide completely until real data comes in
    }

    const item = news[currentIndex];

    return (
        <View style={styles.container}>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>LIVE</Text>
            </View>
            <Animated.View
                key={item.id} // Key change triggers animation
                entering={FadeInRight.duration(500)}
                exiting={FadeOutLeft.duration(500)}
                style={styles.content}
            >
                <Text style={styles.text} numberOfLines={1}>
                    <Text style={styles.bold}>{item.username}</Text> won <Text style={styles.gold}>{formatCurrency(item.amount)}</Text> coins!
                </Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute', // Floating overlay
        top: 100, // Below header
        alignSelf: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20, // Pill shape
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)', // Subtle gold border
        zIndex: 100,
        maxWidth: '90%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    badge: {
        backgroundColor: COLORS.DANGER,
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 3,
        marginRight: 8,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    content: {
        flex: 1,
    },
    text: {
        color: COLORS.TEXT_SECONDARY,
        fontSize: 12,
        fontWeight: '600',
    },
    bold: {
        fontWeight: 'bold',
        color: '#FFF',
    },
    gold: {
        color: COLORS.ACCENT_GOLD,
        fontWeight: 'bold',
    }
});
