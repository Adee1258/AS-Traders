import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'biometric_lock_enabled';
// Lock immediately every time app comes to foreground (no timeout)
const LOCK_TIMEOUT_MS = 0;

interface BiometricContextValue {
  // Is fingerprint lock feature enabled by user
  isLockEnabled: boolean;
  // Is the app currently locked (lock screen visible)
  isLocked: boolean;
  // Does this device support biometrics
  isBiometricSupported: boolean;
  // Unlock the app (called after successful auth)
  unlock: () => void;
  // Toggle the lock feature on/off (called from MoreScreen)
  toggleLock: () => Promise<void>;
  // Trigger biometric prompt manually
  promptBiometric: () => Promise<boolean>;
}

const BiometricContext = createContext<BiometricContextValue | undefined>(undefined);

export const BiometricProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLockEnabled, setIsLockEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  // Track when app went to background to enforce timeout
  const backgroundedAt = useRef<number | null>(null);
  const appStateRef = useRef<AppStateStatus>('active');

  // ── On mount: check device support & restore saved setting ────────────────
  useEffect(() => {
    (async () => {
      const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      const supported = hasHardware && isEnrolled;
      setIsBiometricSupported(supported);

      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      // Only restore enabled state if device still supports it
      if (saved === 'true' && supported) {
        setIsLockEnabled(true);
        // Lock immediately on cold start if feature is on
        setIsLocked(true);
      }
    })();
  }, []);

  // ── AppState listener: lock when app comes back from background ───────────
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (prevState === 'active' && nextState === 'background') {
        backgroundedAt.current = Date.now();
      }

      // Only lock on foreground if coming from background (not from password login flow)
      if (
        prevState === 'background' &&
        nextState === 'active' &&
        isLockEnabled
      ) {
        setIsLocked(true);
        backgroundedAt.current = null;
      }
    });

    return () => subscription.remove();
  }, [isLockEnabled]);

  // ── Prompt biometric ──────────────────────────────────────────────────────
  const promptBiometric = useCallback(async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'AS Traders mein enter karo',
        fallbackLabel: 'Password use karo',
        disableDeviceFallback: true, // We provide our own password fallback
        cancelLabel: 'Cancel',
      });
      return result.success;
    } catch {
      return false;
    }
  }, []);

  // ── Unlock ────────────────────────────────────────────────────────────────
  const unlock = useCallback(() => {
    setIsLocked(false);
  }, []);

  // ── Toggle lock on/off ────────────────────────────────────────────────────
  const toggleLock = useCallback(async () => {
    if (!isBiometricSupported) return;

    if (isLockEnabled) {
      // Turning OFF: require one last biometric confirm
      const ok = await promptBiometric();
      if (!ok) return; // User cancelled — don't disable
      setIsLockEnabled(false);
      setIsLocked(false);
      await AsyncStorage.setItem(STORAGE_KEY, 'false');
    } else {
      // Turning ON: verify biometric works first
      const ok = await promptBiometric();
      if (!ok) return;
      setIsLockEnabled(true);
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
    }
  }, [isLockEnabled, isBiometricSupported, promptBiometric]);

  return (
    <BiometricContext.Provider
      value={{ isLockEnabled, isLocked, isBiometricSupported, unlock, toggleLock, promptBiometric }}
    >
      {children}
    </BiometricContext.Provider>
  );
};

export const useBiometric = (): BiometricContextValue => {
  const ctx = useContext(BiometricContext);
  if (!ctx) throw new Error('useBiometric must be used within BiometricProvider');
  return ctx;
};
