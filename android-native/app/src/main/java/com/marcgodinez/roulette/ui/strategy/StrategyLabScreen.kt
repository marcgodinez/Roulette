package com.marcgodinez.roulette.ui.strategy

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
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.marcgodinez.roulette.ui.game.BettingBoard
import com.marcgodinez.roulette.ui.game.CHIPS
import com.marcgodinez.roulette.ui.theme.*
import com.marcgodinez.roulette.utils.NumberUtils

@Composable
fun StrategyLabScreen(navController: NavController, viewModel: StrategyViewModel = viewModel()) {
        val totalCost = viewModel.localBets.values.sum()

        Column(modifier = Modifier.fillMaxSize().background(DarkBg)) {
                // 1. Header
                StrategyHeader(onExit = { navController.popBackStack() })

                // 2. Betting Board (Sandbox)
                Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                        BettingBoard(
                                bets = viewModel.localBets,
                                onPlaceBet = { viewModel.onPlaceBet(it) }
                        )
                }

                // 3. Controls
                Column(
                        modifier =
                                Modifier.fillMaxWidth()
                                        .background(SurfaceBg)
                                        .border(1.dp, BorderSubtle)
                                        .padding(15.dp)
                ) {
                        // Chip Selector
                        LazyRow(
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                modifier = Modifier.fillMaxWidth().padding(bottom = 15.dp)
                        ) {
                                items(CHIPS) { chip ->
                                        val isSelected = chip.value == viewModel.selectedChipValue
                                        Box(
                                                modifier =
                                                        Modifier.size(36.dp)
                                                                .background(chip.color, CircleShape)
                                                                .border(
                                                                        width =
                                                                                if (isSelected) 2.dp
                                                                                else 0.dp,
                                                                        color =
                                                                                if (isSelected)
                                                                                        PrimaryGold
                                                                                else
                                                                                        Color.Transparent,
                                                                        shape = CircleShape
                                                                )
                                                                .clickable {
                                                                        viewModel
                                                                                .selectedChipValue =
                                                                                chip.value
                                                                },
                                                contentAlignment = Alignment.Center
                                        ) {
                                                Text(
                                                        text = chip.label,
                                                        fontSize = 10.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color =
                                                                if (chip.color == Color.Black)
                                                                        Color.White
                                                                else Color.Black
                                                )
                                        }
                                }
                        }

                        // Action Row
                        Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                                Column {
                                        Text(
                                                "TOTAL COST",
                                                color = TextGray,
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                                NumberUtils.formatCurrency(totalCost.toDouble()),
                                                color = Color.White,
                                                fontSize = 16.sp,
                                                fontWeight = FontWeight.Bold
                                        )
                                }

                                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                        Button(
                                                onClick = { viewModel.clearBoard() },
                                                colors =
                                                        ButtonDefaults.buttonColors(
                                                                containerColor = Color(0x1AFF4500)
                                                        ),
                                                border =
                                                        androidx.compose.foundation.BorderStroke(
                                                                1.dp,
                                                                ErrorRed
                                                        ),
                                                shape = RoundedCornerShape(8.dp)
                                        ) {
                                                Text(
                                                        "Clear",
                                                        color = ErrorRed,
                                                        fontWeight = FontWeight.Bold
                                                )
                                        }

                                        Button(
                                                onClick = { viewModel.openSaveModal() },
                                                colors =
                                                        ButtonDefaults.buttonColors(
                                                                containerColor = PrimaryGold
                                                        ),
                                                shape = RoundedCornerShape(8.dp)
                                        ) {
                                                Text(
                                                        "SAVE STRATEGY",
                                                        color = DarkBg,
                                                        fontWeight = FontWeight.Bold
                                                )
                                        }
                                }
                        }
                }
        }

        if (viewModel.isSaveModalOpen) {
                SaveStrategyDialog(
                        viewModel = viewModel,
                        onDismiss = { viewModel.closeSaveModal() },
                        onSave = { viewModel.saveStrategy { navController.popBackStack() } }
                )
        }
}

@Composable
fun StrategyHeader(onExit: () -> Unit) {
        Row(
                modifier =
                        Modifier.fillMaxWidth()
                                .height(60.dp)
                                .border(1.dp, BorderSubtle)
                                .padding(horizontal = 20.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
        ) {
                Text(
                        "Strategy Lab",
                        color = PrimaryGold,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                )
                Box(
                        modifier =
                                Modifier.background(SurfaceBg, RoundedCornerShape(8.dp))
                                        .border(1.dp, BorderSubtle, RoundedCornerShape(8.dp))
                                        .clickable { onExit() }
                                        .padding(8.dp)
                ) { Text("EXIT", color = TextGray, fontSize = 12.sp, fontWeight = FontWeight.Bold) }
        }
}

@Composable
fun SaveStrategyDialog(viewModel: StrategyViewModel, onDismiss: () -> Unit, onSave: () -> Unit) {
        Dialog(onDismissRequest = onDismiss) {
                Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = SurfaceBg),
                        border = androidx.compose.foundation.BorderStroke(1.dp, BorderSubtle)
                ) {
                        Column(
                                modifier = Modifier.padding(24.dp).fillMaxWidth(),
                                horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                                Text(
                                        "SAVE STRATEGY",
                                        color = PrimaryGold,
                                        fontSize = 20.sp,
                                        fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(24.dp))

                                OutlinedTextField(
                                        value = viewModel.strategyName,
                                        onValueChange = { viewModel.strategyName = it },
                                        label = { Text("Strategy Name") },
                                        colors =
                                                OutlinedTextFieldDefaults.colors(
                                                        focusedBorderColor = PrimaryGold,
                                                        unfocusedBorderColor = BorderSubtle,
                                                        focusedTextColor = Color.White,
                                                        unfocusedTextColor = Color.White
                                                ),
                                        singleLine = true,
                                        modifier = Modifier.fillMaxWidth()
                                )

                                Spacer(modifier = Modifier.height(32.dp))

                                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                        Button(
                                                onClick = onDismiss,
                                                colors =
                                                        ButtonDefaults.buttonColors(
                                                                containerColor = Color.Transparent
                                                        ),
                                                border =
                                                        androidx.compose.foundation.BorderStroke(
                                                                1.dp,
                                                                BorderSubtle
                                                        ),
                                                modifier = Modifier.weight(1f)
                                        ) { Text("CANCEL", color = TextGray) }

                                        Button(
                                                onClick = onSave,
                                                colors =
                                                        ButtonDefaults.buttonColors(
                                                                containerColor = PrimaryGold
                                                        ),
                                                modifier = Modifier.weight(1f)
                                        ) {
                                                Text(
                                                        "SAVE",
                                                        color = DarkBg,
                                                        fontWeight = FontWeight.Bold
                                                )
                                        }
                                }
                        }
                }
        }
}
