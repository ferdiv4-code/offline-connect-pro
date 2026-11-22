
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from '@/state/AppContext';
import { NetworkProvider } from '@/state/NetworkContext';

function StartupAnimation({ onFinish }: { onFinish: () => void }) {
  const fade = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.82)).current;
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const entrance = Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        speed: 1.8,
        bounciness: 12,
        useNativeDriver: true
      }),
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true
        })
      ])
    ]);

    entrance.start();

    const timer = setTimeout(() => {
      Animated.timing(fade, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true
      }).start(({ finished }) => {
        if (finished) onFinish();
      });
    }, 2100);

    return () => clearTimeout(timer);
  }, [fade, onFinish, pulse, scale]);

  return (
    <Animated.View style={[styles.splash, { opacity: fade }]}>
      <Animated.View style={[styles.halo, { opacity: pulse }]} />
      <Animated.Image
        source={require('../assets/icon.png')}
        resizeMode="contain"
        style={[styles.logo, { transform: [{ scale }] }]}
      />
      <Text style={styles.brand}>OFFLINE CONNECT PRO</Text>
      <Text style={styles.tagline}>Connect. Chat. Communicate.</Text>
      <Text style={styles.version}>VERSION 2.0</Text>
    </Animated.View>
  );
}

function RootNavigator() {
  const { loading } = useApp();
  const [showSplash, setShowSplash] = useState(true);

  const finishSplash = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#06182A" />
      <Stack screenOptions={{ headerShown: false }} />
      {showSplash && !loading && (
        <StartupAnimation onFinish={finishSplash} />
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <NetworkProvider>
        <RootNavigator />
      </NetworkProvider>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06182A'
  },
  splash: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
    elevation: 999,
    backgroundColor: '#06182A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  halo: {
    position: 'absolute',
    width: 270,
    height: 270,
    borderRadius: 135,
    borderWidth: 2,
    borderColor: '#35DCC5',
    backgroundColor: 'rgba(32, 157, 180, 0.08)'
  },
  logo: {
    width: 220,
    height: 220,
    borderRadius: 38
  },
  brand: {
    color: '#F1FFFF',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 1
  },
  tagline: {
    color: '#9BC8D1',
    fontSize: 12,
    marginTop: 9,
    letterSpacing: 1
  },
  version: {
    color: '#5F9CA8',
    fontSize: 11,
    marginTop: 22,
    letterSpacing: 2
  }
});
