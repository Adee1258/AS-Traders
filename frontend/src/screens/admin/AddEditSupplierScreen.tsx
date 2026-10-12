import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AdminStackParamList } from '../../types';
import { suppliersAPI } from '../../services/api';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../../constants';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LoadingScreen from '../../components/LoadingScreen';
import KeyboardSafeScrollView from '../../components/KeyboardSafeScrollView';

type EditRoute = RouteProp<AdminStackParamList, 'EditSupplier'>;

const AddEditSupplierScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const isEdit = route.name === 'EditSupplier';
  const supplierId = isEdit ? (route as EditRoute).params.supplierId : null;

  const [form, setForm] = useState({
    name: '',
    ownerName: '',
    phone: '',
    address: '',
    description: '',
    openingBalance: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  useEffect(() => {
    if (!isEdit || !supplierId) return;
    suppliersAPI.getById(supplierId)
      .then(res => {
        const s = res.data.data;
        setForm({
          name: s.name,
          ownerName: s.ownerName || '',
          phone: s.phone || '',
          address: s.address || '',
          description: s.description || '',
          openingBalance: String(s.openingBalance ?? 0),
        });
      })
      .catch(() => {
        Alert.alert('Error', 'Supplier load nahi ho saka');
        navigation.goBack();
      })
      .finally(() => setLoading(false));
  }, [supplierId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Supplier name zaroori hai';
    if (form.openingBalance && isNaN(Number(form.openingBalance)))
      e.openingBalance = 'Valid number dalen';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit && supplierId) {
        await suppliersAPI.update(supplierId, {
          name: form.name.trim(),
          ownerName: form.ownerName.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          description: form.description.trim(),
        });
        Alert.alert('✅ Updated', 'Supplier update ho gaya', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await suppliersAPI.create({
          name: form.name.trim(),
          ownerName: form.ownerName.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          description: form.description.trim(),
          openingBalance: Number(form.openingBalance) || 0,
        });
        Alert.alert('✅ Added', 'Supplier add ho gaya', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Save fail ho gaya');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <KeyboardSafeScrollView>
      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerText}>
          🏭 Supplier = jis se aap maal khareedtay hain — unhe hamesha dena hota hai
        </Text>
      </View>

      <Input
        label="Supplier / Firm Name *"
        placeholder="e.g. Ali Traders, Karachi Wholesale"
        value={form.name}
        onChangeText={v => set('name', v)}
        error={errors.name}
      />
      <Input
        label="Owner Name"
        placeholder="e.g. Muhammad Ali"
        value={form.ownerName}
        onChangeText={v => set('ownerName', v)}
      />
      <Input
        label="Phone Number"
        placeholder="e.g. 0300-1234567"
        value={form.phone}
        onChangeText={v => set('phone', v)}
        keyboardType="phone-pad"
      />
      <Input
        label="Address"
        placeholder="e.g. Main Market, Lahore"
        value={form.address}
        onChangeText={v => set('address', v)}
        multiline
      />
      <Input
        label="Description / Notes"
        placeholder="e.g. Anda supplier, weekly payment"
        value={form.description}
        onChangeText={v => set('description', v)}
        multiline
      />

      {/* Opening balance — only on add */}
      {
        !isEdit && (
          <>
            <View style={styles.divider}>
              <Text style={styles.dividerText}>Opening Balance</Text>
            </View>
            <View style={styles.balanceHint}>
              <Text style={styles.balanceHintText}>
                Supplier ko kitna dena hai abhi? (positive number dalen){'\n'}
                e.g. 10000 = hum unhe 10,000 dete hain
              </Text>
            </View>
            <Input
              label="Opening Balance (Rs.)"
              placeholder="0 ya -5000"
              value={form.openingBalance}
              onChangeText={v => set('openingBalance', v)}
              error={errors.openingBalance}
              keyboardType="numeric"
            />
          </>
        )
      }

      <Button
        title={isEdit ? 'Save Changes' : 'Add Supplier'}
        onPress={handleSave}
        loading={saving}
        style={styles.btn}
      />
    </KeyboardSafeScrollView >
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: 80 },

  infoBanner: {
    backgroundColor: COLORS.supplierLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.supplier,
  },
  infoBannerText: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.supplierDark },

  divider: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    marginTop: SPACING.xs,
  },
  dividerText: { fontSize: 13, fontFamily: FONTS.bold, color: COLORS.primary },

  balanceHint: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  balanceHintText: {
    fontSize: 12, fontFamily: FONTS.regular,
    color: COLORS.textSecondary, lineHeight: 20,
  },

  btn: { marginTop: SPACING.md },
});

export default AddEditSupplierScreen;
