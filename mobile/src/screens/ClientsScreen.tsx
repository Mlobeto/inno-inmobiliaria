import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchClients } from '@inno/shared';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const ClientsScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const { clients, isLoading } = useAppSelector((state) => state.clients);
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isConnected && isInternetReachable) {
      dispatch(fetchClients());
    }
  }, [dispatch, isConnected, isInternetReachable]);

  const onRefresh = async () => {
    if (!isConnected || !isInternetReachable) return;
    setRefreshing(true);
    await dispatch(fetchClients());
    setRefreshing(false);
  };

  const filteredClients = clients.filter((client) =>
    client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.dni?.includes(searchQuery)
  );

  const renderClientCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="bg-white/5 rounded-2xl border border-white/10 p-5 mb-4"
      onPress={() => {
        // Navegar a detalles del cliente (futuro)
      }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center flex-1">
          <View className="w-12 h-12 rounded-full bg-blue-500/20 items-center justify-center mr-3">
            <Text className="text-blue-400 text-xl font-bold">
              {item.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-lg font-semibold" numberOfLines={1}>
              {item.name || 'Sin nombre'}
            </Text>
            <Text className="text-slate-400 text-sm">
              🪪 {item.dni || 'Sin DNI'}
            </Text>
          </View>
        </View>
      </View>

      <View className="space-y-2">
        {item.email && (
          <View className="flex-row items-center">
            <Text className="text-slate-400 text-sm">✉️ {item.email}</Text>
          </View>
        )}
        {item.phone && (
          <View className="flex-row items-center">
            <Text className="text-slate-400 text-sm">📱 {item.phone}</Text>
          </View>
        )}
        {item.address && (
          <View className="flex-row items-center">
            <Text className="text-slate-400 text-sm" numberOfLines={1}>
              📍 {item.address}{item.city ? `, ${item.city}` : ''}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-slate-900">
      {/* Header con búsqueda */}
      <View className="px-6 pt-6 pb-4 border-b border-white/10">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-3xl font-bold text-white">Clientes</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddClient' as never)}
            className="bg-emerald-500 px-4 py-2 rounded-xl"
          >
            <Text className="text-white font-semibold">➕ Nuevo</Text>
          </TouchableOpacity>
        </View>

        {/* Barra de búsqueda */}
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por nombre, email o DNI..."
          placeholderTextColor="#94a3b8"
          className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"
        />

        {/* Indicador offline */}
        {(!isConnected || !isInternetReachable) && (
          <View className="mt-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
            <Text className="text-yellow-400 text-sm text-center">
              📵 Mostrando datos guardados
            </Text>
          </View>
        )}
      </View>

      {/* Lista de clientes */}
      {isLoading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#60a5fa" />
          <Text className="text-slate-400 mt-4">Cargando clientes...</Text>
        </View>
      ) : filteredClients.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-6xl mb-4">👥</Text>
          <Text className="text-white text-xl font-semibold mb-2">
            {searchQuery ? 'No se encontraron clientes' : 'No hay clientes'}
          </Text>
          <Text className="text-slate-400 text-center mb-6">
            {searchQuery
              ? 'Intenta con otro término de búsqueda'
              : 'Comienza agregando tu primer cliente'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              onPress={() => navigation.navigate('AddClient' as never)}
              className="bg-emerald-500 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">➕ Agregar Cliente</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredClients}
          renderItem={renderClientCard}
          keyExtractor={(item) => item.idClient?.toString() || Math.random().toString()}
          contentContainerStyle={{ padding: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#60a5fa"
              enabled={isConnected && isInternetReachable}
            />
          }
        />
      )}

      {/* Contador */}
      {filteredClients.length > 0 && (
        <View className="px-6 py-3 border-t border-white/10">
          <Text className="text-slate-400 text-sm text-center">
            {searchQuery
              ? `${filteredClients.length} de ${clients.length} clientes`
              : `${clients.length} cliente${clients.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
      )}
    </View>
  );
};

export default ClientsScreen;
