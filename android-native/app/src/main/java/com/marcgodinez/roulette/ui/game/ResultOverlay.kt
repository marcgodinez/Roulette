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
import com.marcgodinez.roulette.data.GameConstants
import com.marcgodinez.roulette.ui.theme.*
import com.marcgodinez.roulette.utils.NumberUtils

@Composable
fun ResultOverlay(viewModel: GameViewModel) {
    val winningNumber = viewModel.winningNumber ?: return
    val totalWin = viewModel.totalWin

    val bgColor =
            when {
                winningNumber == 0 -> BetGreen
                GameConstants.isRed(winningNumber) -> BetRed
                else -> BetBlack
            }

    Box(
            modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.6f)),
            contentAlignment = Alignment.Center
    ) {
        Column(
                modifier =
                        Modifier.padding(40.dp)
                                .background(Color(0xF2000000), RoundedCornerShape(24.dp))
                                .border(3.dp, PrimaryGold, RoundedCornerShape(24.dp))
                                .padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
        ) {
            Text(
                    text = "WINNER",
                    color = PrimaryGold,
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 2.sp
            )

            Spacer(modifier = Modifier.height(15.dp))

            Box(
                    modifier =
                            Modifier.size(90.dp)
                                    .background(bgColor, CircleShape)
                                    .border(4.dp, Color.White, CircleShape),
                    contentAlignment = Alignment.Center
            ) {
                Text(
                        text = winningNumber.toString(),
                        color = Color.White,
                        fontSize = 40.sp,
                        fontWeight = FontWeight.Black
                )
            }

            Spacer(modifier = Modifier.height(15.dp))

            if (totalWin > 0) {
                Text(
                        text = "YOU WON ${NumberUtils.formatCurrency(totalWin)}",
                        color = SuccessGreen,
                        fontSize = 26.sp,
                        fontWeight = FontWeight.Bold
                )
            } else {
                Text(
                        text = "No Win",
                        color = ErrorRed,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
