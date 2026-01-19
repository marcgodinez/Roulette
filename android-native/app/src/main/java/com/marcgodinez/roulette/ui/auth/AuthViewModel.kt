package com.marcgodinez.roulette.ui.auth

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.marcgodinez.roulette.data.repositories.AuthRepository
import kotlinx.coroutines.launch

class AuthViewModel(private val repository: AuthRepository = AuthRepository) : ViewModel() {

    var email by mutableStateOf("")
    var password by mutableStateOf("")
    var username by mutableStateOf("")

    var isLoading by mutableStateOf(false)
    var error by mutableStateOf<String?>(null)
    var isRegisterMode by mutableStateOf(false)

    fun authenticate(onSuccess: () -> Unit) {
        if (!isRegisterMode && email.isBlank()) {
            error = "Please enter email or username"
            return
        }
        if (isRegisterMode && (email.isBlank() || username.isBlank())) {
            error = "Please fill in all fields"
            return
        }
        if (password.isBlank()) {
            error = "Password is required"
            return
        }

        isLoading = true
        error = null

        viewModelScope.launch {
            if (isRegisterMode) {
                // 1. Check Username Availability
                if (username.length < 3) {
                    isLoading = false
                    error = "Username must be at least 3 chars"
                    return@launch
                }

                val available = repository.checkUsernameAvailability(username)
                if (!available) {
                    isLoading = false
                    error = "Username already taken"
                    return@launch
                }

                // 2. Sign Up
                val result = repository.signUp(email, password, username)
                isLoading = false
                result.fold(
                        onSuccess = { onSuccess() },
                        onFailure = { error = it.message ?: "Sign up failed" }
                )
            } else {
                // Login Flow
                var targetEmail = email
                // If input lacks '@', treat as username and resolve email
                if (!email.contains("@")) {
                    val resolved = repository.resolveEmailFromUsername(email)
                    if (resolved == null) {
                        isLoading = false
                        error = "Username not found"
                        return@launch
                    }
                    targetEmail = resolved
                }

                val result = repository.signIn(targetEmail, password)
                isLoading = false
                result.fold(
                        onSuccess = { onSuccess() },
                        onFailure = { error = it.message ?: "Login failed" }
                )
            }
        }
    }

    fun loginAnonymously(onSuccess: () -> Unit) {
        isLoading = true
        error = null
        viewModelScope.launch {
            val result = repository.signInAnonymously()
            isLoading = false
            result.fold(
                    onSuccess = { onSuccess() },
                    onFailure = { error = it.message ?: "Guest login failed" }
            )
        }
    }

    fun signInWithGoogle(idToken: String, onSuccess: () -> Unit) {
        isLoading = true
        error = null
        viewModelScope.launch {
            val result = repository.signInWithGoogle(idToken)
            isLoading = false
            result.fold(
                    onSuccess = { onSuccess() },
                    onFailure = { error = it.message ?: "Google login failed" }
            )
        }
    }
}
