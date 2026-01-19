package com.marcgodinez.roulette

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.marcgodinez.roulette.network.ApiClient
import com.marcgodinez.roulette.ui.auth.AuthScreen
import com.marcgodinez.roulette.ui.game.GameScreen
import com.marcgodinez.roulette.ui.hub.HubScreen
import com.marcgodinez.roulette.ui.leaderboard.LeaderboardScreen
import com.marcgodinez.roulette.ui.navigation.Screen
import com.marcgodinez.roulette.ui.theme.RouletteTheme
import io.github.jan.supabase.gotrue.SessionStatus
import io.github.jan.supabase.gotrue.auth

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        com.marcgodinez.roulette.utils.SoundManager.init(this)
        com.marcgodinez.roulette.utils.AdManager.initialize(this)
        com.marcgodinez.roulette.utils.StoreManager.initialize(this)

        setContent {
            RouletteTheme {
                Surface(
                        modifier = Modifier.fillMaxSize(),
                        color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    var authStatus by remember { mutableStateOf<SessionStatus?>(null) }

                    // Monitor Session
                    LaunchedEffect(Unit) {
                        ApiClient.supabase.auth.sessionStatus.collect { status ->
                            authStatus = status
                            if (status is SessionStatus.Authenticated) {
                                // Navigate to Hub if on Login screen (or just let the
                                // startDestination logic handle it)
                                // But simple logic: if authenticated, we want to be in the App
                                // flow.
                                // We will rely on NavHost logic below.
                            }
                        }
                    }

                    // Simple routing logic based on auth state
                    // Ideally we'd have a splash screen determinator, but for now:
                    val startDest =
                            if (authStatus is SessionStatus.Authenticated) Screen.Hub.route
                            else Screen.Auth.route

                    // Force navigation when auth state changes - simplified approach
                    // Warning: Recomposition of NavHost on startDest change isn't ideal, usually we
                    // navigate explicitly.
                    // Better pattern: One NavHost, but protected routes.

                    NavHost(navController = navController, startDestination = Screen.Auth.route) {
                        composable(Screen.Auth.route) {
                            if (authStatus is SessionStatus.Authenticated) {
                                SideEffect {
                                    navController.navigate(Screen.Hub.route) {
                                        popUpTo(Screen.Auth.route) { inclusive = true }
                                    }
                                }
                            } else {
                                AuthScreen(
                                        onLoginSuccess = { /* Auth flow handled by SideEffect */}
                                )
                            }
                        }

                        composable(Screen.Hub.route) { HubScreen(navController = navController) }

                        composable(Screen.Game.route) {
                            GameScreen(
                                    onExit = { navController.popBackStack() },
                                    onLogout = {
                                        navController.navigate(Screen.Auth.route) { popUpTo(0) }
                                    }
                            )
                        }

                        composable(Screen.Leaderboard.route) {
                            LeaderboardScreen(navController = navController)
                        }

                        composable(Screen.Strategy.route) {
                            com.marcgodinez.roulette.ui.strategy.StrategyLabScreen(
                                    navController = navController
                            )
                        }
                    }
                }
            }
        }
    }
}
