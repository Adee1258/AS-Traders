import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput, Image, Modal,
  Platform, KeyboardAvoidingView,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { AdminStackParamList, Order, Shop } from '../../types';
import { ordersAPI } from '../../services/api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { COLORS, SPACING, BORDER_RADIUS, FONTS, SHADOWS } from '../../constants';
import Card from '../../components/Card';

type Route = RouteProp<AdminStackParamList, 'OrderDetails'>;

// ─── PDF HTML Template ──────────────────────────────────────────────────────
const buildBillHtml = (order: Order, shop: Shop | null): string => {
  const shopName = shop?.name ?? '—';
  const ownerName = shop?.ownerName ?? '';
  const phone = (shop as any)?.phone ?? '';

  const itemRows = order.items
    .map(
      (item, i) => `
      <tr style="background:${i % 2 === 0 ? '#f8faff' : '#ffffff'}">
        <td style="padding:10px 12px;font-size:13px;color:#0D1B2A;">${item.productName}</td>
        <td style="padding:10px 12px;text-align:center;font-size:13px;color:#4B5E7A;">${item.quantity} ${item.unit}</td>
        <td style="padding:10px 12px;text-align:right;font-size:13px;color:#4B5E7A;">Rs. ${item.rate.toLocaleString()}</td>
        <td style="padding:10px 12px;text-align:right;font-size:13px;font-weight:700;color:#0D1B2A;">Rs. ${item.total.toLocaleString()}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; background:#fff; color:#0D1B2A; }
    .page { max-width:700px; margin:0 auto; padding:0; }

    /* Header */
    .header { background:linear-gradient(135deg,#1C3FAA,#0D1F5C); padding:32px 36px 24px; }
    .brand { font-size:30px; font-weight:900; color:#fff; letter-spacing:1px; }
    .brand-sub { font-size:13px; color:rgba(255,255,255,0.7); margin-top:2px; letter-spacing:2px; text-transform:uppercase; }
    .header-right { float:right; text-align:right; margin-top:-48px; }
    .bill-label { font-size:11px; color:rgba(255,255,255,0.6); text-transform:uppercase; letter-spacing:1px; }
    .bill-num { font-size:22px; font-weight:800; color:#F59E0B; }
    .bill-date { font-size:11px; color:rgba(255,255,255,0.65); margin-top:4px; }
    .clearfix::after { content:''; display:table; clear:both; }

    /* Shop info */
    .shop-section { background:#F0F4FF; padding:18px 36px; border-bottom:2px solid #E2E8F0; }
    .shop-section-grid { display:flex; justify-content:space-between; align-items:flex-start; }
    .section-label { font-size:10px; text-transform:uppercase; letter-spacing:1px; color:#94A3B8; margin-bottom:4px; }
    .shop-name { font-size:16px; font-weight:800; color:#1C3FAA; }
    .shop-sub { font-size:12px; color:#4B5E7A; margin-top:2px; }
    .status-badge { display:inline-block; background:#D1FAE5; color:#059669; font-size:11px;
      font-weight:700; padding:4px 12px; border-radius:20px; text-transform:uppercase; letter-spacing:0.5px; }

    /* Items table */
    .table-section { padding:24px 36px; }
    .table-title { font-size:12px; text-transform:uppercase; letter-spacing:1px; color:#94A3B8; margin-bottom:12px; }
    table { width:100%; border-collapse:collapse; }
    thead tr { background:#1C3FAA; }
    thead th { padding:10px 12px; color:#fff; font-size:11px; text-transform:uppercase;
      letter-spacing:0.8px; font-weight:700; }
    thead th:first-child { text-align:left; }
    thead th:not(:first-child) { text-align:right; }
    thead th:nth-child(2) { text-align:center; }
    tbody tr:last-child td { border-bottom:2px solid #E2E8F0; }

    /* Total */
    .total-section { padding:0 36px 24px; }
    .total-box { background:#1C3FAA; border-radius:12px; padding:16px 20px;
      display:flex; justify-content:space-between; align-items:center; margin-top:8px; }
    .total-label { font-size:13px; color:rgba(255,255,255,0.8); font-weight:600; }
    .total-amount { font-size:24px; font-weight:900; color:#F59E0B; }
    .subtotals { padding:8px 0; }
    .subtotal-row { display:flex; justify-content:flex-end; gap:32px; padding:4px 0;
      font-size:12px; color:#4B5E7A; border-top:1px solid #E2E8F0; }
    .subtotal-row span:last-child { font-weight:700; color:#0D1B2A; min-width:100px; text-align:right; }

    /* Footer */
    .footer { background:#F8FAFF; padding:18px 36px; border-top:1px solid #E2E8F0; text-align:center; }
    .footer p { font-size:11px; color:#94A3B8; line-height:1.8; }
    .footer strong { color:#1C3FAA; }
    .watermark { font-size:9px; color:#CBD5E1; margin-top:6px; letter-spacing:1px; }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header clearfix">
    <div>
      <div class="brand">AS Traders</div>
      <div class="brand-sub">Wholesale Supplier</div>
    </div>
    <div class="header-right">
      <div class="bill-label">Bill / Invoice</div>
      <div class="bill-num">${order.orderNumber}</div>
      <div class="bill-date">${formatDate(order.createdAt)}</div>
    </div>
  </div>

  <!-- Shop Info -->
  <div class="shop-section">
    <div class="shop-section-grid">
      <div>
        <div class="section-label">Billed To</div>
        <div class="shop-name">${shopName}</div>
        ${ownerName ? `<div class="shop-sub">👤 ${ownerName}</div>` : ''}
        ${phone ? `<div class="shop-sub">📞 ${phone}</div>` : ''}
      </div>
      <div style="text-align:right;">
        <div class="section-label">Status</div>
        <div class="status-badge">${order.status}</div>
        <div style="font-size:11px;color:#94A3B8;margin-top:6px;">
          ${formatDateTime(order.createdAt)}
        </div>
      </div>
    </div>
  </div>

  <!-- Items Table -->
  <div class="table-section">
    <div class="table-title">Order Items (${order.items.length})</div>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th style="text-align:center;">Qty / Unit</th>
          <th style="text-align:right;">Rate</th>
          <th style="text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div class="subtotals">
      <div class="subtotal-row">
        <span>Subtotal</span>
        <span>Rs. ${order.subtotal.toLocaleString()}</span>
      </div>
    </div>
  </div>

  <!-- Total -->
  <div class="total-section">
    <div class="total-box">
      <div class="total-label">Total Amount Due</div>
      <div class="total-amount">Rs. ${order.total.toLocaleString()}</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <p>
      <strong>AS Traders</strong> — Wholesale Supplier<br/>
      Shukriya for your business. Koi sawaal ho to rabta karen.<br/>
    </p>
    <p class="watermark">Generated by AS Traders App • ${formatDateTime(new Date().toISOString())}</p>
  </div>

</div>
</body>
</html>`;
};

// ─── Main Screen ────────────────────────────────────────────────────────────
const OrderDetailsScreen = () => {
  const route = useRoute<Route>();
  const { orderId } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Bill upload state
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadImageUri, setUploadImageUri] = useState<string | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  // View uploaded bill
  const [viewBillVisible, setViewBillVisible] = useState(false);

  const loadOrder = useCallback(async () => {
    try {
      const res = await ordersAPI.getById(orderId);
      setOrder(res.data.data);
    } catch {
      Alert.alert('Error', 'Order load nahi ho saka');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { loadOrder(); }, [loadOrder]);

  // ── Generate & Share PDF ─────────────────────────────────────────────────
  const handleGeneratePDF = async () => {
    if (!order) return;
    setGenerating(true);
    try {
      const shop = typeof order.shopId === 'object' ? (order.shopId as unknown as Shop) : null;
      const html = buildBillHtml(order, shop);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Bill — ${order.orderNumber}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF Ready', `File saved at:\n${uri}`);
      }
    } catch (err) {
      Alert.alert('Error', 'PDF generate nahi ho saka. Dobara try karein.');
    } finally {
      setGenerating(false);
    }
  };

  // ── Pick image from gallery or camera ────────────────────────────────────
  const handlePickImage = async (source: 'camera' | 'gallery') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission Required',
        source === 'camera'
          ? 'Camera access chahiye. Settings se allow karein.'
          : 'Gallery access chahiye. Settings se allow karein.'
      );
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.6,
          base64: true,
        })
        : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.6,
          base64: true,
        });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert('Error', 'Image process nahi ho saki');
        return;
      }
      // Build data URI
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const dataUri = `data:${mimeType};base64,${asset.base64}`;
      // Check size (~5MB limit)
      if (dataUri.length > 7 * 1024 * 1024) {
        Alert.alert('Image too large', 'Choti image select karein (max ~5MB)');
        return;
      }
      setUploadImageUri(dataUri);
    }
  };

  // ── Upload bill to backend ────────────────────────────────────────────────
  const handleUploadBill = async () => {
    if (!uploadImageUri && !uploadDescription.trim()) {
      Alert.alert('Kuch toh bharo', 'Image ya description zaroor dein');
      return;
    }
    setUploading(true);
    try {
      const res = await ordersAPI.updateBill(orderId, {
        ...(uploadImageUri ? { billImageUrl: uploadImageUri } : {}),
        ...(uploadDescription.trim() ? { billDescription: uploadDescription.trim() } : {}),
      });
      setOrder(res.data.data);
      setUploadModalVisible(false);
      setUploadImageUri(null);
      setUploadDescription('');
      Alert.alert('✅ Upload Ho Gaya', 'Bill successfully save ho gaya');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Upload fail ho gaya';
      Alert.alert('Error', msg);
    } finally {
      setUploading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Order nahi mila</Text>
      </View>
    );
  }

  const shop = typeof order.shopId === 'object' ? (order.shopId as unknown as Shop) : null;
  const hasBill = !!(order.billImageUrl || order.billDescription);

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {/* ── Order Header Card ── */}
        <Card style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Text style={styles.orderNum}>{order.orderNumber}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: order.status === 'confirmed' ? COLORS.successLight : COLORS.dangerLight },
            ]}>
              <Text style={[
                styles.statusText,
                { color: order.status === 'confirmed' ? COLORS.success : COLORS.danger },
              ]}>
                {order.status}
              </Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Shop</Text>
            <Text style={styles.metaValue}>{shop?.name ?? '—'}</Text>
          </View>
          {(shop as any)?.ownerName ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Owner</Text>
              <Text style={styles.metaValue}>{(shop as any).ownerName}</Text>
            </View>
          ) : null}
          {(shop as any)?.phone ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Phone</Text>
              <Text style={styles.metaValue}>{(shop as any).phone}</Text>
            </View>
          ) : null}
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{formatDateTime(order.createdAt)}</Text>
          </View>
        </Card>

        {/* ── Action Buttons ── */}
        <View style={styles.actionRow}>
          {/* Generate PDF Bill */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={handleGeneratePDF}
            disabled={generating}
            activeOpacity={0.8}
          >
            {generating ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <>
                <Text style={styles.actionBtnIcon}>🧾</Text>
                <Text style={styles.actionBtnText}>Generate Bill</Text>
                <Text style={styles.actionBtnSub}>PDF / Share</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Upload Physical Bill */}
          <TouchableOpacity
            style={[styles.actionBtn, hasBill ? styles.actionBtnSuccess : styles.actionBtnSecondary]}
            onPress={() => setUploadModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnIcon}>{hasBill ? '✅' : '📷'}</Text>
            <Text style={[styles.actionBtnText, hasBill && { color: COLORS.success }]}>
              {hasBill ? 'Bill Uploaded' : 'Upload Bill'}
            </Text>
            <Text style={[styles.actionBtnSub, hasBill && { color: COLORS.success }]}>
              {hasBill ? 'Tap to update' : 'Photo + Note'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Uploaded Bill Preview ── */}
        {hasBill && (
          <Card style={styles.uploadedBillCard}>
            <View style={styles.uploadedHeader}>
              <Text style={styles.uploadedTitle}>📎 Physical Bill</Text>
              <TouchableOpacity onPress={() => setViewBillVisible(true)}>
                <Text style={styles.viewFullBtn}>View Full →</Text>
              </TouchableOpacity>
            </View>
            {order.billImageUrl ? (
              <TouchableOpacity onPress={() => setViewBillVisible(true)} activeOpacity={0.85}>
                <Image
                  source={{ uri: order.billImageUrl }}
                  style={styles.billThumb}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : null}
            {order.billDescription ? (
              <View style={styles.billDescBox}>
                <Text style={styles.billDescLabel}>Description</Text>
                <Text style={styles.billDescText}>{order.billDescription}</Text>
              </View>
            ) : null}
          </Card>
        )}

        {/* ── Order Items ── */}
        <Text style={styles.sectionTitle}>Order Items ({order.items.length})</Text>
        {order.items.map((item, idx) => (
          <Card key={idx} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{item.productName}</Text>
              <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemQty}>
                {item.quantity} {item.unit}  ×  {formatCurrency(item.rate)}
              </Text>
            </View>
          </Card>
        ))}

        {/* ── Total ── */}
        <View style={styles.totalBox}>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Order Total</Text>
            <Text style={styles.totalAmount}>{formatCurrency(order.total)}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ══ Upload Bill Modal ════════════════════════════════════════════════ */}
      <Modal
        visible={uploadModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!uploading) setUploadModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📷 Bill Upload</Text>
              <TouchableOpacity
                onPress={() => {
                  if (!uploading) {
                    setUploadModalVisible(false);
                    setUploadImageUri(null);
                    setUploadDescription('');
                  }
                }}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Image Picker Buttons */}
              <Text style={styles.modalSectionLabel}>Bill Photo (Optional)</Text>
              <View style={styles.imagePickerRow}>
                <TouchableOpacity
                  style={styles.imagePickerBtn}
                  onPress={() => handlePickImage('camera')}
                  disabled={uploading}
                >
                  <Text style={styles.imagePickerIcon}>📸</Text>
                  <Text style={styles.imagePickerText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.imagePickerBtn}
                  onPress={() => handlePickImage('gallery')}
                  disabled={uploading}
                >
                  <Text style={styles.imagePickerIcon}>🖼️</Text>
                  <Text style={styles.imagePickerText}>Gallery</Text>
                </TouchableOpacity>
              </View>

              {/* Image Preview */}
              {uploadImageUri ? (
                <View style={styles.previewContainer}>
                  <Image
                    source={{ uri: uploadImageUri }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => setUploadImageUri(null)}
                  >
                    <Text style={styles.removeImageText}>🗑️ Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.noImageBox}>
                  <Text style={styles.noImageText}>Koi image select nahi ki</Text>
                </View>
              )}

              {/* Description */}
              <Text style={[styles.modalSectionLabel, { marginTop: SPACING.md }]}>
                Description / Notes (Optional)
              </Text>
              <TextInput
                style={styles.descInput}
                placeholder="e.g. Original bill, thela se mila, date 10 Oct..."
                placeholderTextColor={COLORS.textMuted}
                value={uploadDescription}
                onChangeText={setUploadDescription}
                multiline
                numberOfLines={4}
                editable={!uploading}
              />

              {/* Order reference info */}
              <View style={styles.orderRefBox}>
                <Text style={styles.orderRefText}>
                  📦 {order.orderNumber}  •  {formatDate(order.createdAt)}  •  {formatCurrency(order.total)}
                </Text>
              </View>

              {/* Upload Button */}
              <TouchableOpacity
                style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
                onPress={handleUploadBill}
                disabled={uploading}
                activeOpacity={0.8}
              >
                {uploading ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.uploadBtnText}>✅ Save Bill</Text>
                )}
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══ View Full Bill Modal ════════════════════════════════════════════ */}
      <Modal
        visible={viewBillVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setViewBillVisible(false)}
      >
        <View style={styles.viewBillOverlay}>
          <View style={styles.viewBillCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📎 Physical Bill</Text>
              <TouchableOpacity onPress={() => setViewBillVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {order.billImageUrl ? (
                <Image
                  source={{ uri: order.billImageUrl }}
                  style={styles.fullBillImage}
                  resizeMode="contain"
                />
              ) : null}
              {order.billDescription ? (
                <View style={styles.billDescBox}>
                  <Text style={styles.billDescLabel}>Description</Text>
                  <Text style={[styles.billDescText, { fontSize: 14 }]}>
                    {order.billDescription}
                  </Text>
                </View>
              ) : null}
              <TouchableOpacity
                style={[styles.uploadBtn, { marginTop: SPACING.md }]}
                onPress={() => {
                  setViewBillVisible(false);
                  setTimeout(() => setUploadModalVisible(true), 300);
                }}
              >
                <Text style={styles.uploadBtnText}>✏️ Update Bill</Text>
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: 80 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: COLORS.danger, fontSize: 16, fontFamily: FONTS.semiBold },

  // Header card
  headerCard: { padding: SPACING.md, marginBottom: SPACING.md },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.sm,
  },
  orderNum: { fontSize: 18, fontFamily: FONTS.heavy, color: COLORS.primary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: BORDER_RADIUS.round },
  statusText: { fontSize: 12, fontFamily: FONTS.bold, textTransform: 'capitalize' },
  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 6,
  },
  metaLabel: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textSecondary },
  metaValue: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.text },

  // Action Buttons Row
  actionRow: {
    flexDirection: 'row', gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  actionBtn: {
    flex: 1, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, alignItems: 'center',
    ...SHADOWS.sm,
  },
  actionBtnPrimary: { backgroundColor: COLORS.primary },
  actionBtnSecondary: { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border },
  actionBtnSuccess: { backgroundColor: COLORS.successLight, borderWidth: 1.5, borderColor: COLORS.success },
  actionBtnIcon: { fontSize: 24, marginBottom: 4 },
  actionBtnText: {
    fontSize: 13, fontFamily: FONTS.bold, color: COLORS.white, textAlign: 'center',
  },
  actionBtnSub: {
    fontSize: 10, fontFamily: FONTS.regular, color: 'rgba(255,255,255,0.75)',
    marginTop: 2, textAlign: 'center',
  },

  // Uploaded bill preview
  uploadedBillCard: { padding: SPACING.md, marginBottom: SPACING.md },
  uploadedHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.sm,
  },
  uploadedTitle: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.text },
  viewFullBtn: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.primary },
  billThumb: {
    width: '100%', height: 160, borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm, backgroundColor: COLORS.surface,
  },
  billDescBox: {
    backgroundColor: COLORS.primaryLight, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm, marginTop: SPACING.xs,
  },
  billDescLabel: {
    fontSize: 10, fontFamily: FONTS.bold, color: COLORS.primary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2,
  },
  billDescText: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.text },

  // Items
  sectionTitle: {
    fontSize: 13, fontFamily: FONTS.bold, color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: SPACING.sm, marginTop: SPACING.xs,
  },
  itemCard: { padding: SPACING.md, marginBottom: SPACING.xs },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.text, flex: 1 },
  itemTotal: { fontSize: 14, fontFamily: FONTS.heavy, color: COLORS.primary },
  itemDetails: { marginTop: 4 },
  itemQty: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textSecondary },

  // Total
  totalBox: { marginTop: SPACING.sm },
  divider: { height: 1, backgroundColor: COLORS.border, marginBottom: SPACING.sm },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 4,
  },
  totalLabel: { fontSize: 15, fontFamily: FONTS.semiBold, color: COLORS.text },
  totalAmount: { fontSize: 22, fontFamily: FONTS.heavy, color: COLORS.primary },

  // Upload Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.text },
  modalClose: { fontSize: 20, color: COLORS.textMuted, padding: 4 },
  modalSectionLabel: {
    fontSize: 12, fontFamily: FONTS.bold, color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.sm,
  },

  // Image picker
  imagePickerRow: {
    flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md,
  },
  imagePickerBtn: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md,
    alignItems: 'center', backgroundColor: COLORS.surface,
  },
  imagePickerIcon: { fontSize: 28, marginBottom: 4 },
  imagePickerText: { fontSize: 13, fontFamily: FONTS.semiBold, color: COLORS.text },

  previewContainer: { alignItems: 'center', marginBottom: SPACING.sm },
  previewImage: {
    width: '100%', height: 220, borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  removeImageBtn: {
    marginTop: SPACING.sm, paddingVertical: 6, paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.dangerLight,
  },
  removeImageText: { fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.danger },

  noImageBox: {
    height: 80, borderRadius: BORDER_RADIUS.md, borderWidth: 1.5,
    borderColor: COLORS.border, borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.surface, marginBottom: SPACING.sm,
  },
  noImageText: { fontSize: 13, fontFamily: FONTS.regular, color: COLORS.textMuted },

  descInput: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, fontSize: 14, fontFamily: FONTS.regular,
    color: COLORS.text, backgroundColor: COLORS.surface,
    minHeight: 90, textAlignVertical: 'top',
  },

  orderRefBox: {
    backgroundColor: COLORS.primaryLight, borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm, marginTop: SPACING.md,
    alignItems: 'center',
  },
  orderRefText: {
    fontSize: 12, fontFamily: FONTS.semiBold, color: COLORS.primary,
  },

  uploadBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, alignItems: 'center', marginTop: SPACING.md,
  },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadBtnText: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.white },

  // View Full Bill Modal
  viewBillOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', padding: SPACING.md,
  },
  viewBillCard: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md, width: '100%', maxHeight: '88%',
  },
  fullBillImage: {
    width: '100%', height: 380, borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface, marginBottom: SPACING.md,
  },
});

export default OrderDetailsScreen;
