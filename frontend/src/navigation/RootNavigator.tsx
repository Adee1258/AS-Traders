import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useBiometric } from '../context/BiometricContext';
import { RootStackParamList } from '../types';
import LoadingScreen from '../components/LoadingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import AppLockScreen from '../screens/auth/AppLockScreen';
import AdminNavigator from './AdminNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const { isLoading, isAuthenticated, user, logout } = useAuth();
  const { isLocked, isLockEnabled } = useBiometric();

  // Block customer accounts — this app is admin-only on mobile
  // If someone logs in with a customer account, auto-logout them
  useEffect(() => {
    if (isAuthenticated && user?.role === 'customer') {
      logout().catch(console.error);
    }
  }, [isAuthenticated, user?.role]);

  if (isLoading) return <LoadingScreen message="Starting up..." />;

  // While customer is being logged out, show loading briefly
  if (isAuthenticated && user?.role === 'customer') {
    return <LoadingScreen message="Access allowed nahi..." />;
  }

  // Show lock screen only when: admin is logged in AND lock feature is on AND app is locked
  if (isAuthenticated && isLockEnabled && isLocked) {
    return <AppLockScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="AdminRoot" component={AdminNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
