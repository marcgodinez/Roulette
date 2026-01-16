import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { G, Text as SvgText, Defs, Path, Circle, Rect } from 'react-native-svg';
import { COLORS, SHADOWS } from '../constants/theme';
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

const ZONE_RANGES = {
    VOISINS: { start: 28, end: 7, count: 17, color: '#FFD700' },
    ORPHELINS_RIGHT: { start: 8, end: 10, count: 3, color: '#FF8C00' },
    TIERS: { start: 11, end: 22, count: 12, color: '#00BFFF' },
    ORPHELINS_LEFT: { start: 23, end: 27, count: 5, color: '#FF8C00' }
};

export const RacetrackBoard = ({ width, height }: RacetrackBoardProps) => {
    const { placeBet, selectedChipValue, bets } = useGameStore();
    const [activeZone, setActiveZone] = useState<string | null>(null);

    const PADDING = 10;
    const TRACK_THICKNESS = 70;
    const W = width;
    const H = height;
    const maxDiameter = Math.min(W * 0.95, H * 0.95);
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

    const getPosCCW = (d: number, r: number) => {
        const arcHalf = Math.PI * R_MID;
        if (d < arcHalf) {
            const angle = -(d / R_MID);
            return { x: CX + r * Math.cos(angle), y: CY_TOP + r * Math.sin(angle), angle, section: 'TOP' };
        }
        d -= arcHalf;
        if (d < L_STRAIGHT) return { x: CX - r, y: CY_TOP + d, angle: -Math.PI, section: 'LEFT' };
        d -= L_STRAIGHT;
        if (d < arcHalf) {
            const angle = -Math.PI - (d / R_MID);
            return { x: CX + r * Math.cos(angle), y: CY_BOT + r * Math.sin(angle), angle, section: 'BOT' };
        }
        d -= arcHalf;
        return { x: CX + r, y: CY_BOT - d, angle: 0, section: 'RIGHT' };
    };

    const getSegmentPath = (i: number) => {
        const dCenter = (OFFSET_D - (i * SEGMENT_LENGTH)) % PERIMETER_MID;
        const dStart = (dCenter + SEGMENT_LENGTH / 2);
        const dEnd = (dCenter - SEGMENT_LENGTH / 2);
        const norm = (val: number) => { let v = val % PERIMETER_MID; if (v < 0) v += PERIMETER_MID; return v; };
        const p1 = getPosCCW(norm(dStart), R_OUTER);
        const p2 = getPosCCW(norm(dEnd), R_OUTER);
        const p3 = getPosCCW(norm(dEnd), R_INNER);
        const p4 = getPosCCW(norm(dStart), R_INNER);
        let d = `M ${p1.x} ${p1.y}`;
        if (p1.section === p2.section && (p1.section === 'TOP' || p1.section === 'BOT')) d += ` A ${R_OUTER} ${R_OUTER} 0 0 1 ${p2.x} ${p2.y}`;
        else d += ` L ${p2.x} ${p2.y}`;
        d += ` L ${p3.x} ${p3.y}`;
        d += ` L ${p4.x} ${p4.y}`;
        d += ` Z`;
        return d;
    };

    const isInZone = (idx: number, zoneName: string | null) => {
        if (!zoneName) return false;
        if (zoneName === 'VOISINS') return (idx >= ZONE_RANGES.VOISINS.start || idx <= ZONE_RANGES.VOISINS.end);
        if (zoneName === 'TIERS') return (idx >= ZONE_RANGES.TIERS.start && idx <= ZONE_RANGES.TIERS.end);
        if (zoneName === 'ORPHELINS') {
            const inRight = (idx >= ZONE_RANGES.ORPHELINS_RIGHT.start && idx <= ZONE_RANGES.ORPHELINS_RIGHT.end);
            const inLeft = (idx >= ZONE_RANGES.ORPHELINS_LEFT.start && idx <= ZONE_RANGES.ORPHELINS_LEFT.end);
            return inRight || inLeft;
        }
        if (zoneName === 'ZERO') return (idx >= 33 || idx <= 2);
        return false;
    };

    const formatChipValue = (val: number) => {
        if (val >= 1e6) return (val / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
        if (val >= 1e3) return (val / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
        return val.toString();
    };

    const trackItems = useMemo(() => {
        return RACETRACK_SEQUENCE.map((num, i) => {
            const dCenter = (OFFSET_D - (i * SEGMENT_LENGTH)) % PERIMETER_MID;
            let dNorm = dCenter; if (dNorm < 0) dNorm += PERIMETER_MID;
            const pos = getPosCCW(dNorm, R_MID);
            const rot = (pos.angle * 180 / Math.PI) + 90;
            let baseColor = '#000';
            if (num === 0) baseColor = COLORS.BET_GREEN;
            else if (isRed(num)) baseColor = COLORS.BET_RED;
            else baseColor = COLORS.BET_BLACK;
            return { num, index: i, path: getSegmentPath(i), textPos: pos, rot, baseColor };
        });
    }, [PERIMETER_MID, R_OUTER, R_INNER, SEGMENT_LENGTH]);

    const FELT_COLOR = COLORS.BG_MAIN;
    const LINE_COLOR = COLORS.ACCENT_GOLD;
    const LINE_WIDTH = 2; // Thicker Neon Line

    const getInnerPoint = (i: number, side: 'Start' | 'End') => {
        const dCenter = (OFFSET_D - (i * SEGMENT_LENGTH));
        const d = side === 'Start' ? dCenter + SEGMENT_LENGTH / 2 : dCenter - SEGMENT_LENGTH / 2;
        let val = d % PERIMETER_MID; if (val < 0) val += PERIMETER_MID;
        return getPosCCW(val, R_INNER);
    };

    const getIndices = (start: number, end: number) => {
        const list = []; let curr = start; if (curr === end) return [curr];
        while (true) { list.push(curr); if (curr === end) break; curr = (curr + 1) % 37; }
        return list;
    };
    const getRimTrace = (indices: number[]) => {
        let d = '';
        indices.forEach((i, idx) => {
            const pStart = getInnerPoint(i, 'Start');
            const pEnd = getInnerPoint(i, 'End');
            if (idx === 0) d += `M ${pStart.x} ${pStart.y} `; else d += `L ${pStart.x} ${pStart.y} `;
            d += `L ${pEnd.x} ${pEnd.y} `;
        });
        return d;
    };

    const voisinIndices = getIndices(28, 7);
    let pathVoisinsVisual = getRimTrace(voisinIndices) + " Z";
    const tiersIndices = getIndices(11, 22);
    let pathTiersVisual = getRimTrace(tiersIndices) + " Z";
    const pA = getInnerPoint(7, 'End');
    let pathOrphelinsVisual = `M ${pA.x} ${pA.y} `;
    const orphRightIndices = getIndices(8, 10);
    orphRightIndices.forEach(i => { const pE = getInnerPoint(i, 'End'); pathOrphelinsVisual += `L ${pE.x} ${pE.y} `; });
    const pC = getInnerPoint(22, 'End'); pathOrphelinsVisual += `L ${pC.x} ${pC.y} `;
    const orphLeftIndices = getIndices(23, 27);
    orphLeftIndices.forEach(i => { const pS = getInnerPoint(i, 'Start'); const pE = getInnerPoint(i, 'End'); pathOrphelinsVisual += `L ${pS.x} ${pS.y} L ${pE.x} ${pE.y} `; });
    pathOrphelinsVisual += "Z";

    const ZERO_ARC_ANGLE = 60; const ZERO_BAND_DEPTH = 45; const degToRad = (deg: number) => (deg * Math.PI) / 180;
    const rStart = degToRad(-90 - (ZERO_ARC_ANGLE / 2)); const rEnd = degToRad(-90 + (ZERO_ARC_ANGLE / 2));
    const R_Z_OUTER = R_INNER; const R_Z_INNER = R_INNER - ZERO_BAND_DEPTH;
    const p1 = { x: CX + R_Z_OUTER * Math.cos(rStart), y: CY_TOP + R_Z_OUTER * Math.sin(rStart) };
    const p2 = { x: CX + R_Z_OUTER * Math.cos(rEnd), y: CY_TOP + R_Z_OUTER * Math.sin(rEnd) };
    const p3 = { x: CX + R_Z_INNER * Math.cos(rEnd), y: CY_TOP + R_Z_INNER * Math.sin(rEnd) };
    const p4 = { x: CX + R_Z_INNER * Math.cos(rStart), y: CY_TOP + R_Z_INNER * Math.sin(rStart) };
    const ZeroSectorPath = `M ${p1.x} ${p1.y} A ${R_Z_OUTER} ${R_Z_OUTER} 0 0 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${R_Z_INNER} ${R_Z_INNER} 0 0 0 ${p4.x} ${p4.y} Z`;

    const Y_Zero_Bot = CY_TOP - R_INNER + ZERO_BAND_DEPTH;
    const P_Vois_Left = getInnerPoint(28, 'Start'); const P_Vois_Right = getInnerPoint(7, 'End');
    const Y_Orph_Top = (P_Vois_Left.y + P_Vois_Right.y) / 2;
    const P_Tiers_Left = getInnerPoint(22, 'End'); const P_Tiers_Right = getInnerPoint(11, 'Start');
    const Y_Orph_Bot = (P_Tiers_Left.y + P_Tiers_Right.y) / 2;
    const Y_Void_Bot = CY_BOT + R_INNER;
    const pZero = { x: CX + ((R_Z_OUTER + R_Z_INNER) / 2) * Math.cos(degToRad(-90)), y: CY_TOP + ((R_Z_OUTER + R_Z_INNER) / 2) * Math.sin(degToRad(-90)) };
    const pVoisinsLabel = { x: CX, y: (Y_Zero_Bot + Y_Orph_Top) / 2 };
    const pOrphelinsLabel = { x: CX, y: (Y_Orph_Top + Y_Orph_Bot) / 2 };
    const pTiersLabel = { x: CX, y: (Y_Orph_Bot + Y_Void_Bot) / 2 };

    const handleCallBet = (seq: number[]) => { seq.forEach(n => placeBet(n.toString(), selectedChipValue)); HapticManager.playChipSound(); };

    return (
        <View style={styles.container}>
            <Svg width={W} height={H} style={{ zIndex: 10 }}>
                <Defs />
                <Rect x={CX - R_INNER} y={CY_TOP} width={R_INNER * 2} height={L_STRAIGHT} fill={FELT_COLOR} />
                <Circle cx={CX} cy={CY_TOP} r={R_INNER} fill={FELT_COLOR} />
                <Circle cx={CX} cy={CY_BOT} r={R_INNER} fill={FELT_COLOR} />
                {trackItems.map((item) => {
                    const betAmt = bets[item.num.toString()] || 0;
                    const isZoneActive = activeZone !== null;
                    const belongsToZone = isInZone(item.index, activeZone);
                    let opacity = 1; let strokeWidth = 1; let strokeColor = "rgba(255,255,255,0.2)";
                    if (isZoneActive) {
                        if (belongsToZone) { opacity = 1; strokeWidth = 2; strokeColor = "#FFF"; } else { opacity = 0.3; }
                    }
                    return (
                        <G key={item.num} onPress={() => handleCallBet([item.num])} onPressIn={() => setActiveZone(null)}>
                            <Path d={item.path} fill={item.baseColor} fillOpacity={opacity} stroke={strokeColor} strokeWidth={strokeWidth} />
                            {betAmt > 0 ? (
                                <G>
                                    <Circle cx={item.textPos.x} cy={item.textPos.y + 2} r={13} fill="rgba(0,0,0,0.5)" />
                                    <Circle cx={item.textPos.x} cy={item.textPos.y} r={13} fill={getChipColor(betAmt)} stroke="#000" strokeWidth={1} opacity={opacity} />
                                    <SvgText x={item.textPos.x} y={item.textPos.y} fill="#FFF" fontSize={9} fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">{formatChipValue(betAmt)}</SvgText>
                                </G>
                            ) : (
                                <SvgText x={item.textPos.x} y={item.textPos.y} fill="#FFF" fillOpacity={opacity} fontSize={13} fontWeight="bold" textAnchor="middle" alignmentBaseline="middle" rotation={item.rot} origin={`${item.textPos.x}, ${item.textPos.y}`}>{item.num}</SvgText>
                            )}
                        </G>
                    );
                })}
                <Path d={pathVoisinsVisual} fill={COLORS.ACCENT_GOLD} fillOpacity={0.15} stroke={LINE_COLOR} strokeWidth={LINE_WIDTH} />
                <Path d={pathTiersVisual} fill={COLORS.ACCENT_GOLD} fillOpacity={0.15} stroke={LINE_COLOR} strokeWidth={LINE_WIDTH} />
                <Path d={pathOrphelinsVisual} fill={COLORS.ACCENT_GOLD} fillOpacity={0.15} stroke={LINE_COLOR} strokeWidth={LINE_WIDTH} />
                <Path d={ZeroSectorPath} fill={COLORS.ACCENT_GOLD} fillOpacity={0.3} stroke={LINE_COLOR} strokeWidth={LINE_WIDTH} />

                <G onPress={() => handleCallBet(SEQ_VOISINS_ZERO)} onPressIn={() => setActiveZone('VOISINS')} onPressOut={() => setActiveZone(null)}>
                    <Path d={pathVoisinsVisual} fill="transparent" />
                    <SvgText x={pVoisinsLabel.x} y={pVoisinsLabel.y} fill={COLORS.ACCENT_GOLD} fontSize={16} fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">VOISINS</SvgText>
                </G>
                <G onPress={() => handleCallBet(SEQ_ORPHELINS)} onPressIn={() => setActiveZone('ORPHELINS')} onPressOut={() => setActiveZone(null)}>
                    <Path d={pathOrphelinsVisual} fill="transparent" />
                    <SvgText x={pOrphelinsLabel.x} y={pOrphelinsLabel.y} fill={COLORS.ACCENT_GOLD} fontSize={16} fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">ORPHELINS</SvgText>
                </G>
                <G onPress={() => handleCallBet(SEQ_TIERS)} onPressIn={() => setActiveZone('TIERS')} onPressOut={() => setActiveZone(null)}>
                    <Path d={pathTiersVisual} fill="transparent" />
                    <SvgText x={pTiersLabel.x} y={pTiersLabel.y} fill={COLORS.ACCENT_GOLD} fontSize={16} fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">TIERS</SvgText>
                </G>
                <G onPress={() => handleCallBet(SEQ_JEU0)} onPressIn={() => setActiveZone('ZERO')} onPressOut={() => setActiveZone(null)}>
                    <Path d={ZeroSectorPath} fill="transparent" />
                    <SvgText x={pZero.x} y={pZero.y} fill={COLORS.TEXT_PRIMARY} fontSize={10} fontWeight="bold" textAnchor="middle" alignmentBaseline="middle">ZERO</SvgText>
                </G>
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center', alignItems: 'center',
        transform: [{ perspective: 1000 }, { rotateX: '15deg' }],
        shadowColor: COLORS.ACCENT_BLUE, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.8, shadowRadius: 30, // HOLOGRAPHIC BLUE GLOW
        elevation: 10,
    },
});
