package com.marcgodinez.roulette.data.repositories

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

object SettingsRepository {

    private val IS_MUTED = booleanPreferencesKey("is_muted")
    private val VIBRATION_ENABLED = booleanPreferencesKey("vibration_enabled")
    private val MUSIC_VOLUME = floatPreferencesKey("music_volume")
    private val SFX_VOLUME = floatPreferencesKey("sfx_volume")

    fun getIsMuted(context: Context): Flow<Boolean> =
            context.dataStore.data.map { preferences -> preferences[IS_MUTED] ?: false }

    suspend fun setIsMuted(context: Context, muted: Boolean) {
        context.dataStore.edit { preferences -> preferences[IS_MUTED] = muted }
    }

    fun getVibrationEnabled(context: Context): Flow<Boolean> =
            context.dataStore.data.map { preferences -> preferences[VIBRATION_ENABLED] ?: true }

    suspend fun setVibrationEnabled(context: Context, enabled: Boolean) {
        context.dataStore.edit { preferences -> preferences[VIBRATION_ENABLED] = enabled }
    }

    fun getMusicVolume(context: Context): Flow<Float> =
            context.dataStore.data.map { preferences -> preferences[MUSIC_VOLUME] ?: 0.5f }

    suspend fun setMusicVolume(context: Context, volume: Float) {
        context.dataStore.edit { preferences -> preferences[MUSIC_VOLUME] = volume }
    }

    fun getSfxVolume(context: Context): Flow<Float> =
            context.dataStore.data.map { preferences -> preferences[SFX_VOLUME] ?: 0.8f }

    suspend fun setSfxVolume(context: Context, volume: Float) {
        context.dataStore.edit { preferences -> preferences[SFX_VOLUME] = volume }
    }
}
