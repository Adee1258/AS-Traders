import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface Props { message?: string; }

const LoadingScreen: React.FC<Props> = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    // Logo fade + scale in
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, tension: 120, friction: 8, useNativeDriver: true }),
    ]).start();

    // Bouncing dots
    const dotAnim = (dot: Animated.Value, delay: number) =>
      Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot, { toValue: -10, duration: 350, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
            Animated.timing(dot, { toValue: 0, duration: 350, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
            Animated.delay(300),
          ])
        ),
      ]);

    dotAnim(dot1, 400).start();
    dotAnim(dot2, 600).start();
    dotAnim(dot3, 800).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* AS Traders real logo */}
      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Bouncing dots */}
      <View style={styles.dotsRow}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[styles.dot, { transform: [{ translateY: dot }] }]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 220,
    height: 160,
    marginBottom: 48,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0A7B5E',
  },
});

export default LoadingScreen;
