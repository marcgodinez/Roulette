package com.marcgodinez.roulette.utils

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.SoundPool
import android.util.Log

object SoundManager {
    private var soundPool: SoundPool? = null
    private val soundMap = mutableMapOf<SoundType, Int>()
    private var bgPlayer: MediaPlayer? = null
    private var musicVolume = 0.5f
    private var sfxVolume = 0.8f
    private var isMuted = false

    enum class SoundType(val resName: String) {
        CHIP_PLACE("chip_click"),
        SPIN_START("wheel_spin"),
        WIN("win_celebration"),
        LOSS("loss")
    }

    fun init(context: Context) {
        val attributes =
                AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_GAME)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()

        soundPool = SoundPool.Builder().setMaxStreams(10).setAudioAttributes(attributes).build()

        SoundType.values().forEach { type -> loadSound(context, type) }
    }

    private fun loadSound(context: Context, type: SoundType) {
        val resId = context.resources.getIdentifier(type.resName, "raw", context.packageName)
        if (resId != 0) {
            soundMap[type] = soundPool?.load(context, resId, 1) ?: 0
        } else {
            Log.w("SoundManager", "Sound resource not found: ${type.resName}")
        }
    }

    fun setMuted(muted: Boolean) {
        isMuted = muted
        if (muted) {
            bgPlayer?.pause()
        } else {
            bgPlayer?.start()
        }
    }

    fun setVolumes(music: Float, sfx: Float) {
        musicVolume = music
        sfxVolume = sfx
        bgPlayer?.setVolume(music, music)
    }

    fun play(type: SoundType) {
        if (isMuted) return
        val soundId = soundMap[type] ?: 0
        if (soundId != 0) {
            soundPool?.play(soundId, sfxVolume, sfxVolume, 1, 0, 1f)
        }
    }

    fun startMusic(context: Context, resName: String) {
        if (isMuted) return
        val resId = context.resources.getIdentifier(resName, "raw", context.packageName)
        if (resId == 0) return

        try {
            bgPlayer?.stop()
            bgPlayer?.release()

            bgPlayer = MediaPlayer.create(context, resId)
            bgPlayer?.isLooping = true
            bgPlayer?.setVolume(musicVolume, musicVolume)
            bgPlayer?.start()
        } catch (e: Exception) {
            Log.e("SoundManager", "Error starting music: $resName", e)
        }
    }

    fun stopMusic() {
        bgPlayer?.stop()
        bgPlayer?.release()
        bgPlayer = null
    }

    fun release() {
        soundPool?.release()
        soundPool = null
        stopMusic()
    }
}
