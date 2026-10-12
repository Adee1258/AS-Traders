import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AdminStackParamList } from '../../types';
import { shopsAPI } from '../../services/api';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../../constants';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LoadingScreen from '../../components/LoadingScreen';
import KeyboardSafeScrollView from '../../components/KeyboardSafeScrollView';

type Route = RouteProp<AdminStackParamList, 'EditShop'>;

const EditShopScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { shopId } = route.params;

  const [form, setForm] = useState({ name: '', ownerName: '', phone: '', address: '' });
  const [loginInfo, setLoginInfo] = useState({ username: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));
  const setLogin = (key: string, val: string) => setLoginInfo((f) => ({ ...f, [key]: val }));

  useEffect(() => {
    shopsAPI.getById(shopId)
      .then((shopRes) => {
        const s = shopRes.data.data;
        setForm({ name: s.name, ownerName: s.ownerName, phone: s.phone, address: s.address });
        setLoginInfo((f) => ({ ...f, username: s.username || '' }));
      })
      .catch(() => {
        Alert.alert('Error', 'Failed to load shop');
        navigation.goBack();
      })
      .finally(() => setLoading(false));
  }, [shopId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Shop name is required';
    if (!form.ownerName.trim()) e.ownerName = 'Owner name is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (!form.address.trim()) e.address = 'Address is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await shopsAPI.update(shopId, form);
      Alert.alert('Success', 'Shop info updated successfully');
    } catch {
      Alert.alert('Error', 'Failed to update shop');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!loginInfo.newPassword) { Alert.alert('Error', 'Enter new password'); return; }
    if (loginInfo.newPassword.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
    if (loginInfo.newPassword !== loginInfo.confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }

    setSavingPassword(true);
    try {
      await shopsAPI.updatePassword(shopId, loginInfo.newPassword);
      Alert.alert('Success', 'Password updated successfully');
      setLoginInfo((f) => ({ ...f, newPassword: '', confirmPassword: '' }));
    } catch {
      Alert.alert('Error', 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <KeyboardSafeScrollView>
      {/* Shop Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shop Information</Text>
        <Input label="Shop Name *" value={form.name} onChangeText={(v) => set('name', v)} error={errors.name} />
        <Input label="Owner Name *" value={form.ownerName} onChangeText={(v) => set('ownerName', v)} error={errors.ownerName} />
        <Input label="Phone *" value={form.phone} onChangeText={(v) => set('phone', v)} error={errors.phone} keyboardType="phone-pad" />
        <Input label="Address *" value={form.address} onChangeText={(v) => set('address', v)} error={errors.address} multiline />
        <Button title="Save Shop Info" onPress={handleSave} loading={saving} />
      </View>

      {/* Login Credentials Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Login Credentials</Text>
        <View style={styles.usernameBox}>
          <Text style={styles.usernameLabel}>Current Username</Text>
          <Text style={styles.usernameValue}>{loginInfo.username || 'Loading...'}</Text>
        </View>
        <Input
          label="New Password"
          placeholder="Enter new password (min 6 chars)"
          value={loginInfo.newPassword}
          onChangeText={(v) => setLogin('newPassword', v)}
          isPassword
        />
        <Input
          label="Confirm New Password"
          placeholder="Re-enter new password"
          value={loginInfo.confirmPassword}
          onChangeText={(v) => setLogin('confirmPassword', v)}
          isPassword
        />
        <Button title="Update Password" onPress={handlePasswordChange} loading={savingPassword} variant="secondary" />
      </View>

    </KeyboardSafeScrollView >
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: 80 },
  section: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  sectionTitle: {
    fontSize: 15, fontFamily: FONTS.bold, color: COLORS.text,
    marginBottom: SPACING.xs, paddingBottom: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  usernameBox: {
    backgroundColor: COLORS.primaryLight, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  usernameLabel: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.primary },
  usernameValue: { fontSize: 14, fontFamily: FONTS.heavy, color: COLORS.primary },
});

export default EditShopScreen;
