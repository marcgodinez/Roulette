package com.marcgodinez.roulette.data

object GameConstants {
        // Red Numbers Set
        val RED_NUMBERS = setOf(1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36)

        fun isRed(number: Int): Boolean = RED_NUMBERS.contains(number)

        // Standard European Roulette Sequence (Clockwise from 0)
        val EUROPEAN_SEQUENCE =
                listOf(
                        0,
                        32,
                        15,
                        19,
                        4,
                        21,
                        2,
                        25,
                        17,
                        34,
                        6,
                        27,
                        13,
                        36,
                        11,
                        30,
                        8,
                        23,
                        10,
                        5,
                        24,
                        16,
                        33,
                        1,
                        20,
                        14,
                        31,
                        9,
                        22,
                        18,
                        29,
                        7,
                        28,
                        12,
                        35,
                        3,
                        26
                )

        // French Bets / Call Bets Sequences
        val SEQ_VOISINS_ZERO = listOf(22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25)
        val SEQ_TIERS = listOf(27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33)
        val SEQ_ORPHELINS = listOf(1, 20, 14, 31, 9, 17, 34, 6)
        val SEQ_JEU0 = listOf(12, 35, 3, 26, 0, 32, 15)

        // Racetrack Sequence (Identical to European, explicitly defined for clarity if needed, or
        // alias)
        val RACETRACK_SEQUENCE = EUROPEAN_SEQUENCE

        data class PresetStrategy(
                val id: String,
                val name: String,
                val description: String,
                val color: String,
                val totalUnits: Int,
                val bets: Map<String, Int> // BetID -> Units
        )

        val PRESET_STRATEGIES =
                listOf(
                        PresetStrategy(
                                id = "JAMES_BOND",
                                name = "The James Bond",
                                description = "Cover 2/3 of the table. High risk, high reward.",
                                color = "#3b82f6",
                                totalUnits = 20,
                                bets = mapOf("19-36" to 14, "LINE_13_18" to 5, "0" to 1)
                        ),
                        PresetStrategy(
                                id = "RED_SNAKE",
                                name = "The Red Snake",
                                description = "A zigzag pattern covering 12 red numbers.",
                                color = "#ef4444",
                                totalUnits = 12,
                                bets =
                                        mapOf(
                                                "1" to 1,
                                                "5" to 1,
                                                "9" to 1,
                                                "12" to 1,
                                                "14" to 1,
                                                "16" to 1,
                                                "19" to 1,
                                                "23" to 1,
                                                "27" to 1,
                                                "30" to 1,
                                                "32" to 1,
                                                "34" to 1
                                        )
                        ),
                        PresetStrategy(
                                id = "VOISINS_ZERO",
                                name = "Voisins du Zéro",
                                description = "The neighbors of zero (9 chip bet).",
                                color = "#eab308",
                                totalUnits = 9,
                                bets =
                                        mapOf(
                                                "STREET_0_2_3" to 2,
                                                "COR_25_26_28_29" to 2,
                                                "SPLIT_4_7" to 1,
                                                "SPLIT_12_15" to 1,
                                                "SPLIT_18_21" to 1,
                                                "SPLIT_19_22" to 1,
                                                "SPLIT_32_35" to 1
                                        )
                        )
                )
}
