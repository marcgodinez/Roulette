package com.marcgodinez.roulette.data.repositories

import android.util.Log
import com.marcgodinez.roulette.data.models.UserProfile
import com.marcgodinez.roulette.network.ApiClient
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Columns
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

object PlayerRepository {
    private val _userProfile = MutableStateFlow<UserProfile?>(null)
    val userProfile: StateFlow<UserProfile?> = _userProfile.asStateFlow()

    suspend fun fetchProfile(): UserProfile? {
        val user = ApiClient.supabase.auth.currentUserOrNull()
        if (user == null) {
            _userProfile.value = null
            return null
        }

        return try {
            val profile =
                    ApiClient.supabase
                            .from("profiles")
                            .select(
                                    columns =
                                            Columns.list(
                                                    "id",
                                                    "username",
                                                    "credits",
                                                    "no_ads",
                                                    "last_daily_bonus"
                                            )
                            ) { filter { eq("id", user.id) } }
                            .decodeSingleOrNull<UserProfile>()

            val resultProfile =
                    if (profile != null) {
                        profile
                    } else {
                        Log.d("PlayerRepository", "Profile not found for ${user.id}, creating...")
                        val newProfile =
                                UserProfile(
                                        id = user.id,
                                        username = user.userMetadata?.get("username")?.toString()
                                                        ?: user.email?.substringBefore("@")
                                                                ?: "Guest",
                                        credits = 1000.0
                                )
                        ApiClient.supabase.from("profiles").insert(newProfile)
                        newProfile
                    }

            _userProfile.value = resultProfile
            resultProfile
        } catch (e: Exception) {
            Log.e("PlayerRepository", "fetchProfile Error", e)
            null
        }
    }

    fun updateLocalCredits(newCredits: Double) {
        val current = _userProfile.value
        if (current != null) {
            _userProfile.value = current.copy(credits = newCredits)
        }
    }
}
