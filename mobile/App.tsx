import './global.css';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, SafeAreaView } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store/store';
import { OfflineBanner } from './src/components/OfflineBanner';
import { AppNavigator } from './src/navigation/AppNavigator';
import { usePushNotifications } from './src/hooks/usePushNotifications';

function AppInner() {
  usePushNotifications();
  return (
    <SafeAreaView style={styles.container}>
      <OfflineBanner />
      <AppNavigator />
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppInner />
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
});
