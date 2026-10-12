import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProfitLossReport, ProductProfitBreakdown } from '../../types';
import { profitLossAPI } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS, FONTS, SHADOWS } from '../../constants';

type FilterKey = 'today' | 'week' | 'month';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

const ProfitLossScreen = () => {
  const [report, setReport] = useState<ProfitLossReport | null>(null);
  const [filter, setFilter] = useState<FilterKey>('month');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReport = useCallback(async (f: FilterKey = filter) => {
    try {
      const res = await profitLossAPI.getReport({ filter: f });
      setReport(res.data.data);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadReport(filter);
  }, [filter]));

  const handleFilter = (f: FilterKey) => {
    setFilter(f);
    setLoading(true);
    loadReport(f);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReport(filter);
  };

  const isProfit = (report?.netProfit ?? 0) >= 0;
  const isGrossProfit = (report?.grossProfit ?? 0) >= 0;

  return (
    <View style={styles.container}>
      {/* Header gradient */}
      <LinearGradient
        colors={isProfit ? COLORS.gradientSuccess as [string, string] : ['#DC2626', '#B91C1C']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerLabel}>Net Profit / Loss</Text>
        {loading ? (
          <ActivityIndicator color={COLORS.white} size="large" style={{ marginVertical: 8 }} />
        ) : (
          <>
            <Text style={styles.headerAmount}>
              {formatCurrency(report?.netProfit ?? 0)}
            </Text>
            <Text style={styles.headerSub}>
              {isProfit ? '📈 Profitable' : '📉 Loss'} • Margin: {report?.netMargin?.toFixed(1) ?? 0}%
            </Text>
            {report && (
              <Text style={styles.headerDate}>
                {formatDate(report.since)} — {formatDate(report.until)}
              </Text>
            )}
          </>
        )}
      </LinearGradient>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => handleFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
        ) : !report ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>No data for this period</Text>
          </View>
        ) : (
          <>
            {/* ── Summary Cards ── */}
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.cardGrid}>
              <SummaryCard
                label="Total Revenue"
                value={formatCurrency(report.totalRevenue)}
                sub={`${report.totalOrders} orders`}
                color={COLORS.primary}
                icon="💰"
              />
              <SummaryCard
                label="Total COGS"
                value={formatCurrency(report.totalCOGS)}
                sub="Cost of goods sold"
                color={COLORS.warning}
                icon="📦"
              />
              <SummaryCard
                label="Gross Profit"
                value={formatCurrency(report.grossProfit)}
                sub={`Margin: ${report.grossMargin.toFixed(1)}%`}
                color={isGrossProfit ? COLORS.success : COLORS.danger}
                icon={isGrossProfit ? '✅' : '⚠️'}
              />
              <SummaryCard
                label="Expenses"
                value={formatCurrency(report.totalExpenses)}
                sub="Petrol, salary etc."
                color={COLORS.danger}
                icon="💸"
              />
            </View>

            {/* ── Net Profit Breakdown ── */}
            <View style={styles.netBox}>
              <View style={styles.netRow}>
                <Text style={styles.netLabel}>Gross Profit</Text>
                <Text style={[styles.netValue, { color: isGrossProfit ? COLORS.success : COLORS.danger }]}>
                  {formatCurrency(report.grossProfit)}
                </Text>
              </View>
              <View style={styles.netDivider} />
              <View style={styles.netRow}>
                <Text style={styles.netLabel}>− Expenses</Text>
                <Text style={[styles.netValue, { color: COLORS.danger }]}>
                  {formatCurrency(report.totalExpenses)}
                </Text>
              </View>
              <View style={styles.netDivider} />
              <View style={styles.netRow}>
                <Text style={[styles.netLabel, { fontFamily: FONTS.heavy, color: COLORS.text }]}>
                  = Net {isProfit ? 'Profit' : 'Loss'}
                </Text>
                <Text style={[styles.netValue, styles.netFinal, { color: isProfit ? COLORS.success : COLORS.danger }]}>
                  {formatCurrency(report.netProfit)}
                </Text>
              </View>
            </View>

            {/* ── Per-Product Breakdown ── */}
            {report.productBreakdown.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Product-wise Profit</Text>
                {report.productBreakdown.map((item, index) => (
                  <ProductRow key={String(item.productId)} item={item} rank={index + 1} />
                ))}
              </>
            )}

            {report.productBreakdown.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No orders in this period</Text>
              </View>
            )}

            <View style={{ height: 120 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
};

// ── Sub-components ──────────────────────────────────────────────────────────

const SummaryCard = ({
  label, value, sub, color, icon,
}: {
  label: string; value: string; sub: string; color: string; icon: string;
}) => (
  <View style={summaryStyles.card}>
    <View style={[summaryStyles.iconBg, { backgroundColor: `${color}18` }]}>
      <Text style={summaryStyles.icon}>{icon}</Text>
    </View>
    <Text style={summaryStyles.label}>{label}</Text>
    <Text style={[summaryStyles.value, { color }]}>{value}</Text>
    <Text style={summaryStyles.sub}>{sub}</Text>
  </View>
);

const ProductRow = ({
  item, rank,
}: {
  item: ProductProfitBreakdown; rank: number;
}) => {
  const isLoss = item.grossProfit < 0;
  return (
    <View style={productStyles.row}>
      <View style={[productStyles.rank, { backgroundColor: isLoss ? COLORS.dangerLight : COLORS.primaryLight }]}>
        <Text style={[productStyles.rankText, { color: isLoss ? COLORS.danger : COLORS.primary }]}>
          #{rank}
        </Text>
      </View>
      <View style={productStyles.info}>
        <Text style={productStyles.name}>{item.productName}</Text>
        <Text style={productStyles.detail}>
          {item.totalQty} {item.unit} • Cost: {formatCurrency(item.avgCostPrice)} • Sale: {formatCurrency(item.avgSellingRate)}
        </Text>
        <Text style={productStyles.revenue}>Revenue: {formatCurrency(item.totalRevenue)}</Text>
      </View>
      <View style={productStyles.profitBox}>
        <Text style={[productStyles.profit, { color: isLoss ? COLORS.danger : COLORS.success }]}>
          {formatCurrency(item.grossProfit)}
        </Text>
        <Text style={[productStyles.margin, { color: isLoss ? COLORS.danger : COLORS.success }]}>
          {item.margin.toFixed(1)}%
        </Text>
      </View>
    </View>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    paddingTop: Platform.OS === 'ios' ? 16 : 16,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 12, fontFamily: FONTS.semiBold,
    color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 4,
  },
  headerAmount: {
    fontSize: 32, fontFamily: FONTS.heavy, color: COLORS.white,
    marginVertical: 4,
  },
  headerSub: {
    fontSize: 13, fontFamily: FONTS.semiBold, color: 'rgba(255,255,255,0.85)',
  },
  headerDate: {
    fontSize: 11, fontFamily: FONTS.regular, color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
  },

  filterRow: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SPACING.sm,
  },
  filterBtn: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.white },

  content: { padding: SPACING.md },

  sectionTitle: {
    fontSize: 13, fontFamily: FONTS.bold, color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginTop: SPACING.md, marginBottom: SPACING.sm,
  },

  cardGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between', gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },

  // Net breakdown box
  netBox: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, marginVertical: SPACING.sm,
    ...SHADOWS.sm, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  netRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: SPACING.sm,
  },
  netDivider: { height: 1, backgroundColor: COLORS.border },
  netLabel: { fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.textSecondary },
  netValue: { fontSize: 15, fontFamily: FONTS.bold },
  netFinal: { fontSize: 18, fontFamily: FONTS.heavy },

  emptyBox: {
    alignItems: 'center', paddingVertical: SPACING.xxl,
  },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textMuted },
});

const summaryStyles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, ...SHADOWS.sm,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  iconBg: {
    width: 38, height: 38, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xs,
  },
  icon: { fontSize: 18 },
  label: {
    fontSize: 11, fontFamily: FONTS.semiBold, color: COLORS.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2,
  },
  value: { fontSize: 16, fontFamily: FONTS.heavy, marginBottom: 2 },
  sub: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textMuted },
});

const productStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
    ...SHADOWS.xs, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  rank: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    marginRight: SPACING.sm,
  },
  rankText: { fontSize: 12, fontFamily: FONTS.heavy },
  info: { flex: 1 },
  name: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.text },
  detail: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 2 },
  revenue: { fontSize: 11, fontFamily: FONTS.semiBold, color: COLORS.textSecondary, marginTop: 1 },
  profitBox: { alignItems: 'flex-end', minWidth: 80 },
  profit: { fontSize: 14, fontFamily: FONTS.heavy },
  margin: { fontSize: 11, fontFamily: FONTS.semiBold, marginTop: 2 },
});

export default ProfitLossScreen;
