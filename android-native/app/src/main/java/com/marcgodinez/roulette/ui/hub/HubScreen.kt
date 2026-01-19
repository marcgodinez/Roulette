package com.marcgodinez.roulette.ui.hub

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.marcgodinez.roulette.data.models.LeaderboardEntry
import com.marcgodinez.roulette.ui.game.StoreModal
import com.marcgodinez.roulette.ui.navigation.Screen
import com.marcgodinez.roulette.ui.theme.*
import com.marcgodinez.roulette.utils.NumberUtils

@Composable
fun HubScreen(navController: NavController, viewModel: HubViewModel = viewModel()) {
        val profile = viewModel.profile
        val scrollState = rememberScrollState()
        var selectedTab by remember { mutableStateOf("WEEKLY") } // WEEKLY or LEGENDARY

        Scaffold(
                containerColor = DarkBg,
                topBar = {
                        HubHeader(
                                username = profile?.username ?: "Guest",
                                onSettingsClick = { viewModel.settingsOpen = true }
                        )
                }
        ) { padding ->
                Column(
                        modifier =
                                Modifier.fillMaxSize()
                                        .padding(padding)
                                        .verticalScroll(scrollState)
                                        .padding(horizontal = 20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                ) {
                        Spacer(modifier = Modifier.height(10.dp))

                        // 1. Balance Card
                        BalanceCard(
                                balance = profile?.credits ?: 0.0,
                                onAddClick = { viewModel.storeOpen = true }
                        )

                        Spacer(modifier = Modifier.height(24.dp))

                        // 2. Action Row (Bonus & Ads)
                        ActionRow(viewModel = viewModel)

                        if (profile?.noAds != true) {
                                Spacer(modifier = Modifier.height(16.dp))
                                PremiumBanner(onClick = { viewModel.storeOpen = true })
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        // 3. Main Play Button
                        Button(
                                onClick = { navController.navigate(Screen.Game.route) },
                                modifier =
                                        Modifier.fillMaxWidth()
                                                .height(64.dp)
                                                .shadow(
                                                        10.dp,
                                                        RoundedCornerShape(16.dp),
                                                        spotColor = PrimaryGold
                                                ),
                                shape = RoundedCornerShape(16.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = PrimaryGold)
                        ) {
                                Text(
                                        text = "ENTER ROULETTE",
                                        color = Color.Black,
                                        fontSize = 20.sp,
                                        fontWeight = FontWeight.Bold,
                                        letterSpacing = 2.sp
                                )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // 4. Strategy Lab Button
                        Button(
                                onClick = { navController.navigate(Screen.Strategy.route) },
                                modifier =
                                        Modifier.fillMaxWidth()
                                                .height(56.dp)
                                                .border(
                                                        1.dp,
                                                        AccentBlue,
                                                        RoundedCornerShape(16.dp)
                                                ),
                                shape = RoundedCornerShape(16.dp),
                                colors =
                                        ButtonDefaults.buttonColors(
                                                containerColor = SurfaceBg.copy(alpha = 0.8f)
                                        )
                        ) {
                                Text(
                                        text = "STRATEGY LAB",
                                        color = AccentBlue,
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold,
                                        letterSpacing = 1.sp
                                )
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        // 5. Stats Row (Best Win / Online)
                        StatsRow(bestWin = viewModel.myBestWin, onlineCount = viewModel.onlineCount)

                        Spacer(modifier = Modifier.height(24.dp))

                        // 6. Leaderboard Section
                        LeaderboardSection(
                                selectedTab = selectedTab,
                                onTabSelected = { selectedTab = it },
                                weeklyTop = viewModel.weeklyTop,
                                legendaryTop = viewModel.legendaryTop
                        )

                        Spacer(modifier = Modifier.height(50.dp))
                }
        }

        if (viewModel.storeOpen) {
                val context = androidx.compose.ui.platform.LocalContext.current
                val activity = context as? android.app.Activity

                // Fetch offerings if empty
                LaunchedEffect(Unit) {
                        if (viewModel.packages.isEmpty()) {
                                viewModel.loadPackages()
                        }
                }

                StoreModal(
                        packages = viewModel.packages,
                        loading = viewModel.storeLoading,
                        noAds = profile?.noAds == true,
                        onDismiss = { viewModel.storeOpen = false },
                        onHome = { viewModel.storeOpen = false },
                        onPackageClick = { pkg ->
                                activity?.let { viewModel.purchasePackage(it, pkg) }
                        },
                        onWatchAd = { activity?.let { viewModel.showAd(it) } },
                        onLogout = { viewModel.logout(navController) },
                        onDeleteAccount = { viewModel.logout(navController) }
                )
        }

        if (viewModel.settingsOpen) {
                SettingsModal(
                        onDismiss = { viewModel.settingsOpen = false },
                        isMuted = viewModel.isMuted,
                        onMuteChange = { viewModel.updateMute(it) },
                        vibrationEnabled = viewModel.vibrationEnabled,
                        onVibrationChange = { viewModel.updateVibration(it) },
                        musicVolume = viewModel.musicVolume,
                        onMusicVolumeChange = { viewModel.updateMusicVolume(it) },
                        sfxVolume = viewModel.sfxVolume,
                        onSfxVolumeChange = { viewModel.updateSfxVolume(it) },
                        onLogout = { viewModel.logout(navController) },
                        onDeleteAccount = { viewModel.logout(navController) }
                )
        }
}

@Composable
fun HubHeader(username: String, onSettingsClick: () -> Unit) {
        Row(
                modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
        ) {
                Column {
                        Text(
                                text = "WELCOME BACK",
                                color = TextGray,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                                text = username.uppercase(),
                                color = Color.White,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold
                        )
                }

                Box(
                        modifier =
                                Modifier.size(40.dp)
                                        .background(Color(0x99000000), RoundedCornerShape(12.dp))
                                        .border(1.dp, BorderSubtle, RoundedCornerShape(12.dp))
                                        .clickable { onSettingsClick() },
                        contentAlignment = Alignment.Center
                ) {
                        Icon(
                                imageVector = Icons.Default.Settings,
                                contentDescription = "Settings",
                                tint = PrimaryGold,
                                modifier = Modifier.size(24.dp)
                        )
                }
        }
}

@Composable
fun BalanceCard(balance: Double, onAddClick: () -> Unit) {
        Card(
                modifier =
                        Modifier.fillMaxWidth()
                                .border(1.dp, PrimaryGold, RoundedCornerShape(16.dp)),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.Transparent)
        ) {
                Column(
                        modifier = Modifier.padding(24.dp).fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                ) {
                        Text(
                                text = "TOTAL BALANCE",
                                color = TextGray,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                        text = NumberUtils.formatCurrency(balance),
                                        color = PrimaryGold,
                                        fontSize = 40.sp,
                                        fontWeight = FontWeight.Bold,
                                        letterSpacing = (-1).sp
                                )

                                Spacer(modifier = Modifier.width(16.dp))

                                // Add Button
                                Box(
                                        modifier =
                                                Modifier.size(32.dp)
                                                        .background(PrimaryGold, CircleShape)
                                                        .border(1.dp, Color.White, CircleShape)
                                                        .clickable { onAddClick() },
                                        contentAlignment = Alignment.Center
                                ) {
                                        Text(
                                                text = "+",
                                                color = DarkBg,
                                                fontSize = 20.sp,
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.offset(y = (-2).dp)
                                        )
                                }
                        }
                }
        }
}

@Composable
fun ActionRow(viewModel: HubViewModel) {
        Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
                val bonusAvailable = viewModel.dailyBonusAvailable
                val showSuccess = viewModel.bonusClaimSuccess
                val countdown = viewModel.timeUntilNextBonus

                // Daily Bonus Card
                Box(modifier = Modifier.weight(1f)) {
                        Card(
                                modifier =
                                        Modifier.fillMaxWidth()
                                                .height(100.dp)
                                                .border(
                                                        1.dp,
                                                        BorderSubtle,
                                                        RoundedCornerShape(16.dp)
                                                )
                                                .clickable(enabled = bonusAvailable) {
                                                        viewModel.claimBonus()
                                                },
                                colors =
                                        CardDefaults.cardColors(
                                                containerColor = SurfaceBg.copy(alpha = 0.8f)
                                        )
                        ) {
                                Column(
                                        modifier = Modifier.fillMaxSize().padding(12.dp),
                                        verticalArrangement = Arrangement.Center,
                                        horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                        Icon(
                                                imageVector =
                                                        if (bonusAvailable)
                                                                androidx.compose.material.icons
                                                                        .Icons.Default.CardGiftcard
                                                        else
                                                                androidx.compose.material.icons
                                                                        .Icons.Default.Timer,
                                                contentDescription = null,
                                                tint =
                                                        if (bonusAvailable) PrimaryGold
                                                        else TextGray,
                                                modifier = Modifier.size(24.dp)
                                        )
                                        Spacer(modifier = Modifier.height(8.dp))
                                        if (bonusAvailable) {
                                                Text(
                                                        "CLAIM GIFT",
                                                        color = Color.White,
                                                        fontWeight = FontWeight.Bold,
                                                        fontSize = 14.sp
                                                )
                                                Text(
                                                        "+1,000 Coins",
                                                        color = TextGray,
                                                        fontSize = 10.sp
                                                )
                                        } else {
                                                Text(
                                                        "NEXT IN",
                                                        color = TextGray,
                                                        fontWeight = FontWeight.Bold,
                                                        fontSize = 11.sp
                                                )
                                                Text(
                                                        countdown.ifEmpty { "..." },
                                                        color = PrimaryGold,
                                                        fontSize = 12.sp,
                                                        fontWeight = FontWeight.Bold
                                                )
                                        }
                                }
                        }

                        // Success Animation Overlay
                        androidx.compose.animation.AnimatedVisibility(
                                visible = showSuccess,
                                enter =
                                        androidx.compose.animation.slideInVertically { -it } +
                                                androidx.compose.animation.fadeIn(),
                                exit =
                                        androidx.compose.animation.slideOutVertically { -it } +
                                                androidx.compose.animation.fadeOut()
                        ) {
                                Box(
                                        modifier =
                                                Modifier.fillMaxSize()
                                                        .background(
                                                                SuccessGreen.copy(alpha = 0.9f),
                                                                RoundedCornerShape(16.dp)
                                                        ),
                                        contentAlignment = Alignment.Center
                                ) {
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                                Icon(
                                                        imageVector =
                                                                androidx.compose.material.icons
                                                                        .Icons.Default.CheckCircle,
                                                        contentDescription = null,
                                                        tint = Color.White,
                                                        modifier = Modifier.size(32.dp)
                                                )
                                                Spacer(modifier = Modifier.height(4.dp))
                                                Text(
                                                        "+1,000",
                                                        color = Color.White,
                                                        fontSize = 20.sp,
                                                        fontWeight = FontWeight.Bold
                                                )
                                                Text(
                                                        "Coins Added!",
                                                        color = Color.White,
                                                        fontSize = 12.sp
                                                )
                                        }
                                }
                        }
                }

                // Watch Ad Card
                val context = androidx.compose.ui.platform.LocalContext.current
                val activity = context as? android.app.Activity
                val adLoaded = viewModel.isAdLoaded

                Card(
                        modifier =
                                Modifier.weight(1f)
                                        .height(100.dp)
                                        .border(
                                                1.dp,
                                                if (adLoaded) PrimaryGold else BorderSubtle,
                                                RoundedCornerShape(16.dp)
                                        )
                                        .clickable(enabled = adLoaded) {
                                                activity?.let { viewModel.showAd(it) }
                                        },
                        colors =
                                CardDefaults.cardColors(
                                        containerColor = SurfaceBg.copy(alpha = 0.8f)
                                )
                ) {
                        Column(
                                modifier = Modifier.fillMaxSize().padding(12.dp),
                                verticalArrangement = Arrangement.Center,
                                horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                                val noAds = viewModel.profile?.noAds == true
                                Icon(
                                        imageVector =
                                                if (noAds)
                                                        androidx.compose.material.icons.Icons
                                                                .Default.CardGiftcard
                                                else
                                                        androidx.compose.material.icons.Icons
                                                                .Default.PlayArrow,
                                        contentDescription = null,
                                        tint = if (noAds) PrimaryGold else TextGray,
                                        modifier = Modifier.size(24.dp)
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                        if (noAds) "PREMIUM GIFT"
                                        else if (adLoaded) "FREE COINS" else "LOADING...",
                                        color = if (noAds || adLoaded) Color.White else TextGray,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp
                                )
                                Text(
                                        if (noAds) "Direct Reward" else "Watch Video",
                                        color = TextGray,
                                        fontSize = 10.sp
                                )
                        }
                }
        }
}

@Composable
fun StatsRow(bestWin: Int, onlineCount: Int) {
        Row(
                modifier =
                        Modifier.fillMaxWidth()
                                .background(SurfaceBg.copy(alpha = 0.6f), RoundedCornerShape(16.dp))
                                .border(1.dp, BorderSubtle, RoundedCornerShape(16.dp))
                                .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
        ) {
                // Left Border Accent
                Box(modifier = Modifier.width(4.dp).height(40.dp).background(PrimaryGold))

                Spacer(modifier = Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f)) {
                        Text(
                                "MY BEST WIN",
                                color = TextGray,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                        )
                        Text(
                                text =
                                        if (bestWin > 0)
                                                "+${NumberUtils.formatCurrency(bestWin.toDouble())}"
                                        else "-",
                                color = PrimaryGold,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                        )
                }

                // Online Count
                Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                                modifier =
                                        Modifier.size(8.dp)
                                                .background(Color.Green, CircleShape)
                                                .shadow(4.dp, CircleShape, spotColor = Color.Green)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                                text = "$onlineCount LIVE",
                                color = TextGray,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                        )
                }
        }
}

@Composable
fun LeaderboardSection(
        selectedTab: String,
        onTabSelected: (String) -> Unit,
        weeklyTop: List<LeaderboardEntry>,
        legendaryTop: List<LeaderboardEntry>
) {
        Column(modifier = Modifier.fillMaxWidth()) {
                // Tabs
                Row(modifier = Modifier.fillMaxWidth()) {
                        TabButton(
                                text = "WEEKLY KINGS",
                                selected = selectedTab == "WEEKLY",
                                onClick = { onTabSelected("WEEKLY") },
                                modifier = Modifier.weight(1f)
                        )
                        TabButton(
                                text = "LEGENDARY",
                                selected = selectedTab == "LEGENDARY",
                                onClick = { onTabSelected("LEGENDARY") },
                                modifier = Modifier.weight(1f)
                        )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Content
                Box(
                        modifier =
                                Modifier.fillMaxWidth()
                                        .background(SurfaceBg, RoundedCornerShape(16.dp))
                                        .border(1.dp, BorderSubtle, RoundedCornerShape(16.dp))
                                        .padding(12.dp)
                ) {
                        if (selectedTab == "WEEKLY") {
                                if (weeklyTop.isEmpty()) {
                                        Text(
                                                "No kings this week yet.",
                                                color = TextMuted,
                                                modifier =
                                                        Modifier.padding(20.dp)
                                                                .align(Alignment.Center)
                                        )
                                } else {
                                        Column {
                                                weeklyTop.take(5).forEachIndexed { index, entry ->
                                                        LeaderboardItem(index + 1, entry)
                                                }
                                        }
                                }
                        } else {
                                // Legendary View
                                if (legendaryTop.isEmpty()) {
                                        Text(
                                                "No legends yet.",
                                                color = TextMuted,
                                                modifier =
                                                        Modifier.padding(20.dp)
                                                                .align(Alignment.Center)
                                        )
                                } else {
                                        val legend = legendaryTop.first()
                                        LegendaryCard(legend)
                                }
                        }
                }
        }
}

@Composable
fun TabButton(text: String, selected: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
        Column(
                modifier = modifier.clickable { onClick() }.padding(bottom = 8.dp),
                horizontalAlignment = Alignment.CenterHorizontally
        ) {
                Text(
                        text = text,
                        color = if (selected) PrimaryGold else TextMuted,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Box(
                        modifier =
                                Modifier.fillMaxWidth()
                                        .height(2.dp)
                                        .background(
                                                if (selected) PrimaryGold else Color.Transparent
                                        )
                )
        }
}

@Composable
fun LeaderboardItem(rank: Int, entry: LeaderboardEntry) {
        Row(
                modifier =
                        Modifier.fillMaxWidth()
                                .padding(vertical = 12.dp)
                                .border(width = 0.dp, color = Color.Transparent) // Hack for spacer
                                .background(Color.Transparent), // Spacer
                verticalAlignment = Alignment.CenterVertically
        ) {
                Box(
                        modifier =
                                Modifier.size(24.dp)
                                        .background(
                                                if (rank == 1) PrimaryGold else DarkBg,
                                                CircleShape
                                        ),
                        contentAlignment = Alignment.Center
                ) {
                        Text(
                                text = "#$rank",
                                color = if (rank == 1) DarkBg else TextWhite,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                        )
                }

                Spacer(modifier = Modifier.width(12.dp))

                Text(
                        text = entry.username,
                        color = TextWhite,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.weight(1f)
                )

                // Smart display: prefer totalProfit, fallback to maxWin
                val amount = entry.totalProfit ?: entry.maxWin ?: 0.0
                Text(
                        text = "+${NumberUtils.formatCurrency(amount)}",
                        color = PrimaryGold,
                        fontWeight = FontWeight.Bold
                )
        }
        Divider(color = BorderSubtle, thickness = 0.5.dp)
}

@Composable
fun LegendaryCard(entry: LeaderboardEntry) {
        Column(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
        ) {
                Text(
                        text = "BIGGEST HIT",
                        color = PrimaryGold,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 2.sp
                )

                Spacer(modifier = Modifier.height(16.dp))
                Divider(color = BorderSubtle, modifier = Modifier.width(40.dp))
                Spacer(modifier = Modifier.height(16.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                        // Winning Number Badge
                        val winNum = entry.winningNumber ?: 0
                        val color =
                                when (winNum) {
                                        0 -> BetGreen
                                        1,
                                        3,
                                        5,
                                        7,
                                        9,
                                        12,
                                        14,
                                        16,
                                        18,
                                        19,
                                        21,
                                        23,
                                        25,
                                        27,
                                        30,
                                        32,
                                        34,
                                        36 -> BetRed
                                        else -> BetBlack
                                }

                        Box(
                                modifier =
                                        Modifier.size(36.dp)
                                                .background(color, RoundedCornerShape(8.dp))
                                                .border(
                                                        2.dp,
                                                        PrimaryGold,
                                                        RoundedCornerShape(8.dp)
                                                ),
                                contentAlignment = Alignment.Center
                        ) {
                                Text(
                                        text = "$winNum",
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 16.sp
                                )
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        if (entry.isFire) {
                                Box(
                                        modifier =
                                                Modifier.background(
                                                                Color(0x33FF4500),
                                                                RoundedCornerShape(8.dp)
                                                        )
                                                        .border(
                                                                1.dp,
                                                                Color(0xFFFF4500),
                                                                RoundedCornerShape(8.dp)
                                                        )
                                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                                Icon(
                                                        imageVector = androidx.compose.material.icons.Icons.Default.LocalFireDepartment,
                                                        contentDescription = null,
                                                        tint = Color(0xFFFF4500),
                                                        modifier = Modifier.size(16.dp)
                                                )
                                                Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                                text = "${entry.multiplier}x",
                                                color = Color(0xFFFF4500),
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 14.sp
                                        )
                                }
                        }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                        text = "+${NumberUtils.formatCurrency(entry.maxWin ?: 0.0)}",
                        color = TextWhite,
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Bold
                )

                Text(text = entry.username, color = TextGray, fontSize = 14.sp)
        }
}


        }
    }
}

@Composable
fun PremiumBanner(onClick: () -> Unit) {
        Card(
                modifier =
                        Modifier.fillMaxWidth()
                                .height(60.dp)
                                .shadow(5.dp, RoundedCornerShape(16.dp))
                                .border(BorderStroke(1.dp, PrimaryGold), RoundedCornerShape(16.dp))
                                .clickable { onClick() },
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E))
        ) {
                Row(
                        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                        imageVector = androidx.compose.material.icons.Icons.Default.Star,
                                        contentDescription = null,
                                        tint = PrimaryGold,
                                        modifier = Modifier.size(24.dp)
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                        Text(
                                                "GO PREMIUM",
                                                color = Color.White,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 14.sp
                                        )
                                        Text(
                                                "Remove all ads & get 50k bonus!",
                                                color = TextGray,
                                                fontSize = 10.sp
                                        )
                                }
                        }
                        Text(
                                "BUY NOW",
                                color = PrimaryGold,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp
                        )
                }
        }
}
