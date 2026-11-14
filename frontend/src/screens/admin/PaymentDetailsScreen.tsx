import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList, Payment, Shop } from '../../types';
import { paymentsAPI } from '../../services/api';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { COLORS, useColors, SPACING, BORDER_RADIUS } from '../../constants';
import Card from '../../components/Card';

type Route = RouteProp<AdminStackParamList, 'PaymentDetails'>;
type Nav = NativeStackNavigationProp<AdminStackParamList>;

const PaymentDetailsScreen = () => {
  const C = useColors();
  const styles = getStyles(C);
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { paymentId } = route.params;
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentsAPI.getById(paymentId)
      .then((res) => { setPayment(res.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [paymentId]);

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color={C.primary} /></View>
  );
  if (!payment) return (
    <View style={styles.center}><Text>Payment not found</Text></View>
  );

  const shop = typeof payment.shopId === 'object' ? payment.shopId as unknown as Shop : null;

  const handleEdit = () => {
    navigation.navigate('EditPayment', {
      paymentId: payment._id,
      shopName: shop?.name ?? 'Shop',
      currentAmount: payment.amount,
      currentMethod: payment.paymentMethod,
      currentNotes: payment.notes ?? '',
    });
  };

  const rows = [
    { label: 'Shop', value: shop?.name || '—' },
    { label: 'Payment Method', value: payment.paymentMethod },
    { label: 'Date', value: formatDateTime(payment.createdAt) },
    ...(payment.notes ? [{ label: 'Notes', value: payment.notes }] : []),
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Amount Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>Payment Amount</Text>
        <Text style={styles.bannerAmount}>{formatCurrency(payment.amount)}</Text>
      </View>

      <Card style={styles.detailCard}>
        {rows.map((row, idx) => (
          <View key={idx} style={[styles.row, idx < rows.length - 1 && styles.rowBorder]}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value}>{row.value}</Text>
          </View>
        ))}
      </Card>

      {/* Edit Button */}
      <TouchableOpacity style={styles.editBtn} onPress={handleEdit} activeOpacity={0.85}>
        <Text style={styles.editBtnText}>✏️  Edit Payment</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const getStyles = (C: typeof COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: SPACING.md, paddingBottom: 80 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  banner: {
    backgroundColor: C.success, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg, alignItems: 'center', marginBottom: SPACING.md,
  },
  bannerLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textTransform: 'uppercase' },
  bannerAmount: { fontSize: 30, fontWeight: '800', color: C.white, marginTop: 4 },
  detailCard: { padding: 0, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  label: { fontSize: 13, color: C.textSecondary },
  value: { fontSize: 13, color: C.text, fontWeight: '600', flex: 1, textAlign: 'right' },
  editBtn: {
    marginTop: SPACING.md,
    backgroundColor: C.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  editBtnText: { fontSize: 15, color: C.white, fontWeight: '700' },
});

export default PaymentDetailsScreen;
