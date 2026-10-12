import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, Modal, TextInput, FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { productsAPI, suppliersAPI } from '../../services/api';
import { Supplier } from '../../types';
import { formatCurrency } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS, FONTS, SHADOWS } from '../../constants';
import Input from '../../components/Input';
import Button from '../../components/Button';
import KeyboardSafeScrollView from '../../components/KeyboardSafeScrollView';

const UNITS = ['KG', 'Packet', 'Bag', 'Box', 'Piece'];

type PurchaseType = 'udhaar' | 'cash' | 'existing_stock';

const PURCHASE_TYPES: { type: PurchaseType; icon: string; label: string; sublabel: string; color: string }[] = [
  { type: 'udhaar', icon: '🔴', label: 'Udhaar (Debit)', sublabel: 'Supplier ne udhaar diya — unka balance badhe ga', color: COLORS.danger },
  { type: 'cash', icon: '💵', label: 'Cash (Credit)', sublabel: 'Cash pay kar diya — supplier balance zero rahe ga', color: COLORS.success },
  { type: 'existing_stock', icon: '📦', label: 'Existing Stock', sublabel: 'Pehle se maal pada tha — koi supplier effect nahi', color: COLORS.textMuted },
];

// ─── Searchable Supplier Picker Modal ────────────────────────────────────────
const SupplierPickerModal = ({
  visible,
  suppliers,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  suppliers: Supplier[];
  selectedId: string;
  onSelect: (s: Supplier) => void;
  onClose: () => void;
}) => {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? suppliers.filter(
      s =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        (s.ownerName ?? '').toLowerCase().includes(query.toLowerCase()) ||
        (s.phone ?? '').includes(query)
    )
    : suppliers;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={pickerStyles.overlay}>
        <View style={pickerStyles.sheet}>
          {/* Header */}
          <View style={pickerStyles.header}>
            <Text style={pickerStyles.title}>🏭 Supplier Select Karo</Text>
            <TouchableOpacity onPress={onClose} style={pickerStyles.closeBtn}>
              <Text style={pickerStyles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={pickerStyles.searchBox}>
            <TextInput
              style={pickerStyles.searchInput}
              placeholder="Naam, owner ya phone se search karein..."
              placeholderTextColor={COLORS.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} style={pickerStyles.clearBtn}>
                <Text style={pickerStyles.clearText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Count */}
          <Text style={pickerStyles.countText}>
            {filtered.length} supplier{filtered.length !== 1 ? 's' : ''}
            {query ? ` — "${query}"` : ''}
          </Text>

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={s => s._id}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={pickerStyles.empty}>
                <Text style={pickerStyles.emptyText}>Koi supplier nahi mila</Text>
                <Text style={pickerStyles.emptyHint}>Search clear karein ya naya supplier add karein</Text>
              </View>
            }
            renderItem={({ item: s }) => {
              const isSelected = selectedId === s._id;
              const bal = s.currentBalance ?? 0;
              return (
                <TouchableOpacity
                  style={[pickerStyles.item, isSelected && pickerStyles.itemSelected]}
                  onPress={() => { onSelect(s); onClose(); setQuery(''); }}
                  activeOpacity={0.75}
                >
                  <View style={[pickerStyles.radio, isSelected && pickerStyles.radioSelected]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[pickerStyles.itemName, isSelected && { color: COLORS.supplier }]}>
                      {s.name}
                    </Text>
                    {s.ownerName ? <Text style={pickerStyles.itemSub}>👤 {s.ownerName}</Text> : null}
                    {s.phone ? <Text style={pickerStyles.itemSub}>📞 {s.phone}</Text> : null}
                  </View>
                  <View style={pickerStyles.balBox}>
                    <Text style={pickerStyles.balLabel}>Dena Hai</Text>
                    <Text style={[pickerStyles.balAmount, { color: COLORS.danger }]}>
                      {formatCurrency(Math.abs(bal))}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const AddProductScreen = () => {
  const navigation = useNavigation();

  // Step 1
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ name: '', unit: 'KG', defaultRate: '', costPrice: '', quantity: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 2
  const [purchaseType, setPurchaseType] = useState<PurchaseType>('udhaar');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  useEffect(() => {
    if (step === 2 && purchaseType !== 'existing_stock') {
      setSuppliersLoading(true);
      suppliersAPI.getAll()
        .then(res => setSuppliers(res.data.data || []))
        .catch(() => setSuppliers([]))
        .finally(() => setSuppliersLoading(false));
    }
  }, [step, purchaseType]);

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Product name zaroori hai';
    if (!form.costPrice || isNaN(Number(form.costPrice)) || Number(form.costPrice) < 0)
      e.costPrice = 'Valid cost price dalen';
    if (!form.defaultRate || isNaN(Number(form.defaultRate)) || Number(form.defaultRate) <= 0)
      e.defaultRate = 'Valid selling rate dalen';
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) <= 0)
      e.quantity = `Kitne ${form.unit} liye? Quantity zaroori hai`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (purchaseType !== 'existing_stock' && !selectedSupplier) {
      Alert.alert('Supplier Select Karo', 'Udhaar ya Cash ke liye supplier zaroori hai.');
      return;
    }
    setSaving(true);
    try {
      await productsAPI.create({
        name: form.name.trim(),
        unit: form.unit,
        defaultRate: Number(form.defaultRate),
        costPrice: Number(form.costPrice),
      });

      if (purchaseType !== 'existing_stock' && selectedSupplier) {
        const qty = Number(form.quantity);
        const totalAmount = Number(form.costPrice) * qty;
        const desc = `${form.name.trim()} — ${qty} ${form.unit} @ ${formatCurrency(Number(form.costPrice))}`;
        await suppliersAPI.addTransaction(selectedSupplier._id, {
          type: 'PURCHASE',
          amount: totalAmount,
          description: desc + (purchaseType === 'cash' ? ' [Cash]' : ''),
          referenceNote: purchaseType === 'udhaar' ? 'Udhaar purchase' : 'Cash purchase',
        });
        if (purchaseType === 'cash') {
          await suppliersAPI.addTransaction(selectedSupplier._id, {
            type: 'PAYMENT_SENT',
            amount: totalAmount,
            description: `Cash payment — ${form.name.trim()}`,
            referenceNote: 'Turant cash diya',
          });
        }
      }

      Alert.alert(
        '✅ Product Add Ho Gaya',
        purchaseType === 'existing_stock'
          ? `${form.name.trim()} (${form.quantity} ${form.unit}) register ho gaya.`
          : purchaseType === 'udhaar'
            ? `${form.name.trim()} — ${selectedSupplier?.name} ka udhaar record ho gaya.`
            : `${form.name.trim()} — cash payment record ho gaya.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Product add nahi ho saka');
    } finally {
      setSaving(false);
    }
  };

  const profit = Number(form.defaultRate) - Number(form.costPrice);
  const margin = Number(form.defaultRate) > 0 ? (profit / Number(form.defaultRate)) * 100 : 0;
  const totalBill = Number(form.costPrice) * (Number(form.quantity) || 0);

  // ── STEP 1 ─────────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <KeyboardSafeScrollView>
        {/* Step indicator */}
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, styles.stepActive]}><Text style={styles.stepNum}>1</Text></View>
          <View style={styles.stepLine} />
          <View style={styles.stepDot}><Text style={[styles.stepNum, { color: COLORS.textMuted }]}>2</Text></View>
          <Text style={styles.stepLabel}>Product Details → Purchase Type</Text>
        </View>

        <Input label="Product Name *" placeholder="e.g. Anda, Aata, Chawal"
          value={form.name} onChangeText={v => set('name', v)} error={errors.name} />

        <Text style={styles.label}>Unit *</Text>
        <View style={styles.unitGrid}>
          {UNITS.map(u => (
            <TouchableOpacity key={u}
              style={[styles.unitBtn, form.unit === u && styles.unitActive]}
              onPress={() => set('unit', u)}>
              <Text style={[styles.unitText, form.unit === u && styles.unitTextActive]}>{u}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input label={`Quantity (${form.unit}) *`}
          placeholder={`Kitne ${form.unit} liye? e.g. 50, 100`}
          value={form.quantity} onChangeText={v => set('quantity', v)}
          error={errors.quantity} keyboardType="numeric" />

        <Input label={`Cost Price per ${form.unit} (Rs.) *`}
          placeholder="e.g. 300 — khareed ka daam"
          value={form.costPrice} onChangeText={v => set('costPrice', v)}
          error={errors.costPrice} keyboardType="numeric" />

        <Input label={`Selling Rate per ${form.unit} (Rs.) *`}
          placeholder="e.g. 400 — bechne ka daam"
          value={form.defaultRate} onChangeText={v => set('defaultRate', v)}
          error={errors.defaultRate} keyboardType="numeric" />

        {/* Purchase summary */}
        {form.quantity && Number(form.quantity) > 0 && Number(form.costPrice) > 0 && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>📋 Purchase Summary</Text>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Quantity</Text><Text style={styles.summaryVal}>{form.quantity} {form.unit}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Rate per {form.unit}</Text><Text style={styles.summaryVal}>{formatCurrency(Number(form.costPrice))}</Text></View>
            <View style={[styles.summaryRow, styles.summaryTotalRow]}>
              <Text style={styles.summaryTotalLabel}>Total Bill</Text>
              <Text style={styles.summaryTotalVal}>{formatCurrency(totalBill)}</Text>
            </View>
          </View>
        )}

        {/* Profit preview */}
        {Number(form.defaultRate) > 0 && !isNaN(profit) && (
          <View style={[styles.profitBox, { borderColor: profit >= 0 ? COLORS.success : COLORS.danger }]}>
            <Text style={styles.profitTitle}>💡 Munafa per {form.unit}</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Profit</Text>
              <Text style={[styles.summaryVal, { color: profit >= 0 ? COLORS.success : COLORS.danger }]}>Rs. {profit.toFixed(0)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Margin</Text>
              <Text style={[styles.summaryVal, { color: profit >= 0 ? COLORS.success : COLORS.danger }]}>{margin.toFixed(1)}%</Text>
            </View>
          </View>
        )}

        <Button title="Agla Step: Purchase Type →" onPress={() => { if (validateStep1()) setStep(2); }} style={styles.btn} />
      </KeyboardSafeScrollView>
    );
  }

  // ── STEP 2 ─────────────────────────────────────────────────────────────────
  return (
    <>
      <KeyboardSafeScrollView>
        {/* Step indicator */}
        <View style={styles.stepRow}>
          <TouchableOpacity onPress={() => setStep(1)}>
            <View style={styles.stepDot}><Text style={[styles.stepNum, { color: COLORS.textMuted }]}>1</Text></View>
          </TouchableOpacity>
          <View style={[styles.stepLine, { backgroundColor: COLORS.primary }]} />
          <View style={[styles.stepDot, styles.stepActive]}><Text style={styles.stepNum}>2</Text></View>
          <Text style={styles.stepLabel}>← Back  •  Purchase Type</Text>
        </View>

        {/* Product chip */}
        <View style={styles.productChip}>
          <Text style={styles.chipName}>{form.name}</Text>
          <Text style={styles.chipDetail}>
            {form.quantity} {form.unit}  •  Cost: {formatCurrency(Number(form.costPrice))}/{form.unit}  •  Total: {formatCurrency(totalBill)}
          </Text>
        </View>

        {/* Purchase type */}
        <Text style={styles.sectionTitle}>Yeh maal kaise aya? *</Text>
        {PURCHASE_TYPES.map(pt => (
          <TouchableOpacity key={pt.type}
            style={[styles.typeBtn, purchaseType === pt.type && { borderColor: pt.color, backgroundColor: `${pt.color}10` }]}
            onPress={() => { setPurchaseType(pt.type); setSelectedSupplier(null); }}
            activeOpacity={0.8}
          >
            <Text style={styles.typeIcon}>{pt.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.typeLabel, purchaseType === pt.type && { color: pt.color, fontFamily: FONTS.bold }]}>{pt.label}</Text>
              <Text style={styles.typeSub}>{pt.sublabel}</Text>
            </View>
            {purchaseType === pt.type && <View style={[styles.typeDot, { backgroundColor: pt.color }]} />}
          </TouchableOpacity>
        ))}

        {/* Existing stock */}
        {purchaseType === 'existing_stock' && (
          <View style={styles.existingNote}>
            <Text style={styles.existingText}>📦 Sirf product register hoga. Kisi supplier ka balance nahi badhe ga.</Text>
            <Button title="✅ Save Product" onPress={handleSave} loading={saving} style={{ marginTop: SPACING.md }} />
          </View>
        )}

        {/* Supplier picker */}
        {purchaseType !== 'existing_stock' && (
          <>
            <Text style={styles.sectionTitle}>
              {purchaseType === 'udhaar' ? '🔴 Supplier Select Karo' : '💵 Supplier Select Karo'}
            </Text>
            <Text style={styles.sectionHint}>
              {purchaseType === 'udhaar'
                ? `${formatCurrency(totalBill)} supplier ke account mein debit hoga`
                : `Purchase + payment dono record honge — net balance zero rahega`}
            </Text>

            {suppliersLoading ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.md }} />
            ) : suppliers.length === 0 ? (
              <View style={styles.noSupBox}>
                <Text style={styles.noSupText}>⚠️ Koi supplier nahi mila</Text>
                <Text style={styles.noSupHint}>Pehle Suppliers tab mein supplier add karein</Text>
                <TouchableOpacity style={styles.noSupBtn} onPress={() => navigation.goBack()}>
                  <Text style={styles.noSupBtnText}>← Wapas Jao</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Selected supplier chip / picker button */}
                <TouchableOpacity
                  style={[
                    styles.pickerBtn,
                    selectedSupplier && { borderColor: COLORS.supplier, backgroundColor: COLORS.supplierLight },
                  ]}
                  onPress={() => setPickerOpen(true)}
                  activeOpacity={0.8}
                >
                  {selectedSupplier ? (
                    <View style={styles.pickerSelected}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pickerSelectedName}>{selectedSupplier.name}</Text>
                        {selectedSupplier.ownerName ? (
                          <Text style={styles.pickerSelectedSub}>👤 {selectedSupplier.ownerName}</Text>
                        ) : null}
                      </View>
                      <View style={styles.pickerSelectedBal}>
                        <Text style={styles.pickerBalLabel}>Dena Hai</Text>
                        <Text style={[styles.pickerBalAmt, { color: COLORS.danger }]}>
                          {formatCurrency(Math.abs(selectedSupplier.currentBalance ?? 0))}
                        </Text>
                      </View>
                      <Text style={styles.pickerChange}>Change ▾</Text>
                    </View>
                  ) : (
                    <View style={styles.pickerPlaceholder}>
                      <Text style={styles.pickerPlaceholderIcon}>🔍</Text>
                      <Text style={styles.pickerPlaceholderText}>
                        Supplier choose karein ({suppliers.length} available) ▾
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Balance preview */}
                {selectedSupplier && (
                  <View style={styles.balPreview}>
                    {purchaseType === 'udhaar' ? (
                      <>
                        <Text style={styles.balPreviewLabel}>📈 Is purchase ke baad balance:</Text>
                        <Text style={[styles.balPreviewAmt, { color: COLORS.danger }]}>
                          🔴 Dena Hai: {formatCurrency((selectedSupplier.currentBalance ?? 0) + totalBill)}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.balPreviewLabel}>
                        ✅ Cash — {selectedSupplier.name} ka balance change nahi hoga
                      </Text>
                    )}
                  </View>
                )}

                <Button
                  title="✅ Save Product"
                  onPress={handleSave}
                  loading={saving}
                  style={styles.btn}
                />
              </>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </KeyboardSafeScrollView>

      {/* Searchable Supplier Picker Modal */}
      <SupplierPickerModal
        visible={pickerOpen}
        suppliers={suppliers}
        selectedId={selectedSupplier?._id ?? ''}
        onSelect={s => setSelectedSupplier(s)}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, gap: SPACING.sm },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
  },
  stepActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepNum: { fontSize: 12, fontFamily: FONTS.bold, color: COLORS.white },
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.border },
  stepLabel: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textMuted },

  label: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.text, marginBottom: 8 },
  unitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  unitBtn: {
    paddingHorizontal: SPACING.md, paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md, borderWidth: 1.5,
    borderColor: COLORS.border, backgroundColor: COLORS.white,
  },
  unitActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  unitText: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textSecondary },
  unitTextActive: { color: COLORS.primary, fontFamily: FONTS.bold },

  summaryBox: {
    backgroundColor: COLORS.primaryLight, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  summaryTitle: { fontSize: 12, fontFamily: FONTS.bold, color: COLORS.primary, marginBottom: SPACING.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  summaryLabel: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textSecondary },
  summaryVal: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.text },
  summaryTotalRow: { borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: SPACING.xs, paddingTop: SPACING.xs },
  summaryTotalLabel: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.primary },
  summaryTotalVal: { fontSize: 16, fontFamily: FONTS.heavy, color: COLORS.primary },

  profitBox: {
    borderWidth: 1.5, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.md, backgroundColor: COLORS.surface,
  },
  profitTitle: { fontSize: 12, fontFamily: FONTS.bold, color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.sm },

  btn: { marginTop: SPACING.md },

  // Step 2
  productChip: {
    backgroundColor: COLORS.primaryLight, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.md,
    borderLeftWidth: 4, borderLeftColor: COLORS.primary,
  },
  chipName: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.primary },
  chipDetail: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginTop: 3 },

  sectionTitle: { fontSize: 13, fontFamily: FONTS.bold, color: COLORS.text, marginBottom: SPACING.xs, marginTop: SPACING.md },
  sectionHint: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textMuted, marginBottom: SPACING.sm },

  typeBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md,
    backgroundColor: COLORS.white, gap: SPACING.sm, marginBottom: SPACING.xs,
  },
  typeIcon: { fontSize: 22 },
  typeLabel: { fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.text },
  typeSub: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 1 },
  typeDot: { width: 10, height: 10, borderRadius: 5 },

  existingNote: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
    borderLeftWidth: 4, borderLeftColor: COLORS.textMuted, marginTop: SPACING.sm,
  },
  existingText: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textSecondary, lineHeight: 20 },

  // Picker button
  pickerBtn: {
    borderWidth: 2, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white, marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  pickerPlaceholder: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.sm,
  },
  pickerPlaceholderIcon: { fontSize: 18 },
  pickerPlaceholderText: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textSecondary, flex: 1 },
  pickerSelected: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.sm,
  },
  pickerSelectedName: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.supplier },
  pickerSelectedSub: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 1 },
  pickerSelectedBal: { alignItems: 'flex-end' },
  pickerBalLabel: { fontSize: 9, fontFamily: FONTS.semiBold, color: COLORS.textMuted },
  pickerBalAmt: { fontSize: 13, fontFamily: FONTS.heavy },
  pickerChange: { fontSize: 11, fontFamily: FONTS.semiBold, color: COLORS.supplier, marginLeft: 4 },

  balPreview: {
    backgroundColor: '#FEF2F2', borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: 'rgba(220,38,38,0.2)',
  },
  balPreviewLabel: { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.textSecondary, marginBottom: 4 },
  balPreviewAmt: { fontSize: 16, fontFamily: FONTS.heavy },

  noSupBox: {
    backgroundColor: COLORS.warningLight, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.warning, alignItems: 'center',
  },
  noSupText: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.warning },
  noSupHint: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginTop: SPACING.xs, textAlign: 'center' },
  noSupBtn: { marginTop: SPACING.sm, paddingVertical: 8, paddingHorizontal: 20, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.warning },
  noSupBtnText: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.warning },
});

// ── Picker Modal Styles ───────────────────────────────────────────────────────
const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.text },
  closeBtn: { padding: 6 },
  closeText: { fontSize: 20, color: COLORS.textMuted },

  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    margin: SPACING.md, marginBottom: 4,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
  },
  searchInput: {
    flex: 1, fontSize: 14, fontFamily: FONTS.regular,
    color: COLORS.text, paddingVertical: 10, minHeight: 44,
  },
  clearBtn: { padding: 6 },
  clearText: { fontSize: 14, color: COLORS.textMuted },

  countText: {
    fontSize: 11, fontFamily: FONTS.semiBold, color: COLORS.textMuted,
    paddingHorizontal: SPACING.md, paddingBottom: SPACING.xs,
  },

  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
    gap: SPACING.sm,
  },
  itemSelected: { backgroundColor: COLORS.supplierLight },
  radio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: COLORS.border,
    flexShrink: 0,
  },
  radioSelected: { borderColor: COLORS.supplier, backgroundColor: COLORS.supplier },
  itemName: { fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.text },
  itemSub: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 1 },
  balBox: { alignItems: 'flex-end' },
  balLabel: { fontSize: 9, fontFamily: FONTS.semiBold, color: COLORS.textMuted },
  balAmount: { fontSize: 13, fontFamily: FONTS.heavy },

  empty: { alignItems: 'center', padding: SPACING.xl },
  emptyText: { fontSize: 14, fontFamily: FONTS.semiBold, color: COLORS.textMuted },
  emptyHint: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textMuted, marginTop: 4 },
});

export default AddProductScreen;
