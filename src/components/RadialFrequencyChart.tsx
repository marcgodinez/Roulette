import React, { useMemo } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../constants/theme';
import { EUROPEAN_SEQUENCE, isRed } from '../constants/gameRules';
import { calculateStats } from '../utils/statsHelper';

const { width } = Dimensions.get('window');
const CHART_SIZE = width * 0.90; // Slightly larger
const CENTER = CHART_SIZE / 2;
const MAX_RADIUS = (CHART_SIZE / 2) - 20; // Leave space for labels
const INNER_RADIUS = 50;

interface Props {
    history: { number: number }[];
    limit?: number;
}

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
};

const describeArc = (x: number, y: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, outerRadius, endAngle);
    const end = polarToCartesian(x, y, outerRadius, startAngle);
    const startInner = polarToCartesian(x, y, innerRadius, endAngle);
    const endInner = polarToCartesian(x, y, innerRadius, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    const d = [
        "M", start.x, start.y,
        "A", outerRadius, outerRadius, 0, largeArcFlag, 0, end.x, end.y,
        "L", endInner.x, endInner.y,
        "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
        "Z"
    ].join(" ");

    return d;
};

export const RadialFrequencyChart = ({ history, limit = 200 }: Props) => {
    // Calculate Stats using shared helper
    const stats = useMemo(() => {
        // Limit history first
        const recentHistory = history.slice(0, limit);
        return calculateStats(recentHistory);
    }, [history, limit]);

    // Derived for easier access in render
    const { counts: frequencies, maxCount, hotNumbers, coldNumbers } = stats;

    // 3. Render Wedges
    const renderWedges = () => {
        const anglePerNum = 360 / 37;
        const gap = 0.5; // Gap between wedges in degrees

        return EUROPEAN_SEQUENCE.map((num, i) => {
            // Angle Logic: 
            // We want the wedge CENTERED on the angle `i * anglePerNum`.
            // SVG 0 is at 12 o'clock if we use our polarToCartesian (adjusted -90).
            // BUT, visual wheel usually starts 0 at top. 
            // `i` is position in sequence. 0 is first (Top).

            const centerAngle = i * anglePerNum;
            const startAngle = centerAngle - (anglePerNum / 2) + gap;
            const endAngle = centerAngle + (anglePerNum / 2) - gap;

            const count = frequencies[num];
            // Normalize radius: Inner + (freq/max) * (Max - Inner)
            // Min radius should be viewable even if 0 freq? Maybe just Inner.
            const barHeight = MAX_RADIUS - INNER_RADIUS;
            const radius = INNER_RADIUS + (count / maxCount) * barHeight;

            // Colors
            const isHot = hotNumbers.includes(num);
            const isCold = coldNumbers.includes(num);

            let fillColor = 'rgba(255,255,255,0.1)'; // Default Neutral
            if (isHot) fillColor = '#EF4444';
            else if (isCold && count === 0) fillColor = 'rgba(59, 130, 246, 0.3)';
            else if (isCold) fillColor = 'rgba(59, 130, 246, 0.5)';
            else if (count > 0) fillColor = 'rgba(255,255,255,0.3)'; // Active but neutral

            // Generate Path
            const pathData = describeArc(CENTER, CENTER, INNER_RADIUS, radius, startAngle, endAngle);

            // Label Position (Outside Max Radius)
            const labelR = MAX_RADIUS + 12;
            const labelPos = polarToCartesian(CENTER, CENTER, labelR, centerAngle);
            const numColor = num === 0 ? COLORS.BET_GREEN : (isRed(num) ? COLORS.BET_RED : '#FFF');

            return (
                <G key={num}>
                    <Path d={pathData} fill={fillColor} stroke="none" />

                    {/* Number Label */}
                    <SvgText
                        x={labelPos.x}
                        y={labelPos.y}
                        fill={numColor}
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                    // Rotate text to follow wheel? No, keep upright for readability
                    >
                        {num}
                    </SvgText>
                </G>
            );
        });
    };

    return (
        <View style={styles.container}>
            <Svg width={CHART_SIZE} height={CHART_SIZE}>
                {/* Background Track */}
                <Circle cx={CENTER} cy={CENTER} r={MAX_RADIUS} stroke="#222" strokeWidth="1" fill="none" opacity={0.5} />
                <Circle cx={CENTER} cy={CENTER} r={INNER_RADIUS} stroke="#333" strokeWidth="1" fill="none" />

                {/* Render Wedges */}
                {renderWedges()}
            </Svg>

            {/* Legend (Keep it simple) */}
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
                    <Text style={styles.legendText}>HOT</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: '#3B82F6' }]} />
                    <Text style={styles.legendText}>COLD</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    legend: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 20,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        color: '#BBB',
        fontSize: 12,
        fontWeight: 'bold'
    }
});
