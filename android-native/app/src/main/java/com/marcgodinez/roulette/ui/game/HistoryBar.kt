package com.marcgodinez.roulette.ui.game

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.marcgodinez.roulette.data.GameConstants.RED_NUMBERS
import com.marcgodinez.roulette.ui.theme.*

@Composable
fun HistoryBar(history: List<Int>, onStatsClick: () -> Unit) {
    var showFullHistory by remember { mutableStateOf(false) }

    Row(
            modifier =
                    Modifier.fillMaxWidth()
                            .height(70.dp) // Adjusted height
                            .padding(vertical = 5.dp),
            verticalAlignment = Alignment.CenterVertically
    ) {
        // Stats Button
        Box(
                modifier =
                        Modifier.size(40.dp)
                                .background(Color(0xFF1E293B), CircleShape)
                                .border(1.dp, PrimaryGold, CircleShape)
                                .clickable { onStatsClick() },
                contentAlignment = Alignment.Center
        ) { Text("📊", fontSize = 18.sp) }

        Spacer(modifier = Modifier.width(10.dp))

        // History Row
        LazyRow(
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                contentPadding = PaddingValues(end = 10.dp),
                verticalAlignment = Alignment.CenterVertically
        ) { items(history) { number -> HistoryBubble(number) } }
    }

    if (showFullHistory) {
        FullHistoryDialog(history, onDismiss = { showFullHistory = false })
    }
}

@Composable
fun HistoryBubble(number: Int, isGrid: Boolean = false) {
    val color =
            when {
                number == 0 -> SuccessGreen
                RED_NUMBERS.contains(number) -> ErrorRed
                else -> Color.Black
            }

    val size = if (isGrid) 45.dp else 40.dp

    Box(
            modifier =
                    Modifier.size(size)
                            .background(color, CircleShape)
                            .border(2.dp, Color(0x1AFFFFFF), CircleShape),
            contentAlignment = Alignment.Center
    ) {
        Text(
                text = number.toString(),
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp
        )
    }
}

@Composable
fun FullHistoryDialog(history: List<Int>, onDismiss: () -> Unit) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
                colors = CardDefaults.cardColors(containerColor = SurfaceBg),
                border = BorderStroke(1.dp, BorderSubtle),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.padding(16.dp)
        ) {
            Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                        "Game History",
                        color = PrimaryGold,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(20.dp))

                // Simple Grid Layout
                val columns = 5
                val rows = (history.size + columns - 1) / columns

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    for (i in 0 until rows) {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            for (j in 0 until columns) {
                                val idx = i * columns + j
                                if (idx < history.size) {
                                    HistoryBubble(history[idx], isGrid = true)
                                } else {
                                    Spacer(modifier = Modifier.size(45.dp))
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))
                Button(
                        onClick = onDismiss,
                        colors = ButtonDefaults.buttonColors(containerColor = DarkBg),
                        border = BorderStroke(1.dp, BorderSubtle)
                ) { Text("CLOSE", color = TextGray, fontWeight = FontWeight.Bold) }
            }
        }
    }
}
