package com.marcgodinez.roulette.ui.game

import android.app.Application
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.marcgodinez.roulette.data.repositories.PlayerRepository
import com.marcgodinez.roulette.data.repositories.SettingsRepository
import com.marcgodinez.roulette.network.ApiClient
import com.marcgodinez.roulette.utils.SoundManager
import com.marcgodinez.roulette.utils.VibrationManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

enum class GamePhase {
    BETTING,
    REVEALING, // Pre-spin fire reveal
    SPINNING,
    RESULT,
    BONUS
}

class GameViewModel(application: Application) : AndroidViewModel(application) {

    // Game State
    var credits by mutableStateOf(1000.0) // Default fallback
    var winningNumber by mutableStateOf<Int?>(null)
    var fireNumbers by mutableStateOf<List<Int>>(emptyList())
    var showStats by mutableStateOf(false)
    var showResultOverlay by mutableStateOf(false)
    var totalWin by mutableStateOf(0.0)
    var currentPhase by mutableStateOf(GamePhase.BETTING)
    var isMuted by mutableStateOf(false)
    var vibrationEnabled by mutableStateOf(true)
    var message by mutableStateOf("Place your bets")
    var history by mutableStateOf<List<Int>>(emptyList())
    var savedStrategies by
            mutableStateOf<List<com.marcgodinez.roulette.data.models.Strategy>>(emptyList())
    var showStrategySelector by mutableStateOf(false)

    // Ad Trigger State
    var noAds by mutableStateOf(false)
    var hasShownFirstAd = false
    var winningSpinCount = 0
    var showAdEvent by mutableStateOf(false)

    // Store State
    var storeLoading by mutableStateOf(false)
    var packages by
            mutableStateOf<List<com.marcgodinez.roulette.data.models.StorePackage>>(
                    listOf(
                            com.marcgodinez.roulette.data.models.StorePackage(
                                    identifier = "tiny_pack",
                                    title = "Tiny Pack",
                                    description = "10,000 Coins",
                                    priceString = "$0.99",
                                    credits = 10000
                            ),
                            com.marcgodinez.roulette.data.models.StorePackage(
                                    identifier = "small_pack",
                                    title = "Small Pack",
                                    description = "50,000 Coins",
                                    priceString = "$4.99",
                                    credits = 50000
                            ),
                            com.marcgodinez.roulette.data.models.StorePackage(
                                    identifier = "medium_pack",
                                    title = "Medium Pack",
                                    description = "150,000 Coins",
                                    priceString = "$9.99",
                                    credits = 150000,
                                    isPopular = true
                            ),
                            com.marcgodinez.roulette.data.models.StorePackage(
                                    identifier = "large_pack",
                                    title = "Large Pack",
                                    description = "500,000 Coins",
                                    priceString = "$29.99",
                                    credits = 500000,
                                    isBestValue = true
                            ),
                            com.marcgodinez.roulette.data.models.StorePackage(
                                    identifier = "no_ads",
                                    title = "No Ads Bundle",
                                    description = "Remove Ads + 50,000 Coins",
                                    priceString = "$4.99",
                                    credits = 50000,
                                    isNoAds = true
                            )
                    )
            )

    // Betting State
    var currentBets = mutableStateOf<Map<String, Int>>(emptyMap())
    var selectedChipValue by mutableStateOf(10)
    private var betStack = mutableListOf<Pair<String, Int>>() // For Undo
    private var lastRoundBets = emptyMap<String, Int>() // For Rebet

    val isSpinning
        get() = currentPhase == GamePhase.SPINNING

    init {
        viewModelScope.launch {
            // Observe PlayerRepository
            PlayerRepository.userProfile.collect { profile ->
                if (profile != null) {
                    credits = profile.credits
                    noAds = profile.noAds
                }
            }
        }

        // Initial Fetch
        viewModelScope.launch {
            PlayerRepository.fetchProfile()
            PlayerRepository.fetchProfile()
            history = ApiClient.fetchGameHistory()
            loadStrategies()
        }

        loadSettings()
        observeStore()
    }

    private fun observeStore() {
        viewModelScope.launch {
            com.marcgodinez.roulette.utils.StoreManager.offerings.collect { offerings ->
                offerings?.current?.availablePackages?.let { rcPackages ->
                    if (rcPackages.isNotEmpty()) {
                        // Map RevenueCat packages to our UI model
                        // This logic preserves our local metadata (images/badges) but updates
                        // price/product details
                        val updatedPackages =
                                packages.map { localPack ->
                                    val match =
                                            rcPackages.find {
                                                it.product.id.contains(localPack.identifier)
                                            }
                                    if (match != null) {
                                        localPack.copy(
                                                priceString = match.product.price.formatted,
                                                revenueCatPackage = match
                                        )
                                    } else {
                                        localPack
                                    }
                                }
                        packages = updatedPackages
                    }
                }
            }
        }
    }

    private fun loadSettings() {
        viewModelScope.launch {
            SettingsRepository.getIsMuted(getApplication()).collect { isMuted = it }
        }
        viewModelScope.launch {
            SettingsRepository.getVibrationEnabled(getApplication()).collect {
                vibrationEnabled = it
            }
        }
    }

    fun placeBet(betId: String, amount: Int = selectedChipValue) {
        if (currentPhase != GamePhase.BETTING) return

        val newBets = currentBets.value.toMutableMap()
        val currentAmount = newBets[betId] ?: 0
        newBets[betId] = currentAmount + amount
        currentBets.value = newBets

        betStack.add(betId to amount)
        message = "Bet placed: $amount"

        SoundManager.play(SoundManager.SoundType.CHIP_PLACE)
        if (vibrationEnabled) VibrationManager.vibrate(getApplication())
    }

    fun undoLastBet() {
        if (currentPhase != GamePhase.BETTING || betStack.isEmpty()) return

        val (betId, amount) = betStack.removeAt(betStack.size - 1)
        val newBets = currentBets.value.toMutableMap()
        val currentAmount = newBets[betId] ?: 0

        if (currentAmount <= amount) {
            newBets.remove(betId)
        } else {
            newBets[betId] = currentAmount - amount
        }
        currentBets.value = newBets
        message = "Undone last bet"
    }

    fun rebet() {
        if (currentPhase != GamePhase.BETTING || lastRoundBets.isEmpty()) return
        currentBets.value = lastRoundBets.toMap()
        // Re-populate stack for undoing rebet in pieces (or just clear it)
        betStack.clear()
        message = "Bets repeated!"
    }

    fun clearBets() {
        if (currentPhase != GamePhase.BETTING) return
        currentBets.value = emptyMap()
        betStack.clear()
        message = "Board cleared"
    }

    fun loadStrategies() {
        viewModelScope.launch { savedStrategies = ApiClient.fetchStrategies() }
    }

    fun applyStrategy(bets: Map<String, Int>) {
        if (currentPhase != GamePhase.BETTING) return
        currentBets.value = bets
        betStack.clear()
        message = "Strategy applied!"
    }

    fun deleteStrategy(id: String) {
        viewModelScope.launch {
            if (ApiClient.deleteStrategy(id)) {
                loadStrategies()
            }
        }
    }

    fun spin() {
        val totalBet = currentBets.value.values.sum()
        if (currentBets.value.isEmpty()) {
            message = "Place a bet first!"
            return
        }

        if (totalBet > credits) {
            message = "Insufficient credits!"
            return
        }

        currentPhase = GamePhase.REVEALING
        message = "Fire Numbers Revealed!"
        SoundManager.play(SoundManager.SoundType.SPIN_START)
        if (vibrationEnabled) VibrationManager.vibrate(getApplication(), 100)
        winningNumber = null
        totalWin = 0.0

        // Optimistic update
        credits -= totalBet

        viewModelScope.launch {
            val result = ApiClient.spin(currentBets.value)

            if (result != null) {
                // Keep the current bets for rebet reference before clearing
                lastRoundBets = currentBets.value.toMap()

                fireNumbers = result.fireNumbers
                winningNumber = result.winningNumber

                // Duration of Reveal
                delay(3000)

                currentPhase = GamePhase.SPINNING
                message = "Spinning..."

                // Wait for Wheel Animation (6.5s)
                delay(6500)

                // --- PHASE 1: REVEAL WINNER ---
                // Transition to RESULT to zoom out and show Dolly
                currentPhase = GamePhase.RESULT
                if (result.totalWin > 0) {
                    SoundManager.play(SoundManager.SoundType.WIN)
                    if (vibrationEnabled) VibrationManager.vibrateSuccess(getApplication())
                } else {
                    SoundManager.play(SoundManager.SoundType.LOSS)
                }
                showResultOverlay = false // Keep overlay hidden for now

                // Update data
                totalWin = result.totalWin
                credits = result.newBalance
                PlayerRepository.updateLocalCredits(result.newBalance)
                history = (listOf(result.winningNumber) + history).take(10)

                // Remove Losing Chips
                currentBets.value =
                        currentBets.value.filter { (id, _) ->
                            isWinningBet(id, result.winningNumber)
                        }

                // Wait 2 seconds for user to see the board state
                delay(2000)

                // --- PHASE 2: SHOW WIN OVERLAY ---
                showResultOverlay = true
                message =
                        if (result.totalWin > 0) "YOU WON ${result.totalWin}!"
                        else "No luck this time."

                // TRIGGER AD Logic
                if (result.totalWin > 0 && !noAds) {
                    winningSpinCount++

                    if (!hasShownFirstAd) {
                        // First win ever -> Show Ad
                        hasShownFirstAd = true
                        showAdEvent = true
                        winningSpinCount = 0 // Reset counter so next ad is after 5 wins from now
                    } else if (winningSpinCount >= 5) {
                        // Every 5 winning spins -> Show Ad
                        showAdEvent = true
                        winningSpinCount = 0
                    }
                }

                delay(3000) // Show result overlay for 3 seconds

                // Reset for next round
                currentPhase = GamePhase.BETTING
                fireNumbers = emptyList()
                currentBets.value = emptyMap()
                betStack.clear()
                showResultOverlay = false
            } else {
                message = "Error: Func. no encontrada o Fallo de Red"
                credits += totalBet // Refund optimistic
                currentPhase = GamePhase.BETTING
            }
        }
    }
    fun triggerBonus() {
        currentPhase = GamePhase.BONUS
    }

    fun completeBonus(multiplier: Int, payout: Double) {
        credits += payout
        totalWin += payout // Add to session win?
        PlayerRepository.updateLocalCredits(credits)
        message = "Bonus Win: $$payout!"
        currentPhase = GamePhase.BETTING
        winningNumber = null // Reset for next round
        currentBets.value = emptyMap()
    }

    fun loadPackages() {
        com.marcgodinez.roulette.utils.StoreManager.fetchOfferings()
    }

    fun purchasePackage(
            activity: android.app.Activity,
            pkg: com.marcgodinez.roulette.data.models.StorePackage
    ) {
        val rcPkg = pkg.revenueCatPackage ?: return

        viewModelScope.launch {
            storeLoading = true

            com.marcgodinez.roulette.utils.StoreManager.purchasePackage(
                    activity = activity,
                    pkg = rcPkg,
                    onSuccess = { transaction, info ->
                        viewModelScope.launch {
                            val result =
                                    ApiClient.purchasePack(
                                            amount = pkg.credits,
                                            productId = pkg.identifier,
                                            transactionId = transaction.orderId
                                                            ?: transaction.purchaseToken
                                    )
                            if (result != null) {
                                credits = result.newBalance
                                PlayerRepository.updateLocalCredits(result.newBalance)
                            }
                            storeLoading = false
                        }
                    },
                    onError = { error, cancelled ->
                        android.util.Log.e("GameViewModel", "Purchase error: ${error.message}")
                        storeLoading = false
                    }
            )
        }
    }

    fun showAd(activity: android.app.Activity) {
        if (noAds) {
            // Premium users get rewards instantly
            viewModelScope.launch {
                val result = ApiClient.claimAdReward()
                if (result != null) {
                    credits = result.newBalance
                    PlayerRepository.updateLocalCredits(result.newBalance)
                }
            }
            return
        }
        com.marcgodinez.roulette.utils.AdManager.showRewardedAd(activity) {
            viewModelScope.launch {
                val result = ApiClient.claimAdReward()
                if (result != null) {
                    credits = result.newBalance
                    PlayerRepository.updateLocalCredits(result.newBalance)
                }
            }
        }
    }

    fun signOut() {
        viewModelScope.launch {
            try {
                com.marcgodinez.roulette.data.repositories.AuthRepository.signOut()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun deleteAccount() {
        signOut()
    }

    private fun isWinningBet(betId: String, winningNumber: Int): Boolean {
        if (betId == "0") return winningNumber == 0

        // Simple Numbers
        betId.toIntOrNull()?.let {
            return it == winningNumber
        }

        // Columns
        if (betId.startsWith("COL")) {
            if (winningNumber == 0) return false
            val colIndex = betId.removePrefix("COL").toInt() - 1 // 0, 1, 2
            return (winningNumber - 1) % 3 == colIndex
        }

        // Dozens
        if (betId == "1st12") return winningNumber in 1..12
        if (betId == "2nd12") return winningNumber in 13..24
        if (betId == "3rd12") return winningNumber in 25..36

        // Even Money
        if (winningNumber == 0) return false // 0 loses all simple bets
        if (betId == "1-18") return winningNumber in 1..18
        if (betId == "19-36") return winningNumber in 19..36
        if (betId == "EVEN") return winningNumber % 2 == 0
        if (betId == "ODD") return winningNumber % 2 != 0
        if (betId == "RED")
                return com.marcgodinez.roulette.data.GameConstants.RED_NUMBERS.contains(
                        winningNumber
                )
        if (betId == "BLACK")
                return !com.marcgodinez.roulette.data.GameConstants.RED_NUMBERS.contains(
                        winningNumber
                )

        // Complex (Split, Street, Corner, SixLine, Trio)
        // ID format: PREFIX_n1_n2_...
        if (betId.contains("_")) {
            val parts = betId.split("_")
            // Skip prefix, check remaining parts
            val nums = parts.drop(1).mapNotNull { it.toIntOrNull() }
            return nums.contains(winningNumber)
        }

        return false
    }
}
