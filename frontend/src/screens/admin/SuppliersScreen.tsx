import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList, Supplier } from '../../types';
import { suppliersAPI } from '../../services/api';
import { formatCurrency } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS, FONTS, SHADOWS } from '../../constants';
import EmptyState from '../../components/EmptyState';
import LoadingScreen from '../../components/LoadingScreen';
import Button from '../../components/Button';

type Nav = NativeStackNavigationProp<AdminStackParamList>;

const SuppliersScreen = () => {
  const navigation = useNavigation<Nav>();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [totalPayable, setTotalPayable] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async (q?: string) => {
    try {
      const res = await suppliersAPI.getAll(q);
      setSuppliers(res.data.data || []);
      setTotalPayable(res.data.meta?.totalPayable ?? 0);
    } catch {
      Alert.alert('Error', 'Suppliers load nahi ho sake');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(search); }, []));

  const onRefresh = () => { setRefreshing(true); loadData(search); };
  const handleSearch = (text: string) => {
    setSearch(text);
    if (text.length === 0 || text.length >= 2) loadData(text);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      '⚠️ Delete Supplier',
      `"${name}" ko delete karna chahte hain?\nIs supplier ki saari transactions bhi delete ho jayengi.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            setDeletingId(id);
            try {
              await suppliersAPI.delete(id);
              setSuppliers(prev => prev.filter(s => s._id !== id));
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Delete fail ho gaya');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {/* Summary Header */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderLeftColor: COLORS.danger }]}>
          <Text style={styles.summaryLabel}>🔴 Total Dena Hai</Text>
          <Text style={[styles.summaryAmount, { color: COLORS.danger }]}>
            {formatCurrency(totalPayable)}
          </Text>
          <Text style={styles.summaryHint}>Suppliers ko dene wala total</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search suppliers..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
      </View>

      <FlatList
        data={suppliers}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="🏭"
            title="Koi supplier nahi"
            subtitle="+ Add Supplier se naya supplier add karein"
          />
        }
        ListFooterComponent={
          <Button
            title="+ Add Supplier"
            onPress={() => navigation.navigate('AddSupplier')}
            style={styles.addBtn}
          />
        }
        renderItem={({ item }) => {
          const bal = item.currentBalance ?? 0;
          const isPayable = bal > 0;
          const isReceivable = bal < 0;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('SupplierDetail', {
                supplierId: item._id,
                supplierName: item.name,
              })}
              activeOpacity={0.75}
            >
              {/* Left accent bar */}
              <View style={[
                styles.accentBar,
                { backgroundColor: isPayable ? COLORS.danger : isReceivable ? COLORS.success : COLORS.textMuted },
              ]} />

              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{item.name} →</Text>
                    {item.ownerName ? (
                      <Text style={styles.cardSub}>👤 {item.ownerName}</Text>
                    ) : null}
                    {item.phone ? (
                      <Text style={styles.cardSub}>📞 {item.phone}</Text>
                    ) : null}
                  </View>
                  <View style={styles.balanceBox}>
                    <Text style={styles.balanceLabel}>Dena Hai</Text>
                    <Text style={[styles.balanceAmount, { color: COLORS.danger }]}>
                      {formatCurrency(Math.abs(bal))}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => navigation.navigate('EditSupplier', { supplierId: item._id })}
                  >
                    <Text style={styles.editText}>✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item._id, item.name)}
                    disabled={deletingId === item._id}
                  >
                    <Text style={styles.deleteText}>
                      {deletingId === item._id ? '...' : '🗑️ Delete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  summaryRow: {
    flexDirection: 'row', gap: SPACING.sm,
    padding: SPACING.md, paddingBottom: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  summaryCard: {
    flex: 1, backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md,
    borderLeftWidth: 4, ...SHADOWS.xs,
  },
  summaryLabel: { fontSize: 12, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: 4 },
  summaryAmount: { fontSize: 18, fontFamily: FONTS.heavy },
  summaryHint: { fontSize: 10, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 2 },

  searchBar: {
    padding: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  searchInput: {
    backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm, paddingHorizontal: SPACING.md,
    fontSize: 14, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border, minHeight: 44,
    fontFamily: FONTS.regular,
  },

  list: { padding: SPACING.md, paddingBottom: 120 },

  card: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.sm,
    overflow: 'hidden', ...SHADOWS.sm,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  accentBar: { width: 4 },
  cardBody: { flex: 1, padding: SPACING.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.text },
  cardSub: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginTop: 2 },

  balanceBox: { alignItems: 'flex-end', justifyContent: 'center', marginLeft: SPACING.sm },
  balanceLabel: { fontSize: 10, fontFamily: FONTS.semiBold, color: COLORS.textMuted, textTransform: 'uppercase' },
  balanceAmount: { fontSize: 15, fontFamily: FONTS.heavy, marginTop: 2 },

  cardActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  editBtn: {
    flex: 1, paddingVertical: 7, alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  editText: { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },
  deleteBtn: {
    flex: 1, paddingVertical: 7, alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm, borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.3)', backgroundColor: COLORS.dangerLight,
  },
  deleteText: { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.danger },
  addBtn: { marginTop: SPACING.md },
});

export default SuppliersScreen;
