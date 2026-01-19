package com.marcgodinez.roulette.utils

import android.app.Activity
import android.content.Context
import android.util.Log
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

object AdManager {
    private const val TAG = "AdManager"
    // PROD ID: ca-app-pub-1182495378626576/2255121410
    private const val AD_UNIT_ID = "ca-app-pub-1182495378626576/2255121410"
    // PROD ID (Interstitial): ca-app-pub-1182495378626576/5853431550
    private const val INTERSTI_ID = "ca-app-pub-1182495378626576/5853431550"

    private var rewardedAd: RewardedAd? = null
    private var interstitialAd: com.google.android.gms.ads.interstitial.InterstitialAd? = null

    // State to observe ad loading status in UI
    private val _isAdLoaded = MutableStateFlow(false)
    val isAdLoaded: StateFlow<Boolean> = _isAdLoaded.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    fun initialize(context: Context) {
        MobileAds.initialize(context) { status ->
            Log.d(TAG, "AdMob initialized: ${status.adapterStatusMap}")
            loadRewardedAd(context)
            loadInterstitialAd(context)
        }
    }

    fun loadRewardedAd(context: Context) {
        if (_isLoading.value || rewardedAd != null) return

        _isLoading.value = true
        val adRequest = AdRequest.Builder().build()

        RewardedAd.load(
                context,
                AD_UNIT_ID,
                adRequest,
                object : RewardedAdLoadCallback() {
                    override fun onAdFailedToLoad(adError: LoadAdError) {
                        Log.e(TAG, "Ad failed to load: ${adError.message}")
                        rewardedAd = null
                        _isAdLoaded.value = false
                        _isLoading.value = false
                    }

                    override fun onAdLoaded(ad: RewardedAd) {
                        Log.d(TAG, "Ad was loaded.")
                        rewardedAd = ad
                        _isAdLoaded.value = true
                        _isLoading.value = false

                        // Set callbacks immediately
                        ad.fullScreenContentCallback =
                                object : FullScreenContentCallback() {
                                    override fun onAdDismissedFullScreenContent() {
                                        Log.d(TAG, "Ad dismissed.")
                                        rewardedAd = null
                                        _isAdLoaded.value = false
                                        // Pre-load the next ad
                                        loadRewardedAd(context)
                                    }

                                    override fun onAdFailedToShowFullScreenContent(
                                            adError: AdError
                                    ) {
                                        Log.e(TAG, "Ad failed to show: ${adError.message}")
                                        rewardedAd = null
                                        _isAdLoaded.value = false
                                    }

                                    override fun onAdShowedFullScreenContent() {
                                        Log.d(TAG, "Ad showed fullscreen content.")
                                    }
                                }
                    }
                }
        )
    }

    fun loadInterstitialAd(context: Context) {
        if (interstitialAd != null) return
        val adRequest = AdRequest.Builder().build()

        com.google.android.gms.ads.interstitial.InterstitialAd.load(
                context,
                INTERSTI_ID,
                adRequest,
                object : com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback() {
                    override fun onAdFailedToLoad(adError: LoadAdError) {
                        Log.e(TAG, "Interstitial fail: ${adError.message}")
                        interstitialAd = null
                    }
                    override fun onAdLoaded(
                            ad: com.google.android.gms.ads.interstitial.InterstitialAd
                    ) {
                        Log.d(TAG, "Interstitial Loaded")
                        interstitialAd = ad
                    }
                }
        )
    }

    fun showRewardedAd(activity: Activity, onUserEarnedReward: () -> Unit) {
        rewardedAd?.let { ad ->
            ad.show(activity) { rewardItem ->
                Log.d(TAG, "User earned the reward: ${rewardItem.amount} ${rewardItem.type}")
                onUserEarnedReward()
            }
        }
                ?: run { Log.d(TAG, "The rewarded ad wasn't ready yet.") }
    }

    fun showInterstitial(activity: Activity) {
        interstitialAd?.let { ad ->
            ad.fullScreenContentCallback =
                    object : FullScreenContentCallback() {
                        override fun onAdDismissedFullScreenContent() {
                            interstitialAd = null
                            loadInterstitialAd(activity)
                        }
                        override fun onAdFailedToShowFullScreenContent(adError: AdError) {
                            interstitialAd = null
                        }
                    }
            ad.show(activity)
        }
                ?: run {
                    Log.d(TAG, "Interstitial not ready")
                    loadInterstitialAd(activity)
                }
    }
}
