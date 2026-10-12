import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList, Product } from '../../types';
import { productsAPI } from '../../services/api';
import { formatCurrency } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS, FONTS, SHADOWS } from '../../constants';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import LoadingScreen from '../../components/LoadingScreen';

type Nav = NativeStackNavigationProp<AdminStackParamList>;

const ProductsScreen = () => {
  const navigation = useNavigation<Nav>();
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async (q?: string) => {
    try {
      const res = await productsAPI.getAll();
      const all: Product[] = res.data.data || [];
      setProducts(all);
      applyFilter(all, q ?? search);
    } catch {
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const applyFilter = (all: Product[], q: string) => {
    if (!q.trim()) return setFiltered(all);
    setFiltered(
      all.filter(p =>
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.unit.toLowerCase().includes(q.toLowerCase())
      )
    );
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    applyFilter(products, text);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>

      {/* ── Top bar: search + Add button ── */}
      <View style={styles.topBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddProduct')}
          activeOpacity={0.85}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* ── Count badge ── */}
      <View style={styles.countBar}>
        <Text style={styles.countText}>
          {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          {search ? ` — "${search}"` : ''}
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="🛒"
            title={search ? 'Koi product nahi mila' : 'Koi product nahi'}
            subtitle={search ? 'Search clear karein ya naya product add karein' : '+ Add button se pehla product add karein'}
          />
        }
        renderItem={({ item }) => (
          <Card style={styles.productCard}>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text style={styles.productName}>{item.name}</Text>
                <View style={styles.metaRow}>
                  <View style={styles.unitTag}>
                    <Text style={styles.unitTagText}>{item.unit}</Text>
                  </View>
                  <View style={[
                    styles.badge,
                    { backgroundColor: item.status === 'active' ? COLORS.successLight : COLORS.dangerLight },
                  ]}>
                    <Text style={[
                      styles.badgeText,
                      { color: item.status === 'active' ? COLORS.success : COLORS.danger },
                    ]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Cost:</Text>
                  <Text style={styles.costPrice}>{formatCurrency(item.costPrice ?? 0)}</Text>
                  <Text style={styles.priceSep}>→</Text>
                  <Text style={styles.priceLabel}>Sell:</Text>
                  <Text style={styles.sellPrice}>{formatCurrency(item.defaultRate)}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate('EditProduct', { productId: item._id })}
              >
                <Text style={styles.editText}>✏️</Text>
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

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.md, gap: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    fontSize: 14, fontFamily: FONTS.regular, color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border,
    minHeight: 44,
  },
  addBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    minHeight: 44, justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.sm,
  },
  addBtnText: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.white },

  countBar: {
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  countText: { fontSize: 11, fontFamily: FONTS.semiBold, color: COLORS.textMuted },

  list: { padding: SPACING.md, paddingBottom: 120 },

  productCard: { padding: SPACING.md, marginBottom: SPACING.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  info: { flex: 1, paddingRight: SPACING.sm },
  productName: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: 4 },

  metaRow: { flexDirection: 'row', gap: SPACING.xs, marginBottom: 6, alignItems: 'center' },
  unitTag: {
    backgroundColor: COLORS.primaryLight, borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  unitTagText: { fontSize: 11, fontFamily: FONTS.bold, color: COLORS.primary },
  badge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
  },
  badgeText: { fontSize: 11, fontFamily: FONTS.semiBold, textTransform: 'capitalize' },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priceLabel: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textMuted },
  costPrice: { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },
  priceSep: { fontSize: 11, color: COLORS.textMuted },
  sellPrice: { fontSize: 13, fontFamily: FONTS.heavy, color: COLORS.primary },

  editBtn: {
    width: 36, height: 36, borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
  },
  editText: { fontSize: 16 },
});

export default ProductsScreen;
