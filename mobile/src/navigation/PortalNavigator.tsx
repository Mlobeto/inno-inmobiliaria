import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PortalMisPagosScreen } from '../screens/portal/PortalMisPagosScreen';
import { PortalComprobanteScreen } from '../screens/portal/PortalComprobanteScreen';

export type PortalStackParamList = {
  MisPagos: undefined;
  SubirComprobante: { receiptId: number; period: string };
};

const Stack = createStackNavigator<PortalStackParamList>();

export const PortalNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#16a34a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="MisPagos"
        component={PortalMisPagosScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SubirComprobante"
        component={PortalComprobanteScreen}
        options={{ title: 'Subir Comprobante' }}
      />
    </Stack.Navigator>
  );
};
