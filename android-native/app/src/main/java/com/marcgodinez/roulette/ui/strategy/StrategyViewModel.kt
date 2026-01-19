package com.marcgodinez.roulette.ui.strategy

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.marcgodinez.roulette.data.models.Strategy
import com.marcgodinez.roulette.data.repositories.StrategyRepository
import com.marcgodinez.roulette.network.ApiClient
import io.github.jan.supabase.gotrue.auth
import java.util.UUID
import kotlinx.coroutines.launch

class StrategyViewModel : ViewModel() {

    // Sandbox State
    // Using mutableStateMapOf for direct observation in betting board
    var localBets = mutableStateMapOf<String, Int>()
        private set

    var selectedChipValue by mutableStateOf(10)
    var activeColor by mutableStateOf("#FFD700") // Default Gold

    // UI State
    var isSaveModalOpen by mutableStateOf(false)
    var strategyName by mutableStateOf("")

    // Saved Strategies
    var savedStrategies = mutableStateListOf<Strategy>()
        private set

    init {
        loadStrategies()
    }

    private fun loadStrategies() {
        viewModelScope.launch {
            val strategies = StrategyRepository.getStrategies()
            savedStrategies.clear()
            savedStrategies.addAll(strategies)
        }
    }

    fun onPlaceBet(betId: String) {
        val current = localBets[betId] ?: 0
        localBets[betId] = current + selectedChipValue
    }

    fun clearBoard() {
        localBets.clear()
    }

    fun openSaveModal() {
        isSaveModalOpen = true
    }

    fun closeSaveModal() {
        isSaveModalOpen = false
    }

    fun saveStrategy(onSuccess: () -> Unit) {
        if (strategyName.isBlank() || localBets.isEmpty()) return

        // Launch in coroutine
        viewModelScope.launch {
            val user = ApiClient.supabase.auth.currentUserOrNull()
            if (user == null) return@launch // Should handle error UI

            val newStrategy =
                    Strategy(
                            id = UUID.randomUUID().toString(),
                            name = strategyName,
                            bets = localBets.toMap(),
                            color = activeColor,
                            userId = user.id
                    )

            val success = StrategyRepository.saveStrategy(newStrategy)
            if (success) {
                isSaveModalOpen = false
                loadStrategies()
                onSuccess()
            } else {
                // TODO: Show Error
                println("Failed to save strategy")
            }
        }
    }
}
