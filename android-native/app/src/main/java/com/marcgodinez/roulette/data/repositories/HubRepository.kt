package com.marcgodinez.roulette.data.repositories

import android.util.Log // Ensure this is available, if not, remove or use println for debug
import com.marcgodinez.roulette.data.models.LeaderboardEntry
import com.marcgodinez.roulette.data.models.UserProfile
import com.marcgodinez.roulette.network.ApiClient
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.postgrest.query.Order

// Important: Supabase-kt DSL often requires these wildcard imports or specific ones for eq, filter,
// etc.
// But standard usage is often inside lambda with receiver.
// "decodeList" is likely an extension on PostgrestResult or similar.

object HubRepository {

    suspend fun fetchProfile(): UserProfile? {
        // Delegate to PlayerRepository to ensure consistent state
        return PlayerRepository.fetchProfile()
    }

    suspend fun fetchWeeklyLeaderboard(): List<LeaderboardEntry> {
        return try {
            ApiClient.supabase
                    .from("weekly_leaderboard")
                    .select() { limit(5) }
                    .decodeList<LeaderboardEntry>()
        } catch (e: Exception) {
            Log.e("HubRepository", "Error fetching weekly", e)
            emptyList()
        }
    }

    suspend fun fetchLegendaryTop(): List<LeaderboardEntry> {
        return try {
            ApiClient.supabase
                    .from("legendary_wins")
                    .select() { limit(1) }
                    .decodeList<LeaderboardEntry>()
        } catch (e: Exception) {
            Log.e("HubRepository", "Error fetching legendary", e)
            emptyList()
        }
    }

    suspend fun fetchMyBestWin(): Int {
        return try {
            val user = ApiClient.supabase.auth.currentUserOrNull() ?: return 0
            val result =
                    ApiClient.supabase
                            .from("bet_history")
                            .select(columns = Columns.list("total_win")) {
                                filter { eq("user_id", user.id) }
                                order("total_win", Order.DESCENDING)
                                limit(1)
                            }
                            .decodeSingleOrNull<Map<String, Int>>() // simple map decode

            result?.get("total_win") ?: 0
        } catch (e: Exception) {
            Log.e("HubRepository", "Error fetching best win", e)
            0
        }
    }
}
