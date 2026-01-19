package com.marcgodinez.roulette.ui.leaderboard

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.marcgodinez.roulette.ui.hub.LeaderboardItem
import com.marcgodinez.roulette.ui.theme.DarkBg
import com.marcgodinez.roulette.ui.theme.PrimaryGold

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LeaderboardScreen(navController: NavController, viewModel: LeaderboardViewModel = viewModel()) {
    Scaffold(
            containerColor = DarkBg,
            topBar = {
                CenterAlignedTopAppBar(
                        title = {
                            Text(
                                    "LEADERBOARDS",
                                    fontWeight = FontWeight.ExtraBold,
                                    color = PrimaryGold
                            )
                        },
                        navigationIcon = {
                            IconButton(onClick = { navController.popBackStack() }) {
                                Icon(
                                        Icons.Default.ArrowBack,
                                        contentDescription = "Back",
                                        tint = Color.White
                                )
                            }
                        },
                        colors =
                                TopAppBarDefaults.centerAlignedTopAppBarColors(
                                        containerColor = Color.Transparent
                                )
                )
            }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            // Tabs
            TabRow(
                    selectedTabIndex = viewModel.selectedTab.ordinal,
                    containerColor = Color.Transparent,
                    contentColor = PrimaryGold,
                    indicator = { tabPositions ->
                        TabRowDefaults.Indicator(
                                Modifier.tabIndicatorOffset(
                                        tabPositions[viewModel.selectedTab.ordinal]
                                ),
                                color = PrimaryGold
                        )
                    }
            ) {
                Tab(
                        selected = viewModel.selectedTab == LeaderboardTab.WEEKLY,
                        onClick = { viewModel.selectedTab = LeaderboardTab.WEEKLY },
                        text = { Text("WEEKLY PROFIT", fontWeight = FontWeight.Bold) }
                )
                Tab(
                        selected = viewModel.selectedTab == LeaderboardTab.LEGENDARY,
                        onClick = { viewModel.selectedTab = LeaderboardTab.LEGENDARY },
                        text = { Text("LEGENDARY WINS", fontWeight = FontWeight.Bold) }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (viewModel.loading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = PrimaryGold)
                }
            } else {
                val list =
                        if (viewModel.selectedTab == LeaderboardTab.WEEKLY) viewModel.weeklyList
                        else viewModel.legendaryList

                if (list.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("No entries found", color = Color.Gray)
                    }
                } else {
                    LazyColumn(
                            modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            contentPadding = PaddingValues(bottom = 32.dp)
                    ) {
                        itemsIndexed(list) { index, entry ->
                            LeaderboardItem(rank = index + 1, entry = entry)
                        }
                    }
                }
            }
        }
    }
}
