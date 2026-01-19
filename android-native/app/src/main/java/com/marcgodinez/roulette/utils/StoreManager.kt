package com.marcgodinez.roulette.utils

import android.app.Activity
import android.content.Context
import android.util.Log
import com.revenuecat.purchases.CustomerInfo
import com.revenuecat.purchases.Offerings
import com.revenuecat.purchases.Package
import com.revenuecat.purchases.PurchaseParams
import com.revenuecat.purchases.Purchases
import com.revenuecat.purchases.PurchasesConfiguration
import com.revenuecat.purchases.getOfferingsWith
import com.revenuecat.purchases.interfaces.PurchaseCallback
import com.revenuecat.purchases.models.StoreTransaction
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

object StoreManager {
    private const val TAG = "StoreManager"
    private const val GOOGLE_API_KEY =
            "test_NQmZxFGDDIwHprgnvqHCHsYfmXS" // REPLACEME: Actual RevenueCat Google API Key

    private val _offerings = MutableStateFlow<Offerings?>(null)
    val offerings: StateFlow<Offerings?> = _offerings.asStateFlow()

    private val _isInitialized = MutableStateFlow(false)
    val isInitialized: StateFlow<Boolean> = _isInitialized.asStateFlow()

    fun initialize(context: Context) {
        if (_isInitialized.value) return

        Purchases.debugLogsEnabled = true
        Purchases.configure(PurchasesConfiguration.Builder(context, GOOGLE_API_KEY).build())

        _isInitialized.value = true
        fetchOfferings()
    }

    fun fetchOfferings() {
        Purchases.sharedInstance.getOfferingsWith(
                onError = { error -> Log.e(TAG, "Error fetching offerings: ${error.message}") },
                onSuccess = { offerings ->
                    Log.d(
                            TAG,
                            "Offerings fetched: ${offerings.current?.availablePackages?.size} packages"
                    )
                    _offerings.value = offerings
                }
        )
    }

    fun purchasePackage(
            activity: Activity,
            pkg: Package,
            onSuccess: (StoreTransaction, CustomerInfo) -> Unit,
            onError: (com.revenuecat.purchases.PurchasesError, Boolean) -> Unit
    ) {
        Purchases.sharedInstance.purchase(
                PurchaseParams.Builder(activity, pkg).build(),
                object : PurchaseCallback {
                    override fun onCompleted(
                            storeTransaction: StoreTransaction,
                            customerInfo: CustomerInfo
                    ) {
                        Log.d(TAG, "Purchase completed: ${storeTransaction.productIds}")
                        onSuccess(storeTransaction, customerInfo)
                    }

                    override fun onError(
                            error: com.revenuecat.purchases.PurchasesError,
                            userCancelled: Boolean
                    ) {
                        Log.e(TAG, "Purchase error: ${error.message}, cancelled: $userCancelled")
                        onError(error, userCancelled)
                    }
                }
        )
    }

    fun restorePurchases(
            onSuccess: (CustomerInfo) -> Unit,
            onError: (com.revenuecat.purchases.PurchasesError) -> Unit
    ) {
        Purchases.sharedInstance.restorePurchases(
                object : com.revenuecat.purchases.interfaces.ReceiveCustomerInfoCallback {
                    override fun onReceived(customerInfo: CustomerInfo) {
                        onSuccess(customerInfo)
                    }

                    override fun onError(error: com.revenuecat.purchases.PurchasesError) {
                        onError(error)
                    }
                }
        )
    }
}
