import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import {
  lookupTenant,
  portalLogin,
  clearPortalError,
  clearTenantInfo,
} from '../../store/portalSlice';
import { AppDispatch, RootState } from '../../store/store';

export const PortalLoginScreen = () => {
  // ── Paso 1: buscar inmobiliaria ──────────────────────────────────────────
  const [code, setCode] = useState('');
  // ── Paso 2: login con credenciales ──────────────────────────────────────
  const [email, setEmail] = useState('');
  const [cuil, setCuil] = useState('');

  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { isLoading, error, tenantLoading, tenantError, tenantInfo } = useSelector(
    (state: RootState) => state.portal
  );

  // ── Paso 1 ───────────────────────────────────────────────────────────────

  const handleBuscarTenant = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Ingresá el código de tu inmobiliaria');
      return;
    }
    await dispatch(lookupTenant(code.trim()));
  };

  const handleCambiarInmobiliaria = () => {
    dispatch(clearTenantInfo());
    setCode('');
    setEmail('');
    setCuil('');
  };

  // ── Paso 2 ───────────────────────────────────────────────────────────────

  const handleLogin = async () => {
    if (!email.trim() || !cuil.trim()) {
      Alert.alert('Error', 'Completá email y CUIL');
      return;
    }
    if (!tenantInfo) return;

    try {
      await dispatch(
        portalLogin({ email: email.trim(), cuil: cuil.trim(), tenantId: tenantInfo.tenantId })
      ).unwrap();
    } catch (err: any) {
      Alert.alert('Error', err || 'Credenciales inválidas');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>🔑</Text>
          <Text style={styles.title}>Portal Inquilinos</Text>
          <Text style={styles.subtitle}>Accedé a tus cuotas y pagos</Text>
        </View>

        <View style={styles.form}>
          {/* ── PASO 1: código inmobiliaria ─────────────────────────── */}
          {!tenantInfo ? (
            <>
              <Text style={styles.stepLabel}>Paso 1 — Tu inmobiliaria</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Código de inmobiliaria</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ej: admin21, miinmobiliaria"
                  value={code}
                  onChangeText={setCode}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!tenantLoading}
                  onSubmitEditing={handleBuscarTenant}
                  returnKeyType="search"
                />
                <Text style={styles.hint}>
                  Tu inmobiliaria te habrá enviado este código junto al enlace de la app.
                </Text>
              </View>

              {tenantError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>❌ {tenantError}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.button, tenantLoading && styles.buttonDisabled]}
                onPress={handleBuscarTenant}
                disabled={tenantLoading}
              >
                {tenantLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Buscar inmobiliaria →</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            /* ── PASO 2: credenciales ─────────────────────────────────── */
            <>
              {/* Confirmación de la inmobiliaria encontrada */}
              <View style={styles.tenantCard}>
                {tenantInfo.logo ? (
                  <Image source={{ uri: tenantInfo.logo }} style={styles.tenantLogo} resizeMode="contain" />
                ) : (
                  <Text style={styles.tenantIcon}>🏢</Text>
                )}
                <View style={styles.tenantCardInfo}>
                  <Text style={styles.tenantCardLabel}>Inmobiliaria</Text>
                  <Text style={styles.tenantCardName}>{tenantInfo.businessName}</Text>
                </View>
                <TouchableOpacity onPress={handleCambiarInmobiliaria} style={styles.changeBtn}>
                  <Text style={styles.changeBtnText}>Cambiar</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.stepLabel}>Paso 2 — Tus datos</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="tu@email.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>CUIL (solo números)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="20123456789"
                  value={cuil}
                  onChangeText={setCuil}
                  keyboardType="numeric"
                  editable={!isLoading}
                />
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>❌ {error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Ingresar</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              dispatch(clearPortalError());
              dispatch(clearTenantInfo());
              navigation.goBack();
            }}
          >
            <Text style={styles.backText}>← Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 52, marginBottom: 10 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#166534' },
  subtitle: { fontSize: 14, color: '#4b7c59', marginTop: 4 },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  stepLabel: { fontSize: 12, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    color: '#111827',
  },
  hint: { fontSize: 12, color: '#9ca3af', marginTop: 5, lineHeight: 16 },
  errorContainer: { backgroundColor: '#fef2f2', borderRadius: 8, padding: 10, marginBottom: 12 },
  errorText: { color: '#b91c1c', fontSize: 14 },
  button: {
    backgroundColor: '#16a34a',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { backgroundColor: '#86efac' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  backButton: { alignItems: 'center', marginTop: 20 },
  backText: { color: '#6b7280', fontSize: 14 },
  // Tenant card
  tenantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  tenantLogo: { width: 40, height: 40, borderRadius: 8, marginRight: 10 },
  tenantIcon: { fontSize: 28, marginRight: 10 },
  tenantCardInfo: { flex: 1 },
  tenantCardLabel: { fontSize: 11, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' },
  tenantCardName: { fontSize: 15, fontWeight: 'bold', color: '#166534' },
  changeBtn: { paddingHorizontal: 10, paddingVertical: 5 },
  changeBtnText: { color: '#2563eb', fontWeight: '600', fontSize: 13 },
});
