package com.marcgodinez.roulette.ui.game

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.marcgodinez.roulette.data.GameConstants
import com.marcgodinez.roulette.data.GameConstants.RACETRACK_SEQUENCE
import com.marcgodinez.roulette.data.GameConstants.SEQ_JEU0
import com.marcgodinez.roulette.data.GameConstants.SEQ_ORPHELINS
import com.marcgodinez.roulette.data.GameConstants.SEQ_TIERS
import com.marcgodinez.roulette.data.GameConstants.SEQ_VOISINS_ZERO
import com.marcgodinez.roulette.ui.theme.*
import com.marcgodinez.roulette.utils.NumberUtils
import kotlin.math.*
import kotlin.math.PI
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.hypot
import kotlin.math.min
import kotlin.math.sin

// Zone Ranges and Colors (Parity with Expo consts)
private val ZONE_RANGES =
        mapOf(
                "VOISINS" to ZoneRange(28, 7),
                "ORPHELINS_RIGHT" to ZoneRange(8, 10),
                "TIERS" to ZoneRange(11, 22),
                "ORPHELINS_LEFT" to ZoneRange(23, 27)
        )

data class ZoneRange(val start: Int, val end: Int)

data class PosResult(val x: Float, val y: Float, val angle: Float, val section: String)

@Composable
fun RacetrackBoard(bets: Map<String, Int>, onPlaceBet: (List<Int>) -> Unit) {
    var activeZone by remember { mutableStateOf<String?>(null) }
    val textMeasurer = rememberTextMeasurer()

    Box(
            modifier =
                    Modifier.fillMaxSize().graphicsLayer {
                        rotationX = 15f
                        cameraDistance = 12f * density
                        shadowElevation = 10.dp.toPx()
                    }
    ) {
        Canvas(
                modifier =
                        Modifier.fillMaxSize().pointerInput(Unit) {
                            awaitEachGesture {
                                val down = awaitFirstDown()
                                var currentHit: Any? = null

                                // Layout Constants (Recalculated on gesture start to be safe with
                                // size)
                                val W = size.width.toFloat()
                                val H = size.height.toFloat()
                                val PADDING = 10.dp.toPx()
                                val TRACK_THICKNESS = 48.dp.toPx()
                                val maxDiameter = min(W * 0.95f, H * 0.95f)
                                val R_OUTER = maxDiameter / 2f
                                val R_INNER = R_OUTER - TRACK_THICKNESS
                                val R_MID = R_OUTER - (TRACK_THICKNESS / 2f)
                                val L_STRAIGHT =
                                        (H - (2 * R_OUTER) - (2 * PADDING)).coerceAtLeast(0f)
                                val CX = W / 2f
                                val CY = H / 2f
                                val CY_TOP = CY - L_STRAIGHT / 2f
                                val CY_BOT = CY + L_STRAIGHT / 2f
                                val ARC_LEN = (PI * R_MID).toFloat()
                                val PERIMETER_MID = 2 * ARC_LEN + 2 * L_STRAIGHT
                                val SEGMENT_LENGTH = PERIMETER_MID / 37f
                                val OFFSET_D = ((PI / 2f) * R_MID) - (0.5f * SEGMENT_LENGTH)

                                fun getPosCCW(dVal: Double, r: Float): Offset {
                                    var d = dVal
                                    val arcHalf = PI * R_MID
                                    if (d < arcHalf) {
                                        val angle = -(d / R_MID.toDouble())
                                        return Offset(
                                                (CX + r * cos(angle)).toFloat(),
                                                (CY_TOP + r * sin(angle)).toFloat()
                                        )
                                    }
                                    d -= arcHalf
                                    if (d < L_STRAIGHT) {
                                        return Offset((CX - r).toFloat(), (CY_TOP + d).toFloat())
                                    }
                                    d -= L_STRAIGHT
                                    if (d < arcHalf) {
                                        val angle = -PI - (d / R_MID.toDouble())
                                        return Offset(
                                                (CX + r * cos(angle)).toFloat(),
                                                (CY_BOT + r * sin(angle)).toFloat()
                                        )
                                    }
                                    d -= arcHalf
                                    return Offset((CX + r).toFloat(), (CY_BOT - d).toFloat())
                                }

                                fun norm(vIn: Double): Double {
                                    var v = vIn % PERIMETER_MID
                                    if (v < 0) v += PERIMETER_MID
                                    return v
                                }

                                fun getInnerPoint(i: Int, side: String): Offset {
                                    val dCenter = (OFFSET_D - (i * SEGMENT_LENGTH))
                                    val d =
                                            if (side == "Start") dCenter + SEGMENT_LENGTH / 2.0
                                            else dCenter - SEGMENT_LENGTH / 2.0
                                    return getPosCCW(norm(d), R_INNER)
                                }

                                fun getIndices(start: Int, end: Int): List<Int> {
                                    val list = mutableListOf<Int>()
                                    var curr = start
                                    if (curr == end) return listOf(curr)
                                    while (true) {
                                        list.add(curr)
                                        if (curr == end) break
                                        curr = (curr + 1) % 37
                                    }
                                    return list
                                }

                                // Process Logic
                                fun processTouch(offset: Offset) {
                                    // 1. Check Zones
                                    var hitZone: String? = null

                                    // ZERO Zone Check
                                    val distTop = hypot(offset.x - CX, offset.y - CY_TOP)
                                    if (offset.y < CY_TOP) {
                                        val angleRad = atan2(offset.y - CY_TOP, offset.x - CX)
                                        val angleDeg = Math.toDegrees(angleRad.toDouble())
                                        val zeroBandDepth = 45.dp.toPx()
                                        if (distTop >= (R_INNER - zeroBandDepth) &&
                                                        distTop <= R_INNER
                                        ) {
                                            if (angleDeg in -120.0..-60.0) hitZone = "ZERO"
                                        }
                                    }

                                    // Polygons
                                    if (hitZone == null) {
                                        fun checkPoly(indices: List<Int>, zoneName: String) {
                                            if (hitZone != null) return
                                            val poly = mutableListOf<Offset>()
                                            // Start points + End points logic slightly simplified
                                            // for closed loop roughly
                                            // Using standard Order:
                                            indices.forEach { i ->
                                                poly.add(getInnerPoint(i, "Start"))
                                                poly.add(getInnerPoint(i, "End"))
                                            }
                                            if (isPointInPolygon(offset, poly)) hitZone = zoneName
                                        }

                                        checkPoly(getIndices(28, 7), "VOISINS")
                                        checkPoly(getIndices(11, 22), "TIERS")

                                        if (hitZone == null) {
                                            // M 7End -> loop 8..10 (End) -> L 22End -> loop
                                            // 23..27 (Start, End) -> Z

                                            val orphPoly = mutableListOf<Offset>()
                                            orphPoly.add(getInnerPoint(7, "End"))
                                            getIndices(8, 10).forEach { i ->
                                                // Expo loop: const pE = getInnerPoint(i,
                                                // 'End'); path += L pE
                                                // It uses Ends.
                                                orphPoly.add(getInnerPoint(i, "End"))
                                            }
                                            orphPoly.add(getInnerPoint(22, "End"))
                                            getIndices(23, 27).forEach { i ->
                                                orphPoly.add(getInnerPoint(i, "Start"))
                                                orphPoly.add(getInnerPoint(i, "End"))
                                            }
                                            if (isPointInPolygon(offset, orphPoly)) {
                                                hitZone = "ORPHELINS"
                                            }
                                        }
                                    }

                                    // 2. Check Numbers
                                    val hitNum =
                                            if (hitZone == null) {
                                                getTrackNumberAt(
                                                        offset,
                                                        CX,
                                                        CY_TOP,
                                                        CY_BOT,
                                                        R_INNER,
                                                        R_OUTER,
                                                        R_MID,
                                                        L_STRAIGHT,
                                                        OFFSET_D,
                                                        PERIMETER_MID,
                                                        SEGMENT_LENGTH
                                                )
                                            } else null

                                    // Decision
                                    if (hitZone != null) {
                                        if (currentHit != hitZone) {
                                            activeZone = hitZone
                                            val seq =
                                                    when (hitZone) {
                                                        "VOISINS" -> SEQ_VOISINS_ZERO
                                                        "TIERS" -> SEQ_TIERS
                                                        "ORPHELINS" -> SEQ_ORPHELINS
                                                        "ZERO" -> SEQ_JEU0
                                                        else -> emptyList()
                                                    }
                                            if (seq.isNotEmpty()) onPlaceBet(seq)
                                            currentHit = hitZone
                                        }
                                    } else if (hitNum != null) {
                                        if (currentHit != hitNum) {
                                            activeZone = null
                                            onPlaceBet(listOf(hitNum))
                                            currentHit = hitNum
                                        }
                                    } else {
                                        activeZone = null
                                        currentHit = null
                                    }
                                }

                                // Handle First Touch
                                processTouch(down.position)

                                // Handle Moves
                                var pointer = down.id
                                do {
                                    val event = awaitPointerEvent()
                                    val change = event.changes.find { it.id == pointer }
                                    if (change != null) {
                                        if (change.pressed) {
                                            processTouch(change.position)
                                        } else {
                                            // Up
                                            activeZone = null
                                        }
                                    }
                                } while (change?.pressed == true)
                                activeZone = null
                            }
                        }
        ) {
            val W = size.width
            val H = size.height
            val PADDING = 10.dp.toPx()
            val TRACK_THICKNESS = 48.dp.toPx()
            val FELT_COLOR = Color(0xFF181C28) // COLORS.BG_MAIN
            val LINE_COLOR = PrimaryGold // COLORS.ACCENT_GOLD
            val LINE_WIDTH = 2.dp.toPx()

            val maxDiameter = min(W * 0.95f, H * 0.95f)
            val R_OUTER = maxDiameter / 2f
            val R_INNER = R_OUTER - TRACK_THICKNESS
            val R_MID = R_OUTER - (TRACK_THICKNESS / 2f)
            val L_STRAIGHT = (H - (2 * R_OUTER) - (2 * PADDING)).coerceAtLeast(0f)

            val CX = W / 2f
            val CY = H / 2f
            val CY_TOP = CY - L_STRAIGHT / 2f
            val CY_BOT = CY + L_STRAIGHT / 2f

            val ARC_LEN = (PI * R_MID).toFloat()
            val PERIMETER_MID = 2 * ARC_LEN + 2 * L_STRAIGHT
            val NUM_SEGMENTS = 37
            val SEGMENT_LENGTH = PERIMETER_MID / NUM_SEGMENTS
            val OFFSET_D = ((PI / 2.0) * R_MID) - (0.5 * SEGMENT_LENGTH)

            // --- Helpers ---
            fun getPosCCW(dVal: Double, r: Float): PosResult {
                var d = dVal
                val arcHalf = PI * R_MID

                if (d < arcHalf) {
                    val angle = -(d / R_MID.toDouble())
                    val x = CX + r * cos(angle)
                    val y = CY_TOP + r * sin(angle)
                    return PosResult(x.toFloat(), y.toFloat(), angle.toFloat(), "TOP")
                }
                d -= arcHalf
                if (d < L_STRAIGHT) {
                    return PosResult(CX - r, (CY_TOP + d).toFloat(), -PI.toFloat(), "LEFT")
                }
                d -= L_STRAIGHT
                if (d < arcHalf) {
                    val angle = -PI - (d / R_MID.toDouble())
                    val x = CX + r * cos(angle)
                    val y = CY_BOT + r * sin(angle)
                    return PosResult(x.toFloat(), y.toFloat(), angle.toFloat(), "BOT")
                }
                d -= arcHalf
                // Right Straight
                return PosResult(CX + r, (CY_BOT - d).toFloat(), 0f, "RIGHT")
            }

            fun norm(vIn: Double): Double {
                var v = vIn % PERIMETER_MID
                if (v < 0) v += PERIMETER_MID
                return v
            }

            fun getSegmentPath(i: Int): Path {
                val dCenter = (OFFSET_D - (i * SEGMENT_LENGTH)) % PERIMETER_MID
                val dStart = norm(dCenter + SEGMENT_LENGTH / 2.0)
                val dEnd = norm(dCenter - SEGMENT_LENGTH / 2.0)

                val p1 = getPosCCW(dStart, R_OUTER)
                val p2 = getPosCCW(dEnd, R_OUTER)
                val p3 = getPosCCW(dEnd, R_INNER)
                val p4 = getPosCCW(dStart, R_INNER)

                return Path().apply {
                    moveTo(p1.x, p1.y)
                    // Simplified straight line between points for small segments
                    lineTo(p2.x, p2.y)
                    lineTo(p3.x, p3.y)
                    lineTo(p4.x, p4.y)
                    close()
                }
            }

            fun getInnerPoint(i: Int, side: String): PosResult {
                val dCenter = (OFFSET_D - (i * SEGMENT_LENGTH))
                val d =
                        if (side == "Start") dCenter + SEGMENT_LENGTH / 2.0
                        else dCenter - SEGMENT_LENGTH / 2.0
                return getPosCCW(norm(d), R_INNER)
            }

            fun getIndices(start: Int, end: Int): List<Int> {
                val list = mutableListOf<Int>()
                var curr = start
                if (curr == end) return listOf(curr)
                while (true) {
                    list.add(curr)
                    if (curr == end) break
                    curr = (curr + 1) % 37
                }
                return list
            }

            fun getRimTrace(indices: List<Int>): Path {
                val path = Path()
                indices.forEachIndexed { idx, i ->
                    val pStart = getInnerPoint(i, "Start")
                    val pEnd = getInnerPoint(i, "End")
                    if (idx == 0) path.moveTo(pStart.x, pStart.y)
                    else path.lineTo(pStart.x, pStart.y)
                    path.lineTo(pEnd.x, pEnd.y)
                }
                return path
            }

            fun isInZone(idx: Int, zoneName: String?): Boolean {
                if (zoneName == null) return false
                val range = ZONE_RANGES[zoneName]
                if (range != null) {
                    return if (range.start > range.end) {
                        idx >= range.start || idx <= range.end
                    } else {
                        idx >= range.start && idx <= range.end
                    }
                }
                if (zoneName == "ORPHELINS") {
                    val r = ZONE_RANGES["ORPHELINS_RIGHT"]!!
                    val l = ZONE_RANGES["ORPHELINS_LEFT"]!!
                    val inR = idx >= r.start && idx <= r.end
                    val inL = idx >= l.start && idx <= l.end
                    return inR || inL
                }
                if (zoneName == "ZERO") {
                    // Indices 33 to 2? No, values.
                    // Constants has indices logic.
                    // Wait, standard sequence indices?
                    // The idx passed here is 'i' (0..36 in RACETRACK_SEQUENCE)
                    // Need to check RACETRACK_SEQUENCE[idx] vs values?
                    // No, ZONE_RANGES are based on index in RACETRACK_SEQUENCE?
                    // Expo: RACETRACK_SEQUENCE is ordered 0, 32, 15...
                    // 28 is number 7? No `RACETRACK_SEQUENCE[28]`
                    // Let's assume indices refer to position in the list.
                    // 33=16, 2=15? No.
                    // Let's look at Expo `isInZone`.
                    // idx >= 33 || idx <= 2.
                    return idx >= 33 || idx <= 2
                }
                return false
            }

            // --- Draw Background ---
            val bgPath =
                    Path().apply {
                        moveTo(CX - R_INNER, CY_TOP)
                        arcTo(
                                Rect(
                                        CX - R_INNER,
                                        CY_TOP - R_INNER,
                                        CX + R_INNER,
                                        CY_TOP + R_INNER
                                ),
                                180f,
                                180f,
                                forceMoveTo = false
                        )
                        lineTo(CX + R_INNER, CY_BOT)
                        arcTo(
                                Rect(
                                        CX - R_INNER,
                                        CY_BOT - R_INNER,
                                        CX + R_INNER,
                                        CY_BOT + R_INNER
                                ),
                                0f,
                                180f,
                                forceMoveTo = false
                        )
                        lineTo(CX - R_INNER, CY_TOP)
                        close()
                    }
            drawPath(bgPath, FELT_COLOR)

            // --- Draw Segments ---
            RACETRACK_SEQUENCE.forEachIndexed { i, num ->
                val path = getSegmentPath(i)
                val betAmt = bets[num.toString()] ?: 0
                val belongsToZone = isInZone(i, activeZone)
                val isZoneActive = activeZone != null

                var opacity = 1f
                var strokeWidth = 1.dp.toPx()
                var strokeColor = Color(0x33FFFFFF)

                if (isZoneActive) {
                    if (belongsToZone) {
                        opacity = 1f
                        strokeWidth = 2.dp.toPx()
                        strokeColor = Color.White
                    } else {
                        opacity = 0.3f
                    }
                }

                val baseColor =
                        when {
                            num == 0 -> BetGreen
                            GameConstants.isRed(num) -> BetRed
                            else -> BetBlack
                        }

                drawPath(path, baseColor, alpha = opacity)
                drawPath(path, strokeColor, style = Stroke(strokeWidth), alpha = opacity)

                val dCenter = (OFFSET_D - (i * SEGMENT_LENGTH)) % PERIMETER_MID
                val textPosInfo = getPosCCW(norm(dCenter), R_MID)
                val textPos = Offset(textPosInfo.x, textPosInfo.y)
                val rot = Math.toDegrees(textPosInfo.angle.toDouble()).toFloat() + 90f

                // Draw Chip or Number
                if (betAmt > 0) {
                    withTransform({
                        // No rotation for Chips usually, to keep text readable?
                        // Expo rotates text, but simple circles? Expo rotates text inside chip.
                    }) {
                        drawCircle(
                                Color(0x80000000),
                                radius = 13.dp.toPx(),
                                center = Offset(textPos.x, textPos.y + 2.dp.toPx())
                        )
                        drawCircle(
                                getChipColor(betAmt),
                                radius = 13.dp.toPx(),
                                center = textPos,
                                alpha = opacity
                        )
                        drawCircle(
                                Color.Black,
                                radius = 13.dp.toPx(),
                                center = textPos,
                                style = Stroke(1.dp.toPx()),
                                alpha = opacity
                        )

                        val chipText = NumberUtils.formatAbbreviated(betAmt.toDouble())
                        val textLayout =
                                textMeasurer.measure(
                                        text = chipText,
                                        style =
                                                TextStyle(
                                                        color = Color.White,
                                                        fontSize = 9.sp,
                                                        fontWeight = FontWeight.Bold
                                                )
                                )
                        drawText(
                                textLayout,
                                topLeft =
                                        Offset(
                                                textPos.x - textLayout.size.width / 2,
                                                textPos.y - textLayout.size.height / 2
                                        )
                        )
                    }
                } else {
                    withTransform({ rotate(rot, pivot = textPos) }) {
                        val textLayout =
                                textMeasurer.measure(
                                        text = num.toString(),
                                        style =
                                                TextStyle(
                                                        color = Color.White.copy(alpha = opacity),
                                                        fontSize = 13.sp,
                                                        fontWeight = FontWeight.Bold
                                                )
                                )
                        drawText(
                                textLayout,
                                topLeft =
                                        Offset(
                                                textPos.x - textLayout.size.width / 2,
                                                textPos.y - textLayout.size.height / 2
                                        )
                        )
                    }
                }
            }

            // --- Draw Visual Paths (Rim Traces) ---
            val voisinPath = getRimTrace(getIndices(28, 7)).apply { close() }
            drawPath(voisinPath, PrimaryGold, alpha = 0.15f)
            drawPath(voisinPath, PrimaryGold, style = Stroke(LINE_WIDTH))

            val tiersPath = getRimTrace(getIndices(11, 22)).apply { close() }
            drawPath(tiersPath, PrimaryGold, alpha = 0.15f)
            drawPath(tiersPath, PrimaryGold, style = Stroke(LINE_WIDTH))

            // Orphelins visual (Complex)
            val pA = getInnerPoint(7, "End")
            val pC = getInnerPoint(22, "End")
            val orphPath =
                    Path().apply {
                        moveTo(pA.x, pA.y)
                        getIndices(8, 10).forEach { i ->
                            val pE = getInnerPoint(i, "End")
                            lineTo(pE.x, pE.y)
                        }
                        lineTo(pC.x, pC.y) // Jump to Tiers start?
                        // Expo logic: pC is 22 End?
                        // Actually Expo:
                        // getIndices(23, 27).forEach { pS, pE -> L pS L pE }
                        getIndices(23, 27).forEach { i ->
                            val pS = getInnerPoint(i, "Start")
                            val pE = getInnerPoint(i, "End")
                            lineTo(pS.x, pS.y)
                            lineTo(pE.x, pE.y)
                        }
                        close()
                    }
            drawPath(orphPath, PrimaryGold, alpha = 0.15f)
            drawPath(orphPath, PrimaryGold, style = Stroke(LINE_WIDTH))

            // Zero Sector Visual (Complex Arc)
            val ZERO_ARC_ANGLE = 60.0
            val ZERO_BAND_DEPTH = 45.dp.toPx()
            val rStart = Math.toRadians(-90 - (ZERO_ARC_ANGLE / 2))
            val rEnd = Math.toRadians(-90 + (ZERO_ARC_ANGLE / 2))
            val R_Z_OUTER = R_INNER
            val R_Z_INNER = R_INNER - ZERO_BAND_DEPTH
            val zeroPath =
                    Path().apply {
                        val p1x = CX + R_Z_OUTER * cos(rStart)
                        val p1y = CY_TOP + R_Z_OUTER * sin(rStart)
                        val p3x = CX + R_Z_INNER * cos(rEnd)
                        val p3y = CY_TOP + R_Z_INNER * sin(rEnd)

                        moveTo(p1x.toFloat(), p1y.toFloat())
                        // ArcTo p2
                        arcTo(
                                Rect(
                                        CX - R_Z_OUTER,
                                        CY_TOP - R_Z_OUTER,
                                        CX + R_Z_OUTER,
                                        CY_TOP + R_Z_OUTER
                                ),
                                -90f - 30f,
                                60f,
                                false
                        )
                        lineTo(p3x.toFloat(), p3y.toFloat())
                        arcTo(
                                Rect(
                                        CX - R_Z_INNER,
                                        CY_TOP - R_Z_INNER,
                                        CX + R_Z_INNER,
                                        CY_TOP + R_Z_INNER
                                ),
                                -90f + 30f,
                                -60f,
                                false
                        )
                        close()
                    }
            drawPath(zeroPath, PrimaryGold, alpha = 0.3f)
            drawPath(zeroPath, PrimaryGold, style = Stroke(LINE_WIDTH))

            // --- Draw Center Labels ---
            // Simplified positioning calculation
            val Y_Zero_Bot = CY_TOP - R_INNER + ZERO_BAND_DEPTH
            val P_Vois_Left = getInnerPoint(28, "Start")
            val P_Vois_Right = getInnerPoint(7, "End")
            val Y_Orph_Top = (P_Vois_Left.y + P_Vois_Right.y) / 2
            val P_Tiers_Left = getInnerPoint(22, "End")
            val P_Tiers_Right = getInnerPoint(11, "Start")
            val Y_Orph_Bot = (P_Tiers_Left.y + P_Tiers_Right.y) / 2
            val Y_Void_Bot = CY_BOT + R_INNER

            // Labels
            // VOISINS
            val pVoisY = (Y_Zero_Bot + Y_Orph_Top) / 2
            val textVoisins =
                    textMeasurer.measure(
                            "VOISINS",
                            TextStyle(
                                    color = PrimaryGold,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold
                            )
                    )
            drawText(
                    textVoisins,
                    topLeft =
                            Offset(
                                    CX - textVoisins.size.width / 2,
                                    pVoisY - textVoisins.size.height / 2
                            )
            )

            // ORPHELINS
            val pOrphY = (Y_Orph_Top + Y_Orph_Bot) / 2
            val textOrph =
                    textMeasurer.measure(
                            "ORPHELINS",
                            TextStyle(
                                    color = PrimaryGold,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold
                            )
                    )
            drawText(
                    textOrph,
                    topLeft =
                            Offset(CX - textOrph.size.width / 2, pOrphY - textOrph.size.height / 2)
            )

            // TIERS
            val pTiersY = (Y_Orph_Bot + Y_Void_Bot) / 2
            val textTiers =
                    textMeasurer.measure(
                            "TIERS",
                            TextStyle(
                                    color = PrimaryGold,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold
                            )
                    )
            drawText(
                    textTiers,
                    topLeft =
                            Offset(
                                    CX - textTiers.size.width / 2,
                                    pTiersY - textTiers.size.height / 2
                            )
            )

            // ZERO
            val pZeroY = CY_TOP + ((R_Z_OUTER + R_Z_INNER) / 2) * sin(Math.toRadians(-90.0))
            val textZero =
                    textMeasurer.measure(
                            "ZERO",
                            TextStyle(
                                    color = TextWhite,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                            )
                    )
            drawText(
                    textZero,
                    topLeft =
                            Offset(
                                    CX - textZero.size.width / 2,
                                    pZeroY.toFloat() - textZero.size.height / 2
                            )
            )
        }
    }
}

// Helper to determine which number was hit on the track
private fun getTrackNumberAt(
        offset: Offset,
        CX: Float,
        CY_TOP: Float,
        CY_BOT: Float,
        R_INNER: Float,
        R_OUTER: Float,
        R_MID: Float,
        L_STRAIGHT: Float,
        OFFSET_D: Double,
        PERIMETER_MID: Float,
        SEGMENT_LENGTH: Float
): Int? {
    val x = offset.x
    val y = offset.y

    // Check bounds
    val distTop = hypot(x - CX, y - CY_TOP)
    val distBot = hypot(x - CX, y - CY_BOT)

    // Top Arc
    if (y < CY_TOP) {
        if (distTop in R_INNER..R_OUTER) {
            // Angle
            val angle = atan2(y - CY_TOP, x - CX)
            // d = -angle * R_MID (from getPosCCW logic: angle = -d/R)
            // But verify range.
            // If angle is -PI/2 (top), d should be 0?
            // Formula: angle = -(d / R) -> d = -angle * R
            // if angle = -PI/2 -> d = PI/2 * R. This is not 0.

            // Re-eval OFFSET_D logic:
            // OFFSET_D = (PI/2 * R_MID) - 0.5 SEGMENT.
            // This suggests 0 is at 3 o'clock (0 rad)?
            // Compose Arc 0 is 3 o'clock. -90 is 12 o'clock.

            // Let's rely on simple d calculation based on accumulated length layout
            // Layout: TopArc -> LeftStr -> BotArc -> RightStr -> TopArc
            // TopArc covers angle X to Y?
            // getPosCCW says: d < arcHalf => TopArc.
            // angle = -(d/R).
            // So d = -angle * R.
            // Angles in TopArc (y < CY_TOP) are in (-PI, 0).
            // If angle = -PI/2 -> d = PI/2 * R.
            // This is consistent.
            val d = -angle * R_MID
            val index = ((OFFSET_D - d) / SEGMENT_LENGTH).toInt()
            // We need to normalize/round index properly
            // Let's iterate all segments and find closest? Expensive.
            // Direct map is better.
            // i = (OFFSET_D - d) / SEGMENT_LENGTH
            // Need to handle wrap around
            val normalizedD = d // Is d always positive here? angle negative -> d positive.
            // index check
            val i = Math.round((OFFSET_D - normalizedD) / SEGMENT_LENGTH).toInt()
            return RACETRACK_SEQUENCE[Math.floorMod(i, 37)]
        }
    } else if (y >= CY_TOP && y <= CY_BOT) {
        // Straights
        if (x < CX) {
            // Left Straight
            if (x in (CX - R_OUTER)..(CX - R_INNER)) {
                // d = arcHalf + (y - CY_TOP)
                val arcHalf = PI * R_MID
                val d = arcHalf + (y - CY_TOP)
                val i = Math.round((OFFSET_D - d) / SEGMENT_LENGTH).toInt()
                return RACETRACK_SEQUENCE[Math.floorMod(i, 37)]
            }
        } else {
            // Right Straight
            if (x in (CX + R_INNER)..(CX + R_OUTER)) {
                // d = arcHalf + L + arcHalf + (CY_BOT - y) -> TotalPerimeter - (y - CY_TOP)?
                // getPosCCW: Straight Right: d > arcHalf + L + arcHalf
                // x = CX + r, y = CY_BOT - (d - (2*arcHalf + L))
                // y = CY_BOT - d + 2*arcHalf + L
                // d = CY_BOT - y + 2*arcHalf + L
                val arcHalf = PI * R_MID
                val d = CY_BOT - y + 2 * arcHalf + L_STRAIGHT
                val i = Math.round((OFFSET_D - d) / SEGMENT_LENGTH).toInt()
                return RACETRACK_SEQUENCE[Math.floorMod(i, 37)]
            }
        }
    } else {
        // Bot Arc
        if (distBot in R_INNER..R_OUTER) {
            val angle = atan2(y - CY_BOT, x - CX)
            // angle = -PI - (d/R)
            // d/R = -PI - angle
            // d = R * (-PI - angle)
            // angle is in (0, PI) or (-PI, 0)?
            // y > CY_BOT means Bottom half. angles are (0, PI).
            // Wait, standard atan2 returns positive for y > 0?
            // Yes 0 to PI.
            // formula: angle = -PI - (d/R). This produces very negative angles (-3PI/2 etc).
            // This assumes d continues growing.
            // Let's map angle to d.
            // angle range: 0 (Right) to PI (Left).
            // We want d corresponding to Bot Arc.
            // Bot Arc starts after Left Straight.
            // dStart = arcHalf + L_STRAIGHT.
            // At dStart, angle = -PI.
            // At dEnd = dStart + arcHalf, angle = -2PI (or 0).

            // If angle is positive (0..PI)
            // Equivalent negative angle is angle - 2PI?
            // e.g. PI/2 -> -3PI/2.
            // Let's use: d = R * (-PI - (angle - 2*PI)) ? No.

            // Simpler: d = arcHalf + L + (PI - angle)*R ?
            // At Left (angle=PI), d = arcHalf + L. Correct.
            // At Right (angle=0), d = arcHalf + L + PI*R = 2*arcHalf + L. Correct.
            val arcHalf = PI * R_MID
            val d = arcHalf + L_STRAIGHT + (PI - angle) * R_MID
            val i = Math.round((OFFSET_D - d) / SEGMENT_LENGTH).toInt()
            return RACETRACK_SEQUENCE[Math.floorMod(i, 37)]
        }
    }

    return null
}

// Helper for Point in Polygon (Ray Casting algorithm)
private fun isPointInPolygon(point: Offset, vertices: List<Offset>): Boolean {
    var intersectCount = 0
    for (j in 0 until vertices.size - 1) {
        if (rayCastIntersect(point, vertices[j], vertices[j + 1])) {
            intersectCount++
        }
    }
    // Check last edge (last -> first)
    if (vertices.isNotEmpty()) {
        if (rayCastIntersect(point, vertices.last(), vertices[0])) {
            intersectCount++
        }
    }
    return (intersectCount % 2) == 1
}

private fun rayCastIntersect(point: Offset, vertA: Offset, vertB: Offset): Boolean {
    val aY = vertA.y
    val bY = vertB.y
    val aX = vertA.x
    val bX = vertB.x
    val pY = point.y
    val pX = point.x

    if ((aY > pY && bY > pY) || (aY < pY && bY < pY) || (aX < pX && bX < pX)) {
        return false // NO contact
    }
    if (aY == bY) return false // Horizontal edge

    // Intersect x
    val x = aX + (pY - aY) * (bX - aX) / (bY - aY)
    return x >= pX
}

fun getChipColor(amount: Int): Color {
    return when {
        amount >= 100 -> ChipBlack
        amount >= 25 -> ChipGreen
        amount >= 5 -> ChipRed
        else -> ChipBlue // 1
    }
}

val ChipBlue = Color(0xFF1E88E5)
val ChipRed = Color(0xFFE53935)
val ChipGreen = Color(0xFF43A047)
val ChipBlack = Color(0xFF212121)
