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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { login } from '@inno/shared';
import { AppDispatch, RootState } from '../store/store';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/** Logo AdminProp — 3 barras de distinta altura + arco inferior */
const AppLogo = () => (
  <View style={logo.wrapper}>
    {/* Barras */}
    <View style={logo.barsRow}>
      <View style={[logo.bar, logo.barShort]} />
      <View style={[logo.bar, logo.barTall]} />
      <View style={[logo.bar, logo.barMid]} />
    </View>
    {/* Arco inferior */}
    <View style={logo.arc} />
  </View>
);

const logo = StyleSheet.create({
  wrapper: {
    width: 68,
    height: 52,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginBottom: 4,
  },
  bar: {
    width: 12,
    borderRadius: 3,
    backgroundColor: '#a5b4fc',
  },
  barShort: { height: 22 },
  barTall:  { height: 38 },
  barMid:   { height: 14 },
  arc: {
    width: 56,
    height: 14,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderWidth: 2.5,
    borderTopWidth: 0,
    borderColor: '#818cf8',
  },
});

export const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userFocused, setUserFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const { isConnected } = useNetworkStatus();
  const navigation = useNavigation<any>();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor ingresá usuario y contraseña');
      return;
    }
    if (!isConnected) {
      Alert.alert('Sin conexión', 'Necesitás conexión a internet para iniciar sesión');
      return;
    }
    try {
      await dispatch(login({ username, password })).unwrap();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Credenciales incorrectas');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Bloque superior decorativo */}
        <View style={styles.topBlob} />

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <AppLogo />
            <Text style={styles.title}>AdminProp</Text>
            <Text style={styles.subtitle}>Gestión Inmobiliaria</Text>
          </View>

          {/* Card del formulario */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Iniciá sesión</Text>

            {!isConnected && (
              <View style={styles.offlineBadge}>
                <Text style={styles.offlineBadgeText}>📵 Sin conexión a internet</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>❌ {error}</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Usuario</Text>
              <TextInput
                style={[styles.input, userFocused && styles.inputFocused]}
                placeholder="Ingresá tu usuario"
                placeholderTextColor="#9ca3af"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                onFocus={() => setUserFocused(true)}
                onBlur={() => setUserFocused(false)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={[styles.input, passFocused && styles.inputFocused]}
                placeholder="Ingresá tu contraseña"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Acceso inquilinos */}
          <View style={styles.inquilinoSection}>
            <Text style={styles.inquilinoHint}>¿Sos inquilino?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PortalLogin')} activeOpacity={0.7}>
              <Text style={styles.inquilinoLink}>Accedé al portal de pagos →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scroll: {
    flexGrow: 1,
  },
  topBlob: {
    position: 'absolute',
    top: -80,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#4338ca',
    opacity: 0.25,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f1f5f9',
    marginTop: 14,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#f1f5f9',
  },
  inputFocused: {
    borderColor: '#6366f1',
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#475569',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  errorContainer: {
    backgroundColor: '#450a0a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#991b1b',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
  },
  offlineBadge: {
    backgroundColor: '#451a03',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#92400e',
  },
  offlineBadgeText: {
    color: '#fcd34d',
    fontSize: 13,
    textAlign: 'center',
  },
  inquilinoSection: {
    marginTop: 28,
    alignItems: 'center',
    gap: 6,
  },
  inquilinoHint: {
    fontSize: 13,
    color: '#64748b',
  },
  inquilinoLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34d399',
  },
});
