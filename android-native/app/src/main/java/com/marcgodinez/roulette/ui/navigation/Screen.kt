package com.marcgodinez.roulette.ui.navigation

sealed class Screen(val route: String) {
    data object Auth : Screen("auth")
    data object Hub : Screen("hub")
    data object Game : Screen("game")
    data object Strategy : Screen("strategy")
    object Leaderboard : Screen("leaderboard")
    object Shop : Screen("shop")
    object DailyBonus : Screen("daily_bonus")
}
