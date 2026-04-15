import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
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
  <View className="w-16 h-14 items-center justify-end">
    {/* Barras */}
    <View className="flex-row items-end gap-1.5 mb-1">
      <View className="w-3 h-[22px] rounded bg-indigo-300" />
      <View className="w-3 h-[38px] rounded bg-indigo-300" />
      <View className="w-3 h-[14px] rounded bg-indigo-300" />
    </View>
    {/* Arco inferior */}
    <View
      className="w-14 h-3.5 border-2 border-t-0 border-indigo-400"
      style={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
    />
  </View>
);

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
      className="flex-1 bg-slate-900"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Bloque superior decorativo */}
        <View
          className="absolute -top-20 -left-16 w-72 h-72 rounded-full bg-indigo-700 opacity-25"
        />

        <View className="flex-1 justify-center px-6 py-16">
          {/* Header */}
          <View className="items-center mb-10">
            <AppLogo />
            <Text className="text-4xl font-extrabold text-slate-100 mt-4 tracking-tight">
              AdminProp
            </Text>
            <Text className="text-sm text-slate-400 mt-1 tracking-wide">
              Gestión Inmobiliaria
            </Text>
          </View>

          {/* Card del formulario */}
          <View className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
            <Text className="text-lg font-bold text-slate-200 mb-5">Iniciá sesión</Text>

            {!isConnected && (
              <View className="bg-amber-950 rounded-xl p-3 mb-4 border border-amber-800">
                <Text className="text-yellow-300 text-sm text-center">📵 Sin conexión a internet</Text>
              </View>
            )}

            {error && (
              <View className="bg-red-950 rounded-xl p-3 mb-4 border border-red-800">
                <Text className="text-red-300 text-sm">❌ {error}</Text>
              </View>
            )}

            {/* Campo usuario */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-widest">
                Usuario
              </Text>
              <TextInput
                className={`bg-slate-900 border-2 rounded-xl px-4 py-3 text-base text-slate-100 ${
                  userFocused ? 'border-indigo-500' : 'border-slate-600'
                }`}
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

            {/* Campo contraseña */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-widest">
                Contraseña
              </Text>
              <TextInput
                className={`bg-slate-900 border-2 rounded-xl px-4 py-3 text-base text-slate-100 ${
                  passFocused ? 'border-indigo-500' : 'border-slate-600'
                }`}
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
              className={`rounded-xl py-4 items-center mt-2 ${
                isLoading ? 'bg-slate-600' : 'bg-indigo-500'
              }`}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-base font-bold tracking-wide">Iniciar Sesión</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Acceso inquilinos */}
          <View className="mt-7 items-center gap-1.5">
            <Text className="text-sm text-slate-500">¿Sos inquilino?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PortalLogin')} activeOpacity={0.7}>
              <Text className="text-sm font-bold text-emerald-400">Accedé al portal de pagos →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
