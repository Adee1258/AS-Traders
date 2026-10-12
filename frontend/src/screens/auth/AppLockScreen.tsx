import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Animated, Alert, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useBiometric } from '../../context/BiometricContext';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONTS } from '../../constants';

const AppLockScreen = () => {
  const { promptBiometric, unlock } = useBiometric();
  const { login, user } = useAuth();

  const [showPasswordFallback, setShowPasswordFallback] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Shake animation for wrong password
  const shakeAnim = useRef(new Animated.Value(0)).current;
  // Fade-in on mount
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 350, useNativeDriver: true,
    }).start();
    // Auto-trigger fingerprint on screen open
    handleBiometric();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleBiometric = async () => {
    const success = await promptBiometric();
    if (success) {
      unlock();
    }
  };

  const handlePasswordUnlock = async () => {
    if (!password.trim()) return;
    if (!user?.username) return;

    setLoading(true);
    try {
      // Re-authenticate with actual credentials — this validates against the server
      await login(user.username, password);
      unlock();
    } catch {
      shake();
      setPassword('');
      Alert.alert('Galat Password', 'Password sahi nahi hai. Dobara try karo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={COLORS.gradientPrimary}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative circles */}
      <View style={styles.deco1} />
      <View style={styles.deco2} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

          {/* AS Traders Logo */}
          <View style={styles.lockCircle}>
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.lockLogo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>AS Traders</Text>
          <Text style={styles.subtitle}>
            Fingerprint ya password se open karo
          </Text>

          {!showPasswordFallback ? (
            /* ── Fingerprint mode ─────────────────────────────── */
            <View style={styles.buttonsContainer}>
              {/* Main fingerprint button */}
              <TouchableOpacity
                style={styles.fingerprintBtn}
                onPress={handleBiometric}
                activeOpacity={0.82}
              >
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accentDark]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.fingerprintGradient}
                >
                  <Text style={styles.fingerprintIcon}>👆</Text>
                  <Text style={styles.fingerprintText}>Fingerprint se Open Karo</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Password fallback link */}
              <TouchableOpacity
                style={styles.fallbackLink}
                onPress={() => setShowPasswordFallback(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.fallbackLinkText}>🔑  Password use karo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Password fallback mode ───────────────────────── */
            <Animated.View
              style={[styles.passwordCard, { transform: [{ translateX: shakeAnim }] }]}
            >
              <Text style={styles.passwordLabel}>App Password</Text>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Password daalo..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                secureTextEntry
                autoFocus
                onSubmitEditing={handlePasswordUnlock}
                returnKeyType="done"
                editable={!loading}
              />

              <TouchableOpacity
                style={[styles.unlockBtn, loading && styles.unlockBtnDisabled]}
                onPress={handlePasswordUnlock}
                activeOpacity={0.85}
                disabled={loading}
              >
                <Text style={styles.unlockBtnText}>
                  {loading ? 'Checking...' : 'Unlock Karo →'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backToFinger}
                onPress={() => { setShowPasswordFallback(false); setPassword(''); }}
                activeOpacity={0.7}
              >
                <Text style={styles.backToFingerText}>← Fingerprint pe wapas jao</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryDeep },
  flex: { flex: 1 },
  deco1: {
    position: 'absolute', width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(255,255,255,0.04)', top: -100, right: -80,
  },
  deco2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(245,158,11,0.08)', bottom: 150, left: -60,
  },
  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxl,
  },
  lockCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  lockLogo: { width: 100, height: 100 },
  title: {
    fontSize: 28, fontFamily: FONTS.heavy, color: COLORS.white,
    marginBottom: SPACING.sm, textAlign: 'center',
  },
  subtitle: {
    fontSize: 14, fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center', marginBottom: SPACING.xxl,
    lineHeight: 22, paddingHorizontal: SPACING.md,
  },

  /* Fingerprint mode */
  buttonsContainer: { width: '100%', alignItems: 'center', gap: SPACING.lg },
  fingerprintBtn: { width: '100%', borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', ...SHADOWS.accent },
  fingerprintGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, paddingHorizontal: SPACING.lg, gap: SPACING.sm,
  },
  fingerprintIcon: { fontSize: 26 },
  fingerprintText: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.white },
  fallbackLink: {
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  fallbackLinkText: {
    fontSize: 14, fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.75)',
  },

  /* Password fallback mode */
  passwordCard: { width: '100%', alignItems: 'center', gap: SPACING.md },
  passwordLabel: {
    fontSize: 13, fontFamily: FONTS.semiBold,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase', letterSpacing: 1,
    alignSelf: 'flex-start',
  },
  passwordInput: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 16,
    fontSize: 16, fontFamily: FONTS.medium, color: COLORS.white,
    letterSpacing: 2,
  },
  unlockBtn: {
    width: '100%', backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md, paddingVertical: 16,
    alignItems: 'center', ...SHADOWS.md,
  },
  unlockBtnDisabled: { opacity: 0.6 },
  unlockBtnText: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.primary },
  backToFinger: { paddingVertical: SPACING.sm },
  backToFingerText: {
    fontSize: 13, fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.6)',
  },
});

export default AppLockScreen;
