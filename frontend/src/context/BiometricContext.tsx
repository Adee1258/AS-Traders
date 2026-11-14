import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'biometric_lock_enabled';

interface BiometricContextValue {
  isLockEnabled: boolean;
  isLocked: boolean;
  isBiometricSupported: boolean;
  unlock: () => void;
  toggleLock: () => Promise<void>;
  promptBiometric: () => Promise<boolean>;
  // Call this before opening camera/gallery to prevent lock on return
  suppressLockOnce: () => void;
}

const BiometricContext = createContext<BiometricContextValue | undefined>(undefined);

export const BiometricProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLockEnabled, setIsLockEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  const appStateRef = useRef<AppStateStatus>('active');
  // When true, the next background→active transition will NOT trigger a lock
  const suppressNextLock = useRef(false);

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

      if (
        prevState === 'background' &&
        nextState === 'active' &&
        isLockEnabled
      ) {
        if (suppressNextLock.current) {
          // Camera/gallery returned — skip this lock trigger
          suppressNextLock.current = false;
          return;
        }
        setIsLocked(true);
      }
    });

    return () => subscription.remove();
  }, [isLockEnabled]);

  // ── suppressLockOnce: call before opening camera/gallery ─────────────────
  const suppressLockOnce = useCallback(() => {
    suppressNextLock.current = true;
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
      value={{ isLockEnabled, isLocked, isBiometricSupported, unlock, toggleLock, promptBiometric, suppressLockOnce }}
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
