package com.marcgodinez.roulette.ui.game

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.times
import kotlin.random.Random
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

// --- Constants & Styles ---
val NEON_FUCHSIA = Color(0xFFD946EF)
val NEON_RED = Color(0xFFEF4444)
val NEON_YELLOW = Color(0xFFEAB308)
val NEON_GREEN = Color(0xFF22C55E)
val NEON_BLUE = Color(0xFF3B82F6)

data class NeonStyle(val color: Color, val shadow: Color)

fun getNeonStyle(value: Int): NeonStyle {
        return when {
                value >= 100 -> NeonStyle(NEON_FUCHSIA, Color(0xFFF0ABFC))
                value >= 50 -> NeonStyle(NEON_RED, Color(0xFFFCA5A5))
                value >= 20 -> NeonStyle(NEON_YELLOW, Color(0xFFFDE047))
                value >= 10 -> NeonStyle(NEON_GREEN, Color(0xFF86EFAC))
                else -> NeonStyle(NEON_BLUE, Color(0xFF93C5FD))
        }
}

data class GridCell(val value: Int?, val isLocked: Boolean, val id: Int)

// --- Helper Components ---

@Composable
fun RenderBall(value: Int, size: Dp = 50.dp, isRain: Boolean = false) {
        val style = getNeonStyle(value)
        val density = LocalDensity.current
        val fontSize = with(density) { (size.toPx() * 0.45f).toSp() }

        Box(
                modifier =
                        Modifier.size(size)
                                .shadow(
                                        elevation = if (isRain) 3.dp else 10.dp,
                                        shape = CircleShape,
                                        spotColor = style.color,
                                        ambientColor =
                                                style.color // Add ambient color for better glow
                                )
                                .background(Color(0xE6141414), CircleShape) // rgba(20,20,20,0.9)
                                .border(2.dp, style.color, CircleShape),
                contentAlignment = Alignment.Center
        ) {
                // Internal Gloss
                Box(
                        modifier =
                                Modifier.align(Alignment.TopStart)
                                        .offset(x = size * 0.2f, y = 3.dp)
                                        .size(width = size * 0.4f, height = size * 0.2f)
                                        .rotate(-45f)
                                        .background(
                                                Color(0x26FFFFFF),
                                                RoundedCornerShape(20)
                                        ) // rgba(255,255,255,0.15)
                )

                Text(
                        text = value.toString(),
                        color = Color.White,
                        fontWeight = FontWeight.Black,
                        fontSize = fontSize,
                        style =
                                androidx.compose.ui.text.TextStyle(
                                        shadow = Shadow(color = style.color, blurRadius = 10f)
                                )
                )
        }
}

@Composable
fun LockedCell(value: Int) {
        // Animations: TranslateY (-120 -> 0), ScaleY/ScaleX bounce
        // Android Compose makes sequential animations slightly different.
        // We will use Animatable for precise control or standard transition.

        val visibleState = remember { MutableTransitionState(false).apply { targetState = true } }

        // We can just us standard Animatable for entrance
        val translateY = remember { Animatable(-120f) }
        val scale = remember { Animatable(0.5f) }

        LaunchedEffect(Unit) {
                launch {
                        translateY.animateTo(
                                targetValue = 0f,
                                animationSpec = spring(dampingRatio = 0.8f, stiffness = 250f)
                        )
                }
                launch {
                        // Simple Sequence: slight overshoot is handled by spring, but let's try to
                        // match
                        // Expo's keyframes if needed. Expo: 0 start -> wait -> 1.3/0.7 -> 1
                        // For simplicity and "feel", a spring overshoot is often enough.
                        scale.animateTo(
                                targetValue = 1f,
                                animationSpec = spring(dampingRatio = 0.5f, stiffness = 150f)
                        )
                }
        }

        Box(
                modifier = Modifier.offset(y = translateY.value.dp).scale(scale.value)
                // zIndex equivalent is essentially drawing order
                ) { RenderBall(value = value, size = 58.dp) }
}

@Composable
fun RainColumn(
        cells: List<GridCell>,
        isFull: Boolean,
        isActive: Boolean,
        colIndex: Int,
        trigger: Int
) {
        val CELL_HEIGHT = 70.dp
        val VIEW_HEIGHT = CELL_HEIGHT * 3

        // Rain Data
        // trigger causes new rain data and animation
        val rainData =
                remember(trigger) {
                        val body =
                                List(30) {
                                        if (Random.nextDouble() > 0.8) null
                                        else listOf(5, 10, 20, 50, 2, 5, 8).random()
                                }
                        val tail = List(5) { null } // clear tail
                        tail + body
                }

        val STRIP_LENGTH = rainData.size
        val STRIP_HEIGHT_DP = CELL_HEIGHT * STRIP_LENGTH

        // Animation: translateY from -STRIP_HEIGHT to 0
        // Expo: withTiming(0, duration: 2000, linear) if !isFull && isActive

        val animTranslationY = remember { Animatable(-STRIP_HEIGHT_DP.value) }
        val animOpacity = remember { Animatable(0f) }

        LaunchedEffect(trigger) {
                if (!isFull && isActive) {
                        animOpacity.snapTo(1f)
                        // Cascade delay: Left to right
                        delay(colIndex * 300L)

                        // Reset and Spin
                        animTranslationY.snapTo(-STRIP_HEIGHT_DP.value)
                        animTranslationY.animateTo(
                                targetValue = 0f,
                                animationSpec = tween(durationMillis = 2000, easing = LinearEasing)
                        )
                        // Fade out after spin (optional, or just let it sit until next round)
                        animOpacity.animateTo(0f, tween(300))
                } else {
                        animOpacity.snapTo(0f)
                }
        }

        Box(
                modifier =
                        Modifier.width(75.dp)
                                .height(210.dp) // 3 * 70
                                .background(Color(0xFF0A0A0A), RoundedCornerShape(4.dp))
                                .border(1.dp, Color(0xFF222222), RoundedCornerShape(4.dp))
                                .clip(RoundedCornerShape(4.dp)) // Clip children (rain)
        ) {
                // Rain Layer
                if (!isFull) { // Render only if not full, similar to Expo logic optimization
                        Box(
                                modifier =
                                        Modifier.fillMaxWidth().graphicsLayer {
                                                translationY = animTranslationY.value.dp.toPx()
                                                alpha = animOpacity.value
                                        }
                        ) {
                                Column {
                                        rainData.forEach { value ->
                                                Box(
                                                        modifier =
                                                                Modifier.height(CELL_HEIGHT)
                                                                        .fillMaxWidth(),
                                                        contentAlignment = Alignment.Center
                                                ) {
                                                        if (value != null) {
                                                                Box(
                                                                        modifier =
                                                                                Modifier.scale(0.8f)
                                                                ) {
                                                                        RenderBall(
                                                                                value = value,
                                                                                size = 50.dp,
                                                                                isRain = true
                                                                        )
                                                                }
                                                        }
                                                }
                                        }
                                }
                        }
                }

                // Locked Cells Layer
                Column {
                        cells.forEach { cell ->
                                Box(
                                        modifier =
                                                Modifier.height(CELL_HEIGHT)
                                                        .fillMaxWidth()
                                                        .border(
                                                                width = 1.dp,
                                                                color =
                                                                        Color(
                                                                                0x0DFFFFFF
                                                                        ) // rgba(255,255,255,0.05)
                                                                // Note: Borders in Compose are
                                                                // inset or centered depending on
                                                                // shape.
                                                                // Simply putting it here acts as
                                                                // separator.
                                                                ),
                                        contentAlignment = Alignment.Center
                                ) {
                                        androidx.compose.animation.AnimatedVisibility(
                                                visible = cell.isLocked,
                                                enter =
                                                        slideInVertically(
                                                                animationSpec =
                                                                        tween(
                                                                                durationMillis =
                                                                                        600,
                                                                                easing =
                                                                                        FastOutSlowInEasing
                                                                        ), // Gravity fall
                                                                initialOffsetY = { fullHeight ->
                                                                        -fullHeight
                                                                } // Start from top
                                                        ) +
                                                                fadeIn(
                                                                        animationSpec =
                                                                                tween(
                                                                                        durationMillis =
                                                                                                200
                                                                                )
                                                                )
                                        ) { LockedCell(cell.value ?: 0) }
                                }
                        }
                }
        }
}

@Composable
fun ResultPanel(multiplier: Int, prize: Double, onCollect: () -> Unit) {
        var count by remember { mutableStateOf(0) }
        var showPrize by remember { mutableStateOf(false) }

        LaunchedEffect(multiplier) {
                val duration = 1500
                val startTime = System.currentTimeMillis()

                while (isActive) {
                        val now = System.currentTimeMillis()
                        val elapsed = now - startTime
                        val progress = (elapsed / duration.toFloat()).coerceAtMost(1f)

                        // Ease Out Quad
                        val eased = 1 - (1 - progress) * (1 - progress)
                        count = (eased * multiplier).toInt()

                        if (progress >= 1f) {
                                showPrize = true
                                break
                        }
                        delay(16) // ~60fps
                }
        }

        Box(
                modifier = Modifier.fillMaxWidth().height(120.dp),
                contentAlignment = Alignment.Center
        ) {
                if (!showPrize) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                        text = "TOTAL MULTIPLIER",
                                        color = Color(0xFFAAAAAA),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp,
                                        letterSpacing = 2.sp,
                                        modifier = Modifier.padding(bottom = 5.dp)
                                )
                                Text(
                                        text = "${count}x",
                                        color = Color.White,
                                        fontWeight = FontWeight.Black,
                                        fontSize = 42.sp,
                                        style =
                                                androidx.compose.ui.text.TextStyle(
                                                        shadow =
                                                                Shadow(
                                                                        color = NEON_BLUE,
                                                                        blurRadius = 20f
                                                                )
                                                )
                                )
                        }
                } else {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                        text = "TOTAL WIN",
                                        color = Color(0xFFAAAAAA),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp,
                                        letterSpacing = 2.sp,
                                        modifier = Modifier.padding(bottom = 5.dp)
                                )
                                Text(
                                        text = "$${prize.toInt()}",
                                        color = Color.White,
                                        fontWeight = FontWeight.Black,
                                        fontSize = 56.sp,
                                        style =
                                                androidx.compose.ui.text.TextStyle(
                                                        shadow =
                                                                Shadow(
                                                                        color = Color.White,
                                                                        blurRadius = 30f
                                                                )
                                                ),
                                        modifier = Modifier.padding(bottom = 10.dp)
                                )

                                Box(
                                        modifier =
                                                Modifier.background(
                                                                Color.White,
                                                                RoundedCornerShape(30.dp)
                                                        )
                                                        .clickable { onCollect() }
                                                        .padding(
                                                                horizontal = 40.dp,
                                                                vertical = 12.dp
                                                        )
                                                        .shadow(
                                                                10.dp,
                                                                RoundedCornerShape(30.dp),
                                                                spotColor = Color.White
                                                        )
                                ) {
                                        Text(
                                                text = "COLLECT",
                                                color = Color.Black,
                                                fontWeight = FontWeight.Black,
                                                fontSize = 16.sp,
                                                letterSpacing = 1.sp
                                        )
                                }
                        }
                }
        }
}

@Composable
fun BonusGame(
        onClose: (Int, Double) -> Unit // multiplier, payout
) {
        // Game State
        var lives by remember { mutableIntStateOf(3) }
        var roundCount by remember { mutableIntStateOf(0) }
        var grid by remember { mutableStateOf(List(12) { GridCell(null, false, it) }) }
        var gameStatus by remember { mutableStateOf("PLAYING") } // PLAYING, FINISHED
        var finalStats by remember { mutableStateOf<Pair<Int, Double>?>(null) }
        var isActive by remember { mutableStateOf(false) }
        var cycleTrigger by remember { mutableStateOf(0) }

        // Auto-close logic
        LaunchedEffect(gameStatus) {
                if (gameStatus == "FINISHED") {
                        delay(4500)
                        finalStats?.let { (mult, payout) -> onClose(mult, payout) }
                }
        }

        // This loop logic controls the game flow/turns
        LaunchedEffect(cycleTrigger, gameStatus) {
                if (gameStatus != "PLAYING") return@LaunchedEffect

                roundCount++ // Increment roundCount at the start of the loop

                if (lives <= 0) {
                        // End Game
                        val totalMult = grid.sumOf { if (it.isLocked) it.value ?: 0 else 0 }
                        finalStats = totalMult to (totalMult * 10.0) // Mock payout calc
                        gameStatus = "FINISHED"
                        return@LaunchedEffect
                }

                // Check for empty slots
                val emptyIndices = grid.indices.filter { !grid[it].isLocked }
                if (emptyIndices.isEmpty()) {
                        val totalMult = grid.sumOf { if (it.isLocked) it.value ?: 0 else 0 }
                        finalStats = totalMult to (totalMult * 10.0)
                        gameStatus = "FINISHED"
                        return@LaunchedEffect
                }

                isActive = true

                // Determine hits beforehand for this round
                // ... same logic ...
                // (Omitted for brevity, assuming tool keeps context but I must replace correctly)
                // Wait, I am not replacing logic, just viewing.
                // I will target the UI layer.

                // 60% Chance of Hit
                val hits = mutableListOf<Pair<Int, Int>>() // Index, Value
                if (Random.nextDouble() < 0.60) {
                        val numHits = if (Random.nextDouble() > 0.85) 2 else 1
                        val available = emptyIndices.toMutableList()

                        repeat(numHits) {
                                if (available.isNotEmpty()) {
                                        val randIdx = available.random()
                                        available.remove(randIdx)

                                        val r = Random.nextDouble() * 100
                                        val v =
                                                when {
                                                        r < 50 -> 5
                                                        r < 75 -> 10
                                                        r < 90 -> 20
                                                        r < 98 -> 50
                                                        else -> 100
                                                }
                                        hits.add(randIdx to v)
                                }
                        }
                }

                // Schedule Hits
                // In Expo, we used setTimeout. In Compose, we can use delay inside this coroutine.
                // We need to launch concurrent delays for each hit so they don't block each other
                // sequentially
                // However, since we are in a single CoroutineScope here, we can use `launch` for
                // each hit.

                val hitJobs =
                        hits.map { (idx, value) ->
                                launch {
                                        val delayMs = Random.nextLong(500, 1500)
                                        delay(delayMs)
                                        // Apply Hit
                                        lives = 3 // Reset lives on hit
                                        grid =
                                                grid.toMutableList().apply {
                                                        this[idx] = GridCell(value, true, idx)
                                                }
                                }
                        }

                // End of Round Timer
                delay(2500)
                isActive = false

                // Wait for hits to finish visually (should be done by 1500ms max usually)
                hitJobs.forEach { it.join() }

                val didHit = hits.isNotEmpty()
                if (!didHit) {
                        lives = (lives - 1).coerceAtLeast(0)
                }

                // Next Cycle
                val nextLives = if (didHit) 3 else lives
                if (nextLives > 0) {
                        delay(if (didHit) 1500 else 1000)
                        cycleTrigger++
                } else {
                        delay(1000)
                        // Trigger end game by next loop iteration catching lives <= 0
                        cycleTrigger++
                }
        }

        fun handleSkip() {
                // Fill remaining randomly to finish instantly (simulated)
                val finalGrid =
                        grid.map { cell ->
                                if (cell.isLocked) cell
                                else if (Random.nextDouble() > 0.7)
                                        GridCell(5, true, cell.id) // Mock fill
                                else GridCell(null, false, cell.id)
                        }
                grid = finalGrid

                val totalMult = grid.sumOf { if (it.isLocked) it.value ?: 0 else 0 }
                finalStats = totalMult to (totalMult * 10.0)
                gameStatus = "FINISHED"
        }

        Box(
                modifier =
                        Modifier.fillMaxSize()
                                .background(Color(0xFF05050A)) // Deep Dark Blue/Black
                                .padding(16.dp),
                contentAlignment = Alignment.Center
        ) {
                Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        // verticalArrangement = Arrangement.spacedBy(20.dp)
                        ) {
                        // Header
                        Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier.padding(bottom = 20.dp)
                        ) {
                                Text(
                                        text = "FIRE DROP",
                                        color = Color(0xFFFF4444),
                                        fontSize = 32.sp,
                                        fontWeight = FontWeight.Black,
                                        letterSpacing = 3.sp,
                                        style =
                                                androidx.compose.ui.text.TextStyle(
                                                        shadow =
                                                                Shadow(
                                                                        color = Color.Red,
                                                                        blurRadius = 20f
                                                                )
                                                )
                                )

                                // Lives
                                Row(
                                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                                        modifier = Modifier.padding(top = 5.dp)
                                ) {
                                        repeat(3) { i ->
                                                val active = i < lives
                                                Box(
                                                        modifier =
                                                                Modifier.size(12.dp)
                                                                        .clip(CircleShape)
                                                                        .background(
                                                                                if (active)
                                                                                        NEON_GREEN
                                                                                else
                                                                                        Color(
                                                                                                0xFF333333
                                                                                        )
                                                                        )
                                                                        .border(
                                                                                1.dp,
                                                                                if (active)
                                                                                        Color.White
                                                                                else
                                                                                        Color.Transparent,
                                                                                CircleShape
                                                                        )
                                                                        .shadow(
                                                                                if (active) 5.dp
                                                                                else 0.dp,
                                                                                CircleShape,
                                                                                spotColor =
                                                                                        NEON_GREEN
                                                                        )
                                                )
                                        }
                                }

                                Text(
                                        text =
                                                if (gameStatus == "PLAYING")
                                                        "MULTIPLIERS RAINING..."
                                                else "BONUS COMPLETE",
                                        color = Color(0xFF666666),
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        letterSpacing = 1.sp,
                                        modifier = Modifier.padding(top = 5.dp)
                                )
                        }

                        // GRID CONTAINER
                        Box(
                                modifier =
                                        Modifier.background(Color.Black, RoundedCornerShape(14.dp))
                                                .border(
                                                        2.dp,
                                                        Color(0xFF333333),
                                                        RoundedCornerShape(14.dp)
                                                )
                                                .padding(5.dp)
                                                .shadow(
                                                        30.dp,
                                                        RoundedCornerShape(14.dp),
                                                        spotColor = Color(0xFFFF4444),
                                                        ambientColor = Color.Red
                                                )
                        ) {
                                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                        // 4 Columns
                                        repeat(4) { colIndex ->
                                                // Get cells for this column
                                                // Row 0, 1, 2 for this Col
                                                // Idx = r * 4 + c
                                                val colCells =
                                                        List(3) { r -> grid[r * 4 + colIndex] }
                                                val lockedCount = colCells.count { it.isLocked }
                                                val isFull = lockedCount == 3

                                                RainColumn(
                                                        cells = colCells,
                                                        isFull = colCells.all { it.isLocked },
                                                        isActive = lives > 0,
                                                        colIndex = colIndex,
                                                        trigger = roundCount
                                                )
                                        }
                                }
                        }

                        // FOOTER
                        Box(
                                modifier =
                                        Modifier.fillMaxWidth().height(120.dp).padding(top = 30.dp),
                                contentAlignment = Alignment.Center
                        ) {
                                if (gameStatus == "PLAYING") {
                                        Box(
                                                modifier =
                                                        Modifier.background(
                                                                        Color(0x0DFFFFFF),
                                                                        RoundedCornerShape(20.dp)
                                                                )
                                                                .border(
                                                                        1.dp,
                                                                        Color(0x1AFFFFFF),
                                                                        RoundedCornerShape(20.dp)
                                                                )
                                                                .clickable { handleSkip() }
                                                                .padding(
                                                                        vertical = 12.dp,
                                                                        horizontal = 25.dp
                                                                )
                                        ) {
                                                Text(
                                                        text = "SKIP TO RESULT",
                                                        color = Color(0xFF888888),
                                                        fontWeight = FontWeight.Bold,
                                                        fontSize = 12.sp,
                                                        letterSpacing = 1.sp
                                                )
                                        }
                                } else {
                                        finalStats?.let { (mult, payout) ->
                                                ResultPanel(
                                                        multiplier = mult,
                                                        prize = payout,
                                                        onCollect = { onClose(mult, payout) }
                                                )
                                        }
                                }
                        }
                }
        }
}
