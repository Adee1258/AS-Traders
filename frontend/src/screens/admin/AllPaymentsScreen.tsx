import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, RefreshControl, ScrollView, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdminStackParamList, Payment, Shop } from '../../types';
import { paymentsAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONTS, useColors } from '../../constants';
import DateRangePicker from '../../components/DateRangePicker';
import EmptyState from '../../components/EmptyState';
import LoadingScreen from '../../components/LoadingScreen';

type ViewMode = 'today' | 'history';
type HistoryFilter = '' | 'week' | 'month' | 'custom';

const HISTORY_FILTERS = [
  { label: 'All History', value: '' as HistoryFilter },
  { label: 'This Week', value: 'week' as HistoryFilter },
  { label: 'This Month', value: 'month' as HistoryFilter },
  { label: '📅 Custom', value: 'custom' as HistoryFilter },
];

interface PaymentShopGroup {
  shopId: string;
  shopName: string;
  totalReceived: number;
  payments: Payment[];
}

const AllPaymentsScreen = () => {
  const C = useColors();
  const styles = getStyles(C);
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const loadData = useCallback(async (
    mode: ViewMode = viewMode,
    hFilter: HistoryFilter = historyFilter,
    q: string = search,
    from: string = dateFrom,
    to: string = dateTo,
  ) => {
    try {
      const params: Parameters<typeof paymentsAPI.getAll>[0] = {
        search: q || undefined,
        limit: 200,
      };
      if (mode === 'today') {
        params.filter = 'today';
      } else if (hFilter === 'custom') {
        if (from) params.dateFrom = from;
        if (to) params.dateTo = to;
      } else if (hFilter) {
        params.filter = hFilter;
      }
      const res = await paymentsAPI.getAll(params);
      setPayments(res.data.data || []);
    } catch {
      console.error('Failed to load payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [viewMode, historyFilter, search, dateFrom, dateTo]);

  useEffect(() => {
    loadData();
  }, [viewMode, historyFilter]);

  const handleSearch = (text: string) => {
    setSearch(text);
    loadData(viewMode, historyFilter, text);
  };

  const handleCustomSearch = () => {
    if (!dateFrom && !dateTo) { Alert.alert('Error', 'Kam az kam ek date darj karo'); return; }
    setLoading(true);
    loadData('history', 'custom', search, dateFrom, dateTo);
  };

  // Group today's payments by Shop Name
  const shopGroups = useMemo<PaymentShopGroup[]>(() => {
    if (viewMode !== 'today') return [];

    const map = new Map<string, PaymentShopGroup>();

    payments.forEach((payment) => {
      const shopObj = typeof payment.shopId === 'object' ? (payment.shopId as unknown as Shop) : null;
      const shopName = shopObj?.name || 'Unknown Shop';
      const shopIdKey = shopObj?._id || String(payment.shopId);

      if (!map.has(shopIdKey)) {
        map.set(shopIdKey, {
          shopId: shopIdKey,
          shopName,
          totalReceived: 0,
          payments: [],
        });
      }

      const group = map.get(shopIdKey)!;
      group.payments.push(payment);
      group.totalReceived += payment.amount;
    });

    return Array.from(map.values());
  }, [payments, viewMode]);

  // Overall today's summary
  const todaySummary = useMemo(() => {
    const totalPaymentsCount = payments.length;
    const totalReceivedSum = payments.reduce((acc, p) => acc + p.amount, 0);
    const totalShopsCount = shopGroups.length;
    return { totalPaymentsCount, totalReceivedSum, totalShopsCount };
  }, [payments, shopGroups]);

  if (loading) return <LoadingScreen message="Loading payments..." />;

  return (
    <View style={styles.container}>
      {/* View Mode Tabs */}
      <View style={styles.modeTabBar}>
        <TouchableOpacity
          style={[styles.modeTab, viewMode === 'today' && styles.modeTabActive]}
          onPress={() => { setViewMode('today'); setLoading(true); }}
          activeOpacity={0.8}
        >
          <Text style={[styles.modeTabText, viewMode === 'today' && styles.modeTabTextActive]}>
            ☀️ Today's Payments
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeTab, viewMode === 'history' && styles.modeTabActive]}
          onPress={() => { setViewMode('history'); setLoading(true); }}
          activeOpacity={0.8}
        >
          <Text style={[styles.modeTabText, viewMode === 'history' && styles.modeTabTextActive]}>
            📜 Payment History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.topBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search shop name or notes..."
          placeholderTextColor={C.textMuted}
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {/* TODAY'S DAILY PAYMENTS VIEW */}
      {viewMode === 'today' ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={C.success} />
          }
        >
          {/* Today KPI Card */}
          <View style={styles.todaySummaryCard}>
            <Text style={styles.summaryTitle}>💳 Today's Cash Collection</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{todaySummary.totalShopsCount}</Text>
                <Text style={styles.summaryStatLabel}>Shops Paid</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{todaySummary.totalPaymentsCount}</Text>
                <Text style={styles.summaryStatLabel}>Payments Received</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryStat}>
                <Text style={[styles.summaryStatValue, { color: C.successLight }]}>
                  {formatCurrency(todaySummary.totalReceivedSum)}
                </Text>
                <Text style={styles.summaryStatLabel}>Total Received</Text>
              </View>
            </View>
          </View>

          {shopGroups.length === 0 ? (
            <EmptyState
              icon="💳"
              title="No Payments Collected Today"
              subtitle="Payments collected today from shops will appear here grouped shop-by-shop"
            />
          ) : (
            shopGroups.map((group) => (
              <View key={group.shopId} style={styles.shopGroupContainer}>
                {/* Header */}
                <View style={styles.shopGroupHeader}>
                  <View style={styles.shopHeaderTitleRow}>
                    <Text style={styles.shopHeaderIcon}>🏪</Text>
                    <Text style={styles.shopHeaderName}>{group.shopName}</Text>
                  </View>
                  <View style={styles.shopHeaderBadge}>
                    <Text style={styles.shopHeaderBadgeText}>
                      Received: {formatCurrency(group.totalReceived)}
                    </Text>
                  </View>
                </View>

                {/* Payments */}
                {group.payments.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.paymentCard}
                    onPress={() => navigation.navigate('PaymentDetails', { paymentId: item._id })}
                    activeOpacity={0.75}
                  >
                    <View style={styles.cardRow}>
                      <View style={styles.cardInfo}>
                        <View style={styles.methodTag}>
                          <Text style={styles.methodTagText}>💳 {item.paymentMethod}</Text>
                        </View>
                        {item.notes ? <Text style={styles.notes}>"{item.notes}"</Text> : null}
                        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                      </View>
                      <View style={styles.amountRow}>
                        <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
                        <Text style={styles.tapHint}>✏️</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        /* PAYMENT HISTORY VIEW */
        <View style={{ flex: 1 }}>
          <View style={styles.filterRow}>
            {HISTORY_FILTERS.map((f) => (
              <TouchableOpacity
                key={f.value}
                style={[styles.filterTab, historyFilter === f.value && styles.filterTabActive]}
                onPress={() => { setHistoryFilter(f.value); if (f.value !== 'custom') setLoading(true); }}
              >
                <Text style={[styles.filterText, historyFilter === f.value && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom date range calendar picker */}
          {historyFilter === 'custom' && (
            <DateRangePicker
              dateFrom={dateFrom}
              dateTo={dateTo}
              onChangeDateFrom={setDateFrom}
              onChangeDateTo={setDateTo}
              onSearch={handleCustomSearch}
              accentColor={C.success}
            />
          )}

          {payments.length > 0 && (
            <View style={styles.historyBar}>
              <Text style={styles.historyBarText}>
                {payments.length} payments • {formatCurrency(payments.reduce((s, p) => s + p.amount, 0))}
              </Text>
            </View>
          )}

          <FlatList
            data={payments}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
            }
            ListEmptyComponent={
              <EmptyState icon="💳" title="No Payment History Found" subtitle="No payments match your filter" />
            }
            renderItem={({ item }) => {
              const shopObj = typeof item.shopId === 'object' ? (item.shopId as unknown as Shop) : null;
              return (
                <TouchableOpacity
                  style={styles.historyCard}
                  onPress={() => navigation.navigate('PaymentDetails', { paymentId: item._id })}
                  activeOpacity={0.75}
                >
                  <View style={styles.cardRow}>
                    <View style={styles.cardInfo}>
                      <Text style={styles.historyShopName}>🏪 {shopObj?.name || '—'}</Text>
                      <Text style={styles.historyMethod}>{item.paymentMethod}</Text>
                      {item.notes ? <Text style={styles.notes}>"{item.notes}"</Text> : null}
                      <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <View style={styles.amountRow}>
                      <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
                      <Text style={styles.tapHint}>✏️</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}
    </View>
  );
};

const getStyles = (C: typeof COLORS) => StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  modeTabBar: {
    flexDirection: 'row', backgroundColor: C.white,
    paddingHorizontal: SPACING.sm, paddingTop: SPACING.sm, paddingBottom: 4,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  modeTab: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderRadius: BORDER_RADIUS.md, marginHorizontal: 4,
    backgroundColor: C.surface,
  },
  modeTabActive: { backgroundColor: C.success },
  modeTabText: { fontSize: 13, fontFamily: FONTS.semiBold, color: C.textSecondary },
  modeTabTextActive: { color: C.white, fontFamily: FONTS.bold },

  topBar: {
    padding: SPACING.md, backgroundColor: C.white,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  searchInput: {
    backgroundColor: C.background, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    fontSize: 14, fontFamily: FONTS.medium, color: C.text, borderWidth: 1, borderColor: C.border,
  },

  scrollContent: { padding: SPACING.md, paddingBottom: 120 },

  todaySummaryCard: {
    backgroundColor: C.success,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  summaryTitle: { fontSize: 13, fontFamily: FONTS.bold, color: C.white, marginBottom: SPACING.sm, opacity: 0.9 },
  summaryGrid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingTop: 4 },
  summaryStat: { alignItems: 'center', flex: 1 },
  summaryStatValue: { fontSize: 18, fontFamily: FONTS.heavy, color: C.white },
  summaryStatLabel: { fontSize: 11, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  summaryDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.3)' },

  shopGroupContainer: {
    marginBottom: SPACING.lg,
  },
  shopGroupHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.white,
    paddingHorizontal: SPACING.md, paddingVertical: 12,
    borderTopLeftRadius: BORDER_RADIUS.lg, borderTopRightRadius: BORDER_RADIUS.lg,
    borderWidth: 1, borderColor: C.border,
    borderBottomWidth: 2, borderBottomColor: C.successLight,
  },
  shopHeaderTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  shopHeaderIcon: { fontSize: 18, marginRight: 8 },
  shopHeaderName: { fontSize: 15, fontFamily: FONTS.bold, color: C.text, flex: 1 },
  shopHeaderBadge: {
    backgroundColor: C.successLight, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round, borderWidth: 1, borderColor: 'rgba(5,150,105,0.3)',
  },
  shopHeaderBadgeText: { fontSize: 12, fontFamily: FONTS.bold, color: C.success },

  paymentCard: {
    backgroundColor: C.white,
    padding: SPACING.md,
    borderWidth: 1, borderColor: C.border,
    borderTopWidth: 0,
    borderLeftWidth: 4, borderLeftColor: C.success,
    ...SHADOWS.xs,
  },
  historyCard: {
    backgroundColor: C.white, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderLeftWidth: 4, borderLeftColor: C.success,
    ...SHADOWS.xs, borderWidth: 1, borderColor: C.border,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardInfo: { flex: 1, paddingRight: SPACING.md },
  historyShopName: { fontSize: 14, fontFamily: FONTS.bold, color: C.text, marginBottom: 2 },
  methodTag: {
    alignSelf: 'flex-start', backgroundColor: C.surface,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    marginBottom: 4, borderWidth: 1, borderColor: C.border,
  },
  methodTagText: { fontSize: 11, fontFamily: FONTS.semiBold, color: C.textSecondary },
  historyMethod: { fontSize: 12, fontFamily: FONTS.medium, color: C.textSecondary },
  notes: { fontSize: 12, fontFamily: FONTS.regular, color: C.textMuted, marginTop: 2, fontStyle: 'italic' },
  date: { fontSize: 11, fontFamily: FONTS.regular, color: C.textMuted, marginTop: 4 },
  amount: { fontSize: 16, fontFamily: FONTS.heavy, color: C.success },
  amountRow: { alignItems: 'flex-end' },
  tapHint: { fontSize: 12, marginTop: 4, opacity: 0.5 },

  filterRow: {
    flexDirection: 'row', backgroundColor: C.white,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: C.border,
    gap: SPACING.sm,
  },
  filterTab: {
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: C.border,
  },
  filterTabActive: { backgroundColor: C.success, borderColor: C.success },
  filterText: { fontSize: 12, fontFamily: FONTS.semiBold, color: C.textSecondary },
  filterTextActive: { color: C.white },
  historyBar: {
    backgroundColor: C.successLight, paddingHorizontal: SPACING.md, paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  historyBarText: { fontSize: 12, fontFamily: FONTS.semiBold, color: C.success },
  list: { padding: SPACING.md, paddingBottom: 100 },
});

export default AllPaymentsScreen;
