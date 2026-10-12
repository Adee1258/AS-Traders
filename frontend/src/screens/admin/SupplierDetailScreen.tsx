import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, Modal, TextInput, ScrollView, RefreshControl,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList, Supplier, SupplierTransaction, SupplierTransactionType } from '../../types';
import { suppliersAPI } from '../../services/api';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS, FONTS, SHADOWS } from '../../constants';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';

type Route = RouteProp<AdminStackParamList, 'SupplierDetail'>;

// Transaction type config
const TXN_TYPES: {
  type: SupplierTransactionType;
  label: string;
  icon: string;
  color: string;
  hint: string;
}[] = [
    {
      type: 'PURCHASE',
      label: 'Khareed (Purchase)',
      icon: '🛒',
      color: COLORS.danger,
      hint: 'Maal kharida — balance badha (aap unhe zyada dene lagay)',
    },
    {
      type: 'PAYMENT_SENT',
      label: 'Payment Di (Sent)',
      icon: '💸',
      color: COLORS.success,
      hint: 'Aapne unhe paisa diya — balance ghata',
    },
    {
      type: 'ADJUSTMENT',
      label: 'Adjustment',
      icon: '⚙️',
      color: COLORS.warning,
      hint: 'Manual correction — balance badhta hai',
    },
  ];

type Nav = NativeStackNavigationProp<AdminStackParamList>;

const SupplierDetailScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { supplierId, supplierName } = route.params;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [transactions, setTransactions] = useState<SupplierTransaction[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add transaction modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<SupplierTransactionType>('PURCHASE');
  const [txnAmount, setTxnAmount] = useState('');
  const [txnDescription, setTxnDescription] = useState('');
  const [txnNote, setTxnNote] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [supRes, ledgerRes] = await Promise.all([
        suppliersAPI.getById(supplierId),
        suppliersAPI.getLedger(supplierId),
      ]);
      setSupplier(supRes.data.data);
      const ledger = ledgerRes.data.data;
      // Show newest first
      setTransactions([...(ledger.transactions || [])].reverse());
      setCurrentBalance(ledger.currentBalance ?? 0);
    } catch {
      Alert.alert('Error', 'Data load nahi ho saka');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supplierId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const openModal = () => {
    setSelectedType('PURCHASE');
    setTxnAmount('');
    setTxnDescription('');
    setTxnNote('');
    setModalVisible(true);
  };

  const handleAddTransaction = async () => {
    if (!txnAmount || isNaN(Number(txnAmount)) || Number(txnAmount) <= 0) {
      Alert.alert('Error', 'Valid amount dalen');
      return;
    }
    if (!txnDescription.trim()) {
      Alert.alert('Error', 'Description zaroori hai');
      return;
    }
    setSaving(true);
    try {
      await suppliersAPI.addTransaction(supplierId, {
        type: selectedType,
        amount: Number(txnAmount),
        description: txnDescription.trim(),
        referenceNote: txnNote.trim(),
      });
      setModalVisible(false);
      await loadData();
      Alert.alert('✅ Done', 'Transaction add ho gaya');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Transaction fail ho gaya');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;

  const selectedTypeConfig = TXN_TYPES.find(t => t.type === selectedType)!;

  return (
    <>
      <View style={styles.container}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerName}>{supplier?.name ?? supplierName}</Text>
              {supplier?.ownerName ? (
                <Text style={styles.headerSub}>👤 {supplier.ownerName}</Text>
              ) : null}
              {supplier?.phone ? (
                <Text style={styles.headerSub}>📞 {supplier.phone}</Text>
              ) : null}
              {supplier?.description ? (
                <Text style={styles.headerSub}>📝 {supplier.description}</Text>
              ) : null}
            </View>
            <View style={styles.headerBalance}>
              <Text style={styles.headerBalanceLabel}>🔴 Dena Hai</Text>
              <Text style={[styles.headerBalanceAmount, { color: '#fca5a5' }]}>
                {formatCurrency(Math.abs(currentBalance))}
              </Text>
            </View>
          </View>

          {/* Add Transaction Button */}
          <TouchableOpacity style={styles.addTxnBtn} onPress={openModal} activeOpacity={0.85}>
            <Text style={styles.addTxnText}>+ New Transaction</Text>
          </TouchableOpacity>

          {/* Bills Button */}
          <TouchableOpacity
            style={[styles.addTxnBtn, { marginTop: SPACING.xs, backgroundColor: 'rgba(255,255,255,0.12)' }]}
            onPress={() => navigation.navigate('Bills', {
              partyType: 'supplier',
              partyId: supplierId,
              partyName: supplier?.name ?? supplierName,
            })}
            activeOpacity={0.85}
          >
            <Text style={styles.addTxnText}>🧾 View Bills</Text>
          </TouchableOpacity>
        </View>

        {/* ── Ledger ── */}
        <FlatList
          data={transactions}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
          ListHeaderComponent={
            transactions.length > 0 ? (
              <View style={styles.ledgerHeader}>
                <Text style={styles.ledgerHeaderText}>📒 Ledger ({transactions.length} entries)</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState icon="📒" title="Koi transaction nahi" subtitle="+ New Transaction se shuru karein" />
          }
          renderItem={({ item }) => {
            const cfg = TXN_TYPES.find(t => t.type === item.type);
            const isDebit = item.debit > 0;
            return (
              <View style={styles.txnRow}>
                {/* Left type indicator */}
                <View style={[styles.txnIcon, { backgroundColor: `${cfg?.color ?? COLORS.textMuted}18` }]}>
                  <Text style={styles.txnIconEmoji}>{cfg?.icon ?? '📌'}</Text>
                </View>
                <View style={styles.txnBody}>
                  <Text style={styles.txnDescription}>{item.description}</Text>
                  {item.referenceNote ? (
                    <Text style={styles.txnNote}>📎 {item.referenceNote}</Text>
                  ) : null}
                  <Text style={styles.txnDate}>{formatDateTime(item.createdAt)}</Text>
                </View>
                <View style={styles.txnAmounts}>
                  {item.debit > 0 ? (
                    <Text style={[styles.txnDebit]}>+{formatCurrency(item.debit)}</Text>
                  ) : null}
                  {item.credit > 0 ? (
                    <Text style={[styles.txnCredit]}>-{formatCurrency(item.credit)}</Text>
                  ) : null}
                  <Text style={[
                    styles.txnBalance,
                    { color: item.balanceAfter > 0 ? COLORS.danger : item.balanceAfter < 0 ? COLORS.success : COLORS.textMuted },
                  ]}>
                    {item.balanceAfter > 0 ? 'D: ' : item.balanceAfter < 0 ? 'L: ' : ''}
                    {formatCurrency(Math.abs(item.balanceAfter))}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      </View>

      {/* ══ Add Transaction Modal ════════════════════════════════════════════ */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => { if (!saving) setModalVisible(false); }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>+ New Transaction</Text>
              <TouchableOpacity onPress={() => { if (!saving) setModalVisible(false); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Transaction Type Selector */}
              <Text style={styles.modalLabel}>Transaction Type *</Text>
              <View style={styles.typeGrid}>
                {TXN_TYPES.map(t => (
                  <TouchableOpacity
                    key={t.type}
                    style={[
                      styles.typeBtn,
                      selectedType === t.type && { borderColor: t.color, backgroundColor: `${t.color}12` },
                    ]}
                    onPress={() => setSelectedType(t.type)}
                    disabled={saving}
                  >
                    <Text style={styles.typeBtnIcon}>{t.icon}</Text>
                    <Text style={[
                      styles.typeBtnLabel,
                      selectedType === t.type && { color: t.color, fontFamily: FONTS.bold },
                    ]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Type hint */}
              <View style={[styles.hintBox, { borderColor: selectedTypeConfig.color }]}>
                <Text style={[styles.hintText, { color: selectedTypeConfig.color }]}>
                  {selectedTypeConfig.icon} {selectedTypeConfig.hint}
                </Text>
              </View>

              {/* Amount */}
              <Text style={styles.modalLabel}>Amount (Rs.) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 5000"
                placeholderTextColor={COLORS.textMuted}
                value={txnAmount}
                onChangeText={setTxnAmount}
                keyboardType="numeric"
                editable={!saving}
              />

              {/* Description */}
              <Text style={styles.modalLabel}>Description *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Anda kharida, payment di"
                placeholderTextColor={COLORS.textMuted}
                value={txnDescription}
                onChangeText={setTxnDescription}
                editable={!saving}
              />

              {/* Reference Note */}
              <Text style={styles.modalLabel}>Reference Note (Optional)</Text>
              <TextInput
                style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
                placeholder="e.g. Invoice #123, receipt number"
                placeholderTextColor={COLORS.textMuted}
                value={txnNote}
                onChangeText={setTxnNote}
                multiline
                editable={!saving}
              />

              {/* Preview new balance */}
              {txnAmount && !isNaN(Number(txnAmount)) && Number(txnAmount) > 0 && (
                <View style={styles.previewBox}>
                  <Text style={styles.previewLabel}>Balance Preview</Text>
                  <View style={styles.previewRow}>
                    <Text style={styles.previewItem}>
                      Current: {formatCurrency(Math.abs(currentBalance))}
                    </Text>
                    <Text style={styles.previewArrow}>→</Text>
                    <Text style={styles.previewItem}>
                      {(() => {
                        const amt = Number(txnAmount);
                        let newBal = currentBalance;
                        if (selectedType === 'PURCHASE' || selectedType === 'ADJUSTMENT') {
                          newBal = currentBalance + amt;
                        } else {
                          newBal = currentBalance - amt;
                        }
                        return (
                          <Text style={{ color: newBal > 0 ? COLORS.danger : newBal < 0 ? COLORS.success : COLORS.textMuted, fontFamily: FONTS.heavy }}>
                            {newBal > 0 ? 'Dena: ' : newBal < 0 ? 'Lena: ' : ''}
                            {formatCurrency(Math.abs(newBal))}
                          </Text>
                        );
                      })()}
                    </Text>
                  </View>
                </View>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleAddTransaction}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>✅ Save Transaction</Text>
                )}
              </TouchableOpacity>

              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    backgroundColor: COLORS.supplier,
    padding: SPACING.md,
    paddingTop: SPACING.md,
  },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.md },
  headerName: { fontSize: 18, fontFamily: FONTS.heavy, color: COLORS.white },
  headerSub: { fontSize: 12, fontFamily: FONTS.regular, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  headerBalance: { alignItems: 'flex-end' },
  headerBalanceLabel: { fontSize: 11, fontFamily: FONTS.semiBold, color: 'rgba(255,255,255,0.8)' },
  headerBalanceAmount: { fontSize: 20, fontFamily: FONTS.heavy, color: COLORS.white, marginTop: 2 },

  addTxnBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  addTxnText: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.white },

  // Ledger list
  list: { padding: SPACING.md, paddingBottom: 120 },
  ledgerHeader: {
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  ledgerHeaderText: { fontSize: 12, fontFamily: FONTS.bold, color: COLORS.textSecondary },

  txnRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm, marginBottom: SPACING.xs,
    ...SHADOWS.xs, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  txnIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    marginRight: SPACING.sm,
  },
  txnIconEmoji: { fontSize: 18 },
  txnBody: { flex: 1 },
  txnDescription: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.text },
  txnNote: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 1 },
  txnDate: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 2 },
  txnAmounts: { alignItems: 'flex-end', minWidth: 80 },
  txnDebit: { fontSize: 12, fontFamily: FONTS.bold, color: COLORS.danger },
  txnCredit: { fontSize: 12, fontFamily: FONTS.bold, color: COLORS.success },
  txnBalance: { fontSize: 11, fontFamily: FONTS.semiBold, marginTop: 2 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.md, maxHeight: '94%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.text },
  modalClose: { fontSize: 20, color: COLORS.textMuted, padding: 4 },
  modalLabel: {
    fontSize: 12, fontFamily: FONTS.bold, color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: SPACING.sm, marginTop: SPACING.sm,
  },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  typeBtn: {
    width: '47%', borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.sm,
    alignItems: 'center', backgroundColor: COLORS.surface,
  },
  typeBtnIcon: { fontSize: 22, marginBottom: 4 },
  typeBtnLabel: {
    fontSize: 11, fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary, textAlign: 'center',
  },

  hintBox: {
    borderWidth: 1.5, borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm, marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  hintText: { fontSize: 12, fontFamily: FONTS.regular, lineHeight: 18 },

  input: {
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md,
    fontSize: 14, fontFamily: FONTS.regular, color: COLORS.text,
    backgroundColor: COLORS.surface, marginBottom: SPACING.sm,
    minHeight: 48,
  },

  previewBox: {
    backgroundColor: COLORS.primaryLight, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
  },
  previewLabel: { fontSize: 11, fontFamily: FONTS.bold, color: COLORS.primary, marginBottom: 6 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  previewItem: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.text },
  previewArrow: { fontSize: 16, color: COLORS.primary },

  saveBtn: {
    backgroundColor: COLORS.supplier, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, alignItems: 'center', marginTop: SPACING.sm,
  },
  saveBtnText: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.white },
});

export default SupplierDetailScreen;
