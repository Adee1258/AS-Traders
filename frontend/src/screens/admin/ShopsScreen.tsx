import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList, Shop } from '../../types';
import { shopsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '../../constants';
import Card from '../../components/Card';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import LoadingScreen from '../../components/LoadingScreen';

type Nav = NativeStackNavigationProp<AdminStackParamList>;

const ShopsScreen = () => {
  const navigation = useNavigation<Nav>();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async (q?: string) => {
    try {
      const shopsRes = await shopsAPI.getAll(q);
      setShops(shopsRes.data.data || []);
    } catch {
      Alert.alert('Error', 'Failed to load shops');
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

  const handleDelete = (shopId: string, shopName: string) => {
    Alert.alert(
      '⚠️ Delete Shop',
      `"${shopName}" ko delete karna chahte hain?\n\nIs shop ki sari orders, payments aur ledger entries bhi delete ho jayengi.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(shopId);
            try {
              await shopsAPI.delete(shopId);
              setShops((prev) => prev.filter((s) => s._id !== shopId));
            } catch (err: unknown) {
              const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Failed to delete shop';
              Alert.alert('Error ❌', msg);
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
      {/* Search */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search shops..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
      </View>

      <FlatList
        data={shops}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState
            icon="🏪"
            title="No shops found"
            subtitle="Add your first shop to get started"
          />
        }
        ListFooterComponent={
          <Button
            title="+ Add New Shop"
            onPress={() => navigation.navigate('AddShop')}
            style={styles.addBtn}
          />
        }
        renderItem={({ item }) => (
          <Card style={styles.shopCard}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ShopProfile', { shopId: item._id, shopName: item.name })
              }
              activeOpacity={0.7}
            >
              <View style={styles.shopRow}>
                <View style={styles.shopInfo}>
                  <Text style={styles.shopName}>{item.name} →</Text>
                  <Text style={styles.ownerName}>👤 {item.ownerName}</Text>
                  <Text style={styles.phone}>📞 {item.phone}</Text>
                </View>
                <View style={styles.balanceBox}>
                  <Text style={styles.balanceLabel}>Balance</Text>
                  <Text style={styles.balance}>{formatCurrency(item.currentBalance ?? 0)}</Text>
                </View>
              </View>
            </TouchableOpacity>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate('EditShop', { shopId: item._id })}
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
          </Card>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBar: {
    padding: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  searchInput: {
    backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm, paddingHorizontal: SPACING.md,
    fontSize: 14, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border, minHeight: 44,
  },
  list: { padding: SPACING.md, paddingBottom: 100 },
  shopCard: { padding: SPACING.md },
  shopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  shopInfo: { flex: 1 },
  shopName: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.text },
  ownerName: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  phone: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  balanceBox: { alignItems: 'flex-end', justifyContent: 'center' },
  balanceLabel: { fontSize: 11, color: COLORS.textSecondary, fontFamily: FONTS.semiBold },
  balance: { fontSize: 14, fontFamily: FONTS.heavy, color: COLORS.primary, marginTop: 2 },
  editBtn: {
    flex: 1,
    paddingVertical: 7, alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  editText: { fontSize: 12, color: COLORS.textSecondary, fontFamily: FONTS.semiBold },
  cardActions: {
    flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm,
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 7, alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm, borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.3)',
    backgroundColor: COLORS.dangerLight,
  },
  deleteText: { fontSize: 12, color: COLORS.danger, fontFamily: FONTS.semiBold },
  addBtn: { marginTop: SPACING.md },
});

export default ShopsScreen;
