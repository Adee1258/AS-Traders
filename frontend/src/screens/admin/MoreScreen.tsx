import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Alert, Platform, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AdminStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useBiometric } from '../../context/BiometricContext';
import { COLORS, DARK_COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants';

type Nav = NativeStackNavigationProp<AdminStackParamList>;

// ─── Menu row component ────────────────────────────────────────────────────
const MenuRow = ({
  icon,
  label,
  sublabel,
  onPress,
  rightElement,
  tint,
  C,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  tint?: string;
  C: typeof COLORS;
}) => (
  <TouchableOpacity
    style={[styles.row, { backgroundColor: C.white, borderColor: C.borderLight }]}
    onPress={onPress}
    activeOpacity={onPress ? 0.72 : 1}
    disabled={!onPress}
  >
    <View style={[styles.rowIcon, { backgroundColor: tint ? `${tint}18` : C.surface }]}>
      <Text style={styles.rowIconText}>{icon}</Text>
    </View>
    <View style={styles.rowBody}>
      <Text style={[styles.rowLabel, { color: C.text }]}>{label}</Text>
      {sublabel ? <Text style={[styles.rowSub, { color: C.textMuted }]}>{sublabel}</Text> : null}
    </View>
    {rightElement ?? (
      onPress ? <Text style={[styles.rowArrow, { color: C.textMuted }]}>›</Text> : null
    )}
  </TouchableOpacity>
);

// ─── Section header ────────────────────────────────────────────────────────
const Section = ({ title, C }: { title: string; C: typeof COLORS }) => (
  <Text style={[styles.sectionTitle, { color: C.textMuted }]}>{title}</Text>
);

// ─── Main Screen ──────────────────────────────────────────────────────────
const MoreScreen = () => {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { isLockEnabled, isBiometricSupported, toggleLock } = useBiometric();
  const C = isDark ? DARK_COLORS : COLORS;

  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Sign Out — Are you sure?')) logout().catch(console.error);
    } else {
      Alert.alert('Sign Out', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => logout().catch(console.error) },
      ]);
    }
  };

  const handleBiometricToggle = async () => {
    if (!isBiometricSupported) {
      Alert.alert(
        'Fingerprint Support Nahi Hai',
        'Is device pe fingerprint sensor nahi hai ya koi fingerprint register nahi ki gayi.\n\nDevice Settings mein ja kar pehle fingerprint add karo.',
        [{ text: 'OK' }]
      );
      return;
    }
    await toggleLock();
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Header ── */}
        <LinearGradient
          colors={C.gradientPrimary as [string, string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.avatarCircle}>
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.avatarLogo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name ?? 'Admin'}</Text>
            <Text style={styles.profileUsername}>@{user?.username}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>ADMIN</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Catalog ── */}
        <Section title="CATALOG" C={C} />
        <View style={[styles.group, { backgroundColor: C.white }]}>
          <MenuRow
            icon="🛒" label="Products" sublabel="Saare products dekho / edit karo"
            onPress={() => navigation.navigate('Products')} tint={C.primary} C={C}
          />
          <View style={[styles.divider, { backgroundColor: C.borderLight }]} />
          <MenuRow
            icon="➕" label="Add Product" sublabel="Naya product register karo"
            onPress={() => navigation.navigate('AddProduct')} tint={C.success} C={C}
          />
        </View>

        {/* ── Account ── */}
        <Section title="ACCOUNT" C={C} />
        <View style={[styles.group, { backgroundColor: C.white }]}>
          <MenuRow
            icon="👤" label="My Profile" sublabel="Name, username, password"
            onPress={() => navigation.navigate('AdminProfile')} tint="#8B5CF6" C={C}
          />
        </View>

        {/* ── Security ── */}
        <Section title="SECURITY" C={C} />
        <View style={[styles.group, { backgroundColor: C.white }]}>
          <MenuRow
            icon={isLockEnabled ? '🔒' : '🔓'}
            label="Fingerprint Lock"
            sublabel={
              !isBiometricSupported
                ? 'Is device pe supported nahi'
                : isLockEnabled
                  ? 'App lock on hai — fingerprint se khulay ga'
                  : 'App lock off hai — enable karo'
            }
            tint={isLockEnabled ? '#059669' : '#6B7280'}
            C={C}
            rightElement={
              <Switch
                value={isLockEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: COLORS.border, true: C.primary }}
                thumbColor={isLockEnabled ? C.primary : COLORS.white}
                ios_backgroundColor={COLORS.border}
                disabled={!isBiometricSupported}
              />
            }
          />
        </View>

        {/* ── Appearance ── */}
        <Section title="APPEARANCE" C={C} />
        <View style={[styles.group, { backgroundColor: C.white }]}>
          <MenuRow
            icon={isDark ? '🌙' : '☀️'}
            label="Dark Mode"
            sublabel={isDark ? 'Dark theme on hai' : 'Light theme on hai'}
            tint={isDark ? '#6366F1' : '#F59E0B'}
            C={C}
            rightElement={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: COLORS.border, true: C.primary }}
                thumbColor={isDark ? C.primary : COLORS.white}
                ios_backgroundColor={COLORS.border}
              />
            }
          />
        </View>

        {/* ── App Info ── */}
        <Section title="APP" C={C} />
        <View style={[styles.group, { backgroundColor: C.white }]}>
          <MenuRow
            icon="ℹ️" label="AS Traders"
            sublabel="Wholesale Management App v1.0"
            C={C}
          />
        </View>

        {/* ── Sign Out ── */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: C.dangerLight, borderColor: C.danger }]}
          onPress={confirmLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={[styles.logoutText, { color: C.danger }]}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.md, paddingTop: SPACING.sm },

  // Profile card
  profileCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.md,
    ...SHADOWS.md,
  },
  avatarCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
  },
  avatarLogo: {
    width: 52,
    height: 52,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontFamily: FONTS.heavy, color: '#fff' },
  profileUsername: { fontSize: 12, fontFamily: FONTS.regular, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  roleBadge: {
    alignSelf: 'flex-start', marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10, paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
  },
  roleText: { fontSize: 10, fontFamily: FONTS.heavy, color: '#fff', letterSpacing: 1 },

  // Section title
  sectionTitle: {
    fontSize: 11, fontFamily: FONTS.bold,
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: SPACING.xs, marginTop: SPACING.md,
    paddingHorizontal: 4,
  },

  // Group card
  group: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
    marginBottom: 4,
  },
  divider: { height: 1, marginLeft: 56 },

  // Row
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: 13,
    gap: SPACING.sm,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  rowIconText: { fontSize: 18 },
  rowBody: { flex: 1 },
  rowLabel: { fontSize: 14, fontFamily: FONTS.semiBold },
  rowSub: { fontSize: 11, fontFamily: FONTS.regular, marginTop: 1 },
  rowArrow: { fontSize: 20, fontFamily: FONTS.bold, marginLeft: 4 },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md,
    marginTop: SPACING.lg,
    borderWidth: 1.5, gap: SPACING.sm,
  },
  logoutIcon: { fontSize: 18 },
  logoutText: { fontSize: 15, fontFamily: FONTS.bold },
});

export default MoreScreen;
