package com.marcgodinez.roulette.ui.game

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp

@Composable
fun SideActionButton(
        icon: ImageVector? = null,
        onClick: () -> Unit,
        enabled: Boolean = true,
        color: Color = Color.White,
        content: @Composable (() -> Unit)? = null
) {
    val alpha = if (enabled) 1f else 0.5f

    Box(
            modifier =
                    Modifier.size(48.dp)
                            .graphicsLayer { this.alpha = alpha }
                            .background(Color(0xB3000000), CircleShape)
                            .border(1.dp, color.copy(alpha = 0.5f), CircleShape)
                            .clickable(enabled = enabled, onClick = onClick),
            contentAlignment = Alignment.Center
    ) {
        if (content != null) {
            content()
        } else if (icon != null) {
            Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = color,
                    modifier = Modifier.size(24.dp)
            )
        }
    }
}
