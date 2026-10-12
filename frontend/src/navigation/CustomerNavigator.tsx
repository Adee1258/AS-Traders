import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CustomerStackParamList, CustomerTabParamList } from '../types';
import { COLORS, FONTS, BORDER_RADIUS, SHADOWS } from '../constants';

import CustomerDashboardScreen from '../screens/customer/CustomerDashboardScreen';
import MyOrdersScreen from '../screens/customer/MyOrdersScreen';
import CustomerOrderDetailsScreen from '../screens/customer/CustomerOrderDetailsScreen';
import MyPaymentsScreen from '../screens/customer/MyPaymentsScreen';
import AccountHistoryScreen from '../screens/customer/AccountHistoryScreen';
import MyProfileScreen from '../screens/customer/MyProfileScreen';

const Tab = createBottomTabNavigator<CustomerTabParamList>();
const Stack = createNativeStackNavigator<CustomerStackParamList>();

const stackScreenOptions = {
  headerStyle: { backgroundColor: COLORS.white },
  headerTintColor: COLORS.text,
  headerTitleStyle: { fontFamily: FONTS.bold, fontSize: 17, color: COLORS.text } as object,
  headerTitleAlign: 'center' as const,
  headerShadowVisible: true,
  headerBackTitleVisible: false,
  contentStyle: { backgroundColor: COLORS.background },
};

// ─── Tab icon ──────────────────────────────────────────────────────────────
const TabIcon = ({
  emoji,
  label,
  focused,
}: {
  emoji: string;
  label: string;
  focused: boolean;
}) => (
  <View style={[iconStyles.wrap, focused && iconStyles.wrapActive]}>
    <Text style={iconStyles.emoji}>{emoji}</Text>
    <Text style={[iconStyles.label, focused && iconStyles.labelActive]}>{label}</Text>
    {focused && <View style={iconStyles.dot} />}
  </View>
);

// ─── Tab screens ───────────────────────────────────────────────────────────
const DashboardStack = () => {
  const S = createNativeStackNavigator();
  return (
    <S.Navigator screenOptions={stackScreenOptions}>
      <S.Screen name="CustomerDashboard" component={CustomerDashboardScreen} options={{ headerShown: false }} />
    </S.Navigator>
  );
};

const OrdersStack = () => {
  const S = createNativeStackNavigator();
  return (
    <S.Navigator screenOptions={stackScreenOptions}>
      <S.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: 'My Orders' }} />
      <S.Screen name="OrderDetails" component={CustomerOrderDetailsScreen} options={{ title: 'Order Details' }} />
    </S.Navigator>
  );
};

const PaymentsStack = () => {
  const S = createNativeStackNavigator();
  return (
    <S.Navigator screenOptions={stackScreenOptions}>
      <S.Screen name="MyPayments" component={MyPaymentsScreen} options={{ title: 'My Payments' }} />
    </S.Navigator>
  );
};

const LedgerStack = () => {
  const S = createNativeStackNavigator();
  return (
    <S.Navigator screenOptions={stackScreenOptions}>
      <S.Screen name="AccountHistory" component={AccountHistoryScreen} options={{ title: 'Account History' }} />
    </S.Navigator>
  );
};

const ProfileStack = () => {
  const S = createNativeStackNavigator();
  return (
    <S.Navigator screenOptions={stackScreenOptions}>
      <S.Screen name="MyProfile" component={MyProfileScreen} options={{ title: 'My Profile' }} />
    </S.Navigator>
  );
};

// ─── Tab Navigator ─────────────────────────────────────────────────────────
const CustomerTabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: tabStyles.bar,
      tabBarHideOnKeyboard: true,
    }}
  >
    <Tab.Screen
      name="DashboardTab"
      component={DashboardStack}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon emoji="🏠" label="Home" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="OrdersTab"
      component={OrdersStack}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon emoji="📦" label="Orders" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="PaymentsTab"
      component={PaymentsStack}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon emoji="💳" label="Payments" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="LedgerTab"
      component={LedgerStack}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon emoji="📒" label="Ledger" focused={focused} />
        ),
      }}
    />
    <Tab.Screen
      name="ProfileTab"
      component={ProfileStack}
      options={{
        tabBarIcon: ({ focused }) => (
          <TabIcon emoji="👤" label="Profile" focused={focused} />
        ),
      }}
    />
  </Tab.Navigator>
);

// ─── Root Customer Navigator ───────────────────────────────────────────────
const CustomerNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CustomerDashboard" component={CustomerTabNavigator} />
    {/* Cross-tab screens */}
    <Stack.Screen
      name="OrderDetails"
      component={CustomerOrderDetailsScreen}
      options={{ ...stackScreenOptions, headerShown: true, title: 'Order Details' } as any}
    />
    <Stack.Screen
      name="MyOrders"
      component={MyOrdersScreen}
      options={{ ...stackScreenOptions, headerShown: true, title: 'My Orders' } as any}
    />
    <Stack.Screen
      name="MyPayments"
      component={MyPaymentsScreen}
      options={{ ...stackScreenOptions, headerShown: true, title: 'My Payments' } as any}
    />
    <Stack.Screen
      name="AccountHistory"
      component={AccountHistoryScreen}
      options={{ ...stackScreenOptions, headerShown: true, title: 'Account History' } as any}
    />
    <Stack.Screen
      name="MyProfile"
      component={MyProfileScreen}
      options={{ ...stackScreenOptions, headerShown: true, title: 'My Profile' } as any}
    />
  </Stack.Navigator>
);

export default CustomerNavigator;

// ─── Styles ────────────────────────────────────────────────────────────────
const tabStyles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 12,
    left: 16,
    right: 16,
    height: 68,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderTopWidth: 0,
    paddingBottom: 0,
    paddingTop: 0,
    ...SHADOWS.lg,
    elevation: 20,
  },
});

const iconStyles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingHorizontal: 10,
    borderRadius: BORDER_RADIUS.lg,
    minWidth: 58,
    position: 'relative',
  },
  wrapActive: {
    backgroundColor: COLORS.primaryLight,
  },
  emoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  label: {
    fontSize: 10,
    fontFamily: FONTS.semiBold,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  labelActive: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  dot: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
});
