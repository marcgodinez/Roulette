package com.marcgodinez.roulette.ui.leaderboard

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.marcgodinez.roulette.data.models.LeaderboardEntry
import com.marcgodinez.roulette.data.repositories.HubRepository
import kotlinx.coroutines.launch

enum class LeaderboardTab {
    WEEKLY,
    LEGENDARY
}

class LeaderboardViewModel(private val repository: HubRepository = HubRepository) : ViewModel() {

    var loading by mutableStateOf(false)
    var selectedTab by mutableStateOf(LeaderboardTab.WEEKLY)

    var weeklyList by mutableStateOf<List<LeaderboardEntry>>(emptyList())
    var legendaryList by mutableStateOf<List<LeaderboardEntry>>(emptyList())

    init {
        fetchData()
    }

    fun fetchData() {
        viewModelScope.launch {
            loading = true
            // In a real app we might want pagination or larger limits
            weeklyList = repository.fetchWeeklyLeaderboard()
            legendaryList = repository.fetchLegendaryTop()
            loading = false
        }
    }
}
