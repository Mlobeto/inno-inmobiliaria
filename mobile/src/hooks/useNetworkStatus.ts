import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string | null;
}

/**
 * Hook para detectar estado de conexión en tiempo real
 * 
 * @example
 * const { isConnected, isInternetReachable } = useNetworkStatus();
 * 
 * if (!isConnected) {
 *   return <OfflineBanner />;
 * }
 */
export const useNetworkStatus = (): NetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
  });

  useEffect(() => {
    // Suscribirse a cambios de red
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
      });
    });

    // Cleanup al desmontar
    return () => unsubscribe();
  }, []);

  return networkStatus;
};
