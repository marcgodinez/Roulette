package com.marcgodinez.roulette.utils

import java.text.NumberFormat
import java.util.Locale

object NumberUtils {
    private val currencyFormat =
            NumberFormat.getNumberInstance(Locale.US).apply {
                maximumFractionDigits = 0
                isGroupingUsed = true
            }

    private val decimalFormat =
            NumberFormat.getNumberInstance(Locale.US).apply {
                maximumFractionDigits = 2
                minimumFractionDigits = 0
                isGroupingUsed = true
            }

    fun formatCurrency(amount: Double): String {
        return currencyFormat.format(amount)
    }

    fun formatCurrency(amount: Int): String {
        return currencyFormat.format(amount)
    }

    // Optional: Abbreviated format for very small spaces (1.2k, 1.5M)
    fun formatAbbreviated(amount: Double): String {
        return when {
            amount >= 1_000_000 -> String.format(Locale.US, "%.1fM", amount / 1_000_000.0)
            amount >= 1_000 -> String.format(Locale.US, "%.1fk", amount / 1_000.0)
            else -> currencyFormat.format(amount)
        }
    }
}
