package com.marcgodinez.roulette.ui.game

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import com.marcgodinez.roulette.data.GameConstants.RED_NUMBERS
import com.marcgodinez.roulette.ui.theme.*

@Composable
fun FireOverlay(isVisible: Boolean, fireNumbers: List<Int>) {
    if (!isVisible) return

    Box(
            modifier =
                    Modifier.fillMaxSize()
                            .background(Color.Black.copy(alpha = 0.6f))
                            .padding(top = 180.dp)
                            .zIndex(2000f), // High Z-Index
            contentAlignment = Alignment.TopCenter
    ) {
        Column(
                modifier =
                        Modifier.fillMaxWidth(0.9f)
                                .background(Color(0xE60A0A0A), RoundedCornerShape(20.dp))
                                .border(2.dp, ErrorRed, RoundedCornerShape(20.dp))
                                .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                    "MEGA FIRE 🔥",
                    color = ErrorRed,
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 2.sp,
                    modifier = Modifier.padding(bottom = 15.dp)
            )

            Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
            ) {
                fireNumbers.forEachIndexed { index, num ->
                    val delay = index * 50
                    // Simple Bubble
                    FireBubble(num)
                    if (index < fireNumbers.size - 1) Spacer(Modifier.width(10.dp))
                }
            }
        }
    }
}

@Composable
fun FireBubble(number: Int) {
    val color =
            when {
                number == 0 -> SuccessGreen
                RED_NUMBERS.contains(number) -> ErrorRed
                else -> Color.Black
            }

    Box(
            modifier =
                    Modifier.size(42.dp)
                            .background(color, CircleShape)
                            .border(2.dp, Color.White, CircleShape),
            contentAlignment = Alignment.Center
    ) {
        Text(
                text = number.toString(),
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 20.sp
        )
    }
}
