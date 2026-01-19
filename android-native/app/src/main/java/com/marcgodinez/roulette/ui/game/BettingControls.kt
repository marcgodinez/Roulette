package com.marcgodinez.roulette.ui.game

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import com.marcgodinez.roulette.ui.theme.*
import com.marcgodinez.roulette.utils.NumberUtils

@Composable
fun BettingControls(
        currentBet: Int,
        onSpin: () -> Unit,
        isBetting: Boolean,
        selectedChipValue: Int,
        onSelectChip: (Int) -> Unit,
        onDebug: (() -> Unit)? = null,
        modifier: Modifier = Modifier
) {
        Row(
                modifier =
                        modifier.fillMaxWidth()
                                .height(100.dp)
                                .background(Color(0xE605050A)) // Dark translucent
                                .border(
                                        1.dp,
                                        BorderSubtle,
                                        RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp)
                                )
                                .padding(horizontal = 20.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
        ) {

                // LEFT: Chip Selector
                Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier.width(80.dp).zIndex(10f)
                ) {
                        ChipSelector(
                                selectedChipValue = selectedChipValue,
                                onSelectChip = onSelectChip
                        )
                }

                // CENTER: Spin Button
                Row(verticalAlignment = Alignment.CenterVertically) {
                        SpinButton(onClick = onSpin, enabled = isBetting, isBetting = isBetting)
                        if (onDebug != null) {
                                Spacer(modifier = Modifier.width(8.dp))
                                Box(
                                        modifier =
                                                Modifier.size(30.dp)
                                                        .background(Color.Cyan, CircleShape)
                                                        .clickable(onClick = onDebug),
                                        contentAlignment = Alignment.Center
                                ) { Text("D", fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                        }
                }

                // RIGHT: Total Bet
                Column(horizontalAlignment = Alignment.End) {
                        Text(
                                "TOTAL BET",
                                color = TextGray,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 2.sp
                        )
                        Text(
                                "${NumberUtils.formatCurrency(currentBet.toDouble())} 🪙",
                                color = PrimaryGold,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.ExtraBold
                        )
                }
        }
}

@Composable
fun SpinButton(onClick: () -> Unit, enabled: Boolean, isBetting: Boolean) {
        val bgColor = if (isBetting) SuccessGreen else Color(0xFF1E293B)
        val borderColor = if (isBetting) Color(0xFFDCFCE7) else Color(0xFF334155)

        Box(
                modifier =
                        Modifier.size(75.dp)
                                .clip(CircleShape)
                                .background(bgColor)
                                .border(2.dp, borderColor, CircleShape)
                                .clickable(enabled = enabled, onClick = onClick),
                contentAlignment = Alignment.Center
        ) {
                if (isBetting) {
                        Text(
                                "SPIN",
                                color = Color.Black,
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 18.sp,
                                letterSpacing = 1.sp
                        )
                } else {
                        Text("...", color = Color.White) // Spinner icon later
                }
        }
}
