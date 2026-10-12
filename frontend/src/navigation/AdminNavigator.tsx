import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AdminStackParamList, AdminTabParamList } from '../types';
import { COLORS, FONTS, BORDER_RADIUS, SHADOWS } from '../constants';

// ─── Screen imports ────────────────────────────────────────────────────────
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import ShopsScreen from '../screens/admin/ShopsScreen';
import AddShopScreen from '../screens/admin/AddShopScreen';
import EditShopScreen from '../screens/admin/EditShopScreen';
import ShopProfileScreen from '../screens/admin/ShopProfileScreen';
import ProductsScreen from '../screens/admin/ProductsScreen';
import AddProductScreen from '../screens/admin/AddProductScreen';
import EditProductScreen from '../screens/admin/EditProductScreen';
import NewOrderScreen from '../screens/admin/NewOrderScreen';
import OrderDetailsScreen from '../screens/admin/OrderDetailsScreen';
import AllOrdersScreen from '../screens/admin/AllOrdersScreen';
import AllPaymentsScreen from '../screens/admin/AllPaymentsScreen';
import AddPaymentScreen from '../screens/admin/AddPaymentScreen';
import AllBalancesScreen from '../screens/admin/AllBalancesScreen';
import ShopLedgerScreen from '../screens/admin/ShopLedgerScreen';
import PaymentDetailsScreen from '../screens/admin/PaymentDetailsScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import ExpensesScreen from '../screens/admin/ExpensesScreen';
import ProfitLossScreen from '../screens/admin/ProfitLossScreen';
import SuppliersScreen from '../screens/admin/SuppliersScreen';
import AddEditSupplierScreen from '../screens/admin/AddEditSupplierScreen';
import SupplierDetailScreen from '../screens/admin/SupplierDetailScreen';
import MoreScreen from '../screens/admin/MoreScreen';
import BillsScreen from '../screens/admin/BillsScreen';

// ─── Navigators ────────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator<AdminTabParamList>();
const Stack = createNativeStackNavigator<AdminStackParamList>();

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
const TabIcon = ({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) => (
  <View style={[iconStyles.wrap, focused && iconStyles.wrapActive]}>
    <Text style={iconStyles.emoji}>{emoji}</Text>
    <Text style={[iconStyles.label, focused && iconStyles.labelActive]}>{label}</Text>
    {focused && <View style={iconStyles.dot} />}
  </View>
);

// ─── Tab stacks ────────────────────────────────────────────────────────────
const HomeStack = () => {
  const S = createNativeStackNavigator();
  return (
    <S.Navigator screenOptions={stackScreenOptions}>
      <S.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: false }} />
    </S.Navigator>
  );
};

const ShopsStack = () => {
  const S = createNativeStackNavigator();
  return (
    <S.Navigator screenOptions={stackScreenOptions}>
      <S.Screen name="Shops" component={ShopsScreen} options={{ title: 'Shops' }} />
      <S.Screen name="AddShop" component={AddShopScreen} options={{ title: 'Add Shop' }} />
      <S.Screen name="EditShop" component={EditShopScreen} options={{ title: 'Edit Shop' }} />
      <S.Screen name="ShopProfile" component={ShopProfileScreen} options={({ route }: any) => ({ title: route.params.shopName })} />
      <S.Screen name="NewOrder" component={NewOrderScreen} options={{ title: 'New Order' }} />
      <S.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ title: 'Order Details' }} />
      <S.Screen name="AddPayment" component={AddPaymentScreen} options={{ title: 'Add Payment' }} />
      <S.Screen name="ShopLedger" component={ShopLedgerScreen} options={({ route }: any) => ({ title: `${route.params.shopName} — Ledger` })} />
      <S.Screen name="AllBalances" component={AllBalancesScreen} options={{ title: 'All Balances' }} />
    </S.Navigator>
  );
};

const OrdersStack = () => {
  const S = createNativeStackNavigator();
  return (
    <S.Navigator screenOptions={stackScreenOptions}>
      <S.Screen name="AllOrders" component={AllOrdersScreen} options={{ title: 'All Orders' }} />
      <S.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ title: 'Order Details' }} />
      <S.Screen name="AllPayments" component={AllPaymentsScreen} options={{ title: 'All Payments' }} />
      <S.Screen name="PaymentDetails" component={PaymentDetailsScreen} options={{ title: 'Payment Details' }} />
      <S.Screen name="AddPayment" component={AddPaymentScreen} options={{ title: 'Add Payment' }} />
    </S.Navigator>
  );
};

// ─── Tab 4: Suppliers stack ────────────────────────────────────────────────
const SuppliersStack = () => {
  const S = createNativeStackNavigator();
  return (
    <S.Navigator screenOptions={stackScreenOptions}>
      <S.Screen name="Suppliers" component={SuppliersScreen} options={{ title: 'Suppliers' }} />
      <S.Screen name="AddSupplier" component={AddEditSupplierScreen} options={{ title: 'Add Supplier' }} />
      <S.Screen name="EditSupplier" component={AddEditSupplierScreen} options={{ title: 'Edit Supplier' }} />
      <S.Screen name="SupplierDetail" component={SupplierDetailScreen} options={({ route }: any) => ({ title: route.params.supplierName })} />
    </S.Navigator>
  );
};

const ReportsStack = () => {
  const S = createNativeStackNavigator();
  return (
    <S.Navigator screenOptions={stackScreenOptions}>
      <S.Screen name="ProfitLoss" component={ProfitLossScreen} options={{ title: 'Profit & Loss' }} />
      <S.Screen name="Expenses" component={ExpensesScreen} options={{ title: 'Expenses' }} />
      <S.Screen name="AllBalances" component={AllBalancesScreen} options={{ title: 'All Balances' }} />
    </S.Navigator>
  );
};

const MoreStack = () => {
  const S = createNativeStackNavigator();
  return (
    <S.Navigator screenOptions={stackScreenOptions}>
      <S.Screen name="More" component={MoreScreen} options={{ headerShown: false }} />
      <S.Screen name="Products" component={ProductsScreen} options={{ title: 'Products' }} />
      <S.Screen name="AddProduct" component={AddProductScreen} options={{ title: 'Add Product' }} />
      <S.Screen name="EditProduct" component={EditProductScreen} options={{ title: 'Edit Product' }} />
      <S.Screen name="AdminProfile" component={AdminProfileScreen} options={{ title: 'My Profile & Security' }} />
    </S.Navigator>
  );
};

// ─── Main Tab Navigator — 6 tabs ──────────────────────────────────────────
const AdminTabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: tabStyles.bar,
      tabBarHideOnKeyboard: true,
    }}
  >
    <Tab.Screen
      name="HomeTab"
      component={HomeStack}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} /> }}
    />
    <Tab.Screen
      name="ShopsTab"
      component={ShopsStack}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏪" label="Shops" focused={focused} /> }}
    />
    <Tab.Screen
      name="OrdersTab"
      component={OrdersStack}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📦" label="Orders" focused={focused} /> }}
    />
    <Tab.Screen
      name="SuppliersTab"
      component={SuppliersStack}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏭" label="Suppliers" focused={focused} /> }}
    />
    <Tab.Screen
      name="ReportsTab"
      component={ReportsStack}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Reports" focused={focused} /> }}
    />
    <Tab.Screen
      name="MoreTab"
      component={MoreStack}
      options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" label="More" focused={focused} /> }}
    />
  </Tab.Navigator>
);

// ─── Root Admin Navigator ─────────────────────────────────────────────────
const AdminNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminDashboard" component={AdminTabNavigator} />
    {/* Cross-tab screens */}
    <Stack.Screen name="ShopProfile" component={ShopProfileScreen} options={{ ...stackScreenOptions, headerShown: true, title: '' } as any} />
    <Stack.Screen name="AddShop" component={AddShopScreen} options={{ ...stackScreenOptions, headerShown: true, title: 'Add Shop' } as any} />
    <Stack.Screen name="EditShop" component={EditShopScreen} options={{ ...stackScreenOptions, headerShown: true, title: 'Edit Shop' } as any} />
    <Stack.Screen name="NewOrder" component={NewOrderScreen} options={{ ...stackScreenOptions, headerShown: true, title: 'New Order' } as any} />
    <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ ...stackScreenOptions, headerShown: true, title: 'Order Details' } as any} />
    <Stack.Screen name="AddPayment" component={AddPaymentScreen} options={{ ...stackScreenOptions, headerShown: true, title: 'Add Payment' } as any} />
    <Stack.Screen name="PaymentDetails" component={PaymentDetailsScreen} options={{ ...stackScreenOptions, headerShown: true, title: 'Payment Details' } as any} />
    <Stack.Screen name="ShopLedger" component={ShopLedgerScreen} options={{ ...stackScreenOptions, headerShown: true } as any} />
    <Stack.Screen name="Shops" component={ShopsScreen} options={{ ...stackScreenOptions, headerShown: true, title: 'Shops' } as any} />
    <Stack.Screen name="AllOrders" component={AllOrdersScreen} options={{ ...stackScreenOptions, headerShown: true, title: 'All Orders' } as any} />
    <Stack.Screen name="AllPayments" component={AllPaymentsScreen} options={{ ...stackScreenOptions, headerShown: true, title: 'All Payments' } as any} />
    <Stack.Screen name="AllBalances" component={AllBalancesScreen} options={{ ...stackScreenOptions, headerShown: true, title: 'All Balances' } as any} />
    <Stack.Screen name="Expenses" component={ExpensesScreen} options={{ ...stackScreenOptions, headerShown: true, title: 'Expenses' } as any} />
    <Stack.Screen name="ProfitLoss" component={ProfitLossScreen} options={{ ...stackScreenOptions, headerShown: true, title: 'Profit & Loss' } as any} />
    <Stack.Screen name="Products" component={ProductsScreen} options={{ ...stackScreenOptions, headerShown: true, title: 'Products' } as any} />
    <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ ...stackScreenOptions, headerShown: true, title: 'Add Product' } as any} />
    <Stack.Screen name="EditProduct" component={EditProductScreen} options={{ ...stackScreenOptions, headerShown: true, title: 'Edit Product' } as any} />
    <Stack.Screen name="AdminProfile" component={AdminProfileScreen} options={{ ...stackScreenOptions, headerShown: true, title: 'My Profile & Security' } as any} />
    <Stack.Screen name="Suppliers" component={SuppliersScreen} options={{ ...stackScreenOptions, headerShown: true, title: 'Suppliers' } as any} />
    <Stack.Screen name="AddSupplier" component={AddEditSupplierScreen} options={{ ...stackScreenOptions, headerShown: true, title: 'Add Supplier' } as any} />
    <Stack.Screen name="EditSupplier" component={AddEditSupplierScreen} options={{ ...stackScreenOptions, headerShown: true, title: 'Edit Supplier' } as any} />
    <Stack.Screen name="SupplierDetail" component={SupplierDetailScreen} options={{ ...stackScreenOptions, headerShown: true } as any} />
    <Stack.Screen
      name="Bills"
      component={BillsScreen}
      options={({ route }: any) => ({
        ...stackScreenOptions,
        headerShown: true,
        title: `🧾 Bills — ${route.params?.partyName ?? ''}`,
      }) as any}
    />
  </Stack.Navigator>
);

export default AdminNavigator;

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
    paddingTop: 8,
    paddingHorizontal: 6,
    borderRadius: BORDER_RADIUS.lg,
    minWidth: 50,
    position: 'relative',
  },
  wrapActive: { backgroundColor: COLORS.primaryLight },
  emoji: { fontSize: 20, lineHeight: 26 },
  label: { fontSize: 9, fontFamily: FONTS.semiBold, color: COLORS.textMuted, marginTop: 2 },
  labelActive: { color: COLORS.primary, fontFamily: FONTS.bold },
  dot: {
    position: 'absolute', bottom: -2,
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
});
