package com.marcgodinez.roulette.network

import android.util.Log
import com.marcgodinez.roulette.data.models.BonusResponse
import com.marcgodinez.roulette.data.models.SpinRequest
import com.marcgodinez.roulette.data.models.SpinResponse
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.functions.Functions
import io.github.jan.supabase.functions.functions
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.serializer.KotlinXSerializer
import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.headers
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

object ApiClient {
    private const val SUPABASE_URL = "https://zvfxffixyojoddqwtpow.supabase.co"
    private const val SUPABASE_KEY =
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZnhmZml4eW9qb2RkcXd0cG93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNTg5MTMsImV4cCI6MjA4MzYzNDkxM30.UKNo17_0ZMqdSmQ8lyezgSn24xgVAXPW2E7VoRnPGhE"

    val supabase =
            createSupabaseClient(supabaseUrl = SUPABASE_URL, supabaseKey = SUPABASE_KEY) {
                install(Auth)
                install(Postgrest)
                install(Functions) {
                    // Disable automatic auth token injection to prevent double headers
                    // and allow manual control
                    // autoAuthToken = false // Note: verify property name for 2.5.0, assuming it
                    // exists or similar mechanism
                    // Actually, if property doesn't exist, we must rely on manual invocation
                    // overriding it?
                    // Let's assume for now we just add it manually and HOPE it overrides.
                    // But we saw it appended.
                    // Let's check docs/source via thought process.
                    // If we cannot disable it, we must ensure the token is correct.
                    // The log showed TWO Bearer tokens. One from auto, one from us.
                    // Removing ours fixed the double, but left us with the "Invalid JWT" one.

                    serializer =
                            KotlinXSerializer(
                                    Json {
                                        ignoreUnknownKeys = true
                                        encodeDefaults = true
                                    }
                            )
                }
            }

    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    private val rawClient = HttpClient(CIO) { install(ContentNegotiation) { json(json) } }

    suspend fun spin(bets: Map<String, Int>): SpinResponse? {
        val session = supabase.auth.currentSessionOrNull()
        val token = session?.accessToken ?: return null

        return try {
            try {
                supabase.auth.refreshCurrentSession()
            } catch (e: Exception) {}

            // Re-fetch token incase it changed
            val currentToken = supabase.auth.currentSessionOrNull()?.accessToken ?: token

            val url = "$SUPABASE_URL/functions/v1/spin"

            val response =
                    rawClient.post(url) {
                        this.headers.append("Authorization", "Bearer $SUPABASE_KEY")
                        this.headers.append("x-custom-auth", currentToken)
                        this.headers.append("apikey", SUPABASE_KEY)
                        this.headers.append("Content-Type", "application/json")

                        val bodyString = json.encodeToString(SpinRequest(bets))
                        setBody(bodyString)
                    }

            val responseBody = response.bodyAsText()
            Log.d("ApiClient", "Spin Response (${response.status.value}): $responseBody")

            if (response.status.value !in 200..299) {
                return null
            }

            json.decodeFromString<SpinResponse>(responseBody)
        } catch (e: Exception) {
            Log.e("ApiClient", "Spin Error", e)
            null
        }
    }

    suspend fun claimDailyBonus(): BonusResponse? {
        val session = supabase.auth.currentSessionOrNull()
        val initialToken = session?.accessToken ?: return null

        return try {
            try {
                supabase.auth.refreshCurrentSession()
            } catch (e: Exception) {
                Log.w("ApiClient", "Session refresh failed: ${e.message}")
            }

            // Re-fetch token in case it changed
            val currentToken = supabase.auth.currentSessionOrNull()?.accessToken ?: initialToken

            val response =
                    supabase.functions.invoke(function = "claim-bonus") {
                        headers {
                            append("x-custom-auth", currentToken)
                            append("apikey", SUPABASE_KEY)
                        }
                    }

            val responseBody = response.bodyAsText()
            json.decodeFromString<BonusResponse>(responseBody)
        } catch (e: Exception) {
            Log.e("ApiClient", "Bonus Claim Error", e)
            null
        }
    }

    suspend fun claimAdReward(): BonusResponse? {
        Log.d("ApiClient", "Claiming ad reward...")
        return try {
            try {
                supabase.auth.refreshCurrentSession()
            } catch (e: Exception) {}

            val session = supabase.auth.currentSessionOrNull()
            val token = session?.accessToken

            if (token == null) {
                Log.e("ApiClient", "Cannot claim ad reward: No session")
                return null
            }

            val response =
                    supabase.functions.invoke(function = "ad-reward") {
                        headers {
                            append("x-custom-auth", token)
                            append("apikey", SUPABASE_KEY)
                        }
                        setBody("{}")
                    }

            val responseBody = response.bodyAsText()
            Log.d("ApiClient", "Ad reward claimed: $responseBody")
            json.decodeFromString<BonusResponse>(responseBody)
        } catch (e: Exception) {
            Log.e("ApiClient", "Ad Reward Error", e)
            null
        }
    }

    suspend fun fetchGameHistory(limit: Int = 20): List<Int> {
        return try {
            // Trying 'game_history' table first
            val user = supabase.auth.currentUserOrNull()
            Log.d("ApiClient", "Fetching history for user: ${user?.id}")

            if (user == null) return emptyList()

            // We need a simple data class to decode just the number
            @kotlinx.serialization.Serializable
            data class HistoryItem(
                    @kotlinx.serialization.SerialName("winning_number") val winningNumber: Int
            )

            val items =
                    supabase.from("bet_history")
                            .select(
                                    columns =
                                            io.github.jan.supabase.postgrest.query.Columns.list(
                                                    "winning_number"
                                            )
                            ) {
                                filter { eq("user_id", user.id) }
                                order(
                                        "created_at",
                                        order =
                                                io.github.jan.supabase.postgrest.query.Order
                                                        .DESCENDING
                                )
                                limit(limit.toLong())
                            }
                            .decodeList<HistoryItem>()

            items.map { it.winningNumber }
        } catch (e: Exception) {
            Log.e("ApiClient", "History Fetch Error", e)
            // Fallback: If table doesn't exist, return empty for now
            emptyList()
        }
    }

    suspend fun fetchStrategies(): List<com.marcgodinez.roulette.data.models.Strategy> {
        return try {
            val user = supabase.auth.currentUserOrNull() ?: return emptyList()
            val strategies =
                    supabase.from("saved_strategies")
                            .select {
                                filter { eq("user_id", user.id) }
                                order(
                                        "created_at",
                                        order =
                                                io.github.jan.supabase.postgrest.query.Order
                                                        .DESCENDING
                                )
                            }
                            .decodeList<com.marcgodinez.roulette.data.models.Strategy>()
            Log.d("ApiClient", "Strategies fetched successfully: ${strategies.size}")
            strategies
        } catch (e: Exception) {
            Log.e("ApiClient", "Strategies Fetch Error: ${e.message}", e)
            emptyList()
        }
    }

    suspend fun purchasePack(
            amount: Int,
            productId: String,
            transactionId: String
    ): BonusResponse? {
        return try {
            try {
                supabase.auth.refreshCurrentSession()
            } catch (e: Exception) {}

            val session = supabase.auth.currentSessionOrNull()
            val token = session?.accessToken

            if (token == null) {
                Log.e("ApiClient", "Cannot purchase pack: No session")
                return null
            }

            @kotlinx.serialization.Serializable
            data class PurchaseRequest(
                    val amount: Int,
                    val productId: String,
                    val transactionId: String
            )

            Log.d("ApiClient", "Purchasing pack: $productId, amount: $amount")

            val response =
                    supabase.functions.invoke(function = "purchase-pack") {
                        headers {
                            append("x-custom-auth", token)
                            append("apikey", SUPABASE_KEY)
                        }
                        setBody(PurchaseRequest(amount, productId, transactionId))
                    }

            val responseBody = response.bodyAsText()
            json.decodeFromString<BonusResponse>(responseBody)
        } catch (e: Exception) {
            Log.e("ApiClient", "Purchase Error", e)
            null
        }
    }

    suspend fun deleteStrategy(id: String): Boolean {
        return try {
            supabase.from("saved_strategies").delete { filter { eq("id", id) } }
            true
        } catch (e: Exception) {
            Log.e("ApiClient", "Strategy Delete Error", e)
            false
        }
    }
}
