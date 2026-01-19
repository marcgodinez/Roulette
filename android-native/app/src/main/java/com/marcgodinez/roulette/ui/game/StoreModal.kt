package com.marcgodinez.roulette.ui.game

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Redeem
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.ExitToApp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.marcgodinez.roulette.data.models.StorePackage
import com.marcgodinez.roulette.ui.theme.PrimaryGold
import com.marcgodinez.roulette.ui.theme.SuccessGreen
import com.marcgodinez.roulette.utils.NumberUtils

// Mock Data Structure
// Using shared StorePackage from GameModels

// No longer using MOCK_PACKAGES here, passed from ViewModel

@Composable
fun StoreModal(
        packages: List<StorePackage>,
        loading: Boolean = false,
        noAds: Boolean = false,
        onDismiss: () -> Unit,
        onHome: () -> Unit,
        onPackageClick: (StorePackage) -> Unit,
        onWatchAd: () -> Unit,
        onLogout: () -> Unit,
        onDeleteAccount: () -> Unit
) {
        val scope = rememberCoroutineScope()

        Dialog(
                onDismissRequest = onDismiss,
                properties = DialogProperties(usePlatformDefaultWidth = false) // Full width custom
        ) {
                Box(
                        modifier =
                                Modifier.fillMaxSize()
                                        .background(Color(0xCC000000)) // Dimmed background
                                        .clickable(enabled = false) {
                                        }, // Prevent clicks passing through
                        contentAlignment = Alignment.Center
                ) {
                        // Modal Content
                        Card(
                                modifier =
                                        Modifier.fillMaxWidth(0.9f)
                                                .fillMaxHeight(0.85f)
                                                .border(
                                                        2.dp,
                                                        PrimaryGold,
                                                        RoundedCornerShape(20.dp)
                                                ),
                                shape = RoundedCornerShape(20.dp),
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF050505))
                        ) {
                                Column(modifier = Modifier.fillMaxSize()) {
                                        // Header
                                        Box(
                                                modifier =
                                                        Modifier.fillMaxWidth()
                                                                .background(Color(0x0DFFFFFF))
                                                                .padding(20.dp)
                                                                .border(
                                                                        width = 0.dp,
                                                                        color = Color.Transparent,
                                                                        shape =
                                                                                RoundedCornerShape(
                                                                                        0.dp
                                                                                )
                                                                ) // Just for layout match
                                        ) {
                                                Text(
                                                        text = "GAME MENU",
                                                        color = PrimaryGold,
                                                        fontSize = 20.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        letterSpacing = 2.sp,
                                                        modifier = Modifier.align(Alignment.Center)
                                                )
                                                IconButton(
                                                        onClick = onDismiss,
                                                        modifier =
                                                                Modifier.align(Alignment.CenterEnd)
                                                ) {
                                                        Icon(
                                                                Icons.Filled.Close,
                                                                contentDescription = "Close",
                                                                tint = Color.Gray
                                                        )
                                                }
                                        }

                                        Divider(color = Color(0xFF333333), thickness = 1.dp)

                                        // Content
                                        Column(
                                                modifier =
                                                        Modifier.weight(1f)
                                                                .verticalScroll(
                                                                        rememberScrollState()
                                                                )
                                                                .padding(20.dp),
                                                verticalArrangement = Arrangement.spacedBy(20.dp)
                                        ) {
                                                // 1. NAVIGATION (GO HOME)
                                                Button(
                                                        onClick = {
                                                                onDismiss()
                                                                onHome()
                                                        },
                                                        colors =
                                                                ButtonDefaults.buttonColors(
                                                                        containerColor = PrimaryGold
                                                                ),
                                                        shape = RoundedCornerShape(12.dp),
                                                        modifier =
                                                                Modifier.fillMaxWidth()
                                                                        .height(50.dp)
                                                ) {
                                                        Icon(
                                                                Icons.Filled.Home,
                                                                contentDescription = null,
                                                                tint = Color.Black
                                                        )
                                                        Spacer(Modifier.width(10.dp))
                                                        Text(
                                                                "GO HOME",
                                                                color = Color.Black,
                                                                fontSize = 16.sp,
                                                                fontWeight = FontWeight.Black,
                                                                letterSpacing = 1.sp
                                                        )
                                                }

                                                Divider(color = Color(0xFF333333))

                                                // 2. ECONOMY (FREE COINS)
                                                Text(
                                                        "FREE COINS",
                                                        color = Color.Gray,
                                                        fontSize = 12.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        letterSpacing = 2.sp
                                                )

                                                OutlinedButton(
                                                        onClick = onWatchAd,
                                                        colors =
                                                                ButtonDefaults.outlinedButtonColors(
                                                                        containerColor =
                                                                                if (loading)
                                                                                        Color.Transparent
                                                                                else
                                                                                        Color(
                                                                                                0x1A22C55E
                                                                                        ),
                                                                        contentColor = SuccessGreen
                                                                ),
                                                        border = BorderStroke(1.dp, SuccessGreen),
                                                        shape = RoundedCornerShape(12.dp),
                                                        modifier =
                                                                Modifier.fillMaxWidth()
                                                                        .height(50.dp)
                                                ) {
                                                        if (loading) {
                                                                CircularProgressIndicator(
                                                                        modifier =
                                                                                Modifier.size(
                                                                                        24.dp
                                                                                ),
                                                                        color = SuccessGreen,
                                                                        strokeWidth = 2.dp
                                                                )
                                                        } else {
                                                                Icon(
                                                                        if (noAds)
                                                                                Icons.Filled.Redeem
                                                                        else Icons.Filled.PlayArrow,
                                                                        contentDescription = null,
                                                                        tint = SuccessGreen
                                                                ) // Video icon proxy
                                                                Spacer(Modifier.width(10.dp))
                                                                Text(
                                                                        if (noAds)
                                                                                "GET REWARD (+500)"
                                                                        else "WATCH AD (+500)",
                                                                        fontSize = 16.sp,
                                                                        fontWeight =
                                                                                FontWeight.Bold,
                                                                        letterSpacing = 1.sp
                                                                )
                                                        }
                                                }

                                                Divider(color = Color(0xFF333333))

                                                // 3. NO-ADS BUNDLE (FEATURED)
                                                val noAdsPack = packages.find { it.isNoAds }
                                                if (noAdsPack != null && !noAds) {
                                                        Text(
                                                                "SPECIAL OFFER",
                                                                color = PrimaryGold,
                                                                fontSize = 12.sp,
                                                                fontWeight = FontWeight.Bold,
                                                                letterSpacing = 2.sp
                                                        )

                                                        Box(modifier = Modifier.fillMaxWidth()) {
                                                                Row(
                                                                        modifier =
                                                                                Modifier.fillMaxWidth()
                                                                                        .padding(
                                                                                                top =
                                                                                                        10.dp
                                                                                        )
                                                                                        .background(
                                                                                                Color(
                                                                                                        0x26FFD700
                                                                                                ),
                                                                                                RoundedCornerShape(
                                                                                                        16.dp
                                                                                                )
                                                                                        )
                                                                                        .border(
                                                                                                2.dp,
                                                                                                PrimaryGold,
                                                                                                RoundedCornerShape(
                                                                                                        16.dp
                                                                                                )
                                                                                        )
                                                                                        .clickable {
                                                                                                onPackageClick(
                                                                                                        noAdsPack
                                                                                                )
                                                                                        }
                                                                                        .padding(
                                                                                                16.dp
                                                                                        ),
                                                                        horizontalArrangement =
                                                                                Arrangement
                                                                                        .SpaceBetween,
                                                                        verticalAlignment =
                                                                                Alignment
                                                                                        .CenterVertically
                                                                ) {
                                                                        Column(
                                                                                modifier =
                                                                                        Modifier.weight(
                                                                                                1f
                                                                                        )
                                                                        ) {
                                                                                Text(
                                                                                        noAdsPack
                                                                                                .title,
                                                                                        color =
                                                                                                Color.White,
                                                                                        fontSize =
                                                                                                18.sp,
                                                                                        fontWeight =
                                                                                                FontWeight
                                                                                                        .Bold
                                                                                )
                                                                                Text(
                                                                                        noAdsPack
                                                                                                .description,
                                                                                        color =
                                                                                                Color.Gray,
                                                                                        fontSize =
                                                                                                14.sp
                                                                                )
                                                                        }
                                                                        Button(
                                                                                onClick = {
                                                                                        onPackageClick(
                                                                                                noAdsPack
                                                                                        )
                                                                                },
                                                                                colors =
                                                                                        ButtonDefaults
                                                                                                .buttonColors(
                                                                                                        containerColor =
                                                                                                                PrimaryGold
                                                                                                ),
                                                                                shape =
                                                                                        RoundedCornerShape(
                                                                                                8.dp
                                                                                        )
                                                                        ) {
                                                                                Text(
                                                                                        noAdsPack
                                                                                                .priceString,
                                                                                        color =
                                                                                                Color.Black,
                                                                                        fontWeight =
                                                                                                FontWeight
                                                                                                        .Bold
                                                                                )
                                                                        }
                                                                }

                                                                // Badge
                                                                Surface(
                                                                        color = PrimaryGold,
                                                                        shape =
                                                                                RoundedCornerShape(
                                                                                        4.dp
                                                                                ),
                                                                        modifier =
                                                                                Modifier.align(
                                                                                        Alignment
                                                                                                .TopCenter
                                                                                )
                                                                ) {
                                                                        Text(
                                                                                "BEST CHOICE",
                                                                                color = Color.Black,
                                                                                fontSize = 10.sp,
                                                                                fontWeight =
                                                                                        FontWeight
                                                                                                .Bold,
                                                                                modifier =
                                                                                        Modifier.padding(
                                                                                                horizontal =
                                                                                                        8.dp,
                                                                                                vertical =
                                                                                                        2.dp
                                                                                        )
                                                                        )
                                                                }
                                                        }

                                                        Divider(color = Color(0xFF333333))
                                                }

                                                // 4. BUY COINS
                                                Text(
                                                        "BUY COINS",
                                                        color = Color.Gray,
                                                        fontSize = 12.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        letterSpacing = 2.sp
                                                )

                                                if (loading) {
                                                        Box(
                                                                Modifier.fillMaxWidth(),
                                                                contentAlignment = Alignment.Center
                                                        ) {
                                                                CircularProgressIndicator(
                                                                        color = PrimaryGold
                                                                )
                                                        }
                                                } else {
                                                        val coinPacks =
                                                                packages.filter { !it.isNoAds }
                                                        coinPacks.forEach { pkg ->
                                                                val isPremium =
                                                                        pkg.identifier.contains(
                                                                                "large"
                                                                        )
                                                                val badge =
                                                                        when {
                                                                                pkg.isPopular ->
                                                                                        "POPULAR"
                                                                                pkg.isBestValue ->
                                                                                        "BEST VALUE"
                                                                                else -> null
                                                                        }

                                                                val cardBg =
                                                                        if (isPremium)
                                                                                Color(0x1AFFD700)
                                                                        else Color(0x11FFFFFF)
                                                                val borderColor =
                                                                        if (isPremium)
                                                                                PrimaryGold.copy(
                                                                                        alpha = 0.5f
                                                                                )
                                                                        else Color(0xFF444444)

                                                                Box(
                                                                        modifier =
                                                                                Modifier.fillMaxWidth()
                                                                ) {
                                                                        Row(
                                                                                modifier =
                                                                                        Modifier.fillMaxWidth()
                                                                                                .padding(
                                                                                                        top =
                                                                                                                10.dp
                                                                                                ) // Space for badge
                                                                                                .background(
                                                                                                        cardBg,
                                                                                                        RoundedCornerShape(
                                                                                                                16.dp
                                                                                                        )
                                                                                                )
                                                                                                .border(
                                                                                                        1.dp,
                                                                                                        borderColor,
                                                                                                        RoundedCornerShape(
                                                                                                                16.dp
                                                                                                        )
                                                                                                )
                                                                                                .clickable {
                                                                                                        onPackageClick(
                                                                                                                pkg
                                                                                                        )
                                                                                                }
                                                                                                .padding(
                                                                                                        16.dp
                                                                                                ),
                                                                                horizontalArrangement =
                                                                                        Arrangement
                                                                                                .SpaceBetween,
                                                                                verticalAlignment =
                                                                                        Alignment
                                                                                                .CenterVertically
                                                                        ) {
                                                                                Column(
                                                                                        modifier =
                                                                                                Modifier.weight(
                                                                                                        1f
                                                                                                )
                                                                                ) {
                                                                                        Text(
                                                                                                pkg.title,
                                                                                                color =
                                                                                                        if (isPremium
                                                                                                        )
                                                                                                                PrimaryGold
                                                                                                        else
                                                                                                                Color.White,
                                                                                                fontWeight =
                                                                                                        FontWeight
                                                                                                                .Bold,
                                                                                                fontSize =
                                                                                                        18.sp
                                                                                        )
                                                                                        Text(
                                                                                                pkg.description,
                                                                                                color =
                                                                                                        Color.Gray,
                                                                                                fontSize =
                                                                                                        12.sp
                                                                                        )
                                                                                        if (!isPremium
                                                                                        ) {
                                                                                                Spacer(
                                                                                                        modifier =
                                                                                                                Modifier.height(
                                                                                                                        4.dp
                                                                                                                )
                                                                                                )
                                                                                                Text(
                                                                                                        "+${NumberUtils.formatCurrency(pkg.credits.toDouble())} Coins",
                                                                                                        color =
                                                                                                                SuccessGreen,
                                                                                                        fontWeight =
                                                                                                                FontWeight
                                                                                                                        .Bold,
                                                                                                        fontSize =
                                                                                                                14.sp
                                                                                                )
                                                                                        }
                                                                                }

                                                                                Spacer(
                                                                                        modifier =
                                                                                                Modifier.width(
                                                                                                        16.dp
                                                                                                )
                                                                                )

                                                                                Button(
                                                                                        onClick = {
                                                                                                onPackageClick(
                                                                                                        pkg
                                                                                                )
                                                                                        },
                                                                                        colors =
                                                                                                ButtonDefaults
                                                                                                        .buttonColors(
                                                                                                                containerColor =
                                                                                                                        if (isPremium
                                                                                                                        )
                                                                                                                                PrimaryGold
                                                                                                                        else
                                                                                                                                Color.White
                                                                                                        ),
                                                                                        shape =
                                                                                                RoundedCornerShape(
                                                                                                        8.dp
                                                                                                ),
                                                                                        contentPadding =
                                                                                                PaddingValues(
                                                                                                        horizontal =
                                                                                                                16.dp,
                                                                                                        vertical =
                                                                                                                8.dp
                                                                                                )
                                                                                ) {
                                                                                        Text(
                                                                                                pkg.priceString,
                                                                                                color =
                                                                                                        Color.Black,
                                                                                                fontWeight =
                                                                                                        FontWeight
                                                                                                                .Bold,
                                                                                                fontSize =
                                                                                                        14.sp
                                                                                        )
                                                                                }
                                                                        }

                                                                        // BADGE
                                                                        if (badge != null) {
                                                                                Box(
                                                                                        modifier =
                                                                                                Modifier.align(
                                                                                                                Alignment
                                                                                                                        .TopCenter
                                                                                                        )
                                                                                                        .offset(
                                                                                                                y =
                                                                                                                        0.dp
                                                                                                        )
                                                                                                        .background(
                                                                                                                if (isPremium
                                                                                                                )
                                                                                                                        PrimaryGold
                                                                                                                else
                                                                                                                        SuccessGreen,
                                                                                                                RoundedCornerShape(
                                                                                                                        4.dp
                                                                                                                )
                                                                                                        )
                                                                                                        .padding(
                                                                                                                horizontal =
                                                                                                                        8.dp,
                                                                                                                vertical =
                                                                                                                        2.dp
                                                                                                        )
                                                                                ) {
                                                                                        Text(
                                                                                                text =
                                                                                                        badge,
                                                                                                color =
                                                                                                        Color.Black,
                                                                                                fontSize =
                                                                                                        10.sp,
                                                                                                fontWeight =
                                                                                                        FontWeight
                                                                                                                .Bold
                                                                                        )
                                                                                }
                                                                        }
                                                                }
                                                        }
                                                }

                                                Divider(color = Color(0xFF333333))

                                                // 4. PROFILE
                                                Text(
                                                        "PROFILE",
                                                        color = Color.Gray,
                                                        fontSize = 12.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        letterSpacing = 2.sp
                                                )

                                                OutlinedButton(
                                                        onClick = {
                                                                onDismiss()
                                                                onLogout()
                                                        },
                                                        colors =
                                                                ButtonDefaults.outlinedButtonColors(
                                                                        contentColor = Color.White
                                                                ),
                                                        border =
                                                                BorderStroke(
                                                                        1.dp,
                                                                        Color(0xFF333333)
                                                                ),
                                                        shape = RoundedCornerShape(10.dp),
                                                        modifier = Modifier.fillMaxWidth()
                                                ) {
                                                        Icon(
                                                                Icons.Outlined.ExitToApp,
                                                                contentDescription = null,
                                                                modifier = Modifier.size(20.dp)
                                                        )
                                                        Spacer(Modifier.width(8.dp))
                                                        Text(
                                                                "LOG OUT",
                                                                fontWeight = FontWeight.Bold
                                                        )
                                                }

                                                OutlinedButton(
                                                        onClick = {
                                                                // Confirm delete? Simple for now
                                                                onDismiss()
                                                                onDeleteAccount()
                                                        },
                                                        colors =
                                                                ButtonDefaults.outlinedButtonColors(
                                                                        contentColor =
                                                                                Color(0xFFEF4444)
                                                                ),
                                                        border =
                                                                BorderStroke(
                                                                        1.dp,
                                                                        Color(0xFFEF4444)
                                                                ),
                                                        shape = RoundedCornerShape(10.dp),
                                                        modifier = Modifier.fillMaxWidth()
                                                ) {
                                                        Icon(
                                                                Icons.Outlined.Delete,
                                                                contentDescription = null,
                                                                modifier = Modifier.size(20.dp)
                                                        )
                                                        Spacer(Modifier.width(8.dp))
                                                        Text(
                                                                "DELETE ACCOUNT",
                                                                fontWeight = FontWeight.Bold
                                                        )
                                                }
                                        }

                                        // Footer
                                        Box(
                                                modifier =
                                                        Modifier.fillMaxWidth()
                                                                .padding(15.dp)
                                                                .border(
                                                                        0.dp,
                                                                        Color.Transparent
                                                                ), // Layout placeholder
                                                contentAlignment = Alignment.Center
                                        ) {
                                                Text(
                                                        "v1.0.0",
                                                        color = Color(0xFF555555),
                                                        fontSize = 10.sp
                                                )
                                        }
                                }
                        }
                }
        }
}
