package com.marcgodinez.roulette.ui.game

import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import androidx.lifecycle.viewmodel.compose.viewModel
import com.marcgodinez.roulette.ui.theme.*
import com.marcgodinez.roulette.utils.NumberUtils

@Composable
fun GameScreen(
        viewModel: GameViewModel = viewModel(),
        onExit: () -> Unit = {},
        onNavigateToStrategy: () -> Unit = {},
        onLogout: () -> Unit = {}
) {
        val totalBet = viewModel.currentBets.value.values.sum()
        var viewMode by remember { mutableStateOf("GRID") } // GRID or TRACK
        var showDebugBonus by remember { mutableStateOf(false) }
        var showStore by remember { mutableStateOf(false) }

        val context = androidx.compose.ui.platform.LocalContext.current

        // Listen for Ad Event
        LaunchedEffect(viewModel.showAdEvent) {
                if (viewModel.showAdEvent) {
                        val activity = context as? android.app.Activity
                        activity?.let {
                                com.marcgodinez.roulette.utils.AdManager.showInterstitial(it)
                        }
                        viewModel.showAdEvent = false
                }
        }

        // Screen Metrics for Centering
        val config = LocalConfiguration.current
        val density = LocalDensity.current
        val screenHeightPx = with(density) { config.screenHeightDp.dp.toPx() }
        val targetTranslationY = screenHeightPx * 0.25f // Move down significantly

        // Animations for Focus Mode
        val focusScale by
                animateFloatAsState(
                        targetValue =
                                if (viewModel.isSpinning) 2.2f
                                else 1f, // Massive Zoom for Protagonism
                        animationSpec = spring(stiffness = Spring.StiffnessLow)
                )
        val dimmerAlpha by
                animateFloatAsState(
                        targetValue = if (viewModel.isSpinning) 0.5f else 0f,
                        animationSpec = tween(500)
                )
        val wheelTranslationY by
                animateFloatAsState(
                        targetValue = if (viewModel.isSpinning) targetTranslationY else 0f,
                        animationSpec = spring(stiffness = Spring.StiffnessLow)
                )

        Box(modifier = Modifier.fillMaxSize().background(Color(0xFF0A0A18))) {
                StrategySelectorModal(
                        visible = viewModel.showStrategySelector,
                        onClose = { viewModel.showStrategySelector = false },
                        savedStrategies = viewModel.savedStrategies,
                        selectedChipValue = viewModel.selectedChipValue,
                        onApplyStrategy = { viewModel.applyStrategy(it) },
                        onDeleteStrategy = { viewModel.deleteStrategy(it) }
                )

                // --- HEADER (Z-Index 200) ---
                Row(
                        modifier =
                                Modifier.fillMaxWidth()
                                        .padding(top = 15.dp, start = 20.dp, end = 20.dp)
                                        .height(60.dp)
                                        .zIndex(200f),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                ) {
                        // LEFT: CREDITS BOX
                        Box(
                                modifier =
                                        Modifier.background(
                                                        Color(0x99000000),
                                                        RoundedCornerShape(20.dp)
                                                )
                                                .border(
                                                        1.dp,
                                                        BorderSubtle,
                                                        RoundedCornerShape(20.dp)
                                                )
                                                .padding(horizontal = 15.dp, vertical = 8.dp)
                        ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                        // Chip Icon
                                        Box(
                                                modifier =
                                                        Modifier.size(20.dp)
                                                                .background(
                                                                        PrimaryGold,
                                                                        CircleShape
                                                                )
                                                                .border(
                                                                        1.dp,
                                                                        Color.White,
                                                                        CircleShape
                                                                ),
                                                contentAlignment = Alignment.Center
                                        ) {
                                                Box(
                                                        modifier =
                                                                Modifier.size(12.dp)
                                                                        .border(
                                                                                1.dp,
                                                                                Color.Black,
                                                                                CircleShape
                                                                        ) // Dashed border simulated
                                                )
                                        }
                                        Spacer(modifier = Modifier.width(10.dp))
                                        Text(
                                                text =
                                                        NumberUtils.formatCurrency(
                                                                viewModel.credits
                                                        ),
                                                color = Color.White,
                                                fontSize = 16.sp,
                                                fontWeight = FontWeight.Bold
                                        )
                                }
                        }

                        // RIGHT: SHOP BUTTON (+)
                        Box(
                                modifier =
                                        Modifier.size(32.dp)
                                                .background(PrimaryGold, CircleShape)
                                                .border(1.dp, Color.White, CircleShape)
                                                .clickable { showStore = true },
                                contentAlignment = Alignment.Center
                        ) {
                                Text(
                                        "+",
                                        color = Color.Black,
                                        fontSize = 20.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.offset(y = (-2).dp)
                                )
                        }
                }

                // --- MAIN CONTENT ---
                Column(modifier = Modifier.fillMaxSize()) {
                        val isBetting = viewModel.currentPhase == GamePhase.BETTING
                        Spacer(modifier = Modifier.height(70.dp)) // Reduced Header space

                        // TOP CONTAINER (Reserving space for Wheel)
                        Box(
                                modifier = Modifier.weight(0.28f).fillMaxWidth(),
                                contentAlignment = Alignment.Center
                        ) {
                                // Empty, the wheel is rendered at the root Box to be above dimmer
                        }

                        // HISTORY BAR
                        Box(
                                modifier =
                                        Modifier.fillMaxWidth()
                                                .background(Color(0x80000000))
                                                .border(BorderStroke(1.dp, Color(0x1AFFFFFF)))
                                                .zIndex(15f)
                        ) {
                                HistoryBar(
                                        viewModel.history,
                                        onStatsClick = { viewModel.showStats = true }
                                )
                        }

                        if (viewModel.showStats) {
                                StatsModal(
                                        history = viewModel.history,
                                        onDismiss = { viewModel.showStats = false }
                                )
                        }

                        // BOTTOM CONTAINER (Board + Controls)
                        Box(modifier = Modifier.weight(0.72f).fillMaxWidth()) {
                                Column(
                                        modifier = Modifier.fillMaxSize(),
                                        horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                        // BOARD CONTAINER
                                        Box(
                                                modifier =
                                                        Modifier.weight(1f)
                                                                .fillMaxWidth()
                                                                .padding(top = 5.dp)
                                                                .background(
                                                                        Color(0x8014141E),
                                                                        RoundedCornerShape(12.dp)
                                                                )
                                                                .border(
                                                                        1.dp,
                                                                        BorderSubtle,
                                                                        RoundedCornerShape(12.dp)
                                                                )
                                                                .clip(RoundedCornerShape(12.dp))
                                        ) {
                                                if (viewMode == "TRACK") {
                                                        RacetrackBoard(
                                                                bets = viewModel.currentBets.value,
                                                                onPlaceBet = { ids ->
                                                                        ids.forEach { id ->
                                                                                viewModel.placeBet(
                                                                                        id.toString()
                                                                                )
                                                                        }
                                                                }
                                                        )
                                                } else {
                                                        BettingBoard(
                                                                isSpinning = viewModel.isSpinning,
                                                                winningNumber =
                                                                        if (viewModel
                                                                                        .currentPhase ==
                                                                                        GamePhase
                                                                                                .RESULT
                                                                        )
                                                                                viewModel
                                                                                        .winningNumber
                                                                        else null,
                                                                bets = viewModel.currentBets.value,
                                                                onPlaceBet = { id ->
                                                                        viewModel.placeBet(id)
                                                                }
                                                        )
                                                }
                                        }

                                        // BETTING CONTROLS
                                        BettingControls(
                                                currentBet = totalBet,
                                                onSpin = { viewModel.spin() },
                                                isBetting = isBetting,
                                                selectedChipValue = viewModel.selectedChipValue,
                                                onSelectChip = { viewModel.selectedChipValue = it },
                                                onDebug = { showDebugBonus = true }
                                        )
                                }
                        }
                }

                // --- GLOBAL DIMMER ---
                if (dimmerAlpha > 0f) {
                        Box(
                                modifier =
                                        Modifier.fillMaxSize()
                                                .background(Color.Black.copy(alpha = dimmerAlpha))
                                                .zIndex(80f)
                        )
                }

                // --- FOCUSED SUBJECT (WHEEL) ---
                // Rendered at root Box level with higher zIndex than dimmer
                Column(modifier = Modifier.fillMaxSize().zIndex(100f)) {
                        Spacer(modifier = Modifier.height(70.dp)) // Move everything up
                        Box(
                                modifier = Modifier.weight(0.28f).fillMaxWidth(),
                                contentAlignment = Alignment.Center
                        ) {
                                // 1. FLOATING LEFT ACTIONS
                                Column(
                                        modifier =
                                                Modifier.align(Alignment.TopStart)
                                                        .padding(start = 15.dp, top = 5.dp),
                                        verticalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                        SideActionButton(
                                                content = {
                                                        if (viewMode == "GRID") {
                                                                RouletteIcon(
                                                                        size = 22.dp,
                                                                        color = AccentGold
                                                                )
                                                        } else {
                                                                Icon(
                                                                        Icons.Outlined.GridView,
                                                                        contentDescription = "Grid",
                                                                        tint = AccentGold,
                                                                        modifier =
                                                                                Modifier.size(20.dp)
                                                                )
                                                        }
                                                },
                                                onClick = {
                                                        viewMode =
                                                                if (viewMode == "GRID") "TRACK"
                                                                else "GRID"
                                                }
                                        )
                                        SideActionButton(
                                                icon = Icons.Outlined.FavoriteBorder,
                                                onClick = { viewModel.showStrategySelector = true },
                                                color = ErrorRed
                                        )
                                }

                                // 2. FLOATING RIGHT ACTIONS
                                Column(
                                        modifier =
                                                Modifier.align(Alignment.TopEnd)
                                                        .padding(end = 15.dp, top = 5.dp),
                                        verticalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                        SideActionButton(
                                                icon = Icons.Filled.Undo,
                                                onClick = { viewModel.undoLastBet() },
                                                enabled =
                                                        viewModel.currentPhase == GamePhase.BETTING,
                                                color = AccentBlue
                                        )
                                        SideActionButton(
                                                icon = Icons.Outlined.Delete,
                                                onClick = { viewModel.clearBets() },
                                                enabled =
                                                        viewModel.currentPhase == GamePhase.BETTING,
                                                color = ErrorRed
                                        )
                                        SideActionButton(
                                                icon = Icons.Filled.Refresh,
                                                onClick = { viewModel.rebet() },
                                                enabled =
                                                        viewModel.currentPhase ==
                                                                GamePhase.BETTING && totalBet == 0,
                                                color = SuccessGreen
                                        )
                                }

                                // 4. WHEEL COMPONENT
                                Box(contentAlignment = Alignment.Center) {
                                        RouletteWheel(
                                                isSpinning = viewModel.isSpinning,
                                                winningNumber = viewModel.winningNumber,
                                                fireNumbers = viewModel.fireNumbers,
                                                modifier =
                                                        Modifier.size(310.dp).graphicsLayer {
                                                                scaleX = focusScale
                                                                scaleY = focusScale
                                                                translationY = wheelTranslationY
                                                        }
                                        )
                                }
                        }
                        // Spacer for the rest of the layout to keep zIndex(100f) area clear
                        Spacer(modifier = Modifier.weight(0.72f).fillMaxWidth())
                }

                // --- OVERLAYS ---
                // FIRE
                FireOverlay(
                        isVisible = viewModel.currentPhase == GamePhase.REVEALING,
                        fireNumbers = viewModel.fireNumbers
                )

                // BONUS GAME
                if (viewModel.currentPhase == GamePhase.BONUS) {
                        BonusGame(onClose = { m, p -> viewModel.completeBonus(m, p) })
                }

                // DEBUG BONUS GAME
                if (showDebugBonus) {
                        BonusGame(onClose = { _, _ -> showDebugBonus = false })
                }

                // RESULT (Parity with GameScreen.tsx ResultOverlay)
                if (viewModel.currentPhase == GamePhase.RESULT &&
                                viewModel.showResultOverlay &&
                                viewModel.winningNumber != null
                ) {
                        ResultOverlay(viewModel)
                }

                // STORE MODAL
                if (showStore) {
                        LaunchedEffect(Unit) { viewModel.loadPackages() }
                        val act = context as? android.app.Activity
                        StoreModal(
                                packages = viewModel.packages,
                                loading = viewModel.storeLoading,
                                noAds = viewModel.noAds,
                                onDismiss = { showStore = false },
                                onHome = {
                                        showStore = false
                                        onExit()
                                },
                                onPackageClick = { pkg ->
                                        act?.let { viewModel.purchasePackage(it, pkg) }
                                },
                                onWatchAd = { act?.let { viewModel.showAd(it) } },
                                onLogout = {
                                        viewModel.signOut()
                                        onLogout()
                                },
                                onDeleteAccount = {
                                        viewModel.deleteAccount()
                                        onLogout()
                                }
                        )
                }
        }
}

@Composable
fun RouletteIcon(size: androidx.compose.ui.unit.Dp, color: Color) {
        Canvas(modifier = Modifier.size(size)) {
                val strokeWidth2 = 2.dp.toPx()
                val strokeWidth15 = 1.5.dp.toPx()

                // Outer Circle
                drawCircle(
                        color = color,
                        radius = size.toPx() / 2 - strokeWidth2 / 2,
                        style = Stroke(width = strokeWidth2)
                )

                // Inner Circle
                drawCircle(
                        color = color,
                        radius = size.toPx() * 0.3f,
                        style = Stroke(width = strokeWidth15)
                )

                // Center Dot
                drawCircle(color = color, radius = size.toPx() * 0.1f, style = Fill)

                // 4 Lines
                val center = size.toPx() / 2
                val length = size.toPx() * 0.2f

                // Top
                drawLine(
                        color = color,
                        start = Offset(center, 0f),
                        end = Offset(center, length),
                        strokeWidth = strokeWidth15
                )
                // Bottom
                drawLine(
                        color = color,
                        start = Offset(center, size.toPx()),
                        end = Offset(center, size.toPx() - length),
                        strokeWidth = strokeWidth15
                )
                // Left
                drawLine(
                        color = color,
                        start = Offset(0f, center),
                        end = Offset(length, center),
                        strokeWidth = strokeWidth15
                )
                // Right
                drawLine(
                        color = color,
                        start = Offset(size.toPx(), center),
                        end = Offset(size.toPx() - length, center),
                        strokeWidth = strokeWidth15
                )
        }
}
