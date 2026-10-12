import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../types';
import { shopsAPI } from '../../services/api';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../../constants';
import Input from '../../components/Input';
import Button from '../../components/Button';
import KeyboardSafeScrollView from '../../components/KeyboardSafeScrollView';

type Nav = NativeStackNavigationProp<AdminStackParamList>;

const AddShopScreen = () => {
  const navigation = useNavigation<Nav>();
  const [form, setForm] = useState({
    name: '', ownerName: '', phone: '', address: '', openingBalance: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: string, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Shop name is required';
    if (!form.ownerName.trim()) e.ownerName = 'Owner name is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (!form.address.trim()) e.address = 'Address is required';
    if (form.openingBalance && isNaN(Number(form.openingBalance)))
      e.openingBalance = 'Must be a valid number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await shopsAPI.create({
        name: form.name.trim(),
        ownerName: form.ownerName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        openingBalance: form.openingBalance ? Number(form.openingBalance) : 0,
      });
      Alert.alert('Success', 'Shop created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create shop';
      setSubmitError(msg);
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardSafeScrollView>
      <Input label="Shop Name *" placeholder="e.g. Al Madina Store" value={form.name}
        onChangeText={(v) => set('name', v)} error={errors.name} />
      <Input label="Owner Name *" placeholder="e.g. Muhammad Ali" value={form.ownerName}
        onChangeText={(v) => set('ownerName', v)} error={errors.ownerName} />
      <Input label="Phone *" placeholder="e.g. 0300-1234567" value={form.phone}
        onChangeText={(v) => set('phone', v)} error={errors.phone} keyboardType="phone-pad" />
      <Input label="Address *" placeholder="e.g. Main Bazar, Lahore" value={form.address}
        onChangeText={(v) => set('address', v)} error={errors.address} multiline />
      <Input label="Opening Balance (Rs.)" placeholder="0" value={form.openingBalance}
        onChangeText={(v) => set('openingBalance', v)} error={errors.openingBalance}
        keyboardType="numeric" />

      {submitError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Error: {submitError}</Text>
        </View>
      ) : null}

      <Button title="Create Shop" onPress={handleSubmit} loading={loading} style={styles.btn} />
    </KeyboardSafeScrollView>
  );
};

const styles = StyleSheet.create({
  errorBox: {
    backgroundColor: COLORS.dangerLight, borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderLeftWidth: 4, borderLeftColor: COLORS.danger,
  },
  errorText: { color: COLORS.danger, fontFamily: FONTS.semiBold, fontSize: 14 },
  btn: { marginTop: SPACING.md },
});

export default AddShopScreen;
