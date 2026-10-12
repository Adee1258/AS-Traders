import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AdminStackParamList } from '../../types';
import { productsAPI } from '../../services/api';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';
import Input from '../../components/Input';
import Button from '../../components/Button';
import LoadingScreen from '../../components/LoadingScreen';
import KeyboardSafeScrollView from '../../components/KeyboardSafeScrollView';

type Route = RouteProp<AdminStackParamList, 'EditProduct'>;
const UNITS = ['KG', 'Packet', 'Bag', 'Box', 'Piece'];

const EditProductScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { productId } = route.params;

  const [form, setForm] = useState({
    name: '', unit: 'KG', defaultRate: '', costPrice: '', status: 'active',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  useEffect(() => {
    productsAPI.getById(productId).then((res) => {
      const p = res.data.data;
      setForm({
        name: p.name,
        unit: p.unit,
        defaultRate: String(p.defaultRate),
        costPrice: String(p.costPrice ?? 0),
        status: p.status,
      });
      setLoading(false);
    }).catch(() => {
      Alert.alert('Error', 'Failed to load product');
      navigation.goBack();
    });
  }, [productId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.defaultRate || isNaN(Number(form.defaultRate)) || Number(form.defaultRate) <= 0)
      e.defaultRate = 'Valid selling rate required';
    if (form.costPrice === '' || isNaN(Number(form.costPrice)) || Number(form.costPrice) < 0)
      e.costPrice = 'Valid cost price required (can be 0)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await productsAPI.update(productId, {
        name: form.name.trim(),
        unit: form.unit,
        defaultRate: Number(form.defaultRate),
        costPrice: Number(form.costPrice),
        status: form.status,
      });
      Alert.alert('Success', 'Product updated', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch {
      Alert.alert('Error', 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const profit = Number(form.defaultRate) - Number(form.costPrice);
  const margin = Number(form.defaultRate) > 0
    ? (profit / Number(form.defaultRate)) * 100
    : 0;
  const showPreview = Number(form.defaultRate) > 0 && !isNaN(profit);

  if (loading) return <LoadingScreen />;

  return (
    <KeyboardSafeScrollView>
      <Input label="Product Name *" value={form.name}
        onChangeText={(v) => set('name', v)} error={errors.name} />

      <Text style={styles.label}>Unit *</Text>
      <View style={styles.unitGrid}>
        {UNITS.map((u) => (
          <TouchableOpacity
            key={u} style={[styles.unitBtn, form.unit === u && styles.unitActive]}
            onPress={() => set('unit', u)}
          >
            <Text style={[styles.unitText, form.unit === u && styles.unitTextActive]}>{u}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input
        label="Cost Price (Rs.) *"
        placeholder="Aapka khareed ka daam"
        value={form.costPrice}
        onChangeText={(v) => set('costPrice', v)}
        error={errors.costPrice}
        keyboardType="numeric"
      />

      <Input
        label="Selling Rate (Rs.) *"
        placeholder="Shop ko bechne ka daam"
        value={form.defaultRate}
        onChangeText={(v) => set('defaultRate', v)}
        error={errors.defaultRate}
        keyboardType="numeric"
      />

      {/* Live profit preview */}
      {
        showPreview && (
          <View style={[
            styles.previewBox,
            { borderColor: profit >= 0 ? COLORS.success : COLORS.danger },
          ]}>
            <Text style={styles.previewTitle}>Per Unit Preview</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Profit per unit</Text>
              <Text style={[styles.previewValue, { color: profit >= 0 ? COLORS.success : COLORS.danger }]}>
                Rs. {profit.toFixed(0)}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Margin</Text>
              <Text style={[styles.previewValue, { color: profit >= 0 ? COLORS.success : COLORS.danger }]}>
                {margin.toFixed(1)}%
              </Text>
            </View>
          </View>
        )
      }

      <Text style={styles.label}>Status</Text>
      <View style={styles.unitGrid}>
        {['active', 'inactive'].map((s) => (
          <TouchableOpacity
            key={s} style={[styles.unitBtn, form.status === s && styles.unitActive]}
            onPress={() => set('status', s)}
          >
            <Text style={[styles.unitText, form.status === s && styles.unitTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button title="Save Changes" onPress={handleSave} loading={saving} style={styles.btn} />
    </KeyboardSafeScrollView >
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: 80 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  unitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  unitBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white,
  },
  unitActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  unitText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  unitTextActive: { color: COLORS.primary, fontWeight: '700' },
  previewBox: {
    borderWidth: 1.5, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  previewTitle: {
    fontSize: 12, fontWeight: '700', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.sm,
  },
  previewRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 3,
  },
  previewLabel: { fontSize: 13, color: COLORS.textSecondary },
  previewValue: { fontSize: 15, fontWeight: '700' },
  btn: { marginTop: SPACING.md },
});

export default EditProductScreen;
