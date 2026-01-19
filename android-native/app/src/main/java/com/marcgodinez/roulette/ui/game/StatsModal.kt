package com.marcgodinez.roulette.ui.game

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.marcgodinez.roulette.ui.theme.*

@Composable
fun StatsModal(history: List<Int>, onDismiss: () -> Unit) {
    var activeTab by remember { mutableStateOf("OVERVIEW") }

    // Logic Calculation
    val stats =
            remember(history) {
                val counts = mutableMapOf<Int, Int>()
                for (i in 0..36) counts[i] = 0
                history.forEach { num -> counts[num] = (counts[num] ?: 0) + 1 }

                val sorted = counts.entries.sortedByDescending { it.value }

                val hot = sorted.filter { it.value > 0 }.take(5).map { it.toPair() }
                val maxCount = if (sorted.isNotEmpty()) sorted.first().value else 1
                val coldThreshold = if (maxCount >= 4) maxCount / 4 else 0
                val cold =
                        sorted.reversed()
                                .filter { it.value == 0 || it.value <= coldThreshold }
                                .take(5)
                                .map { it.toPair() }

                StatsData(counts, hot, cold, history.size)
            }

    Dialog(
            onDismissRequest = onDismiss,
            properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Card(
                colors = CardDefaults.cardColors(containerColor = DarkBg),
                border = BorderStroke(1.dp, PrimaryGold),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth(0.95f).fillMaxHeight(0.85f).padding(16.dp)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // HEADER
                Row(
                        modifier = Modifier.fillMaxWidth().background(SurfaceBg).padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                            "SESSION ANALYTICS",
                            color = PrimaryGold,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                    )
                    Text(
                            "✕",
                            color = TextGray,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.clickable { onDismiss() }
                    )
                }

                // TABS
                Row(modifier = Modifier.fillMaxWidth().background(Color(0xFF0F172A))) {
                    TabButton("OVERVIEW", activeTab == "OVERVIEW") { activeTab = "OVERVIEW" }
                    TabButton("HEATMAP", activeTab == "HEATMAP") { activeTab = "HEATMAP" }
                    TabButton("LOG", activeTab == "LOG") { activeTab = "LOG" }
                }

                // BODY
                Column(modifier = Modifier.weight(1f).padding(16.dp)) {
                    when (activeTab) {
                        "OVERVIEW" -> OverviewTab(stats)
                        "HEATMAP" -> HeatmapTab(stats.counts)
                        "LOG" -> LogTab(history)
                    }
                }
            }
        }
    }
}

@Composable
fun RowScope.TabButton(text: String, isActive: Boolean, onClick: () -> Unit) {
    Box(
            modifier =
                    Modifier.weight(1f)
                            .clickable(onClick = onClick)
                            .background(if (isActive) Color(0x0DFFD700) else Color.Transparent)
                            .padding(vertical = 12.dp)
                            .border(width = 0.dp, color = Color.Transparent)
                            .border(width = 0.dp, color = Color.Transparent), // Simplified
            // simplified here
            contentAlignment = Alignment.Center
    ) {
        Column {
            Text(
                    text,
                    color = if (isActive) PrimaryGold else TextGray,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
            )
            if (isActive) {
                Spacer(modifier = Modifier.height(4.dp))
                Box(Modifier.height(2.dp).width(40.dp).background(PrimaryGold))
            }
        }
    }
}

@Composable
fun OverviewTab(stats: StatsData) {
    LazyColumn(horizontalAlignment = Alignment.CenterHorizontally) {
        item {
            Text(
                    "HOT & COLD (Last ${stats.total})",
                    color = TextGray,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
            )
            Spacer(modifier = Modifier.height(10.dp))

            Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                // HOT
                KpiBox("HOT") {
                    if (stats.hot.isEmpty()) Text("-", color = TextGray)
                    else {
                        Row(horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                            stats.hot.forEach { (num, count) ->
                                Box(
                                        modifier =
                                                Modifier.size(30.dp)
                                                        .background(
                                                                if (count >= 4) ErrorRed
                                                                else Color(0xFFEAB308),
                                                                CircleShape
                                                        ),
                                        contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                            "$num",
                                            color = Color.White,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.sp
                                    )
                                    // Badge
                                    Box(
                                            modifier =
                                                    Modifier.align(Alignment.TopEnd)
                                                            .offset(x = 4.dp, y = (-4).dp)
                                                            .size(12.dp)
                                                            .background(Color.White, CircleShape),
                                            contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                                "$count",
                                                color = Color.Black,
                                                fontSize = 8.sp,
                                                fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // COLD
                KpiBox("COLD") {
                    if (stats.cold.isEmpty()) Text("-", color = TextGray)
                    else {
                        Row(horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                            stats.cold.forEach { (num, _) ->
                                Box(
                                        modifier =
                                                Modifier.size(30.dp)
                                                        .background(SurfaceBg, CircleShape)
                                                        .border(1.dp, BorderSubtle, CircleShape),
                                        contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                            "$num",
                                            color = Color.White,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.sp
                                    )
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))
            Text(
                    "FREQUENCY WHEEL",
                    color = TextGray,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
            )
            Spacer(modifier = Modifier.height(10.dp))
            // TODO: Implement Radial Chart later
            Text("Coming Soon", color = TextGray, fontSize = 10.sp)
        }
    }
}

@Composable
fun KpiBox(title: String, content: @Composable () -> Unit) {
    Column(
            modifier =
                    Modifier.width(160.dp)
                            .background(SurfaceBg, RoundedCornerShape(10.dp))
                            .border(1.dp, BorderSubtle, RoundedCornerShape(10.dp))
                            .padding(10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(title, color = TextGray, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(8.dp))
        content()
    }
}

@Composable
fun HeatmapTab(counts: Map<Int, Int>) {
    // Placeholder for now as BettingBoard reuse is complex
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text("Heatmap View (Grid Parity Needed)", color = TextGray)
    }
}

@Composable
fun LogTab(history: List<Int>) {
    LazyVerticalGrid(
            columns = GridCells.Adaptive(minSize = 40.dp),
            contentPadding = PaddingValues(10.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
    ) { items(history) { num -> HistoryBubble(num, isGrid = true) } }
}

data class StatsData(
        val counts: Map<Int, Int>,
        val hot: List<Pair<Int, Int>>,
        val cold: List<Pair<Int, Int>>,
        val total: Int
)
