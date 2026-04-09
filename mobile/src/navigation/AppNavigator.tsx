import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { LoginScreen } from '../screens/LoginScreen';
import { PropertiesScreen } from '../screens/PropertiesScreen';
import ClientsScreen from '../screens/ClientsScreen';
import AddClientScreen from '../screens/AddClientScreen';
import { PortalLoginScreen } from '../screens/portal/PortalLoginScreen';
import { PortalNavigator } from './PortalNavigator';
import { Text } from 'react-native';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Placeholder para otras pantallas
const ContractsScreen = () => (
  <Text style={{ flex: 1, textAlign: 'center', marginTop: 100 }}>
    📄 Contratos (próximamente)
  </Text>
);

const ProfileScreen = () => (
  <Text style={{ flex: 1, textAlign: 'center', marginTop: 100 }}>
    👤 Perfil (próximamente)
  </Text>
);

// Stack de Clientes (lista + crear)
const ClientsStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ClientsList"
        component={ClientsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddClient"
        component={AddClientScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// Tabs principales (cuando está autenticado)
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
      }}
    >
      <Tab.Screen
        name="Propiedades"
        component={PropertiesScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏠</Text>,
          headerShown: true,
          headerStyle: {
            backgroundColor: '#3b82f6',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Tab.Screen
        name="Clientes"
        component={ClientsStack}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🧑‍💼</Text>,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Contratos"
        component={ContractsScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📄</Text>,
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

// Navegación principal
export const AppNavigator = () => {
  const { user, token: agentToken } = useSelector((state: RootState) => state.auth);
  const { token: portalToken } = useSelector((state: RootState) => state.portal);

  const isAgent = !!agentToken && !!user;
  const isInquilino = !!portalToken;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isInquilino ? (
          <Stack.Screen name="Portal" component={PortalNavigator} />
        ) : isAgent ? (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="PortalLogin" component={PortalLoginScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
