package com.marcgodinez.roulette.ui.hub

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.marcgodinez.roulette.ui.theme.*

@Composable
fun SettingsModal(
        onDismiss: () -> Unit,
        // Audio State
        isMuted: Boolean,
        onMuteChange: (Boolean) -> Unit,
        vibrationEnabled: Boolean,
        onVibrationChange: (Boolean) -> Unit,
        musicVolume: Float,
        onMusicVolumeChange: (Float) -> Unit,
        sfxVolume: Float,
        onSfxVolumeChange: (Float) -> Unit,
        // Account Actions
        onLogout: () -> Unit,
        onDeleteAccount: () -> Unit
) {
        // Internal navigation state: "MAIN" or "ACCOUNT"
        var currentScreen by remember { mutableStateOf("MAIN") }

        Dialog(onDismissRequest = onDismiss) {
                Box(
                        modifier =
                                Modifier.fillMaxWidth()
                                        .background(
                                                brush =
                                                        Brush.verticalGradient(
                                                                colors =
                                                                        listOf(
                                                                                Color(0xFF1E1E2C),
                                                                                Color(0xFF14141E)
                                                                        )
                                                        ),
                                                shape = RoundedCornerShape(24.dp)
                                        )
                                        .border(1.dp, BorderSubtle, RoundedCornerShape(24.dp))
                                        .padding(24.dp)
                ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                // Header
                                Row(
                                        modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                ) {
                                        if (currentScreen == "ACCOUNT") {
                                                Icon(
                                                        imageVector = Icons.Default.ArrowBack,
                                                        contentDescription = "Back",
                                                        tint = TextGray,
                                                        modifier =
                                                                Modifier.size(24.dp).clickable {
                                                                        currentScreen = "MAIN"
                                                                }
                                                )
                                        } else {
                                                Spacer(
                                                        modifier = Modifier.size(24.dp)
                                                ) // Spacer for alignment
                                        }

                                        Text(
                                                text =
                                                        if (currentScreen == "ACCOUNT") "ACCOUNT"
                                                        else "SETTINGS",
                                                color = Color.White,
                                                fontSize = 20.sp,
                                                fontWeight = FontWeight.Bold,
                                                letterSpacing = 2.sp
                                        )

                                        Icon(
                                                imageVector = Icons.Default.Close,
                                                contentDescription = "Close",
                                                tint = TextGray,
                                                modifier =
                                                        Modifier.size(24.dp).clickable {
                                                                onDismiss()
                                                        }
                                        )
                                }

                                // Content Switcher
                                AnimatedContent(targetState = currentScreen) { screen ->
                                        Column(
                                                modifier = Modifier.fillMaxWidth(),
                                                verticalArrangement = Arrangement.spacedBy(20.dp)
                                        ) {
                                                if (screen == "MAIN") {
                                                        // --- AUDIO SETTINGS ---
                                                        SettingsSectionHeader("AUDIO")

                                                        // Mute Toggle
                                                        SettingsToggleRow(
                                                                label = "Mute Audio",
                                                                checked = isMuted,
                                                                onCheckedChange = onMuteChange
                                                        )

                                                        // Vibration Toggle
                                                        SettingsToggleRow(
                                                                label = "Vibration",
                                                                checked = vibrationEnabled,
                                                                onCheckedChange = onVibrationChange
                                                        )

                                                        // Music Level
                                                        SettingsSliderRow(
                                                                label = "Music Volume",
                                                                value = musicVolume,
                                                                onValueChange = onMusicVolumeChange,
                                                                enabled = !isMuted
                                                        )

                                                        // SFX Level
                                                        SettingsSliderRow(
                                                                label = "SFX Volume",
                                                                value = sfxVolume,
                                                                onValueChange = onSfxVolumeChange,
                                                                enabled = !isMuted
                                                        )

                                                        Spacer(modifier = Modifier.height(10.dp))

                                                        // --- ACCOUNT NAVIGATION ---
                                                        val uriHandler =
                                                                androidx.compose.ui.platform
                                                                        .LocalUriHandler.current
                                                        SettingsButtonRow(
                                                                text = "Privacy Policy",
                                                                onClick = {
                                                                        uriHandler.openUri(
                                                                                "https://google.com"
                                                                        )
                                                                } // Placeholder
                                                        )
                                                        Spacer(modifier = Modifier.height(10.dp))

                                                        SettingsButtonRow(
                                                                text = "Account Settings",
                                                                onClick = {
                                                                        currentScreen = "ACCOUNT"
                                                                }
                                                        )
                                                } else {
                                                        // --- ACCOUNT ACTIONS ---
                                                        SettingsSectionHeader("MANAGE ACCOUNT")

                                                        Text(
                                                                text =
                                                                        "Manage your account session and data.",
                                                                color = TextMuted,
                                                                fontSize = 14.sp,
                                                                modifier =
                                                                        Modifier.padding(
                                                                                bottom = 10.dp
                                                                        )
                                                        )

                                                        // Logout
                                                        Button(
                                                                onClick = onLogout,
                                                                modifier =
                                                                        Modifier.fillMaxWidth()
                                                                                .height(50.dp),
                                                                colors =
                                                                        ButtonDefaults.buttonColors(
                                                                                containerColor =
                                                                                        SurfaceBg
                                                                        ),
                                                                shape = RoundedCornerShape(12.dp)
                                                        ) {
                                                                Text(
                                                                        "LOGOUT",
                                                                        color = Color.White,
                                                                        fontWeight = FontWeight.Bold
                                                                )
                                                        }

                                                        // Delete Account
                                                        Button(
                                                                onClick = onDeleteAccount,
                                                                modifier =
                                                                        Modifier.fillMaxWidth()
                                                                                .height(50.dp)
                                                                                .border(
                                                                                        1.dp,
                                                                                        ErrorRed,
                                                                                        RoundedCornerShape(
                                                                                                12.dp
                                                                                        )
                                                                                ),
                                                                colors =
                                                                        ButtonDefaults.buttonColors(
                                                                                containerColor =
                                                                                        Color.Transparent
                                                                        ),
                                                                shape = RoundedCornerShape(12.dp)
                                                        ) {
                                                                Text(
                                                                        "DELETE ACCOUNT",
                                                                        color = ErrorRed,
                                                                        fontWeight = FontWeight.Bold
                                                                )
                                                        }
                                                }
                                        }
                                }
                        }
                }
        }
}

@Composable
fun SettingsSectionHeader(text: String) {
        Text(
                text = text,
                color = TextGray,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp,
                modifier = Modifier.padding(bottom = 8.dp)
        )
}

@Composable
fun SettingsToggleRow(label: String, checked: Boolean, onCheckedChange: (Boolean) -> Unit) {
        Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
        ) {
                Text(
                        text = label,
                        color = Color.White,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold
                )
                Switch(
                        checked = checked,
                        onCheckedChange = onCheckedChange,
                        colors =
                                SwitchDefaults.colors(
                                        checkedThumbColor = PrimaryGold,
                                        checkedTrackColor = PrimaryGold.copy(alpha = 0.5f),
                                        uncheckedThumbColor = TextGray,
                                        uncheckedTrackColor = SurfaceBg
                                )
                )
        }
}

@Composable
fun SettingsSliderRow(
        label: String,
        value: Float,
        onValueChange: (Float) -> Unit,
        enabled: Boolean = true
) {
        Column(modifier = Modifier.fillMaxWidth()) {
                Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                ) {
                        Text(
                                text = label,
                                color = if (enabled) Color.White else TextMuted,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium
                        )
                        Text(
                                text = "${(value * 100).toInt()}%",
                                color = if (enabled) PrimaryGold else TextMuted,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                        )
                }
                Slider(
                        value = value,
                        onValueChange = onValueChange,
                        enabled = enabled,
                        colors =
                                SliderDefaults.colors(
                                        thumbColor = PrimaryGold,
                                        activeTrackColor = PrimaryGold,
                                        inactiveTrackColor = SurfaceBg
                                ),
                        modifier = Modifier.height(20.dp) // Compact slider height
                )
        }
}

@Composable
fun SettingsButtonRow(text: String, onClick: () -> Unit) {
        Row(
                modifier =
                        Modifier.fillMaxWidth()
                                .height(56.dp)
                                .background(SurfaceBg, RoundedCornerShape(12.dp))
                                .clickable { onClick() }
                                .padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
        ) {
                Text(
                        text = text,
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                )
                Icon(
                        imageVector = Icons.Default.KeyboardArrowRight,
                        contentDescription = null,
                        tint = TextGray
                )
        }
}
