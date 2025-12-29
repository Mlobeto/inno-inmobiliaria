import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store/store';
import NetInfo from '@react-native-community/netinfo';

const OFFLINE_QUEUE_KEY = '@inno:offlineQueue';

export interface OfflineAction {
  id: string;
  action: any; // Redux action
  timestamp: number;
  retries: number;
}

/**
 * Sistema de cola para sincronizar acciones cuando vuelva la red
 */
class OfflineQueueManager {
  private queue: OfflineAction[] = [];
  private isSyncing: boolean = false;

  constructor() {
    this.loadQueue();
    this.watchNetwork();
  }

  /**
   * Cargar cola desde AsyncStorage al iniciar
   */
  private async loadQueue() {
    try {
      const queueData = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      if (queueData) {
        this.queue = JSON.parse(queueData);
        console.log(`📦 Cola offline cargada: ${this.queue.length} acciones pendientes`);
      }
    } catch (error) {
      console.error('Error al cargar cola offline:', error);
    }
  }

  /**
   * Guardar cola en AsyncStorage
   */
  private async saveQueue() {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Error al guardar cola offline:', error);
    }
  }

  /**
   * Agregar acción a la cola cuando no hay red
   */
  async addToQueue(action: any) {
    const offlineAction: OfflineAction = {
      id: `${Date.now()}-${Math.random()}`,
      action,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(offlineAction);
    await this.saveQueue();

    console.log(`➕ Acción agregada a cola offline: ${action.type}`);
    return offlineAction.id;
  }

  /**
   * Vigilar cambios de red y sincronizar cuando vuelva
   */
  private watchNetwork() {
    NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable && !this.isSyncing) {
        if (this.queue.length > 0) {
          console.log('🌐 Red detectada! Iniciando sincronización...');
          this.sync();
        }
      }
    });
  }

  /**
   * Sincronizar todas las acciones pendientes
   */
  async sync() {
    if (this.isSyncing || this.queue.length === 0) return;

    this.isSyncing = true;
    console.log(`🔄 Sincronizando ${this.queue.length} acciones...`);

    const failedActions: OfflineAction[] = [];

    for (const offlineAction of this.queue) {
      try {
        // Despachar la acción al store
        await store.dispatch(offlineAction.action);
        console.log(`✅ Sincronizada: ${offlineAction.action.type}`);
      } catch (error) {
        console.error(`❌ Error al sincronizar: ${offlineAction.action.type}`, error);
        
        // Reintentar hasta 3 veces
        if (offlineAction.retries < 3) {
          offlineAction.retries++;
          failedActions.push(offlineAction);
        } else {
          console.warn(`⚠️ Acción descartada después de 3 intentos: ${offlineAction.action.type}`);
        }
      }
    }

    // Actualizar cola con solo las acciones fallidas
    this.queue = failedActions;
    await this.saveQueue();

    this.isSyncing = false;

    if (failedActions.length === 0) {
      console.log('✨ Sincronización completada exitosamente!');
    } else {
      console.warn(`⚠️ ${failedActions.length} acciones no se pudieron sincronizar`);
    }
  }

  /**
   * Obtener cantidad de acciones pendientes
   */
  getPendingCount(): number {
    return this.queue.length;
  }

  /**
   * Limpiar cola manualmente (solo para testing o casos especiales)
   */
  async clearQueue() {
    this.queue = [];
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
    console.log('🗑️ Cola offline limpiada');
  }
}

export const offlineQueue = new OfflineQueueManager();
