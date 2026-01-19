package com.marcgodinez.roulette.ui.game

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.marcgodinez.roulette.ui.theme.PrimaryGold
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin

data class Chip(val value: Int, val color: Color, val label: String)

val CHIPS =
        listOf(
                Chip(10, Color(0xFF2196F3), "10"),
                Chip(50, Color(0xFF4CAF50), "50"),
                Chip(100, Color(0xFFF44336), "100"),
                Chip(500, Color(0xFF9C27B0), "500"),
                Chip(1000, Color(0xFFFF9800), "1k"),
                Chip(5000, Color(0xFF000000), "5k")
        )

@Composable
fun ChipSelector(
        selectedChipValue: Int,
        onSelectChip: (Int) -> Unit,
        modifier: Modifier = Modifier
) {
    var isOpen by remember { mutableStateOf(false) }

    val animationProgress by
            animateFloatAsState(
                    targetValue = if (isOpen) 1f else 0f,
                    animationSpec = spring(dampingRatio = 0.6f, stiffness = Spring.StiffnessLow)
            )

    val selectedChip = CHIPS.find { it.value == selectedChipValue } ?: CHIPS[0]

    // Radial Config
    val radiusDp = 120.dp
    val startAngle = -90.0 // Up
    val endAngle = 0.0 // Right

    Box(modifier = modifier, contentAlignment = Alignment.BottomStart) {

        // Render Expanded Chips (Behind the toggle)
        if (animationProgress > 0.01f) {
            CHIPS.forEachIndexed { index, chip ->
                val range = endAngle - startAngle
                val step = range / (CHIPS.size - 1)
                val angleDeg = startAngle + (index * step)
                val angleRad = Math.toRadians(angleDeg)

                val density = LocalDensity.current
                val radiusPx = with(density) { radiusDp.toPx() }

                val tx = (cos(angleRad) * radiusPx * animationProgress).roundToInt()
                val ty = (sin(angleRad) * radiusPx * animationProgress).roundToInt()

                val scale = animationProgress

                ChipButtonDisplay(
                        chip = chip,
                        isSelected = chip.value == selectedChipValue,
                        onClick = {
                            onSelectChip(chip.value)
                            isOpen = false
                        },
                        modifier = Modifier.offset { IntOffset(tx, ty) }.scale(scale)
                )
            }
        }

        // Main Toggle Button
        ChipButtonDisplay(
                chip = selectedChip,
                isSelected = true,
                onClick = { isOpen = !isOpen },
                isMain = true,
                modifier = Modifier.size(50.dp)
        )
    }
}

@Composable
fun ChipButtonDisplay(
        chip: Chip,
        isSelected: Boolean,
        onClick: () -> Unit,
        isMain: Boolean = false,
        modifier: Modifier = Modifier
) {
    val size = if (isMain) 50.dp else 40.dp
    val borderColor = if (isSelected && !isMain) PrimaryGold else Color.White.copy(alpha = 0.5f)

    Box(
            modifier =
                    modifier.size(size)
                            .background(chip.color, CircleShape)
                            .border(if (isMain) 2.dp else 1.5.dp, borderColor, CircleShape)
                            .clickable(onClick = onClick),
            contentAlignment = Alignment.Center
    ) {
        // Inner dashed circle simulation
        Box(
                modifier =
                        Modifier.size(size * 0.7f)
                                .border(1.dp, Color.White.copy(alpha = 0.5f), CircleShape)
        )
        Text(
                text = chip.label,
                color = if (chip.color == Color.Black) Color.White else Color.Black,
                fontSize = if (isMain) 14.sp else 10.sp,
                fontWeight = FontWeight.Bold
        )
    }
}
