package com.marcgodinez.roulette.ui.game

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.marcgodinez.roulette.data.GameConstants
import com.marcgodinez.roulette.data.models.Strategy
import com.marcgodinez.roulette.ui.theme.*

@Composable
fun StrategySelectorModal(
        visible: Boolean,
        onClose: () -> Unit,
        savedStrategies: List<Strategy>,
        selectedChipValue: Int,
        onApplyStrategy: (Map<String, Int>) -> Unit,
        onDeleteStrategy: (String) -> Unit
) {
        if (!visible) return

        var activeTab by remember { mutableStateOf("MY_STRATEGIES") }

        Dialog(onDismissRequest = onClose) {
                Surface(
                        modifier = Modifier.fillMaxWidth().fillMaxHeight(0.8f).padding(16.dp),
                        shape = RoundedCornerShape(24.dp),
                        color = Color(0xF10F0F14), // Deep dark
                        border = BorderStroke(2.dp, AccentGold)
                ) {
                        Column(modifier = Modifier.padding(24.dp).fillMaxSize()) {
                                Text(
                                        text = "Quick Load Strategy",
                                        color = AccentGold,
                                        fontSize = 22.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        textAlign = TextAlign.Center,
                                        modifier = Modifier.fillMaxWidth()
                                )

                                Spacer(modifier = Modifier.height(20.dp))

                                // Tabs
                                Row(modifier = Modifier.fillMaxWidth().height(50.dp)) {
                                        TabItem(
                                                text = "My Strategies",
                                                isActive = activeTab == "MY_STRATEGIES",
                                                onClick = { activeTab = "MY_STRATEGIES" },
                                                modifier = Modifier.weight(1f)
                                        )
                                        TabItem(
                                                text = "Famous Presets",
                                                isActive = activeTab == "PRESETS",
                                                onClick = { activeTab = "PRESETS" },
                                                modifier = Modifier.weight(1f)
                                        )
                                }

                                Spacer(modifier = Modifier.height(16.dp))

                                LazyColumn(
                                        modifier = Modifier.weight(1f),
                                        verticalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                        if (activeTab == "MY_STRATEGIES") {
                                                if (savedStrategies.isEmpty()) {
                                                        item {
                                                                Text(
                                                                        text =
                                                                                "No saved strategies yet.",
                                                                        color = TextGray,
                                                                        modifier =
                                                                                Modifier.fillMaxWidth()
                                                                                        .padding(
                                                                                                top =
                                                                                                        20.dp
                                                                                        ),
                                                                        textAlign =
                                                                                TextAlign.Center,
                                                                        fontSize = 14.sp
                                                                )
                                                        }
                                                } else {
                                                        items(savedStrategies) { strategy ->
                                                                StrategyRow(
                                                                        name = strategy.name,
                                                                        subtitle =
                                                                                "Cost: ${strategy.bets.values.sum()}",
                                                                        color =
                                                                                Color(
                                                                                        android.graphics
                                                                                                .Color
                                                                                                .parseColor(
                                                                                                        strategy.color
                                                                                                )
                                                                                ),
                                                                        onPlay = {
                                                                                onApplyStrategy(
                                                                                        strategy.bets
                                                                                )
                                                                                onClose()
                                                                        }
                                                                )
                                                        }
                                                }
                                        } else {
                                                items(GameConstants.PRESET_STRATEGIES) { preset ->
                                                        val cost =
                                                                preset.totalUnits *
                                                                        selectedChipValue
                                                        StrategyRow(
                                                                name = preset.name,
                                                                subtitle = preset.description,
                                                                extraInfo =
                                                                        "Requires $cost credits (${preset.totalUnits}u)",
                                                                color =
                                                                        Color(
                                                                                android.graphics
                                                                                        .Color
                                                                                        .parseColor(
                                                                                                preset.color
                                                                                        )
                                                                        ),
                                                                onPlay = {
                                                                        val newBets =
                                                                                preset.bets
                                                                                        .mapValues {
                                                                                                it.value *
                                                                                                        selectedChipValue
                                                                                        }
                                                                        onApplyStrategy(newBets)
                                                                        onClose()
                                                                }
                                                        )
                                                }
                                        }
                                }

                                Spacer(modifier = Modifier.height(16.dp))

                                Button(
                                        onClick = onClose,
                                        modifier = Modifier.fillMaxWidth(),
                                        colors =
                                                ButtonDefaults.buttonColors(
                                                        containerColor = Color.Transparent
                                                ),
                                        border = BorderStroke(1.dp, BorderSubtle),
                                        shape = RoundedCornerShape(12.dp)
                                ) { Text("CLOSE", color = TextGray, fontWeight = FontWeight.Bold) }
                        }
                }
        }
}

@Composable
fun TabItem(text: String, isActive: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
        Column(
                modifier = modifier.fillMaxHeight().clickable(onClick = onClick),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
        ) {
                Text(
                        text = text,
                        color = if (isActive) AccentGold else TextGray,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                )
                if (isActive) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Box(modifier = Modifier.width(40.dp).height(3.dp).background(AccentGold))
                }
        }
}

@Composable
fun StrategyRow(
        name: String,
        subtitle: String,
        extraInfo: String? = null,
        color: Color,
        onPlay: () -> Unit
) {
        Row(
                modifier =
                        Modifier.fillMaxWidth()
                                .background(
                                        Color.Black.copy(alpha = 0.6f),
                                        RoundedCornerShape(16.dp)
                                )
                                .border(
                                        1.dp,
                                        Color.White.copy(alpha = 0.1f),
                                        RoundedCornerShape(16.dp)
                                )
                                .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
        ) {
                Box(
                        modifier =
                                Modifier.size(14.dp)
                                        .background(color, CircleShape)
                                        .border(1.dp, Color.White, CircleShape)
                )

                Spacer(modifier = Modifier.width(14.dp))

                Column(modifier = Modifier.weight(1f)) {
                        Text(
                                text = name,
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                        )
                        Text(text = subtitle, color = TextGray, fontSize = 12.sp)
                        if (extraInfo != null) {
                                Text(
                                        text = extraInfo,
                                        color = AccentGold,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(top = 4.dp)
                                )
                        }
                }

                Button(
                        onClick = onPlay,
                        colors =
                                ButtonDefaults.buttonColors(
                                        containerColor = SuccessGreen.copy(alpha = 0.2f)
                                ),
                        border = BorderStroke(1.dp, SuccessGreen),
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
                ) {
                        Text(
                                "PLAY",
                                color = SuccessGreen,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp
                        )
                }
        }
}
