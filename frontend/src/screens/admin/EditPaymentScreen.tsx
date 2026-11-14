import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../types';
import { paymentsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/format';
import { COLORS, useColors, SPACING, BORDER_RADIUS } from '../../constants';
import Input from '../../components/Input';
import Button from '../../components/Button';
import KeyboardSafeScrollView from '../../components/KeyboardSafeScrollView';

type Route = RouteProp<AdminStackParamList, 'EditPayment'>;
type Nav = NativeStackNavigationProp<AdminStackParamList>;

const METHODS = ['Cash', 'Bank Transfer', 'Other'];

const EditPaymentScreen = () => {
  const C = useColors();
  const styles = getStyles(C);
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { paymentId, shopName, currentAmount, currentMethod, currentNotes } = route.params;

  const [amount, setAmount] = useState(String(currentAmount));
  const [method, setMethod] = useState(currentMethod);
  const [notes, setNotes] = useState(currentNotes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!amount) e.amount = 'Amount is required';
    else if (isNaN(Number(amount)) || Number(amount) <= 0) e.amount = 'Enter a valid positive amount';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    Alert.alert(
      'Confirm Edit',
      `Shop: ${shopName}\nNew Amount: ${formatCurrency(Number(amount))}\nMethod: ${method}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update Payment',
          onPress: async () => {
            setLoading(true);
            try {
              await paymentsAPI.update(paymentId, {
                amount: Number(amount),
                paymentMethod: method,
                notes: notes.trim(),
              });
              Alert.alert('Payment Updated', 'Payment successfully updated.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err: unknown) {
              const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Failed to update payment';
              Alert.alert('Error', msg);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <KeyboardSafeScrollView>
      {/* Shop info banner */}
      <View style={styles.balanceBox}>
        <Text style={styles.shopName}>{shopName}</Text>
        <Text style={styles.balanceLabel}>Editing Payment</Text>
        <Text style={styles.balance}>{formatCurrency(currentAmount)}</Text>
      </View>

      <Input
        label="Payment Amount (Rs.) *"
        placeholder="e.g. 20000"
        value={amount}
        onChangeText={setAmount}
        error={errors.amount}
        keyboardType="numeric"
      />

      {/* Show diff if amount changed */}
      {amount && !errors.amount && Number(amount) !== currentAmount && (
        <View style={styles.previewRow}>
          <View style={styles.previewItem}>
            <Text style={styles.previewLabel}>Original</Text>
            <Text style={styles.previewVal}>{formatCurrency(currentAmount)}</Text>
          </View>
          <Text style={styles.arrow}>{'→'}</Text>
          <View style={styles.previewItem}>
            <Text style={styles.previewLabel}>New Amount</Text>
            <Text style={[styles.previewVal, { color: C.primary }]}>
              {formatCurrency(Number(amount))}
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.label}>Payment Method *</Text>
      <View style={styles.methodRow}>
        {METHODS.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.methodBtn, method === m && styles.methodBtnActive]}
            onPress={() => setMethod(m)}
          >
            <Text style={[styles.methodText, method === m && styles.methodTextActive]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input
        label="Notes (optional)"
        placeholder="e.g. Cash received from owner"
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <Button title="Update Payment" onPress={handleSave} loading={loading} style={styles.btn} />
    </KeyboardSafeScrollView>
  );
};

const getStyles = (C: typeof COLORS) => StyleSheet.create({
  balanceBox: {
    backgroundColor: C.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: C.primary,
  },
  shopName: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 4 },
  balanceLabel: { fontSize: 11, color: C.primary, fontWeight: '600', textTransform: 'uppercase' },
  balance: { fontSize: 24, fontWeight: '800', color: C.primary, marginTop: 2 },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: C.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: C.border,
  },
  previewItem: { alignItems: 'center' },
  previewLabel: { fontSize: 11, color: C.textSecondary, fontWeight: '500' },
  previewVal: { fontSize: 14, fontWeight: '700', color: C.text, marginTop: 2 },
  arrow: { fontSize: 18, color: C.textMuted },
  label: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 8 },
  methodRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  methodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.white,
    alignItems: 'center',
  },
  methodBtnActive: { borderColor: C.primary, backgroundColor: C.primaryLight },
  methodText: { fontSize: 13, color: C.textSecondary, fontWeight: '500' },
  methodTextActive: { color: C.primary, fontWeight: '700' },
  btn: { marginTop: SPACING.sm },
});

export default EditPaymentScreen;
