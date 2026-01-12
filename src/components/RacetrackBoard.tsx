import React, { useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { G, Text as SvgText, Defs, LinearGradient, Stop, Path, Rect, Circle, Line } from 'react-native-svg';
import { COLORS } from '../constants/theme';
import {
    RACETRACK_SEQUENCE,
    SEQ_VOISINS_ZERO,
    SEQ_TIERS,
    SEQ_ORPHELINS,
    SEQ_JEU0,
    isRed
} from '../constants/gameRules';
import { useGameStore } from '../store/useGameStore';
import { getChipColor } from '../constants/chips';

interface RacetrackBoardProps {
    width: number;
    height: number;
}

export const RacetrackBoard = ({ width, height }: RacetrackBoardProps) => {
    const { placeBet, selectedChipValue, bets } = useGameStore();

    // --- GEOMETRY CONFIGURATION ---
    const PADDING = 2;
    const TRACK_THICKNESS = 48;

    // Determine Orientation - FORCE VERTICAL as requested
    const isVertical = true;

    // Use passed width/height directly
    const W = width;
    const H = height;

    // --- VERTICAL STADIUM (PILL) GEOMETRY ---
    // Maximized width.
    // Radius = (W - 2*PADDING) / 2
    const R_OUTER = (W - 2 * PADDING) / 2;

    // Straight Line Length (Vertical)
    const L_STRAIGHT = Math.max(0, H - 2 * R_OUTER - 2 * PADDING);

    // Horizontal Mode L_STRAIGHT (Legacy support or if switched back)
    const L_STRAIGHT_H = Math.max(0, W - 2 * ((H - PADDING) / 2) - 2 * PADDING);

    const CX = W / 2;
    const CY = H / 2;

    // Centers for Vertical Stadium Arcs
    // Top Arc Center
    const CY_TOP = CY - L_STRAIGHT / 2;
    // Bottom Arc Center
    const CY_BOT = CY + L_STRAIGHT / 2;

    // Horizontal Centers
    const CX_LEFT = CX - L_STRAIGHT_H / 2;
    const CX_RIGHT = CX + L_STRAIGHT_H / 2;

    const R_INNER = R_OUTER - TRACK_THICKNESS;
    const R_MID = R_OUTER - (TRACK_THICKNESS / 2);

    // Perimeters
    // Vertical: 2 * (Half Arc PI*R) + 2 * L_STRAIGHT
    const PERIMETER_MID = 2 * Math.PI * R_MID + 2 * (isVertical ? L_STRAIGHT : L_STRAIGHT_H);

    const NUM_SEGMENTS = 37;
    const SEGMENT_LENGTH = PERIMETER_MID / NUM_SEGMENTS;

    // --- HELPER: Get Coordinates for a distance 'd' along the perimeter ---
    const getPosForDist = (distance: number, radius: number) => {
        // Normalize distance
        let d = distance % PERIMETER_MID;
        if (d < 0) d += PERIMETER_MID;

        if (isVertical) {
            // VERTICAL PILL LOGIC
            // Standard Start: Angle 0 (Right, 3 o'clock).
            // But usually we want 0 (Top) to be first? 
            // Let's assume Angle 0 (Right) is start of the Top Arc's right side?
            // Top Arc spans from Angle 0 to -180 (Right -> Top -> Left).

            const arcHalfMid = Math.PI * R_MID;

            // 1. Top Arc (0 to -180 degrees)
            if (d < arcHalfMid) {
                // Angle goes from 0 to -PI
                const angleRad = -(d / R_MID);
                const x = CX + radius * Math.cos(angleRad);
                const y = CY_TOP + radius * Math.sin(angleRad);
                return { x, y, angleRad, isCurve: true, center: 'TOP' };
            }
            d -= arcHalfMid;

            // 2. Left Line (Top to Bottom)
            if (d < L_STRAIGHT) {
                const x = CX - radius;
                const y = CY_TOP + d;
                return { x, y, angleRad: -Math.PI, isCurve: false };
            }
            d -= L_STRAIGHT;

            // 3. Bottom Arc (-180 start? No, technically -180 relative to center)
            // Bottom Arc spans from -180 (Left) to -360 (Right)
            if (d < arcHalfMid) {
                const angleRad = -Math.PI - (d / R_MID);
                const x = CX + radius * Math.cos(angleRad);
                const y = CY_BOT + radius * Math.sin(angleRad);
                return { x, y, angleRad, isCurve: true, center: 'BOT' };
            }
            d -= arcHalfMid;

            // 4. Right Line (Bottom to Top)
            if (d < L_STRAIGHT) {
                const x = CX + radius;
                const y = CY_BOT - d;
                return { x, y, angleRad: 0, isCurve: false };
            }

            return { x: CX + radius, y: CY_TOP, angleRad: 0, isCurve: true, center: 'TOP' };

        } else {
            // HORIZONTAL LOGIC (Original)
            // ... (Same as before)
            const arcQuarterMid = (Math.PI * R_MID) / 2;
            if (d < arcQuarterMid) {
                const angleRad = -(d / R_MID);
                const x = CX_RIGHT + radius * Math.cos(angleRad);
                const y = CY + radius * Math.sin(angleRad);
                return { x, y, angleRad, isCurve: true, center: 'RIGHT' };
            }

            d -= arcQuarterMid;

            if (d < L_STRAIGHT_H) {
                const x = CX_RIGHT - d;
                const y = CY - radius;
                return { x, y, angleRad: -Math.PI / 2, isCurve: false };
            }

            d -= L_STRAIGHT_H;

            const arcHalfMid = Math.PI * R_MID;

            if (d < arcHalfMid) {
                const angleRad = -Math.PI / 2 - (d / R_MID);
                const x = CX_LEFT + radius * Math.cos(angleRad);
                const y = CY + radius * Math.sin(angleRad);
                return { x, y, angleRad, isCurve: true, center: 'LEFT' };
            }

            d -= arcHalfMid;

            if (d < L_STRAIGHT_H) {
                const x = CX_LEFT + d;
                const y = CY + radius; // Bottom line
                return { x, y, angleRad: Math.PI / 2, isCurve: false };
            }

            d -= L_STRAIGHT_H;

            // Right Arc Part 2
            const angleRad = -3 * Math.PI / 2 - (d / R_MID);
            const x = CX_RIGHT + radius * Math.cos(angleRad);
            const y = CY + radius * Math.sin(angleRad);
            return { x, y, angleRad, isCurve: true, center: 'RIGHT' };
        }
    };

    // Generate accurate path for a segment
    const getSegmentPath = (i: number) => {
        const dStart = i * SEGMENT_LENGTH;
        const dEnd = (i + 1) * SEGMENT_LENGTH;

        const p1 = getPosForDist(dStart, R_OUTER); // Outer Start
        const p2 = getPosForDist(dEnd, R_OUTER);   // Outer End
        const p3 = getPosForDist(dEnd, R_INNER);   // Inner End
        const p4 = getPosForDist(dStart, R_INNER); // Inner Start

        // Construct Path Command
        // Move to P1
        let d = `M ${p1.x} ${p1.y}`;

        // Line/Arc to P2
        if (p1.isCurve && p2.isCurve && p1.center === p2.center) {
            // Both on same arc -> A command
            // Sweep flag is 0 (CCW for SVG Y-down coordinates with negative angles? No, Math.sin works normally)
            // My angles go 0 -> -90 (CCW visually).
            // So sweep flag 0? 
            // Lets check: Start 0, End -10. 
            // SVG Arc: Start -> End. if sweep=0, goes "Left" way?
            // Usually 0 is 'short way' or 'ccw'. 
            // Let's rely on LargeArcFlag 0 (small slice). 
            // Sweep: 0 for CCW (negative angle direction)?
            d += ` A ${R_OUTER} ${R_OUTER} 0 0 0 ${p2.x} ${p2.y}`;
        } else {
            // Straight line or crossing boundary (treat as straight for small segments)
            // Even if crossing from Arc to Line, L works fine for small step.
            d += ` L ${p2.x} ${p2.y}`;
        }

        // Line to P3
        d += ` L ${p3.x} ${p3.y}`;

        // Line/Arc to P4 (Backward)
        if (p3.isCurve && p4.isCurve && p3.center === p4.center) {
            // Going P3 -> P4 (CCW in angle, but traversing backwards along track?)
            // P3 angle is "more negative" (later). P4 is "less negative" (earlier).
            // So we go from -10 to 0. Positive direction.
            // Sweep flag 1.
            d += ` A ${R_INNER} ${R_INNER} 0 0 1 ${p4.x} ${p4.y}`;
        } else {
            d += ` L ${p4.x} ${p4.y}`;
        }

        // Close
        d += ` Z`;

        return d;
    };

    const trackItems = useMemo(() => {
        return RACETRACK_SEQUENCE.map((num, i) => {
            const dCenter = (i + 0.5) * SEGMENT_LENGTH;
            const pos = getPosForDist(dCenter, R_MID);

            // Text rotation
            // Normal to surface or upright?
            // Standard: Rotated so bottom fits center.
            // pos.angleRad is tangent? No, it's radial angle from center.
            // +90 deg.
            const textRot = (pos.angleRad * 180 / Math.PI) + 90;

            let color = '#000';
            if (num === 0) color = COLORS.BET_GREEN;
            else if (isRed(num)) color = COLORS.BET_RED;

            return {
                num,
                path: getSegmentPath(i),
                textPos: pos,
                textRot,
                color
            };
        });
    }, [PERIMETER_MID, CX_RIGHT, CX_LEFT, CY, R_MID, L_STRAIGHT, L_STRAIGHT_H]);

    const handleCallBet = (sequence: number[]) => {
        sequence.forEach(num => {
            placeBet(num.toString(), selectedChipValue);
        });
    };

    // --- DIVIDERS LAYER (Memoized) ---
    const DividersLayer = useMemo(() => {
        const getOuterPos = (i: number) => getPosForDist(i * SEGMENT_LENGTH, R_OUTER);
        const getInnerPos = (i: number) => getPosForDist(i * SEGMENT_LENGTH, R_INNER);

        if (isVertical) {
            // Pill Top Y is Top of the Straight section (CY - L_STRAIGHT/2).
            const boxTopY = CY - L_STRAIGHT / 2;

            // Ratios (Total 10.5)
            // Zero (1.0) -> Voisins (4.0) -> Orph (3.0) -> Tiers (2.5)
            const share = L_STRAIGHT / 10.5;

            const y1 = boxTopY + share * 1.0;
            const y2 = boxTopY + share * (1.0 + 4.0);
            const y3 = boxTopY + share * (5.0 + 3.0);

            // Inner width boundaries
            const boxLeft = CX - R_INNER + 4;
            const boxRight = CX + R_INNER - 4;

            return (
                <G>
                    <Line x1={boxLeft} y1={y1} x2={boxRight} y2={y1} stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
                    <Line x1={boxLeft} y1={y2} x2={boxRight} y2={y2} stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
                    <Line x1={boxLeft} y1={y3} x2={boxRight} y2={y3} stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
                </G>
            );
        } else {
            const boxX = PADDING + TRACK_THICKNESS + 4;
            const boxY = PADDING + TRACK_THICKNESS + 4;
            const boxH = H - 2 * boxY;
            const boxW = W - 2 * boxX;

            const x1 = boxX + boxW * (2.5 / 10.5);
            const x2 = boxX + boxW * (5.5 / 10.5);
            const x3 = boxX + boxW * (9.5 / 10.5);

            return (
                <G>
                    <Line x1={x1} y1={boxY} x2={x1} y2={boxY + boxH} stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
                    <Line x1={x2} y1={boxY} x2={x2} y2={boxY + boxH} stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
                    <Line x1={x3} y1={boxY} x2={x3} y2={boxY + boxH} stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
                </G>
            );
        }
    }, [isVertical, W, H, L_STRAIGHT, L_STRAIGHT_H, R_OUTER, R_INNER, PADDING, TRACK_THICKNESS, CX, CY, SEGMENT_LENGTH]);
    return (
        <View style={[styles.container, { width, height }]}>
            <Svg width={width} height={height}>
                <Defs>
                    {/* Glossy gradient if needed */}
                </Defs>

                {DividersLayer}

                {/* Track Cells */}
                {trackItems.map((item) => {
                    const betAmount = bets[item.num.toString()] || 0;
                    const hasBet = betAmount > 0;

                    return (
                        <G key={item.num} onPress={() => handleCallBet([item.num])}>
                            {/* Shape */}
                            <Path
                                d={item.path}
                                fill={item.color}
                                stroke="rgba(255,255,255,0.2)" // Separator lines
                                strokeWidth={1}
                            />

                            {/* Bet Indicator */}
                            {hasBet ? (
                                <Circle
                                    cx={item.textPos.x}
                                    cy={item.textPos.y}
                                    r={8}
                                    fill={getChipColor(betAmount)}
                                    stroke="#000"
                                />
                            ) : (
                                <SvgText
                                    fill="#FFF"
                                    fontSize={10}
                                    fontWeight="bold"
                                    textAnchor="middle"
                                    alignmentBaseline="middle"
                                    x={item.textPos.x}
                                    y={item.textPos.y}
                                    rotation={item.textRot}
                                    origin={`${item.textPos.x}, ${item.textPos.y}`}
                                >
                                    {item.num}
                                </SvgText>
                            )}
                        </G>
                    );
                })}
            </Svg>

            {/* Central Betting Zones */}
            <View style={[
                styles.centerControls,
                {
                    left: PADDING + TRACK_THICKNESS + 4,
                    right: PADDING + TRACK_THICKNESS + 4,
                    top: PADDING + TRACK_THICKNESS + 4,
                    bottom: PADDING + TRACK_THICKNESS + 4,
                    borderRadius: R_INNER - 4,
                }
            ]}>

                {/* 1. SERIE 5/8 (Tiers) - Left Side */}
                <TouchableOpacity
                    style={[styles.zone, styles.zoneTiers]}
                    onPress={() => handleCallBet(SEQ_TIERS)}
                >
                    <Text style={styles.zoneTitle}>SERIE 5/8</Text>
                </TouchableOpacity>

                {/* 2. ORPHELINS (Orph) - Middle Left */}
                <TouchableOpacity
                    style={[styles.zone, styles.zoneOrph]}
                    onPress={() => handleCallBet(SEQ_ORPHELINS)}
                >
                    <Text style={styles.zoneTitle}>ORPHELINS</Text>
                </TouchableOpacity>

                {/* 3. SERIE 0/2/3 (Voisins) - Middle Right */}
                <TouchableOpacity
                    style={[styles.zone, styles.zoneVoisins]}
                    onPress={() => handleCallBet(SEQ_VOISINS_ZERO)}
                >
                    <Text style={styles.zoneTitle}>SERIE 0/2/3</Text>
                </TouchableOpacity>

                {/* 4. ZERO SPIEL (Zero) - Right Edge */}
                <TouchableOpacity
                    style={[styles.zone, styles.zoneZero]}
                    onPress={() => handleCallBet(SEQ_JEU0)}
                >
                    <Text style={[styles.zoneTitle, { width: 40, textAlign: 'center' }]}>ZERO</Text>
                </TouchableOpacity>

            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerControls: {
        position: 'absolute',
        flexDirection: 'row',
        backgroundColor: 'transparent',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)'
    },
    zone: {
        justifyContent: 'center',
        alignItems: 'center',
        // borderRightWidth removed, handled by SVG
        height: '100%'
    },
    zoneTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center'
    },
    zoneTiers: {
        flex: 2.5,
    },
    zoneOrph: {
        flex: 3.0,
    },
    zoneVoisins: {
        flex: 4.0,
    },
    zoneZero: {
        flex: 1.0,
        borderRightWidth: 0,
        backgroundColor: 'rgba(255,255,255,0.1)'
    }
});
