import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { offlineQueue } from '../utils/offlineQueue';

/**
 * Indicador visual de estado offline
 * Muestra banner amarillo cuando no hay conexión
 */
export const OfflineBanner: React.FC = () => {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const pendingCount = offlineQueue.getPendingCount();

  if (isConnected && isInternetReachable) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        📵 Sin conexión
      </Text>
      {pendingCount > 0 && (
        <Text style={styles.pending}>
          {pendingCount} cambio{pendingCount > 1 ? 's' : ''} pendiente{pendingCount > 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#f59e0b',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  pending: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 4,
  },
});
