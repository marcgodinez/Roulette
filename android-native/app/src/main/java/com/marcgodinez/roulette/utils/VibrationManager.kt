package com.marcgodinez.roulette.utils

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

object VibrationManager {

    fun vibrate(context: Context, durationMillis: Long = 50) {
        val vibrator =
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    val vibratorManager =
                            context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as
                                    VibratorManager
                    vibratorManager.defaultVibrator
                } else {
                    @Suppress("DEPRECATION")
                    context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(
                    VibrationEffect.createOneShot(durationMillis, VibrationEffect.DEFAULT_AMPLITUDE)
            )
        } else {
            @Suppress("DEPRECATION") vibrator.vibrate(durationMillis)
        }
    }

    fun vibrateSuccess(context: Context) {
        val vibrator =
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    val vibratorManager =
                            context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as
                                    VibratorManager
                    vibratorManager.defaultVibrator
                } else {
                    @Suppress("DEPRECATION")
                    context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val timings = longArrayOf(0, 100, 50, 100)
            val amplitudes =
                    intArrayOf(
                            0,
                            VibrationEffect.DEFAULT_AMPLITUDE,
                            0,
                            VibrationEffect.DEFAULT_AMPLITUDE
                    )
            vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1))
        } else {
            @Suppress("DEPRECATION") vibrator.vibrate(longArrayOf(0, 100, 50, 100), -1)
        }
    }
}
