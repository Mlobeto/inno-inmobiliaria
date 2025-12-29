import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllProperties } from '@inno/shared/src/store/slices/propertiesSlice';
import { AppDispatch, RootState } from '../store/store';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface Property {
  propertyId: number;
  title: string;
  address: string;
  type: 'venta' | 'alquiler';
  price: number;
  status: string;
  images: string[];
  bedrooms?: number;
  bathrooms?: number;
  surface?: number;
}

export const PropertiesScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { properties, isLoading } = useSelector((state: RootState) => state.properties);
  const { isConnected } = useNetworkStatus();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    if (isConnected) {
      try {
        await dispatch(fetchAllProperties()).unwrap();
      } catch (error) {
        console.error('Error al cargar propiedades:', error);
      }
    }
  };

  const onRefresh = async () => {
    if (!isConnected) {
      return;
    }
    setRefreshing(true);
    await loadProperties();
    setRefreshing(false);
  };

  const renderProperty = ({ item }: { item: Property }) => (
    <TouchableOpacity style={styles.card}>
      {/* Imagen */}
      <View style={styles.imageContainer}>
        {item.images && item.images.length > 0 ? (
          <Image
            source={{ uri: item.images[0] }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.imagePlaceholderText}>🏠</Text>
          </View>
        )}
        <View style={[styles.badge, item.type === 'venta' ? styles.badgeSale : styles.badgeRent]}>
          <Text style={styles.badgeText}>
            {item.type === 'venta' ? '💰 Venta' : '🔑 Alquiler'}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title || 'Propiedad sin título'}
        </Text>
        <Text style={styles.cardAddress} numberOfLines={1}>
          📍 {item.address}
        </Text>

        {/* Características */}
        <View style={styles.features}>
          {item.surface && (
            <View style={styles.feature}>
              <Text style={styles.featureText}>📐 {item.surface}m²</Text>
            </View>
          )}
          {item.bedrooms && (
            <View style={styles.feature}>
              <Text style={styles.featureText}>🛏️ {item.bedrooms}</Text>
            </View>
          )}
          {item.bathrooms && (
            <View style={styles.feature}>
              <Text style={styles.featureText}>🚿 {item.bathrooms}</Text>
            </View>
          )}
        </View>

        {/* Precio */}
        <Text style={styles.price}>
          ${item.price?.toLocaleString('es-AR') || 'Consultar'}
        </Text>

        {/* Estado */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusDot,
              item.status === 'available' ? styles.statusAvailable : styles.statusUnavailable,
            ]}
          />
          <Text style={styles.statusText}>
            {item.status === 'available' ? 'Disponible' : 'No disponible'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🏘️</Text>
      <Text style={styles.emptyTitle}>No hay propiedades</Text>
      <Text style={styles.emptyText}>
        {!isConnected
          ? 'Sin conexión - Mostrando datos guardados'
          : 'No hay propiedades cargadas'}
      </Text>
    </View>
  );

  if (isLoading && properties.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Cargando propiedades...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={properties}
        renderItem={renderProperty}
        keyExtractor={(item) => item.propertyId.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            enabled={isConnected}
            tintColor="#3b82f6"
          />
        }
        ListEmptyComponent={renderEmpty}
      />

      {/* Floating offline indicator */}
      {!isConnected && properties.length > 0 && (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>
            📵 Mostrando datos guardados
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 48,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeSale: {
    backgroundColor: '#10b981',
  },
  badgeRent: {
    backgroundColor: '#3b82f6',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  cardAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  features: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  feature: {
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusAvailable: {
    backgroundColor: '#10b981',
  },
  statusUnavailable: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  offlineIndicator: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    elevation: 3,
  },
  offlineText: {
    color: '#92400e',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
});
