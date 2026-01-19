package com.marcgodinez.roulette.ui.game

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import com.marcgodinez.roulette.data.GameConstants.RED_NUMBERS
import com.marcgodinez.roulette.ui.theme.BetBlack
import com.marcgodinez.roulette.ui.theme.BetGreen
import com.marcgodinez.roulette.ui.theme.BetRed
import com.marcgodinez.roulette.ui.theme.PrimaryGold
import kotlinx.coroutines.*

// Constants
val NUMBERS = (1..36).toList()
val BORDER_COLOR = Color(0x1AFFFFFF)

@Composable
fun BettingBoard(
        highlightedNumbers: List<Int> = emptyList(),
        isSpinning: Boolean = false,
        winningNumber: Int? = null,
        bets: Map<String, Int> = emptyMap(),
        onPlaceBet: (String) -> Unit = {},
        // New props for external control
        externalBets: Map<String, Int>? = null,
        onExternalBet: ((String, Int) -> Boolean)? = null,
        externalChipValue: Int? = null,
        disabled: Boolean = false,
        heatmapData: Map<Int, Int>? = null
) {
    // Layout Metrics
    var boardWidth by remember { mutableStateOf(0f) }
    var boardHeight by remember { mutableStateOf(0f) }

    // Ghost Logic
    var ghostTargetId by remember { mutableStateOf<String?>(null) }
    var lastPaintId by remember { mutableStateOf<String?>(null) }
    var isPrecisionMode by remember { mutableStateOf(false) }

    // Column Weights
    val w1 = 2.5f
    val w2 = 1.2f
    val w3 = 6.0f
    val wTotal = w1 + w2 + w3

    // 14-Unit Vertical Grid
    val rows = 14f

    // --- GLOBAL RESOLVER ---
    fun resolveGlobalTarget(offset: Offset): String? {
        if (boardWidth == 0f || boardHeight == 0f) return null

        val col1Width = (w1 / wTotal) * boardWidth
        val col2Width = (w2 / wTotal) * boardWidth
        // col3Width = remainder

        val x = offset.x
        val y = offset.y
        val unitHeight = boardHeight / rows

        // --- INVALID BOUNDS ---
        if (x < 0 || x > boardWidth || y < 0 || y > boardHeight) return null

        // --- COL 1: SIDE BETS ---
        if (x < col1Width) {
            val logicalRow = y / unitHeight // 0..14

            // 0-1: Top Spacer (Ignored)
            if (logicalRow < 1) return null

            // 1-3: 1-18 (2 units)
            if (logicalRow < 3) return "1-18"

            // 3-5: EVEN (2 units)
            if (logicalRow < 5) return "EVEN"

            // 5-9: COLORS (4 units)
            if (logicalRow < 9) {
                // Split Width detected by local X within Col 1
                val localCol1X = x
                return if (localCol1X < col1Width / 2) "RED" else "BLACK"
            }

            // 9-11: ODD (2 units)
            if (logicalRow < 11) return "ODD"

            // 11-13: 19-36 (2 units)
            if (logicalRow < 13) return "19-36"

            // 13-14: Bottom Spacer (Ignored)
            return null
        }

        // --- COL 2: DOZENS ---
        if (x < col1Width + col2Width) {
            val logicalRow = y / unitHeight

            // 0-1: Top Spacer
            if (logicalRow < 1) return null

            // 1st 12 (4 units: 1..5)
            if (logicalRow < 5) return "1st12"

            // 2nd 12 (4 units: 5..9)
            if (logicalRow < 9) return "2nd12"

            // 3rd 12 (4 units: 9..13)
            if (logicalRow < 13) return "3rd12"

            return null
        }

        // --- COL 3: GRID ---
        val col3Start = col1Width + col2Width
        val localGridX = x - col3Start
        val gridWidth = boardWidth - col3Start

        val cellWidth = gridWidth / 3f
        val cellHeight = unitHeight // Same unit height

        // Hit Slop Constants
        val HIT_SLOP = 0.25f
        // Local Grid Coordinates
        val col = (localGridX / cellWidth).toInt()
        val row = (y / cellHeight).toInt() // 0..13

        if (col < 0 || col > 2) return null // Should be covered by bounds check usually
        if (row < 0 || row > 13) return null // Should be covered

        val relX = (localGridX % cellWidth) / cellWidth
        val relY = (y % cellHeight) / cellHeight

        val nearLeft = relX < HIT_SLOP
        val nearRight = relX > (1f - HIT_SLOP)
        val nearTop = relY < HIT_SLOP
        val nearBottom = relY > (1f - HIT_SLOP)

        fun makeId(prefix: String, nums: List<Int>): String {
            return "${prefix}_${nums.sorted().joinToString("_")}"
        }

        // Row 13: 2:1 Columns
        if (row == 13) {
            return when (col) {
                0 -> "COL1"
                1 -> "COL2"
                2 -> "COL3"
                else -> null
            }
        }

        // Row 0: Zero
        if (row == 0) {
            if (nearBottom) {
                val belowNum = col + 1
                return makeId("SPLIT", listOf(0, belowNum))
            }
            return "0"
        }

        // Grid Rows 1..12
        val logicalRow = row - 1
        val baseNumber = (logicalRow * 3) + col + 1

        // STREET / SIXLINE (Left Edge of Col 0)
        if (nearLeft && col == 0) {
            if (nearTop && logicalRow > 0) {
                val startPrev = baseNumber - 3
                val startCurr = baseNumber
                return makeId(
                        "SIXLINE",
                        listOf(
                                startPrev,
                                startPrev + 1,
                                startPrev + 2,
                                startCurr,
                                startCurr + 1,
                                startCurr + 2
                        )
                )
            }
            if (nearBottom && logicalRow < 11) {
                val startCurr = baseNumber
                val startNext = baseNumber + 3
                return makeId(
                        "SIXLINE",
                        listOf(
                                startCurr,
                                startCurr + 1,
                                startCurr + 2,
                                startNext,
                                startNext + 1,
                                startNext + 2
                        )
                )
            }
            return makeId("STREET", listOf(baseNumber, baseNumber + 1, baseNumber + 2))
        }

        // CORNERS
        if (nearLeft && nearTop && logicalRow > 0 && col > 0)
                return makeId(
                        "COR",
                        listOf(baseNumber, baseNumber - 1, baseNumber - 3, baseNumber - 4)
                )
        if (nearRight && nearTop && logicalRow > 0 && col < 2)
                return makeId(
                        "COR",
                        listOf(baseNumber, baseNumber + 1, baseNumber - 3, baseNumber - 2)
                )
        if (nearLeft && nearBottom && logicalRow < 11 && col > 0)
                return makeId(
                        "COR",
                        listOf(baseNumber, baseNumber - 1, baseNumber + 3, baseNumber + 2)
                )
        if (nearRight && nearBottom && logicalRow < 11 && col < 2)
                return makeId(
                        "COR",
                        listOf(baseNumber, baseNumber + 1, baseNumber + 3, baseNumber + 4)
                )

        // SPLITS
        if (nearLeft && col > 0) return makeId("SPLIT", listOf(baseNumber, baseNumber - 1))
        if (nearRight && col < 2) return makeId("SPLIT", listOf(baseNumber, baseNumber + 1))
        if (nearTop && logicalRow > 0) return makeId("SPLIT", listOf(baseNumber, baseNumber - 3))
        if (nearBottom && logicalRow < 11)
                return makeId("SPLIT", listOf(baseNumber, baseNumber + 3))

        // TRIO
        if (nearTop && logicalRow == 0) {
            if (col == 1 && nearLeft) return makeId("TRIO", listOf(0, 1, 2))
            if (col == 1 && nearRight) return makeId("TRIO", listOf(0, 2, 3))
            return makeId("SPLIT", listOf(0, baseNumber))
        }

        // STRAIGHT
        return baseNumber.toString()
    }

    // --- ROOT COMPOSABLE ---
    Box(
            modifier =
                    Modifier.fillMaxSize()
                            .onGloballyPositioned { coordinates ->
                                boardWidth = coordinates.size.width.toFloat()
                                boardHeight = coordinates.size.height.toFloat()
                            }
                            // GLOBAL HYBRID GESTURE DETECTOR
                            .pointerInput(boardWidth, boardHeight) {
                                awaitEachGesture {
                                    val down = awaitFirstDown()
                                    var dragStarted = false
                                    isPrecisionMode = false
                                    lastPaintId = null

                                    try {
                                        // Phase 1: Wait for decision (Tap vs Paint vs Precision)
                                        withTimeout(250) {
                                            var pointerId = down.id
                                            while (true) {
                                                val event = awaitPointerEvent()
                                                val change =
                                                        event.changes.find { it.id == pointerId }

                                                if (change == null || !change.pressed) {
                                                    // UP (Tap)
                                                    val target = resolveGlobalTarget(down.position)
                                                    if (target != null) onPlaceBet(target)
                                                    return@withTimeout // Exit timeout normally
                                                }

                                                val dist =
                                                        (change.position - down.position)
                                                                .getDistance()
                                                if (dist > 20f) {
                                                    // MOVED -> Paint Mode
                                                    dragStarted = true
                                                    throw CancellationException(
                                                            "PaintMode"
                                                    ) // Break timeout to enter Paint loop
                                                }
                                            }
                                        }
                                        // If timeout finishes normally (and we returned), loop
                                        // ended (Up).
                                    } catch (e: TimeoutCancellationException) {
                                        // Timeout happened -> Precision Mode
                                        isPrecisionMode = true
                                        val t = resolveGlobalTarget(down.position)
                                        ghostTargetId = t

                                        var pointerId = down.id
                                        while (true) {
                                            val event = awaitPointerEvent()
                                            val change = event.changes.find { it.id == pointerId }
                                            if (change == null || !change.pressed) {
                                                // Release Precision
                                                ghostTargetId?.let { onPlaceBet(it) }
                                                ghostTargetId = null
                                                isPrecisionMode = false
                                                break
                                            }
                                            // Drag Ghost
                                            val target = resolveGlobalTarget(change.position)
                                            ghostTargetId = target
                                            change.consume()
                                        }
                                    } catch (e: CancellationException) {
                                        if (e.message == "PaintMode") {
                                            // Paint Loop
                                            var pointerId = down.id
                                            while (true) {
                                                val event = awaitPointerEvent()
                                                val change =
                                                        event.changes.find { it.id == pointerId }
                                                if (change == null || !change.pressed) break // UP

                                                val target = resolveGlobalTarget(change.position)
                                                if (target != null && target != lastPaintId) {
                                                    onPlaceBet(target)
                                                    lastPaintId = target
                                                }
                                                change.consume()
                                            }
                                        }
                                    }
                                }
                            }
                            .background(Color.Transparent)
                            .border(1.dp, BORDER_COLOR, RoundedCornerShape(12.dp))
    ) {
        Row(Modifier.fillMaxSize()) {
            // COL 1: Side Bets
            Column(
                    modifier =
                            Modifier.weight(w1).fillMaxHeight().drawRightBorder(1.dp, BORDER_COLOR)
            ) {
                Box(
                        Modifier.weight(1f).fillMaxWidth().drawBottomBorder(1.dp, BORDER_COLOR)
                ) // Top Spacer

                SideBetCell("1-18", Modifier.weight(2f).drawBottomBorder(1.dp, BORDER_COLOR))
                SideBetCell("EVEN", Modifier.weight(2f).drawBottomBorder(1.dp, BORDER_COLOR))

                Row(Modifier.weight(4f).fillMaxWidth().drawBottomBorder(1.dp, BORDER_COLOR)) {
                    ColorBetCell(
                            BetRed,
                            Modifier.weight(1f).fillMaxHeight().drawRightBorder(1.dp, BORDER_COLOR)
                    )
                    ColorBetCell(BetBlack, Modifier.weight(1f).fillMaxHeight())
                }

                SideBetCell("ODD", Modifier.weight(2f).drawBottomBorder(1.dp, BORDER_COLOR))
                SideBetCell("19-36", Modifier.weight(2f).drawBottomBorder(1.dp, BORDER_COLOR))

                Box(Modifier.weight(1f).fillMaxWidth()) // Bottom Spacer
            }

            // COL 2: Dozens
            Column(
                    modifier =
                            Modifier.weight(w2).fillMaxHeight().drawRightBorder(1.dp, BORDER_COLOR)
            ) {
                Box(
                        Modifier.weight(1f).fillMaxWidth().drawBottomBorder(1.dp, BORDER_COLOR)
                ) // Top Spacer
                SideBetCell("1st 12", Modifier.weight(4f).drawBottomBorder(1.dp, BORDER_COLOR))
                SideBetCell("2nd 12", Modifier.weight(4f).drawBottomBorder(1.dp, BORDER_COLOR))
                SideBetCell("3rd 12", Modifier.weight(4f).drawBottomBorder(1.dp, BORDER_COLOR))
                Box(Modifier.weight(1f).fillMaxWidth()) // Bottom Spacer
            }

            // COL 3: Grid
            Column(modifier = Modifier.weight(w3).fillMaxHeight()) {
                // Zero Row
                Box(
                        modifier =
                                Modifier.weight(1f)
                                        .fillMaxWidth()
                                        .drawBottomBorder(1.dp, BORDER_COLOR),
                        contentAlignment = Alignment.Center
                ) {
                    Box(
                            modifier =
                                    Modifier.fillMaxWidth(0.8f)
                                            .fillMaxHeight(0.8f)
                                            .background(Color(0x6600C800), RoundedCornerShape(25))
                                            .border(2.dp, BetGreen, RoundedCornerShape(25))
                    )
                    Text("0", color = Color.White, fontWeight = FontWeight.Black, fontSize = 20.sp)
                    if (winningNumber == 0) Dolly()
                }

                // Grid 1..36
                Column(modifier = Modifier.weight(12f)) {
                    for (row in 0 until 12) {
                        Row(modifier = Modifier.weight(1f).fillMaxWidth()) {
                            for (col in 0 until 3) {
                                val num = (row * 3) + col + 1
                                val isRed = RED_NUMBERS.contains(num)
                                val bg = if (isRed) Color(0x99C80000) else Color(0xCC1E1E28)
                                val isHighlighted = highlightedNumbers.contains(num)

                                Box(
                                        modifier =
                                                Modifier.weight(1f)
                                                        .fillMaxHeight()
                                                        .background(
                                                                if (isHighlighted) Color(0x33FF4500)
                                                                else bg
                                                        )
                                                        .border(0.5.dp, BORDER_COLOR),
                                        contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                            num.toString(),
                                            color = Color.White,
                                            fontSize = 20.sp,
                                            fontWeight = FontWeight.Black
                                    )
                                    if (winningNumber == num) Dolly()
                                }
                            }
                        }
                    }
                }

                // 2:1
                Row(Modifier.weight(1f).fillMaxWidth().drawTopBorder(1.dp, BORDER_COLOR)) {
                    VisualSideBetCell("2:1", Modifier.weight(1f))
                    VisualSideBetCell("2:1", Modifier.weight(1f))
                    VisualSideBetCell("2:1", Modifier.weight(1f))
                }
            }
        }

        // --- UNIFIED CHIPS OVERLAY ---
        // Render ALL chips here based on bets map
        // Also render Ghost Chip if dragging
        ChipsOverlay(bets, boardWidth, boardHeight, ghostTargetId)
    }
}

// --- DUMB UI COMPS (No Touch Handling) ---
@Composable
fun SideBetCell(label: String, modifier: Modifier) {
    Box(modifier = modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
        Text(
                text = label,
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
                modifier = Modifier.rotate(90f)
        )
    }
}

@Composable
fun VisualSideBetCell(label: String, modifier: Modifier) {
    Box(modifier = modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
        Text(
                text = label,
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
                modifier = Modifier.rotate(90f).offset(x = 10.dp)
        )
    }
}

@Composable
fun ColorBetCell(color: Color, modifier: Modifier) {
    Box(modifier = modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
        Box(
                modifier =
                        Modifier.width(30.dp)
                                .height(40.dp)
                                .rotate(90f)
                                .background(color, RoundedCornerShape(4.dp))
        )
    }
}

@Composable
fun ChipsOverlay(
        bets: Map<String, Int>,
        boardWidth: Float,
        boardHeight: Float,
        ghostTargetId: String? = null
) {
    if (boardWidth == 0f || boardHeight == 0f) return

    val w1 = 2.5f
    val w2 = 1.2f
    val w3 = 6.0f
    val wTotal = w1 + w2 + w3
    val col1W = (w1 / wTotal) * boardWidth
    val col2W = (w2 / wTotal) * boardWidth
    val col3Start = col1W + col2W
    val unitH = boardHeight / 14f
    val cellW = (boardWidth - col3Start) / 3f

    fun getCoordinates(id: String): Pair<Float, Float>? {
        // --- COL 1: SIDE BETS ---
        // Simple Centers
        if (id == "1-18") return Pair(col1W * 0.5f, unitH * (1 + 1)) // Row 1 to 3 -> Center 2
        if (id == "EVEN") return Pair(col1W * 0.5f, unitH * (3 + 1)) // Row 3 to 5 -> Center 4
        if (id == "RED")
                return Pair(col1W * 0.25f, unitH * (5 + 2)) // Row 5 to 9 -> Center 7, Left Side
        if (id == "BLACK") return Pair(col1W * 0.75f, unitH * (5 + 2)) // Right Side
        if (id == "ODD") return Pair(col1W * 0.5f, unitH * (9 + 1)) // Row 9 to 11 -> Center 10
        if (id == "19-36") return Pair(col1W * 0.5f, unitH * (11 + 1)) // Row 11 to 13 -> Center 12

        // --- COL 2: DOZENS ---
        if (id == "1st12")
                return Pair(col1W + col2W * 0.5f, unitH * (1 + 2)) // Row 1 to 5 -> Center 3
        if (id == "2nd12")
                return Pair(col1W + col2W * 0.5f, unitH * (5 + 2)) // Row 5 to 9 -> Center 7
        if (id == "3rd12")
                return Pair(col1W + col2W * 0.5f, unitH * (9 + 2)) // Row 9 to 13 -> Center 11

        // --- COL 3: GRID (Straight & Complex) ---
        var cx = 0f
        var cy = 0f

        // COLUMNS
        if (id.startsWith("COL")) {
            val idx = id.removePrefix("COL").toIntOrNull() ?: return null
            // COL1=1, COL2=2, COL3=3. idx-1 => 0,1,2
            val c = idx - 1
            cx = col3Start + (c + 0.5f) * cellW
            cy = unitH * 13.5f
            return Pair(cx, cy)
        }

        // 0
        if (id == "0") return Pair(col3Start + 1.5f * cellW, unitH * 0.5f)

        // NUMBERS / COMPLEX
        val parts = id.split("_")
        val nums = parts.filter { it.toIntOrNull() != null }.map { it.toInt() }

        if (nums.isEmpty()) return null

        var sumC = 0f
        var sumR = 0f
        nums.forEach { n ->
            if (n == 0) {
                sumC += 1.5f // Middle of Grid
                sumR += 0.5f // Row 0 Center
            } else {
                val col = (n - 1) % 3
                val row = (n - 1) / 3
                sumC += (col + 0.5f)
                sumR += (row + 1 + 0.5f) // +1 for Zero row
            }
        }

        val localCx = (sumC / nums.size)
        val localCy = (sumR / nums.size)

        cx = col3Start + localCx * cellW
        cy = localCy * unitH

        // Edge Corrections
        if (id.startsWith("STREET") || id.startsWith("SIXLINE")) {
            cx = col3Start // Left edge of grid
        }
        if (id.startsWith("TRIO")) {
            if (nums.contains(1)) cx = col3Start + 1f * cellW else cx = col3Start + 2f * cellW
        }

        return Pair(cx, cy)
    }

    // Render Placed Bets
    bets.forEach { (key, amount) ->
        if (amount > 0) {
            val coords = getCoordinates(key)
            if (coords != null) {
                val chipSize = 36.dp
                ChipView(
                        amount,
                        modifier =
                                Modifier.size(chipSize)
                                        .offset(
                                                x =
                                                        with(LocalDensity.current) {
                                                            coords.first.toDp() - (chipSize / 2)
                                                        },
                                                y =
                                                        with(LocalDensity.current) {
                                                            coords.second.toDp() - (chipSize / 2)
                                                        }
                                        )
                )
            }
        }
    }

    // Render Ghost Chip
    if (ghostTargetId != null) {
        val coords = getCoordinates(ghostTargetId)
        if (coords != null) {
            val chipSize = 36.dp
            Box(
                    modifier =
                            Modifier.size(chipSize)
                                    .offset(
                                            x =
                                                    with(LocalDensity.current) {
                                                        coords.first.toDp() - (chipSize / 2)
                                                    },
                                            y =
                                                    with(LocalDensity.current) {
                                                        coords.second.toDp() - (chipSize / 2)
                                                    }
                                    )
                                    .background(Color.White.copy(alpha = 0.5f), CircleShape)
                                    .border(1.dp, Color.White, CircleShape)
            )
        }
    }
}

// Helpers retained
fun Modifier.drawRightBorder(strokeWidth: Dp, color: Color) =
        this.drawBehind {
            val strokePx = strokeWidth.toPx()
            val x = size.width - (strokePx / 2f)
            drawLine(
                    color = color,
                    start = Offset(x, 0f),
                    end = Offset(x, size.height),
                    strokeWidth = strokePx
            )
        }

fun Modifier.drawBottomBorder(strokeWidth: Dp, color: Color) =
        this.drawBehind {
            val strokePx = strokeWidth.toPx()
            val y = size.height - (strokePx / 2f)
            drawLine(
                    color = color,
                    start = Offset(0f, y),
                    end = Offset(size.width, y),
                    strokeWidth = strokePx
            )
        }

fun Modifier.drawTopBorder(strokeWidth: Dp, color: Color) =
        this.drawBehind {
            val strokePx = strokeWidth.toPx()
            val y = strokePx / 2f
            drawLine(
                    color = color,
                    start = Offset(0f, y),
                    end = Offset(size.width, y),
                    strokeWidth = strokePx
            )
        }

@Composable
fun ChipView(amount: Int, modifier: Modifier = Modifier) {
    val color =
            when {
                amount >= 5000 -> Color(0xFF000000)
                amount >= 1000 -> Color(0xFFFF9800)
                amount >= 500 -> Color(0xFF9C27B0)
                amount >= 100 -> Color(0xFFF44336)
                amount >= 50 -> Color(0xFF4CAF50)
                else -> Color(0xFF2196F3)
            }
    val textColor = if (amount >= 5000) Color.White else Color.Black
    val displayAmount = formatAmount(amount)
    Box(
            modifier =
                    modifier.shadow(4.dp, CircleShape)
                            .background(color, CircleShape)
                            .border(2.dp, color, CircleShape),
            contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.size(26.dp)) {
            drawCircle(
                    color = Color.White.copy(alpha = 0.5f),
                    style =
                            Stroke(
                                    width = 1.dp.toPx(),
                                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(5f, 5f), 0f)
                            )
            )
        }
        Text(
                text = displayAmount,
                color = textColor,
                fontSize = if (displayAmount.length > 3) 8.sp else 10.sp,
                fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun Dolly() {
    Box(modifier = Modifier.size(36.dp).zIndex(100f), contentAlignment = Alignment.Center) {
        Box(
                modifier =
                        Modifier.size(24.dp)
                                .background(Color(0x33FFFFFF), CircleShape)
                                .border(2.dp, PrimaryGold, CircleShape)
        )
        Box(
                modifier =
                        Modifier.width(8.dp)
                                .height(16.dp)
                                .offset(y = (-4).dp)
                                .background(PrimaryGold, RoundedCornerShape(4.dp))
        )
    }
}

fun formatAmount(amount: Int): String {
    return when {
        amount >= 1000 -> "${(amount / 1000.0).toString().removeSuffix(".0")}k"
        else -> amount.toString()
    }
}
