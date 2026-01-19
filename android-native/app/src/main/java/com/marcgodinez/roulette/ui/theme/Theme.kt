package com.marcgodinez.roulette.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme =
        darkColorScheme(
                primary = PrimaryGold,
                secondary = SecondaryGold,
                tertiary = AdBlue,
                background = DarkBg,
                surface = SurfaceBg,
                onPrimary = Color.Black,
                onSecondary = Color.Black,
                onBackground = TextWhite,
                onSurface = TextWhite,
                error = ErrorRed
        )

@Composable
fun RouletteTheme(
        darkTheme: Boolean = true, // We always want dark theme for this app
        content: @Composable () -> Unit
) {
    val colorScheme = DarkColorScheme

    MaterialTheme(
            colorScheme = colorScheme,
            typography = Typography(), // Can customize later
            content = content
    )
}
