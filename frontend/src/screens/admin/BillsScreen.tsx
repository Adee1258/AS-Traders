import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, Modal, TextInput, Image, ScrollView,
  RefreshControl, ActivityIndicator, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { AdminStackParamList, Bill } from '../../types';
import { billsAPI } from '../../services/api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS, FONTS, SHADOWS } from '../../constants';
import EmptyState from '../../components/EmptyState';
import LoadingScreen from '../../components/LoadingScreen';

type Route = RouteProp<AdminStackParamList, 'Bills'>;

const SOURCE_LABELS: Record<string, string> = {
  manual:         '📎 Manual',
  auto_order:     '🤖 Auto (Order)',
  auto_purchase:  '🤖 Auto (Purchase)',
};

const BillsScreen = () => {
  const route = useRoute<Route>();
  const { partyType, partyId, partyName } = route.params;

  // List state
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);

  // Date filter
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterApplied, setFilterApplied] = useState(false);

  // View image modal
  const [viewBill, setViewBill] = useState<Bill | null>(null);

  // Add/Edit modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [fTitle, setFTitle] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fAmount, setFAmount] = useState('');
  const [fDate, setFDate] = useState('');
  const [fImage, setFImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadBills = useCallback(async () => {
    try {
      const res = await billsAPI.getAll({
        partyType,
        partyId,
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
        limit: 50,
      });
      setBills(res.data.data || []);
      setTotal(res.data.pagination?.total ?? 0);
    } catch {
      Alert.alert('Error', 'Bills load nahi ho sake');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [partyType, partyId, dateFrom, dateTo]);

  useFocusEffect(useCallback(() => { loadBills(); }, [loadBills]));

  const applyFilter = () => {
    setFilterApplied(!!(dateFrom || dateTo));
    setLoading(true);
    loadBills();
  };

  const clearFilter = () => {
    setDateFrom('');
    setDateTo('');
    setFilterApplied(false);
    setLoading(true);
  };

  // Pick image
  const pickImage = async (source: 'camera' | 'gallery') => {
    const perm = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perm.granted) {
      Alert.alert('Permission Required', 'Access chahiye');
      return;
    }

    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.6, base64: true })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.6, base64: true });

    if (!result.canceled && result.assets[0]?.base64) {
      const mime = result.assets[0].mimeType ?? 'image/jpeg';
      const uri = `data:${mime};base64,${result.assets[0].base64}`;
      if (uri.length > 10 * 1024 * 1024) {
        Alert.alert('Too large', 'Choti image use karein');
        return;
      }
      setFImage(uri);
    }
  };

  const openAdd = () => {
    setEditingBill(null);
    setFTitle('');
    setFDesc('');
    setFAmount('');
    setFDate(new Date().toISOString().split('T')[0]);
    setFImage(null);
    setFormOpen(true);
  };

  const openEdit = (b: Bill) => {
    setEditingBill(b);
    setFTitle(b.title);
    setFDesc(b.description);
    setFAmount(b.amount > 0 ? String(b.amount) : '');
    setFDate(b.billDate.split('T')[0]);
    setFImage(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!fTitle.trim()) { Alert.alert('Error', 'Title zaroori hai'); return; }
    setSaving(true);
    try {
      if (editingBill) {
        await billsAPI.update(editingBill._id, {
          title: fTitle.trim(),
          description: fDesc.trim(),
          amount: Number(fAmount) || 0,
          billDate: fDate,
          ...(fImage ? { imageBase64: fImage } : {}),
        });
      } else {
        await billsAPI.create({
          partyType,
          partyId,
          title: fTitle.trim(),
          description: fDesc.trim(),
          amount: Number(fAmount) || 0,
          billDate: fDate,
          ...(fImage ? { imageBase64: fImage } : {}),
        });
      }
      setFormOpen(false);
      loadBills();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Save fail ho gaya');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (bill: Bill) => {
    Alert.alert('Delete Bill', `"${bill.title}" delete karna chahte hain?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setDeleting(bill._id);
          try {
            await billsAPI.delete(bill._id);
            setBills(prev => prev.filter(b => b._id !== bill._id));
          } catch {
            Alert.alert('Error', 'Delete fail ho gaya');
          } finally {
            setDeleting(null);
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingScreen />;

  return (
    <>
      <View style={styles.container}>
        {/* ── Header bar ── */}
        <View style={styles.topBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.partyName}>{partyName}</Text>
            <Text style={styles.countText}>{total} bill{total !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.85}>
            <Text style={styles.addBtnText}>+ Add Bill</Text>
          </TouchableOpacity>
        </View>

        {/* ── Date Filter ── */}
        <View style={styles.filterBox}>
          <Text style={styles.filterLabel}>Date Filter</Text>
          <View style={styles.filterRow}>
            <TextInput
              style={styles.dateInput}
              placeholder="From (YYYY-MM-DD)"
              placeholderTextColor={COLORS.textMuted}
              value={dateFrom}
              onChangeText={setDateFrom}
            />
            <Text style={styles.filterSep}>—</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="To (YYYY-MM-DD)"
              placeholderTextColor={COLORS.textMuted}
              value={dateTo}
              onChangeText={setDateTo}
            />
          </View>
          <View style={styles.filterBtns}>
            <TouchableOpacity style={styles.filterApplyBtn} onPress={applyFilter}>
              <Text style={styles.filterApplyText}>🔍 Apply</Text>
            </TouchableOpacity>
            {filterApplied && (
              <TouchableOpacity style={styles.filterClearBtn} onPress={clearFilter}>
                <Text style={styles.filterClearText}>✕ Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Bill List ── */}
        <FlatList
          data={bills}
          keyExtractor={b => b._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadBills(); }}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="🧾"
              title="Koi bill nahi"
              subtitle="+ Add Bill se naya bill add karein"
            />
          }
          renderItem={({ item: b }) => (
            <View style={styles.card}>
              {/* Left: image thumbnail or placeholder */}
              <TouchableOpacity
                style={styles.thumbBox}
                onPress={() => b.imageUrl ? setViewBill(b) : null}
                activeOpacity={b.imageUrl ? 0.8 : 1}
              >
                {b.imageUrl ? (
                  <Image source={{ uri: b.imageUrl }} style={styles.thumb} resizeMode="cover" />
                ) : (
                  <View style={styles.thumbPlaceholder}>
                    <Text style={styles.thumbPlaceholderIcon}>🧾</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Info */}
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>{b.title}</Text>
                <Text style={styles.cardDate}>📅 {formatDate(b.billDate)}</Text>
                {b.amount > 0 && (
                  <Text style={styles.cardAmount}>{formatCurrency(b.amount)}</Text>
                )}
                {b.description ? (
                  <Text style={styles.cardDesc} numberOfLines={2}>{b.description}</Text>
                ) : null}
                <Text style={styles.cardSource}>{SOURCE_LABELS[b.source] ?? b.source}</Text>
              </View>

              {/* Actions */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => openEdit(b)}
                >
                  <Text style={styles.editBtnText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(b)}
                  disabled={deleting === b._id}
                >
                  {deleting === b._id
                    ? <ActivityIndicator size="small" color={COLORS.danger} />
                    : <Text style={styles.deleteBtnText}>🗑️</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>

      {/* ══ View Bill Image Modal ═════════════════════════════════════════ */}
      <Modal
        visible={!!viewBill}
        animationType="fade"
        transparent
        onRequestClose={() => setViewBill(null)}
      >
        <View style={styles.imageOverlay}>
          <View style={styles.imageSheet}>
            <View style={styles.imageSheetHeader}>
              <Text style={styles.imageSheetTitle} numberOfLines={1}>
                {viewBill?.title}
              </Text>
              <TouchableOpacity onPress={() => setViewBill(null)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            {viewBill?.imageUrl && (
              <Image
                source={{ uri: viewBill.imageUrl }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            )}
            <Text style={styles.viewBillDate}>
              📅 {viewBill ? formatDate(viewBill.billDate) : ''}
              {viewBill?.amount ? `  •  ${formatCurrency(viewBill.amount)}` : ''}
            </Text>
            {viewBill?.description ? (
              <Text style={styles.viewBillDesc}>{viewBill.description}</Text>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* ══ Add / Edit Bill Modal ═════════════════════════════════════════ */}
      <Modal
        visible={formOpen}
        animationType="slide"
        transparent
        onRequestClose={() => { if (!saving) setFormOpen(false); }}
      >
        <KeyboardAvoidingView
          style={styles.formOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
          <View style={styles.formSheet}>
            {/* Header */}
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {editingBill ? '✏️ Edit Bill' : '+ New Bill'}
              </Text>
              <TouchableOpacity
                onPress={() => { if (!saving) setFormOpen(false); }}
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Title */}
              <Text style={styles.fLabel}>Title *</Text>
              <TextInput
                style={styles.fInput}
                placeholder="e.g. Order bill, Maal kharida"
                placeholderTextColor={COLORS.textMuted}
                value={fTitle}
                onChangeText={setFTitle}
              />

              {/* Amount */}
              <Text style={styles.fLabel}>Amount (Rs.)</Text>
              <TextInput
                style={styles.fInput}
                placeholder="e.g. 5000"
                placeholderTextColor={COLORS.textMuted}
                value={fAmount}
                onChangeText={setFAmount}
                keyboardType="numeric"
              />

              {/* Date */}
              <Text style={styles.fLabel}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.fInput}
                placeholder="e.g. 2026-10-15"
                placeholderTextColor={COLORS.textMuted}
                value={fDate}
                onChangeText={setFDate}
              />

              {/* Description */}
              <Text style={styles.fLabel}>Description / Notes</Text>
              <TextInput
                style={[styles.fInput, { minHeight: 70, textAlignVertical: 'top' }]}
                placeholder="Koi detail add karein..."
                placeholderTextColor={COLORS.textMuted}
                value={fDesc}
                onChangeText={setFDesc}
                multiline
              />

              {/* Image picker */}
              <Text style={styles.fLabel}>Bill Photo (Optional)</Text>
              <View style={styles.imagePickerRow}>
                <TouchableOpacity
                  style={styles.imagePickerBtn}
                  onPress={() => pickImage('camera')}
                >
                  <Text style={styles.imagePickerIcon}>📸</Text>
                  <Text style={styles.imagePickerText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.imagePickerBtn}
                  onPress={() => pickImage('gallery')}
                >
                  <Text style={styles.imagePickerIcon}>🖼️</Text>
                  <Text style={styles.imagePickerText}>Gallery</Text>
                </TouchableOpacity>
              </View>

              {fImage ? (
                <View style={styles.previewContainer}>
                  <Image
                    source={{ uri: fImage }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => setFImage(null)}
                  >
                    <Text style={styles.removeImageText}>🗑️ Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : editingBill?.imageUrl ? (
                <View style={styles.existingImageBox}>
                  <Image
                    source={{ uri: editingBill.imageUrl }}
                    style={styles.existingImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.existingImageNote}>
                    Naya image select karo replace karne ke liye
                  </Text>
                </View>
              ) : null}

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving
                  ? <ActivityIndicator color={COLORS.white} size="small" />
                  : <Text style={styles.saveBtnText}>
                      {editingBill ? '✅ Update Bill' : '✅ Save Bill'}
                    </Text>
                }
              </TouchableOpacity>

              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.md, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  partyName: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.text },
  countText: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 2 },
  addBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    ...SHADOWS.sm,
  },
  addBtnText: { fontSize: 13, fontFamily: FONTS.bold, color: COLORS.white },

  filterBox: {
    backgroundColor: COLORS.white, padding: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  filterLabel: { fontSize: 11, fontFamily: FONTS.bold, color: COLORS.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  dateInput: {
    flex: 1, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm, paddingHorizontal: 10, paddingVertical: 7,
    fontSize: 12, fontFamily: FONTS.regular, color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  filterSep: { fontSize: 14, color: COLORS.textMuted },
  filterBtns: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  filterApplyBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: 7,
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.sm,
  },
  filterApplyText: { fontSize: 12, fontFamily: FONTS.bold, color: COLORS.white },
  filterClearBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: 7,
    backgroundColor: COLORS.dangerLight, borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.danger,
  },
  filterClearText: { fontSize: 12, fontFamily: FONTS.bold, color: COLORS.danger },

  list: { padding: SPACING.md, paddingBottom: 120 },

  card: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.sm,
    overflow: 'hidden', ...SHADOWS.sm,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  thumbBox: { width: 72, backgroundColor: COLORS.surface },
  thumb: { width: 72, height: '100%' as any, minHeight: 80 },
  thumbPlaceholder: {
    width: 72, minHeight: 80,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
  },
  thumbPlaceholderIcon: { fontSize: 28 },

  cardInfo: { flex: 1, padding: SPACING.sm },
  cardTitle: { fontSize: 13, fontFamily: FONTS.bold, color: COLORS.text },
  cardDate: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 2 },
  cardAmount: { fontSize: 13, fontFamily: FONTS.heavy, color: COLORS.primary, marginTop: 2 },
  cardDesc: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginTop: 2 },
  cardSource: { fontSize: 10, fontFamily: FONTS.semiBold, color: COLORS.textMuted, marginTop: 3 },

  cardActions: {
    flexDirection: 'column', justifyContent: 'center',
    padding: SPACING.sm, gap: SPACING.xs,
  },
  editBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  editBtnText: { fontSize: 14 },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: COLORS.dangerLight, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(220,38,38,0.3)',
  },
  deleteBtnText: { fontSize: 14 },

  // View image modal
  imageOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center', alignItems: 'center', padding: SPACING.md,
  },
  imageSheet: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md, width: '100%', maxHeight: '88%',
  },
  imageSheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.sm,
  },
  imageSheetTitle: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.text, flex: 1 },
  closeText: { fontSize: 22, color: COLORS.textMuted, padding: 4 },
  fullImage: { width: '100%', height: 340, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.surface },
  viewBillDate: { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.textSecondary, marginTop: SPACING.sm },
  viewBillDesc: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginTop: 4 },

  // Form modal
  formOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  formSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl, borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.md, maxHeight: '94%',
  },
  formHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.md,
    paddingBottom: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  formTitle: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.text },

  fLabel: {
    fontSize: 12, fontFamily: FONTS.bold, color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: SPACING.xs, marginTop: SPACING.sm,
  },
  fInput: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, fontSize: 14, fontFamily: FONTS.regular,
    color: COLORS.text, backgroundColor: COLORS.surface, minHeight: 48,
  },

  imagePickerRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  imagePickerBtn: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md,
    alignItems: 'center', backgroundColor: COLORS.surface,
  },
  imagePickerIcon: { fontSize: 26, marginBottom: 4 },
  imagePickerText: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.text },

  previewContainer: { alignItems: 'center', marginBottom: SPACING.sm },
  previewImage: { width: '100%', height: 200, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.surface },
  removeImageBtn: {
    marginTop: SPACING.sm, paddingVertical: 6, paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.dangerLight,
  },
  removeImageText: { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.danger },

  existingImageBox: { marginBottom: SPACING.sm },
  existingImage: { width: '100%', height: 120, borderRadius: BORDER_RADIUS.md },
  existingImageNote: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 4 },

  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, alignItems: 'center', marginTop: SPACING.md,
  },
  saveBtnText: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.white },
});

export default BillsScreen;
