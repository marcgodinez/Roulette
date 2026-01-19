package com.marcgodinez.roulette.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable data class SpinRequest(val bets: Map<String, Int>)

@Serializable
data class SpinResponse(
        @SerialName("winningNumber") val winningNumber: Int,
        @SerialName("fireNumbers") val fireNumbers: List<Int>,
        @SerialName("totalWin") val totalWin: Double,
        @SerialName("newBalance") val newBalance: Double,
        @SerialName("bonusStake") val bonusStake: Double = 0.0,
        val error: String? = null,
        @SerialName("xp_gained") val xpGained: Int = 0,
        @SerialName("new_level") val newLevel: Int = 1
)

@Serializable
data class BonusResponse(
        val success: Boolean = false,
        val newBalance: Double = 0.0,
        val reward: Double = 0.0
)

@Serializable data class AdRewardRequest(val adNetworkPendingId: String? = null)

@Serializable
data class UserProfile(
        val id: String,
        val username: String?,
        val credits: Double,
        @SerialName("no_ads") val noAds: Boolean = false,
        @SerialName("last_daily_bonus") val lastDailyBonus: String? = null
)

@Serializable
data class LeaderboardEntry(
        val username: String,
        @SerialName("total_profit") val totalProfit: Double? = null,
        @SerialName("max_win") val maxWin: Double? = null,
        @SerialName("winning_number") val winningNumber: Int? = null,
        @SerialName("multiplier") val multiplier: Double? = null,
        @SerialName("is_fire") val isFire: Boolean = false
)

@Serializable
data class StorePackage(
        val identifier: String,
        val title: String,
        val description: String,
        val priceString: String,
        val credits: Int = 0,
        val isNoAds: Boolean = false,
        val isBestValue: Boolean = false,
        val isPopular: Boolean = false,
        @kotlinx.serialization.Transient
        val revenueCatPackage: com.revenuecat.purchases.Package? = null
)

@Serializable
data class Strategy(
        val id: String,
        val name: String,
        @SerialName("bet_data") val bets: Map<String, Int>,
        @SerialName("color_code") val color: String,
        @SerialName("user_id") val userId: String? = null
)
