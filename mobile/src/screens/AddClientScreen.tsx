import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createClient, clearError } from '@inno/shared';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { queueAction } from '../utils/offlineQueue';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FormData {
  cuil: string;
  name: string;
  email: string;
  phone: string;
  dni: string;
  address: string;
  city: string;
}

interface ValidationErrors {
  cuil?: string;
  email?: string;
  phone?: string;
}

const AddClientScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const { isCreating, error } = useAppSelector((state: any) => state.clients);
  const [localSuccess, setLocalSuccess] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    cuil: '',
    name: '',
    email: '',
    phone: '',
    dni: '',
    address: '',
    city: '',
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  // Validaciones
  const validateCuil = (cuil: string): string | undefined => {
    if (!cuil) return undefined;
    const cuilPattern = /^\d{2}-\d{8}-\d{1}$/;
    if (!cuilPattern.test(cuil)) {
      return 'Formato: XX-XXXXXXXX-X';
    }
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email) return undefined;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return 'Email inválido';
    }
    return undefined;
  };

  const validatePhone = (phone: string): string | undefined => {
    if (!phone) return undefined;
    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
      return '10 dígitos sin 0 ni 15';
    }
    return undefined;
  };

  useEffect(() => {
    const errors: ValidationErrors = {};
    if (touched.cuil) {
      const cuilError = validateCuil(formData.cuil);
      if (cuilError) errors.cuil = cuilError;
    }
    if (touched.email) {
      const emailError = validateEmail(formData.email);
      if (emailError) errors.email = emailError;
    }
    if (touched.phone) {
      const phoneError = validatePhone(formData.phone);
      if (phoneError) errors.phone = phoneError;
    }
    setValidationErrors(errors);
  }, [formData, touched]);

  useEffect(() => {
    if (localSuccess) {
      Alert.alert(
        '✅ Cliente creado',
        isConnected && isInternetReachable
          ? '¡Cliente creado exitosamente!'
          : 'Cliente guardado localmente. Se sincronizará cuando tengas conexión.',
        [
          {
            text: 'OK',
            onPress: () => {
              setLocalSuccess(false);
              dispatch(clearError());
              navigation.goBack();
            },
          },
        ]
      );
    }
  }, [localSuccess, navigation, isConnected, isInternetReachable, dispatch]);

  const handleChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const handleSubmit = async () => {
    const errors: ValidationErrors = {};
    const cuilError = validateCuil(formData.cuil);
    const emailError = validateEmail(formData.email);
    const phoneError = validatePhone(formData.phone);

    if (cuilError) errors.cuil = cuilError;
    if (emailError) errors.email = emailError;
    if (phoneError) errors.phone = phoneError;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setTouched({ cuil: true, email: true, phone: true });
      Alert.alert('❌ Errores de validación', 'Por favor, corrige los errores');
      return;
    }

    if (!formData.name || !formData.cuil || !formData.phone || 
        !formData.address || !formData.city || !formData.dni) {
      Alert.alert('❌ Campos incompletos', 'Completa todos los campos requeridos');
      return;
    }

    try {
      if (!isConnected || !isInternetReachable) {
        await AsyncStorage.setItem(`@inno:client_${Date.now()}`, JSON.stringify(formData));
        await queueAction({ type: 'CREATE_CLIENT', data: formData });
        setLocalSuccess(true);
      } else {
        await dispatch(createClient(formData)).unwrap();
        setLocalSuccess(true);
      }
    } catch (err: any) {
      Alert.alert('❌ Error', err.message || 'Error al crear el cliente');
    }
  };

  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  const isOnline = isConnected && isInternetReachable;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>← Volver</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Crear Nuevo Cliente</Text>
            <Text style={styles.subtitle}>Completa la información del cliente</Text>
            {!isOnline && (
              <View style={styles.offlineWarning}>
                <Text style={styles.offlineText}>
                  📵 Sin conexión - Los datos se guardarán localmente
                </Text>
              </View>
            )}
          </View>

          {/* Estados */}
          {isCreating && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#60a5fa" />
              <Text style={styles.loadingText}>Creando cliente...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Formulario */}
          <View style={styles.formContainer}>
            {/* CUIL */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>📋 CUIL *</Text>
              <TextInput
                value={formData.cuil}
                onChangeText={(text) => handleChange('cuil', text)}
                onBlur={() => handleBlur('cuil')}
                placeholder="XX-XXXXXXXX-X"
                placeholderTextColor="#94a3b8"
                style={[styles.input, validationErrors.cuil && styles.inputError]}
                keyboardType="numeric"
                maxLength={13}
              />
              {validationErrors.cuil && (
                <Text style={styles.errorFieldText}>⚠️ {validationErrors.cuil}</Text>
              )}
            </View>

            {/* Nombre */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>👤 Nombre Completo *</Text>
              <TextInput
                value={formData.name}
                onChangeText={(text) => handleChange('name', text)}
                placeholder="Nombre del cliente"
                placeholderTextColor="#94a3b8"
                style={styles.input}
              />
            </View>

            {/* Email */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>✉️ Email</Text>
              <TextInput
                value={formData.email}
                onChangeText={(text) => handleChange('email', text)}
                onBlur={() => handleBlur('email')}
                placeholder="email@ejemplo.com"
                placeholderTextColor="#94a3b8"
                style={[styles.input, validationErrors.email && styles.inputError]}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {validationErrors.email && (
                <Text style={styles.errorFieldText}>⚠️ {validationErrors.email}</Text>
              )}
            </View>

            {/* Teléfono */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>📱 Teléfono Móvil *</Text>
              <TextInput
                value={formData.phone}
                onChangeText={(text) => handleChange('phone', text)}
                onBlur={() => handleBlur('phone')}
                placeholder="10 dígitos (sin 0 ni 15)"
                placeholderTextColor="#94a3b8"
                style={[styles.input, validationErrors.phone && styles.inputError]}
                keyboardType="phone-pad"
                maxLength={10}
              />
              {validationErrors.phone && (
                <Text style={styles.errorFieldText}>⚠️ {validationErrors.phone}</Text>
              )}
            </View>

            {/* DNI */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>🪪 DNI *</Text>
              <TextInput
                value={formData.dni}
                onChangeText={(text) => handleChange('dni', text)}
                placeholder="Número de DNI"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                keyboardType="numeric"
                maxLength={8}
              />
            </View>

            {/* Sección Domicilio */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📍 Información de Domicilio</Text>
            </View>

            {/* Dirección */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Dirección *</Text>
              <TextInput
                value={formData.address}
                onChangeText={(text) => handleChange('address', text)}
                placeholder="Calle y número"
                placeholderTextColor="#94a3b8"
                style={styles.input}
              />
            </View>

            {/* Ciudad */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Ciudad *</Text>
              <TextInput
                value={formData.city}
                onChangeText={(text) => handleChange('city', text)}
                placeholder="Ciudad"
                placeholderTextColor="#94a3b8"
                style={styles.input}
              />
            </View>

            {/* Botón */}
            {hasValidationErrors && (
              <View style={styles.validationWarning}>
                <Text style={styles.validationWarningText}>
                  ⚠️ Por favor, corrige los errores antes de continuar
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isCreating || hasValidationErrors}
              style={[
                styles.submitButton,
                (isCreating || hasValidationErrors) && styles.submitButtonDisabled,
              ]}
            >
              <Text style={styles.submitButtonText}>
                {isCreating
                  ? '⏳ Creando...'
                  : hasValidationErrors
                  ? '❌ Corrige los errores'
                  : isOnline
                  ? '💾 Crear Cliente'
                  : '📵 Guardar Localmente'}
              </Text>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    color: '#60a5fa',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#cbd5e1',
  },
  offlineWarning: {
    marginTop: 12,
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  offlineText: {
    color: '#fbbf24',
    fontSize: 14,
  },
  loadingContainer: {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: '#60a5fa',
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    color: '#cbd5e1',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 14,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
  },
  inputError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  errorFieldText: {
    color: '#f87171',
    fontSize: 12,
    marginTop: 4,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  validationWarning: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  validationWarningText: {
    color: '#f87171',
    fontSize: 14,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#475569',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default AddClientScreen;
