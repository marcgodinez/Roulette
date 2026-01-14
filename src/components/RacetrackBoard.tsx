import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { G, Text as SvgText, Defs, Path, Circle, Line, Rect } from 'react-native-svg';
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
import { HapticManager } from '../services/HapticManager';

interface RacetrackBoardProps {
    width: number;
    height: number;
}

// Correct Indices in RACETRACK_SEQUENCE (0-based)
// Voisins: 22..25 -> Indices 28..7 (wrapping)
// Orph (Right): 17..6 -> Indices 8..10
// Tiers: 27..33 -> Indices 11..22
// Orph (Left): 1..9 -> Indices 23..27
const ZONE_RANGES = {
    VOISINS: { start: 28, end: 7, count: 17, color: '#FFD700' }, // Ends at 7 inclusive
    ORPHELINS_RIGHT: { start: 8, end: 10, count: 3, color: '#FF8C00' },
    TIERS: { start: 11, end: 22, count: 12, color: '#00BFFF' },
    ORPHELINS_LEFT: { start: 23, end: 27, count: 5, color: '#FF8C00' } // Same color as Right
};

export const RacetrackBoard = ({ width, height }: RacetrackBoardProps) => {
    const { placeBet, selectedChipValue, bets } = useGameStore();

    // Interaction State
    const [activeZone, setActiveZone] = useState<string | null>(null);

    // --- GEOMETRY CONFIGURATION ---
    const PADDING = 10;
    const TRACK_THICKNESS = 60;
    const isVertical = true;
    const W = width;
    const H = height;

    // Constrain Radius to fit in the smaller dimension (with margin)
    // 0.90 factor provides the requested lateral margins
    // USER REQUEST: Make it "narrower" (mas estrecha).
    // limiting width to 75% of available width to elongate the shape.
    const maxDiameter = Math.min(W * 0.75, H * 0.90);
    const R_OUTER = maxDiameter / 2;
    const R_INNER = R_OUTER - TRACK_THICKNESS;
    const R_MID = R_OUTER - (TRACK_THICKNESS / 2);

    const L_STRAIGHT = Math.max(0, H - (2 * R_OUTER) - (2 * PADDING));

    const CX = W / 2;
    const CY = H / 2;
    const CY_TOP = CY - L_STRAIGHT / 2;
    const CY_BOT = CY + L_STRAIGHT / 2;

    const ARC_LEN = Math.PI * R_MID;
    const PERIMETER_MID = 2 * ARC_LEN + 2 * L_STRAIGHT;
    const NUM_SEGMENTS = 37;
    const SEGMENT_LENGTH = PERIMETER_MID / NUM_SEGMENTS;

    const OFFSET_D = ((Math.PI / 2) * R_MID) - (0.5 * SEGMENT_LENGTH);

    // --- GEOMETRY HELPERS ---
    const getPosCCW = (d: number, r: number) => {
        const arcHalf = Math.PI * R_MID;

        if (d < arcHalf) {
            const angle = -(d / R_MID);
            return { x: CX + r * Math.cos(angle), y: CY_TOP + r * Math.sin(angle), angle, section: 'TOP' };
        }
        d -= arcHalf;
        if (d < L_STRAIGHT) {
            return { x: CX - r, y: CY_TOP + d, angle: -Math.PI, section: 'LEFT' };
        }
        d -= L_STRAIGHT;
        if (d < arcHalf) {
            const angle = -Math.PI - (d / R_MID);
            return { x: CX + r * Math.cos(angle), y: CY_BOT + r * Math.sin(angle), angle, section: 'BOT' };
        }
        d -= arcHalf;
        return { x: CX + r, y: CY_BOT - d, angle: 0, section: 'RIGHT' };
    };

    const getPosForDist = (rawDistance: number, radius: number) => {
        let d = (rawDistance + OFFSET_D) % PERIMETER_MID;
        if (d < 0) d += PERIMETER_MID;
        return getPosCCW(d, radius);
    };

    const getSegmentPath = (i: number) => {
        const dCenter = (OFFSET_D - (i * SEGMENT_LENGTH)) % PERIMETER_MID;
        const dStart = (dCenter + SEGMENT_LENGTH / 2);
        const dEnd = (dCenter - SEGMENT_LENGTH / 2);

        const norm = (val: number) => {
            let v = val % PERIMETER_MID;
            if (v < 0) v += PERIMETER_MID;
            return v;
        };

        const p1 = getPosCCW(norm(dStart), R_OUTER);
        const p2 = getPosCCW(norm(dEnd), R_OUTER);
        const p3 = getPosCCW(norm(dEnd), R_INNER);
        const p4 = getPosCCW(norm(dStart), R_INNER);

        let d = `M ${p1.x} ${p1.y}`;
        if (p1.section === p2.section && (p1.section === 'TOP' || p1.section === 'BOT')) {
            d += ` A ${R_OUTER} ${R_OUTER} 0 0 1 ${p2.x} ${p2.y}`;
        } else {
            d += ` L ${p2.x} ${p2.y}`;
        }
        d += ` L ${p3.x} ${p3.y}`;
        d += ` L ${p4.x} ${p4.y}`;
        d += ` Z`;
        return d;
    };

    // --- CHECK IN ZONE ---
    const isInZone = (idx: number, zoneName: string | null) => {
        if (!zoneName) return false;
        if (zoneName === 'VOISINS') {
            return (idx >= ZONE_RANGES.VOISINS.start || idx <= ZONE_RANGES.VOISINS.end);
        }
        if (zoneName === 'TIERS') {
            return (idx >= ZONE_RANGES.TIERS.start && idx <= ZONE_RANGES.TIERS.end);
        }
        if (zoneName === 'ORPHELINS') {
            const inRight = (idx >= ZONE_RANGES.ORPHELINS_RIGHT.start && idx <= ZONE_RANGES.ORPHELINS_RIGHT.end);
            const inLeft = (idx >= ZONE_RANGES.ORPHELINS_LEFT.start && idx <= ZONE_RANGES.ORPHELINS_LEFT.end);
            return inRight || inLeft;
        }
        if (zoneName === 'ZERO') {
            return (idx >= 33 || idx <= 2);
        }
        return false;
    };

    const trackItems = useMemo(() => {
        return RACETRACK_SEQUENCE.map((num, i) => {
            const dCenter = (OFFSET_D - (i * SEGMENT_LENGTH)) % PERIMETER_MID;
            let dNorm = dCenter;
            if (dNorm < 0) dNorm += PERIMETER_MID;

            const pos = getPosCCW(dNorm, R_MID);
            const rot = (pos.angle * 180 / Math.PI) + 90;

            let baseColor = '#000';
            if (num === 0) baseColor = COLORS.BET_GREEN;
            else if (isRed(num)) baseColor = COLORS.BET_RED;
            else baseColor = COLORS.BET_BLACK;

            return {
                num,
                index: i,
                path: getSegmentPath(i),
                textPos: pos,
                rot,
                baseColor
            };
        });
    }, [PERIMETER_MID, R_OUTER, R_INNER, SEGMENT_LENGTH]);


    // --- INNER ZONES GEOMETRY ---
    // We visually divide the inner void into 3 main blocks: 
    // 1. VOISINS (Top)
    // 2. ORPHELINS (Middle)
    // 3. TIERS (Bottom)
    // And a sub-zone ZERO SPIEL inside Voisins.

    // Calculate "Cut Points" on the Inner Radius
    const getInnerPoint = (i: number, side: 'Start' | 'End') => {
        // Start of i: d = Offset - i*Seg + Seg/2
        // End of i:   d = Offset - i*Seg - Seg/2
        const dCenter = (OFFSET_D - (i * SEGMENT_LENGTH));
        const d = side === 'Start' ? dCenter + SEGMENT_LENGTH / 2 : dCenter - SEGMENT_LENGTH / 2;

        let val = d % PERIMETER_MID;
        if (val < 0) val += PERIMETER_MID;

        return getPosCCW(val, R_INNER);
    };

    // VOISINS: Index 27 (End of Orph Left) -> Index 8 (Start of Orph Right) ?
    // Actually Voisins Range: Starts 28, Ends 7.
    // So "Cut Line" is between Index 28 (Start) and Index 7 (End).
    // Wait, 28 is on the Left. 7 is on the Right.
    // So we connect InnerPoint(28, Start) to InnerPoint(7, End)?
    // Or InnerPoint(28, corner) to InnerPoint(7, corner).
    // Let's use the explicit boundaries we used for Regions.

    // Bounds Indices:
    // Voisins: [28, 29... 0 ... 7]
    // Tiers: [11 ... 22]
    // Orphelins: The Middle.

    const pVoisinsLeft = getInnerPoint(28, 'Start'); // The logical start of Voisins zone
    const pVoisinsRight = getInnerPoint(7, 'End'); // The logical end of Voisins zone

    const pTiersRight = getInnerPoint(11, 'Start'); // Start of Tiers
    const pTiersLeft = getInnerPoint(22, 'End'); // End of Tiers

    // Construct Paths
    // 1. VOISINS PATH
    // Trace Inner Track from 28(Start) -> 7(End) -> Line to 28(Start)
    const getZonePath = (indices: number[], closeLine: boolean = true) => {
        if (!indices.length) return '';
        const startI = indices[0];
        const endI = indices[indices.length - 1];

        // Move to Start
        const pStart = getInnerPoint(startI, 'Start');
        let d = `M ${pStart.x} ${pStart.y}`;

        // Trace Inner
        indices.forEach(i => {
            const pEnd = getInnerPoint(i, 'End');
            // We can use Line or Arc. For simplicity & robustness, Lines.
            // (37 segments is smooth enough)
            d += ` L ${pEnd.x} ${pEnd.y}`;
        });

        // Close
        if (closeLine) {
            d += ` Z`;
        }
        return d;
    };

    // Helper to get range
    const getIndices = (start: number, end: number) => {
        const list = [];
        let curr = start;
        if (curr === end) return [curr];
        while (true) {
            list.push(curr);
            if (curr === end) break;
            curr = (curr + 1) % 37;
        }
        return list;
    };

    const voisinsIndices = getIndices(28, 7);
    const tiersIndices = getIndices(11, 22);
    // Orphelins is the "Rest". We can construct it by connecting the 4 points:
    // VoisinsLeft -> VoisinsRight -> TiersRight -> TiersLeft -> Z
    // But we need to trace the track edges for OrphRight and OrphLeft.
    // OrphRight: 8..10.
    // OrphLeft: 23..27.

    const orphRightIndices = getIndices(8, 10);
    const orphLeftIndices = getIndices(23, 27);

    // ORPHELINS PATH: 
    // Start at VoisinsRight (End of 7) -> Trace OrphRight (8..10) -> TiersRight (Start of 11)
    // -> Line to TiersLeft (End of 22) -> Trace OrphLeft (23..27) -> VoisinsLeft (Start of 28)
    // -> Line to Start.

    const getOrphelinsPath = () => {
        // 1. Start at End of Voisins (which is Start of OrphRight basically, coincident points)
        const pStart = getInnerPoint(7, 'End');
        let d = `M ${pStart.x} ${pStart.y}`;

        // 2. Trace Orph Right
        orphRightIndices.forEach(i => {
            const p = getInnerPoint(i, 'End');
            d += ` L ${p.x} ${p.y}`;
        });

        // 3. Line to Tiers Left (Actually Tiers End is 22... wait Tiers Start is 11)
        // We just finished 10. Next is 11.
        // Effectively we are at Start of 11. 
        // We want to draw a Line across to End of 22? 
        // NO. We want to draw a line to the Start of the Orph Left side?
        // The Orphelins zone fills the middle.
        // So it connects the "Right Side" to the "Left Side".
        // Connection 1: End of OrphRight (10) -> Start of Tiers (11)? 
        // No, Tiers is the bottom cap.
        // So Orphelins touches Tiers.
        // So we trace 8..10. Now we are at boundary with Tiers.
        // We draw Line to boundary of Tiers/OrphLeft? 
        // Tiers is 11..22.
        // So boundary is between 22 and 23.
        // We draw Line from (End of 10) to (Start of 23)?
        // Or do we include Tiers boundary?
        // The border is the line connecting EndOf10 and StartOf23? No.
        // The border is strict.
        // Visually, Orphelins is a polygon covering the middle void.
        // One visual edge is the boundary with Voisins.
        // Other edge is boundary with Tiers.
        // So:
        // Edge 1 (Top): Line from VoisinsRight(7_End) to VoisinsLeft(28_start).
        // Edge 2 (Right): Inner Track 8..10.
        // Edge 3 (Bottom): Line from TiersRight(11_start) to TiersLeft(22_end).
        // Edge 4 (Left): Inner Track 27..23 (Reverse).

        // Let's build this.

        // A: Move to VoisinsRight (7 End / 8 Start)
        // B: Trace 8..10. End at 10 End.
        // 11 is Tiers Start (Bottom Right).
        // So 10 End connects to 11 Start.
        // But Tiers Zone is a "Cap".
        // The Orphelins Zone shares the "Cut Line" with Tiers.
        // Cut Line connects 11_Start and 22_End.
        // So we go 10_End -> 11_Start -> (Line across) -> 22_End -> (Trace Backwards 27..23) -> 23_Start -> (Line across) -> 8_Start?
        // No. 
        // 23_Start is OrphLeft Start.
        // 23..27 goes UP the Left side.
        // 27 End connects to 28 Start (Voisins Left).
        // Voisins Cut Line connects 28_Start and 7_End.

        // Path:
        // 1. Move to 7_End (Right Top).
        // 2. Trace 8..10 (Right Side Down). Ends at 10_End (Right Bot).
        // 3. Line to 22_End (Left Bot).  <-- This is the Tiers Boundary Line.
        // 4. Trace 23..27 (Left Side Up). Need to verify order.
        //    Indices 23..27 go Up? 
        //    CCW Geometry: 23 is Bot Left. 27 is Top Left.
        //    Yes. So we trace 23 -> 27?
        const p22End = getInnerPoint(22, 'End');
        d += ` L ${p22End.x} ${p22End.y}`;

        // Trace 23..27? No, our trace logic (getInnerPoint) follows CCW index order?
        // 23..27 is [23, 24, 25, 26, 27].
        // 23 is Bottom Left.
        // 27 is Top Left.
        // So tracing 23->27 goes UP perfectly.
        // BUT we are at 22_End (which is 23_Start).
        // So we just Trace 23..27 normally.
        orphLeftIndices.forEach(i => {
            const p = getInnerPoint(i, 'End');
            d += ` L ${p.x} ${p.y}`;
        });

        // Now at 27_End.
        // Line to 7_End (Start Point). <-- This is Voisins Boundary Line.
        d += ` Z`;

        return d;
    };

    // ZERO SPIEL: Subzone within Voisins. 
    // Indices: [33, 34, 35, 36, 0, 1, 2] -> 12, 35, 3, 26, 0, 32, 15.
    // Range: 33..2.
    // It's the "Tip" of the Voisins Cap.
    // We can draw it overlaying Voisins.
    // Boundary of Zero Spiel is 33_Start and 2_End.
    const zeroSpielIndices = getIndices(33, 2);

    const pathVoisins = getZonePath(voisinsIndices);
    const pathTiers = getZonePath(tiersIndices);
    const pathOrphelins = getOrphelinsPath();
    const pathZero = getZonePath(zeroSpielIndices);

    // Labels Positions (Centroids adjustment)
    // Voisins: Inside Top Cap. Center of Cap is CY_TOP.
    // Zero Spiel: Very Top Tip.
    // Tiers: Inside Bottom Cap. Center of Cap is CY_BOT.

    // We want Voisins Text to be inside the Top Arc area.
    // CY_TOP is the center of the arc.
    // So let's place it slightly "Up" from the center of the arc to be distinct from Orphelins.
    const pVoisinsCenter = { x: CX, y: CY_TOP - (R_INNER * 0.4) };

    // Tiers Text: Inside Bottom Arc.
    const pTiersCenter = { x: CX, y: CY_BOT + (R_INNER * 0.4) };

    const pOrphelinsCenter = { x: CX, y: CY };

    // Zero Spiel: Inside Voisins, closer to the '0' at the top.
    const pZeroCenter = { x: CX, y: CY_TOP - (R_INNER * 0.75) };

    const handleCallBet = (seq: number[]) => {
        seq.forEach(n => placeBet(n.toString(), selectedChipValue));
        HapticManager.playChipSound();
    };

    return (
        <View style={styles.container}>
            <Svg width={W} height={H}>
                <Defs />

                {/* TRACK ITEMS (Outer Ring) */}
                {trackItems.map((item) => {
                    const betAmt = bets[item.num.toString()] || 0;

                    // Interaction Logic
                    const isZoneActive = activeZone !== null;
                    const belongsToZone = isInZone(item.index, activeZone);

                    let opacity = 1;
                    let strokeWidth = 1;
                    let strokeColor = "rgba(255,255,255,0.2)";

                    if (isZoneActive) {
                        if (belongsToZone) {
                            opacity = 1;
                            strokeWidth = 2;
                            strokeColor = "#FFF"; // Highlight border
                        } else {
                            opacity = 0.3; // Dim others
                        }
                    }

                    return (
                        <G key={item.num} onPress={() => handleCallBet([item.num])}>
                            <Path
                                d={item.path}
                                fill={item.baseColor}
                                fillOpacity={opacity}
                                stroke={strokeColor}
                                strokeWidth={strokeWidth}
                            />
                            {betAmt > 0 ? (
                                <Circle
                                    cx={item.textPos.x}
                                    cy={item.textPos.y}
                                    r={9}
                                    fill={getChipColor(betAmt)}
                                    stroke="#000"
                                    opacity={opacity}
                                />
                            ) : (
                                <SvgText
                                    x={item.textPos.x}
                                    y={item.textPos.y}
                                    fill="#FFF"
                                    fillOpacity={opacity}
                                    fontSize={12}
                                    fontWeight="bold"
                                    textAnchor="middle"
                                    alignmentBaseline="middle"
                                    rotation={item.rot}
                                    origin={`${item.textPos.x}, ${item.textPos.y}`}
                                >
                                    {item.num}
                                </SvgText>
                            )}
                        </G>
                    );
                })}

                {/* INNER ZONES (The Backgrounds) */}
                {/* 1. Voisins (Base) */}
                <G onPress={() => handleCallBet(SEQ_VOISINS_ZERO)} onPressIn={() => setActiveZone('VOISINS')} onPressOut={() => setActiveZone(null)}>
                    <Path d={pathVoisins} fill="none" stroke={COLORS.ACCENT_GOLD} strokeWidth={2} />
                    <SvgText x={pVoisinsCenter.x} y={pVoisinsCenter.y} fill={COLORS.ACCENT_GOLD} fontSize={14} fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">
                        VOISINS
                    </SvgText>
                </G>

                {/* 2. Orphelins */}
                <G onPress={() => handleCallBet(SEQ_ORPHELINS)} onPressIn={() => setActiveZone('ORPHELINS')} onPressOut={() => setActiveZone(null)}>
                    <Path d={pathOrphelins} fill="none" stroke={COLORS.ACCENT_GOLD} strokeWidth={2} />
                    <SvgText x={pOrphelinsCenter.x} y={pOrphelinsCenter.y} fill={COLORS.ACCENT_GOLD} fontSize={14} fontWeight="bold" textAnchor="middle" alignmentBaseline="middle" origin={`${pOrphelinsCenter.x}, ${pOrphelinsCenter.y}`}>
                        ORPHELINS
                    </SvgText>
                </G>

                {/* 3. Tiers */}
                <G onPress={() => handleCallBet(SEQ_TIERS)} onPressIn={() => setActiveZone('TIERS')} onPressOut={() => setActiveZone(null)}>
                    <Path d={pathTiers} fill="none" stroke={COLORS.ACCENT_GOLD} strokeWidth={2} />
                    <SvgText x={pTiersCenter.x} y={pTiersCenter.y} fill={COLORS.ACCENT_GOLD} fontSize={14} fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">
                        TIERS
                    </SvgText>
                </G>

                {/* 4. Zero Spiel (Overlay on Voisins) */}
                <G onPress={() => handleCallBet(SEQ_JEU0)} onPressIn={() => setActiveZone('ZERO')} onPressOut={() => setActiveZone(null)}>
                    <Path d={pathZero} fill="none" stroke={COLORS.ACCENT_GOLD} strokeWidth={2} />
                    <SvgText x={pZeroCenter.x} y={pZeroCenter.y} fill={COLORS.ACCENT_GOLD} fontSize={10} fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">
                        ZERO
                    </SvgText>
                </G>
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
