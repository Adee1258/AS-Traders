import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TextInput,
} from 'react-native';
import { ShopBalance } from '../../types';
import { shopsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../../constants';
import EmptyState from '../../components/EmptyState';
import LoadingScreen from '../../components/LoadingScreen';

const AllBalancesScreen = () => {
  const [shops, setShops] = useState<ShopBalance[]>([]);
  const [filtered, setFiltered] = useState<ShopBalance[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await shopsAPI.getAllBalances();
      const data = res.data.data;
      setShops(data.shops || []);
      setFiltered(data.shops || []);
      setTotalOutstanding(data.totalOutstanding || 0);
    } catch {
      console.error('Failed to load balances');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) return setFiltered(shops);
    setFiltered(
      shops.filter(
        (s) =>
          s.shopName.toLowerCase().includes(text.toLowerCase()) ||
          s.ownerName.toLowerCase().includes(text.toLowerCase())
      )
    );
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {/* Total Outstanding Header */}
      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Total Outstanding Balance</Text>
        <Text style={styles.totalAmount}>{formatCurrency(totalOutstanding)}</Text>
        <Text style={styles.totalCount}>{shops.length} shops</Text>
      </View>

      {/* Search */}
      <View style={styles.toolbar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by shop or owner..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.shopId}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={<EmptyState icon="⚖️" title="No shops found" />}
        renderItem={({ item }) => <ShopBalanceRow item={item} />}
      />
    </View>
  );
};

const ShopBalanceRow = ({ item }: { item: ShopBalance }) => (
  <View style={styles.balanceCard}>
    <View style={styles.shopInfo}>
      <Text style={styles.shopName}>{item.shopName}</Text>
      <Text style={styles.ownerName}>👤 {item.ownerName}</Text>
      <Text style={styles.phone}>📞 {item.phone}</Text>
    </View>
    <View style={styles.balanceInfo}>
      <Text style={styles.balanceLabel}>Balance</Text>
      <Text
        style={[
          styles.balance,
          { color: item.currentBalance > 0 ? COLORS.danger : COLORS.success },
        ]}
      >
        {formatCurrency(item.currentBalance)}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  totalBox: { backgroundColor: COLORS.primary, padding: SPACING.lg, alignItems: 'center' },
  totalLabel: {
    fontSize: 12, color: 'rgba(255,255,255,0.8)',
    fontFamily: FONTS.semiBold, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  totalAmount: { fontSize: 28, fontFamily: FONTS.heavy, color: COLORS.white, marginTop: 4 },
  totalCount: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  toolbar: {
    padding: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  searchInput: {
    backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 9,
    fontSize: 14, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border,
  },

  list: { padding: SPACING.md, paddingBottom: 100 },

  balanceCard: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.xs,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  shopInfo: { flex: 1 },
  shopName: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.text },
  ownerName: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  phone: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  balanceInfo: { alignItems: 'flex-end' },
  balanceLabel: { fontSize: 10, color: COLORS.textSecondary, fontFamily: FONTS.semiBold, textTransform: 'uppercase' },
  balance: { fontSize: 15, fontFamily: FONTS.heavy, marginTop: 2 },
});

export default AllBalancesScreen;
