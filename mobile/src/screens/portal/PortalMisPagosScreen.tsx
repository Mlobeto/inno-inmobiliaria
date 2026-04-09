import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { fetchMisPagos, portalLogout, Receipt, PaymentMethod } from '../../store/portalSlice';
import { AppDispatch, RootState } from '../../store/store';
import { PortalStackParamList } from '../../navigation/PortalNavigator';

type NavProp = StackNavigationProp<PortalStackParamList, 'MisPagos'>;

// ─── Helpers ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  paid: { label: 'Pagado', color: '#166534', bg: '#dcfce7' },
  pending: { label: 'Pendiente', color: '#92400e', bg: '#fef3c7' },
};

const VOUCHER_CONFIG: Record<string, { label: string; color: string }> = {
  none: { label: '', color: '' },
  pending_review: { label: '🕐 En revisión', color: '#d97706' },
  approved: { label: '✅ Aprobado', color: '#166534' },
  rejected: { label: '❌ Rechazado', color: '#dc2626' },
};

const METHOD_ICONS: Record<string, string> = {
  cbu: '🏦',
  alias: '🔤',
  qr: '📱',
  transferencia: '💳',
};

function formatPeriod(period: string) {
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  if (period && period.includes('-')) {
    const [y, m] = period.split('-');
    const monthName = months[parseInt(m, 10) - 1] ?? m;
    return `${monthName} ${y}`;
  }
  return period;
}

function formatCurrency(amount: string | number, currency = 'ARS') {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(num);
}

// ─── Receipt Card ──────────────────────────────────────────────────────────

const ReceiptCard = ({ receipt, onPress }: { receipt: Receipt; onPress: () => void }) => {
  const status = STATUS_CONFIG[receipt.status] ?? STATUS_CONFIG.pending;
  const voucher = VOUCHER_CONFIG[receipt.voucherStatus ?? 'none'];
  const canUpload = receipt.status === 'pending' && receipt.voucherStatus !== 'approved';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.periodText}>
          {receipt.installmentNumber && receipt.totalInstallments
            ? `Cuota ${receipt.installmentNumber}/${receipt.totalInstallments} — `
            : ''}
          {formatPeriod(receipt.period)}
        </Text>
        <View style={[styles.badge, { backgroundColor: status.bg }]}>
          <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <Text style={styles.amountText}>{formatCurrency(receipt.amount, receipt.originalCurrency || 'ARS')}</Text>

      {voucher.label ? (
        <Text style={[styles.voucherStatus, { color: voucher.color }]}>{voucher.label}</Text>
      ) : null}

      {receipt.voucherStatus === 'rejected' && receipt.voucherRejReason ? (
        <Text style={styles.rejReason}>Motivo: {receipt.voucherRejReason}</Text>
      ) : null}

      {receipt.paidAt ? (
        <Text style={styles.paidAt}>
          Pagado el {new Date(receipt.paidAt).toLocaleDateString('es-AR')}
        </Text>
      ) : null}

      {canUpload && (
        <TouchableOpacity style={styles.uploadButton} onPress={onPress}>
          <Text style={styles.uploadButtonText}>
            {receipt.voucherUrl ? '🔄 Reenviar comprobante' : '📎 Subir comprobante'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Payment Method Item ───────────────────────────────────────────────────

const PaymentMethodItem = ({ method }: { method: PaymentMethod }) => {
  const icon = METHOD_ICONS[method.type] ?? '💰';
  return (
    <View style={styles.methodItem}>
      <Text style={styles.methodIcon}>{icon}</Text>
      <View style={styles.methodInfo}>
        <Text style={styles.methodLabel}>{method.label}</Text>
        <Text style={styles.methodValue} selectable>{method.value}</Text>
      </View>
    </View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────

export const PortalMisPagosScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NavProp>();
  const { client, receipts, paymentMethods, isLoading, error } = useSelector((state: RootState) => state.portal);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchMisPagos());
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchMisPagos());
    setRefreshing(false);
  }, [dispatch]);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => dispatch(portalLogout()) },
    ]);
  };

  const pendientes = receipts.filter((r) => r.status === 'pending');
  const pagados = receipts.filter((r) => r.status === 'paid');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {client?.name?.split(' ')[0] ?? 'Inquilino'}</Text>
          <Text style={styles.subGreeting}>Tus cuotas y pagos</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoading && !refreshing ? (
          <ActivityIndicator size="large" color="#16a34a" style={{ marginTop: 40 }} />
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => dispatch(fetchMisPagos())}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Cuotas pendientes */}
        {pendientes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏳ Pendientes ({pendientes.length})</Text>
            {pendientes.map((r) => (
              <ReceiptCard
                key={r.id}
                receipt={r}
                onPress={() => navigation.navigate('SubirComprobante', { receiptId: r.id, period: r.period })}
              />
            ))}
          </View>
        )}

        {/* Historial pagado */}
        {pagados.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ Historial de pagos ({pagados.length})</Text>
            {pagados.map((r) => (
              <ReceiptCard key={r.id} receipt={r} onPress={() => {}} />
            ))}
          </View>
        )}

        {!isLoading && receipts.length === 0 && !error && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>🎉 No tenés cuotas pendientes</Text>
          </View>
        )}

        {/* Métodos de pago */}
        {paymentMethods.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💳 Cómo pagar</Text>
            <View style={styles.methodsCard}>
              {paymentMethods.map((m) => (
                <PaymentMethodItem key={m.id} method={m} />
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  header: {
    backgroundColor: '#16a34a',
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subGreeting: { fontSize: 13, color: '#dcfce7', marginTop: 2 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  logoutText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  periodText: { fontSize: 14, fontWeight: '600', color: '#374151', flex: 1 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  amountText: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  voucherStatus: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  rejReason: { fontSize: 12, color: '#6b7280', fontStyle: 'italic', marginBottom: 4 },
  paidAt: { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
  uploadButton: {
    marginTop: 10,
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#16a34a',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  uploadButtonText: { color: '#16a34a', fontWeight: '700', fontSize: 14 },
  methodsCard: { backgroundColor: '#fff', borderRadius: 12, padding: 4, elevation: 2 },
  methodItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  methodIcon: { fontSize: 24, marginRight: 12 },
  methodInfo: { flex: 1 },
  methodLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  methodValue: { fontSize: 15, color: '#111827', marginTop: 2 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyStateText: { fontSize: 18, color: '#4b7c59' },
  errorBox: { margin: 16, backgroundColor: '#fef2f2', borderRadius: 10, padding: 16, alignItems: 'center' },
  errorText: { color: '#b91c1c', fontSize: 14, marginBottom: 8 },
  retryText: { color: '#2563eb', fontWeight: '600' },
});
