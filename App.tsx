import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, ActivityIndicator, BackHandler } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GameScreen } from './src/screens/GameScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { HubScreen } from './src/screens/HubScreen';
import { useAuth } from './src/hooks/useAuth';
import { useGameStore } from './src/store/useGameStore';

import { StrategyEditor } from './src/screens/StrategyEditor';

export default function App() {
  const { session, loading } = useAuth();
  const { loadUserProfile, setStoreOpen } = useGameStore();
  const [inGame, setInGame] = useState(false);
  const [inStrategyLab, setInStrategyLab] = useState(false);

  useEffect(() => {
    if (session) {
      loadUserProfile();
    } else {
      setInGame(false);
      setInStrategyLab(false);
    }
  }, [session]);

  const handleBackToHub = () => {
    setInGame(false);
    setInStrategyLab(false);
  }

  useEffect(() => {
    const backAction = () => {
      if (inGame || inStrategyLab) {
        setInGame(false);
        setInStrategyLab(false);
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [inGame, inStrategyLab]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        {!session ? (
          <AuthScreen />
        ) : inGame ? (
          <GameScreen onBack={handleBackToHub} />
        ) : inStrategyLab ? (
          <StrategyEditor onClose={handleBackToHub} />
        ) : (
          <HubScreen
            onPlay={() => setInGame(true)}
            onStrategy={() => setInStrategyLab(true)}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
