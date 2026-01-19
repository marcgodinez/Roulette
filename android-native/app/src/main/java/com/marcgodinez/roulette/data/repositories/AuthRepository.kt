package com.marcgodinez.roulette.data.repositories

import android.util.Log
import com.marcgodinez.roulette.network.ApiClient
import io.github.jan.supabase.gotrue.SessionStatus
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.gotrue.providers.builtin.Email
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Columns
import kotlinx.coroutines.flow.Flow

object AuthRepository {

    val sessionStatus: Flow<SessionStatus> = ApiClient.supabase.auth.sessionStatus

    suspend fun signIn(email: String, password: String): Result<Unit> {
        return try {
            ApiClient.supabase.auth.signInWith(Email) {
                this.email = email
                this.password = password
            }
            Log.d("AuthRepository", "SignIn Success for $email")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("AuthRepository", "SignIn Failed for $email", e)
            Result.failure(e)
        }
    }

    suspend fun signUp(email: String, password: String, username: String): Result<Unit> {
        return try {
            ApiClient.supabase.auth.signUpWith(Email) {
                this.email = email
                this.password = password
                this.data =
                        kotlinx.serialization.json.buildJsonObject {
                            put("username", kotlinx.serialization.json.JsonPrimitive(username))
                        }
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun signInAnonymously(): Result<Unit> {
        return try {
            ApiClient.supabase.auth.signInAnonymously()
            Log.d("AuthRepository", "Anonymous SignIn Success")
            Result.success(Unit)
        } catch (e: Exception) {
            Log.e("AuthRepository", "Anonymous SignIn Failed", e)
            Result.failure(e)
        }
    }

    suspend fun resolveEmailFromUsername(username: String): String? {
        return try {
            val result =
                    ApiClient.supabase
                            .from("profiles")
                            .select(columns = Columns.list("email")) {
                                filter { eq("username", username) }
                            }
                            .decodeSingleOrNull<Map<String, String>>()

            result?.get("email")
        } catch (e: Exception) {
            Log.e("AuthRepository", "Error resolving username", e)
            null
        }
    }

    suspend fun checkUsernameAvailability(username: String): Boolean {
        return try {
            val result =
                    ApiClient.supabase
                            .from("profiles")
                            .select(columns = Columns.list("id")) {
                                filter { eq("username", username) }
                            }
                            .decodeSingleOrNull<Map<String, String>>()

            result == null // Available if no result found
        } catch (e: Exception) {
            Log.e("AuthRepository", "Error checking username", e)
            false // Assume unavailable on error safely
        }
    }

    suspend fun signOut() {
        try {
            ApiClient.supabase.auth.signOut()
        } catch (e: Exception) {
            Log.e("AuthRepository", "SignOut Error", e)
        }
    }
}
