import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'biometric_lock_enabled';

// Minimum time app must be in background before locking (ms)
// Camera/gallery returns within a few seconds — real "leave app" takes longer
const MIN_BACKGROUND_MS = 10_000; // 10 seconds

interface BiometricContextValue {
  isLockEnabled: boolean;
  isLocked: boolean;
  isBiometricSupported: boolean;
  unlock: () => void;
  toggleLock: () => Promise<void>;
  promptBiometric: () => Promise<boolean>;
  suppressLockOnce: () => void;
}

const BiometricContext = createContext<BiometricContextValue | undefined>(undefined);

export const BiometricProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLockEnabled, setIsLockEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  const appStateRef = useRef<AppStateStatus>('active');
  // Timestamp when app went to background
  const backgroundedAt = useRef<number | null>(null);
  // Manual suppress flag for extra safety
  const suppressCount = useRef(0);

  // ── On mount ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      const supported = hasHardware && isEnrolled;
      setIsBiometricSupported(supported);

      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === 'true' && supported) {
        setIsLockEnabled(true);
        setIsLocked(true);
      }
    })();
  }, []);

  // ── AppState listener ─────────────────────────────────────────────────────
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      // Record when app goes to background
      if (nextState === 'background' || nextState === 'inactive') {
        if (backgroundedAt.current === null) {
          backgroundedAt.current = Date.now();
        }
        return;
      }

      // App came back to foreground
      if (nextState === 'active' && isLockEnabled) {
        const timeInBackground = backgroundedAt.current
          ? Date.now() - backgroundedAt.current
          : 0;

        backgroundedAt.current = null;

        // Manual suppress (camera/gallery) — skip lock regardless of time
        if (suppressCount.current > 0) {
          suppressCount.current -= 1;
          return;
        }

        // Only lock if app was in background long enough
        // Camera/gallery trips are very short (< 10 seconds)
        if (timeInBackground >= MIN_BACKGROUND_MS) {
          setIsLocked(true);
        }
      }
    });

    return () => subscription.remove();
  }, [isLockEnabled]);

  // ── suppressLockOnce ──────────────────────────────────────────────────────
  const suppressLockOnce = useCallback(() => {
    // Set to 5 to safely cover all possible background trips during camera flow
    suppressCount.current = 5;
  }, []);

  // ── Prompt biometric ──────────────────────────────────────────────────────
  const promptBiometric = useCallback(async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'AS Traders mein enter karo',
        fallbackLabel: 'Password use karo',
        disableDeviceFallback: true,
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
      const ok = await promptBiometric();
      if (!ok) return;
      setIsLockEnabled(false);
      setIsLocked(false);
      await AsyncStorage.setItem(STORAGE_KEY, 'false');
    } else {
      const ok = await promptBiometric();
      if (!ok) return;
      setIsLockEnabled(true);
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
    }
  }, [isLockEnabled, isBiometricSupported, promptBiometric]);

  return (
    <BiometricContext.Provider
      value={{
        isLockEnabled, isLocked, isBiometricSupported,
        unlock, toggleLock, promptBiometric, suppressLockOnce,
      }}
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
