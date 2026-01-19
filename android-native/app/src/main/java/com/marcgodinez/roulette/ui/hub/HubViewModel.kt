package com.marcgodinez.roulette.ui.hub

import android.app.Application
import android.util.Log
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.marcgodinez.roulette.data.models.LeaderboardEntry
import com.marcgodinez.roulette.data.models.StorePackage
import com.marcgodinez.roulette.data.models.UserProfile
import com.marcgodinez.roulette.data.repositories.HubRepository
import com.marcgodinez.roulette.data.repositories.SettingsRepository
import com.marcgodinez.roulette.network.ApiClient
import com.marcgodinez.roulette.utils.SoundManager
import kotlinx.coroutines.launch

class HubViewModel(application: Application) : AndroidViewModel(application) {
    private val repository: HubRepository = HubRepository

    var loading by mutableStateOf(false)
    var profile by mutableStateOf<UserProfile?>(null)
    var weeklyTop by mutableStateOf<List<LeaderboardEntry>>(emptyList())
    var legendaryTop by mutableStateOf<List<LeaderboardEntry>>(emptyList())
    var myBestWin by mutableStateOf(0)
    var onlineCount by mutableStateOf(142) // Mocked for UI replication
    var dailyBonusAvailable by mutableStateOf(false)
    var bonusClaimSuccess by mutableStateOf(false)
    var timeUntilNextBonus by mutableStateOf("")

    // Store State
    var storeOpen by mutableStateOf(false)
    var settingsOpen by mutableStateOf(false)

    // Settings State
    var isMuted by mutableStateOf(false)
    var vibrationEnabled by mutableStateOf(true)
    var musicVolume by mutableStateOf(0.5f)
    var sfxVolume by mutableStateOf(0.8f)

    var storeLoading by mutableStateOf(false)
    var packages by
            mutableStateOf<List<StorePackage>>(
                    listOf(
                            StorePackage(
                                    identifier = "tiny_pack",
                                    title = "Tiny Pack",
                                    description = "10,000 Coins",
                                    priceString = "$0.99",
                                    credits = 10000
                            ),
                            StorePackage(
                                    identifier = "small_pack",
                                    title = "Small Pack",
                                    description = "50,000 Coins",
                                    priceString = "$4.99",
                                    credits = 50000
                            ),
                            StorePackage(
                                    identifier = "medium_pack",
                                    title = "Medium Pack",
                                    description = "150,000 Coins",
                                    priceString = "$9.99",
                                    credits = 150000,
                                    isPopular = true
                            ),
                            StorePackage(
                                    identifier = "large_pack",
                                    title = "Large Pack",
                                    description = "500,000 Coins",
                                    priceString = "$29.99",
                                    credits = 500000,
                                    isBestValue = true
                            ),
                            StorePackage(
                                    identifier = "no_ads",
                                    title = "No Ads Bundle",
                                    description = "Remove Ads + 50,000 Coins",
                                    priceString = "$4.99",
                                    credits = 50000,
                                    isNoAds = true
                            )
                    )
            )

    private fun observeStoreOfferings() {
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

    // Ad State
    var isAdLoaded by mutableStateOf(false)

    init {
        refreshData()
        loadSettings()
        observeAdState()
        observeStoreOfferings()
    }

    private fun observeAdState() {
        viewModelScope.launch {
            com.marcgodinez.roulette.utils.AdManager.isAdLoaded.collect { adManagerLoaded ->
                isAdLoaded = profile?.noAds == true || adManagerLoaded
            }
        }
    }

    private fun loadSettings() {
        viewModelScope.launch {
            SettingsRepository.getIsMuted(getApplication()).collect {
                isMuted = it
                SoundManager.setMuted(it)
            }
        }
        viewModelScope.launch {
            SettingsRepository.getVibrationEnabled(getApplication()).collect {
                vibrationEnabled = it
            }
        }
        viewModelScope.launch {
            SettingsRepository.getMusicVolume(getApplication()).collect {
                musicVolume = it
                SoundManager.setVolumes(musicVolume, sfxVolume)
            }
        }
        viewModelScope.launch {
            SettingsRepository.getSfxVolume(getApplication()).collect {
                sfxVolume = it
                SoundManager.setVolumes(musicVolume, sfxVolume)
            }
        }
    }
    fun updateMute(muted: Boolean) {
        viewModelScope.launch { SettingsRepository.setIsMuted(getApplication(), muted) }
    }

    fun updateVibration(enabled: Boolean) {
        viewModelScope.launch { SettingsRepository.setVibrationEnabled(getApplication(), enabled) }
    }

    fun updateMusicVolume(volume: Float) {
        viewModelScope.launch { SettingsRepository.setMusicVolume(getApplication(), volume) }
    }

    fun updateSfxVolume(volume: Float) {
        viewModelScope.launch { SettingsRepository.setSfxVolume(getApplication(), volume) }
    }

    fun refreshData() {
        viewModelScope.launch {
            loading = true
            Log.d("HubViewModel", "Refreshing data...")

            // Parallel execution would be better but keeping simple sequence for now
            profile = repository.fetchProfile()
            Log.d("HubViewModel", "Profile loaded: $profile")

            weeklyTop = repository.fetchWeeklyLeaderboard()
            legendaryTop = repository.fetchLegendaryTop()
            myBestWin = repository.fetchMyBestWin()

            checkBonusStatus(profile?.lastDailyBonus)

            // Update isAdLoaded based on new profile data
            isAdLoaded =
                    profile?.noAds == true ||
                            com.marcgodinez.roulette.utils.AdManager.isAdLoaded.value

            loading = false
            Log.d("HubViewModel", "Data refresh complete.")
        }
    }

    private fun checkBonusStatus(lastBonus: String?) {
        if (lastBonus == null) {
            dailyBonusAvailable = true
            return
        }

        try {
            // Parse Supabase ISO 8601 string to Instant
            // Some timestamps come with offset +00:00 instead of Z
            val lastClaimTime =
                    try {
                        java.time.Instant.parse(lastBonus)
                    } catch (e: Exception) {
                        java.time.OffsetDateTime.parse(lastBonus).toInstant()
                    }

            val now = java.time.Instant.now()

            // 24 hours in seconds = 86400
            val secondsSinceClaim = java.time.Duration.between(lastClaimTime, now).seconds

            dailyBonusAvailable = secondsSinceClaim >= 86400

            // Calculate time until next bonus if not available
            if (!dailyBonusAvailable) {
                val secondsRemaining = 86400 - secondsSinceClaim
                val hours = secondsRemaining / 3600
                val minutes = (secondsRemaining % 3600) / 60
                timeUntilNextBonus = "${hours}h ${minutes}m"
            } else {
                timeUntilNextBonus = ""
            }
        } catch (e: Exception) {
            Log.e("HubViewModel", "Error parsing date: $lastBonus", e)
            dailyBonusAvailable = true // Fallback to allowed on error
            timeUntilNextBonus = ""
        }
    }

    fun claimBonus() {
        Log.d("HubViewModel", "claimBonus() called - Starting bonus claim process")
        viewModelScope.launch {
            try {
                Log.d("HubViewModel", "Calling ApiClient.claimDailyBonus()...")
                val result = ApiClient.claimDailyBonus()
                Log.d("HubViewModel", "API Response: $result")

                if (result != null && result.success) {
                    Log.d("HubViewModel", "Bonus claim SUCCESS - triggering animation")
                    // Success - trigger animation
                    bonusClaimSuccess = true
                    Log.d("HubViewModel", "bonusClaimSuccess set to true")

                    Log.d("HubViewModel", "Calling refreshData()...")
                    refreshData()

                    // Auto-reset success state after 3 seconds
                    Log.d("HubViewModel", "Waiting 3 seconds before resetting animation...")
                    kotlinx.coroutines.delay(3000)
                    bonusClaimSuccess = false
                    Log.d("HubViewModel", "Animation reset complete")
                } else {
                    Log.e("HubViewModel", "Bonus claim FAILED - result: $result")
                    if (result == null) {
                        Log.e("HubViewModel", "Result is null - API call failed")
                    } else if (!result.success) {
                        Log.e(
                                "HubViewModel",
                                "Result success=false - bonus not available or unauthorized"
                        )
                    }
                }
            } catch (e: Exception) {
                Log.e("HubViewModel", "Exception in claimBonus: ${e.message}", e)
            }
        }
    }

    fun showAd(activity: android.app.Activity) {
        if (profile?.noAds == true) {
            // Premium users get rewards instantly
            claimAdReward()
            return
        }
        com.marcgodinez.roulette.utils.AdManager.showRewardedAd(activity) {
            // Callback when reward is earned
            claimAdReward()
        }
    }

    private fun claimAdReward() {
        viewModelScope.launch {
            val result = ApiClient.claimAdReward()
            if (result != null) {
                refreshData()
            }
        }
    }

    fun loadPackages() {
        viewModelScope.launch {
            com.marcgodinez.roulette.utils.StoreManager.offerings.collect { offerings ->
                val availablePackages = offerings?.current?.availablePackages
                if (availablePackages != null) {
                    packages =
                            availablePackages.map { pkg ->
                                StorePackage(
                                        identifier = pkg.product.id,
                                        title = pkg.product.title,
                                        description = pkg.product.description,
                                        priceString = pkg.product.price.formatted,
                                        credits =
                                                when {
                                                    pkg.product.id.contains("small") -> 1000
                                                    pkg.product.id.contains("medium") -> 5500
                                                    pkg.product.id.contains("large") -> 12000
                                                    pkg.product.id.contains("noads") -> 50000
                                                    else -> 0
                                                },
                                        isNoAds = pkg.product.id.contains("noads"),
                                        revenueCatPackage = pkg
                                )
                            }
                }
            }
        }
    }

    fun purchasePackage(activity: android.app.Activity, pkg: StorePackage) {
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
                                refreshData()
                            }
                            storeLoading = false
                        }
                    },
                    onError = { error, cancelled ->
                        Log.e("HubViewModel", "Purchase error: ${error.message}")
                        storeLoading = false
                    }
            )
        }
    }

    fun logout(navController: androidx.navigation.NavController) {
        viewModelScope.launch {
            // Clear session
            com.marcgodinez.roulette.data.repositories.AuthRepository.signOut()
            // Navigate to Auth
            navController.navigate("auth") { popUpTo(0) }
        }
    }
}
