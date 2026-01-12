import React from 'react';
import { View, Text, StyleSheet, PanResponder, Dimensions } from 'react-native';
import { COLORS } from '../constants/theme';

interface Props {
    value: number;
    onValueChange: (value: number) => void;
    minimumValue?: number;
    maximumValue?: number;
    disabled?: boolean;
    style?: any;
    minimumTrackTintColor?: string;
    maximumTrackTintColor?: string;
    thumbTintColor?: string;
}

export const CustomSlider = ({
    value,
    onValueChange,
    minimumValue = 0,
    maximumValue = 1,
    disabled = false,
    style,
    minimumTrackTintColor = COLORS.ACCENT_GOLD,
    maximumTrackTintColor = '#FFFFFF',
    thumbTintColor = COLORS.ACCENT_GOLD
}: Props) => {
    const [width, setWidth] = React.useState(0);

    const panResponder = React.useMemo(() =>
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                if (disabled || width === 0) return;
                const x = evt.nativeEvent.locationX;
                let val = (x / width) * (maximumValue - minimumValue) + minimumValue;
                val = Math.max(minimumValue, Math.min(maximumValue, val));
                onValueChange(val);
            },
            onPanResponderMove: (evt) => {
                if (disabled || width === 0) return;
                const x = evt.nativeEvent.locationX;
                let val = (x / width) * (maximumValue - minimumValue) + minimumValue;
                val = Math.max(minimumValue, Math.min(maximumValue, val));
                onValueChange(val);
            },
            onPanResponderTerminationRequest: () => false,
            onPanResponderRelease: () => { },
        }), [width, disabled, minimumValue, maximumValue, onValueChange]
    );

    const percentage = ((value - minimumValue) / (maximumValue - minimumValue)) * 100;

    return (
        <View
            style={[styles.container, style, disabled && styles.disabled]}
            onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
            {...panResponder.panHandlers}
        >
            <View style={[styles.track, { backgroundColor: maximumTrackTintColor }]} pointerEvents="none">
                <View
                    style={[
                        styles.fill,
                        {
                            width: `${percentage}%`,
                            backgroundColor: minimumTrackTintColor
                        }
                    ]}
                />
            </View>
            <View
                style={[
                    styles.thumb,
                    {
                        left: `${percentage}%`,
                        borderColor: minimumTrackTintColor,
                        backgroundColor: '#FFFFFF',
                        transform: [{ translateX: -12 }]
                    }
                ]}
                pointerEvents="none"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 40,
        justifyContent: 'center',
    },
    track: {
        height: 4,
        borderRadius: 2,
        width: '100%',
        backgroundColor: '#E0E0E0',
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        backgroundColor: COLORS.ACCENT_GOLD,
    },
    thumb: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        top: '50%',
        marginTop: -12,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    disabled: {
        opacity: 0.5,
    }
});
