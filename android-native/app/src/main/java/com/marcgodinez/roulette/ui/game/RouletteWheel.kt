package com.marcgodinez.roulette.ui.game

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import com.marcgodinez.roulette.R
import com.marcgodinez.roulette.data.GameConstants
import com.marcgodinez.roulette.ui.theme.PrimaryGold
import kotlin.math.cos
import kotlin.math.pow
import kotlin.math.sin
import kotlinx.coroutines.launch

// Standard European Roulette Sequence (Clockwise from 0)
val EUROPEAN_SEQUENCE = GameConstants.EUROPEAN_SEQUENCE

/**
 * Custom Easing to match React Native Reanimated `Easing.out(Easing.cubic)` Logic: 1 - (1 - t)^3
 */
class EaseOutCubic : Easing {
        override fun transform(fraction: Float): Float {
                val t = 1f - fraction
                return 1f - t * t * t
        }
}

/**
 * Custom Easing to match React Native Reanimated `Easing.inOut(Easing.exp)` Logic: Exponential Ease
 * InOut if t < 0.5: 2^(20t - 10) / 2 if t >= 0.5: (2 - 2^(-20t + 10)) / 2
 */
class EaseInOutExpo : Easing {
        override fun transform(fraction: Float): Float {
                if (fraction == 0f) return 0f
                if (fraction == 1f) return 1f

                if (fraction < 0.5f) {
                        return 2.0.pow(20.0 * fraction - 10.0).toFloat() / 2f
                } else {
                        return (2f - 2.0.pow(-20.0 * fraction + 10.0).toFloat()) / 2f
                }
        }
}

@Composable
fun RouletteWheel(
        isSpinning: Boolean,
        winningNumber: Int?,
        fireNumbers: List<Int> = emptyList(),
        modifier: Modifier = Modifier
) {
        val rotation = remember { Animatable(0f) }
        val ballRotation = remember { Animatable(0f) }
        // Starts at edge (0.85 relative to half-size), drops to pocket (0.67)
        val ballRadiusFactor = remember { Animatable(0.85f) }

        LaunchedEffect(isSpinning, winningNumber) {
                if (isSpinning && winningNumber != null) {
                        // === SINGLE SHOT SPIN LOGIC (Exact Port from Expo) ===

                        // 0. RESET Ball Radius (100ms) - Expo Line 39
                        launch {
                                ballRadiusFactor.animateTo(
                                        targetValue = 0.85f,
                                        animationSpec =
                                                tween(durationMillis = 100, easing = LinearEasing)
                                )
                        }

                        // Calculate final target immediately.
                        val singleSlotAngle = 360f / 37f
                        val winningIndex = EUROPEAN_SEQUENCE.indexOf(winningNumber)

                        // If winning number not found (shouldn't happen), default to 0
                        val safeWinningIndex = if (winningIndex == -1) 0 else winningIndex

                        // === Wheel Logic ===
                        // Target: rotate ~5 times + alignment
                        val currentWheel = rotation.value
                        val angleOfNumber = safeWinningIndex * singleSlotAngle

                        // Expo Line 52: const alignmentOffset = 360 - angleOfNumber;
                        val alignmentOffset = 360f - angleOfNumber

                        val minSpins = 5f * 360f // 5 full spins

                        val currentMod = currentWheel % 360f
                        val safeCurrentMod = if (currentMod >= 0) currentMod else currentMod + 360f

                        // Expo Lines 59-60
                        var delta = alignmentOffset - safeCurrentMod
                        if (delta < 0) delta += 360f

                        val targetWheel = currentWheel + minSpins + delta
                        val DURATION = 6500 // 6.5 Seconds

                        // Spin Wheel
                        launch {
                                rotation.animateTo(
                                        targetValue = targetWheel,
                                        animationSpec = tween(DURATION, easing = EaseOutCubic())
                                )
                        }

                        // === Ball Logic ===
                        // Expo Line 82: const targetBall = currentBall - minBallSpins;
                        val currentBall = ballRotation.value
                        val minBallSpins = 5f * 360f
                        val targetBall = currentBall - minBallSpins

                        launch {
                                ballRotation.animateTo(
                                        targetValue = targetBall,
                                        animationSpec = tween(DURATION, easing = EaseOutCubic())
                                )
                        }

                        // Spiral In (Drop)
                        // Expo Lines 92-95: Drops to 0.76 (In Android we user 0.62 per request)
                        launch {
                                ballRadiusFactor.animateTo(
                                        targetValue = 0.62f,
                                        animationSpec = tween(DURATION, easing = EaseInOutExpo())
                                )
                        }
                }
        }

        // Root Container with 3D Tilt and Drop Shadow
        Box(
                modifier =
                        modifier.shadow(
                                        elevation = 15.dp,
                                        shape = CircleShape,
                                        clip = false,
                                        ambientColor = Color.Black,
                                        spotColor = Color.Black
                                )
                                .graphicsLayer {
                                        rotationX = 48f // Slightly more tilt
                                        cameraDistance = 15 * density
                                },
                contentAlignment = Alignment.Center
        ) {
                // --- CASING & NEON ---
                Canvas(modifier = Modifier.matchParentSize()) {
                        val radius = size.minDimension / 2f
                        val centerOffset = center

                        // 1. Metallic Outer Rim (Linear Gradient for volume)
                        drawCircle(
                                brush =
                                        androidx.compose.ui.graphics.Brush.linearGradient(
                                                colors =
                                                        listOf(
                                                                Color(0xFF353535),
                                                                Color(0xFF0A0A0A),
                                                                Color(0xFF222222)
                                                        ),
                                                start = Offset(0f, 0f),
                                                end = Offset(size.width, size.height)
                                        ),
                                radius = radius,
                                center = centerOffset
                        )

                        // 2. Inner Glow / Beveled Rim Edge
                        drawCircle(
                                color = Color(0xFF444444),
                                radius = radius - 2.dp.toPx(),
                                center = centerOffset,
                                style =
                                        androidx.compose.ui.graphics.drawscope.Stroke(
                                                width = 2.dp.toPx()
                                        )
                        )

                        // 2.5 Depth Ring (Dark separator)
                        drawCircle(
                                color = Color.Black,
                                radius = radius - 8.dp.toPx(),
                                center = centerOffset,
                                style =
                                        androidx.compose.ui.graphics.drawscope.Stroke(
                                                width = 1.dp.toPx()
                                        )
                        )

                        // 3. Neon Glow (Simulated with multiple strokes)
                        val glowColor = Color(0xFF2196F3)
                        for (i in 1..4) {
                                drawCircle(
                                        color = glowColor.copy(alpha = 0.12f / i),
                                        radius = radius - 4.dp.toPx(),
                                        center = centerOffset,
                                        style =
                                                androidx.compose.ui.graphics.drawscope.Stroke(
                                                        width = (8 + i * 6).dp.toPx()
                                                )
                                )
                        }

                        // 4. Sharp Neon Stroke
                        drawCircle(
                                color = glowColor,
                                radius = radius,
                                center = centerOffset,
                                style =
                                        androidx.compose.ui.graphics.drawscope.Stroke(
                                                width = 3.dp.toPx()
                                        )
                        )

                        // 5. Specular Highlight (Light Flare)
                        drawArc(
                                color = Color.White.copy(alpha = 0.2f),
                                startAngle = -120f,
                                sweepAngle = 40f,
                                useCenter = false,
                                topLeft = Offset(4.dp.toPx(), 4.dp.toPx()),
                                size =
                                        androidx.compose.ui.geometry.Size(
                                                size.width - 8.dp.toPx(),
                                                size.height - 8.dp.toPx()
                                        ),
                                style =
                                        androidx.compose.ui.graphics.drawscope.Stroke(
                                                width = 4.dp.toPx(),
                                                cap = StrokeCap.Round
                                        )
                        )
                }

                // Inner Black Void (Behind Wheel - Implicit in full coverage, but kept for depth if
                // needed)
                // (Omitted as the wheel covers it)

                // --- WHEEL CONTENT (Inset to fit inside Casing) ---
                Box(
                        modifier = Modifier.matchParentSize().padding(8.6.dp), // Precise inset
                        contentAlignment = Alignment.Center
                ) {
                        // 1. Wheel Image (Rotates)
                        Image(
                                painter = painterResource(id = R.drawable.roulette_wheel),
                                contentDescription = "Roulette Wheel",
                                modifier = Modifier.matchParentSize().rotate(rotation.value)
                        )

                        // 1.2 Depth Bowl Overlay (Concave Shadow)
                        Canvas(modifier = Modifier.matchParentSize()) {
                                drawCircle(
                                        brush =
                                                androidx.compose.ui.graphics.Brush.radialGradient(
                                                        colors =
                                                                listOf(
                                                                        Color.Transparent,
                                                                        Color.Black.copy(
                                                                                alpha = 0.5f
                                                                        )
                                                                ),
                                                        center = center,
                                                        radius = size.minDimension / 1.1f
                                                ),
                                        radius = size.minDimension / 2f,
                                        center = center
                                )
                        }

                        // 1.5 Fire Number Highlights (Rotates with Wheel)
                        if (fireNumbers.isNotEmpty()) {
                                Canvas(
                                        modifier = Modifier.matchParentSize().rotate(rotation.value)
                                ) {
                                        val radius = size.minDimension / 2f
                                        val slotAngle = 360f / 37f
                                        val arcStroke =
                                                androidx.compose.ui.graphics.drawscope.Stroke(
                                                        width = 3.dp.toPx()
                                                )

                                        fireNumbers.forEach { number ->
                                                val index = EUROPEAN_SEQUENCE.indexOf(number)
                                                if (index != -1) {
                                                        // 0 is at 12 o'clock (-90 deg). Sequence is
                                                        // CW.
                                                        // Slot 0 is centered at -90.
                                                        // Start of slot is -90 - half_slot.
                                                        val startAngle =
                                                                (index * slotAngle) -
                                                                        90f -
                                                                        (slotAngle / 2f)

                                                        drawArc(
                                                                color = PrimaryGold,
                                                                startAngle = startAngle,
                                                                sweepAngle = slotAngle,
                                                                useCenter = false,
                                                                topLeft =
                                                                        Offset(
                                                                                center.x - radius +
                                                                                        5.dp.toPx(),
                                                                                center.y - radius +
                                                                                        5.dp.toPx()
                                                                        ), // Inset slightly
                                                                size =
                                                                        androidx.compose.ui.geometry
                                                                                .Size(
                                                                                        (radius -
                                                                                                5.dp.toPx()) *
                                                                                                2,
                                                                                        (radius -
                                                                                                5.dp.toPx()) *
                                                                                                2
                                                                                ),
                                                                style = arcStroke
                                                        )
                                                }
                                        }
                                }
                        }

                        // 2. Ball Layer (Rotates independently)
                        val density = LocalDensity.current

                        Canvas(modifier = Modifier.matchParentSize()) {
                                val radius = size.minDimension / 2f
                                val currentBallRadius = radius * ballRadiusFactor.value

                                // Ball Angle comes from ballRotation (degrees)
                                // -90 is Top (standard DrawScope 0 is East/Right)
                                val angleRad = Math.toRadians((ballRotation.value - 90).toDouble())

                                val ballX = center.x + currentBallRadius * cos(angleRad).toFloat()
                                val ballY = center.y + currentBallRadius * sin(angleRad).toFloat()

                                // Ball Size (Reduced per user feedback)
                                val ballRadiusPx = with(density) { 3.5.dp.toPx() }
                                val shadowRadiusPx = with(density) { 4.dp.toPx() }
                                val shadowOffsetPx = with(density) { 1.dp.toPx() }

                                // Shadow
                                drawCircle(
                                        color = Color.Black.copy(alpha = 0.5f),
                                        radius = shadowRadiusPx,
                                        center = Offset(ballX, ballY + shadowOffsetPx)
                                )

                                // Ball
                                drawCircle(
                                        color = Color.White,
                                        radius = ballRadiusPx,
                                        center = Offset(ballX, ballY)
                                )
                        }

                        // 3. Pointer (Triangle at Top)
                        Canvas(modifier = Modifier.matchParentSize()) {
                                val pointerWidthPx = with(density) { 16.dp.toPx() }
                                val pointerHeightPx = with(density) { 16.dp.toPx() }

                                val topCenter = Offset(size.width / 2, 0f)

                                val trianglePath =
                                        androidx.compose.ui.graphics.Path().apply {
                                                moveTo(
                                                        topCenter.x,
                                                        topCenter.y + pointerHeightPx
                                                ) // Point down tip
                                                lineTo(
                                                        topCenter.x - (pointerWidthPx / 2),
                                                        topCenter.y
                                                )
                                                lineTo(
                                                        topCenter.x + (pointerWidthPx / 2),
                                                        topCenter.y
                                                )
                                                close()
                                        }

                                // Shadow for pointer
                                drawPath(trianglePath, Color.Black.copy(alpha = 0.3f), style = Fill)

                                drawPath(trianglePath, PrimaryGold)
                        }
                }
        }
}
