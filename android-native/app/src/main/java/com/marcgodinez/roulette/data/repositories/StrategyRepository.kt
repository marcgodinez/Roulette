package com.marcgodinez.roulette.data.repositories

import android.util.Log
import com.marcgodinez.roulette.data.models.Strategy
import com.marcgodinez.roulette.network.ApiClient
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.postgrest.from

object StrategyRepository {
    suspend fun getStrategies(): List<Strategy> {
        return try {
            val user = ApiClient.supabase.auth.currentUserOrNull() ?: return emptyList()
            ApiClient.supabase
                    .from("saved_strategies")
                    .select { filter { eq("user_id", user.id) } }
                    .decodeList<Strategy>()
        } catch (e: Exception) {
            Log.e("StrategyRepo", "Error fetching saved_strategies", e)
            emptyList()
        }
    }

    suspend fun saveStrategy(strategy: Strategy): Boolean {
        return try {
            ApiClient.supabase.from("saved_strategies").insert(strategy)
            true
        } catch (e: Exception) {
            Log.e("StrategyRepo", "Error saving strategy", e)
            false
        }
    }

    suspend fun deleteStrategy(strategyId: String): Boolean {
        return try {
            ApiClient.supabase.from("saved_strategies").delete { filter { eq("id", strategyId) } }
            true
        } catch (e: Exception) {
            Log.e("StrategyRepo", "Error deleting strategy", e)
            false
        }
    }
}
