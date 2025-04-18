import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthScreen from './screens/AuthScreen';
import DashboardScreen from './screens/DashboardScreen';
import VoiceActiveConversation from './screens/VoiceActiveConversation';
import EditProfileScreen from './screens/EditProfileScreen';
import LifeAreaScreen from './screens/LifeAreaScreen';
import SettingsScreen from './screens/SettingsScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { useAppDispatch } from './hooks/useAppDispatch';
import { setCredentials } from './store/slices/authSlice';

const Stack = createNativeStackNavigator();

// Componente para manejar la inicialización
const InitializationWrapper = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userDataString = await AsyncStorage.getItem('userData');
        
        if (token && userDataString) {
          const userData = JSON.parse(userDataString);
          dispatch(setCredentials({ user: userData, token }));
        }
      } catch (error) {
        console.error('Error during initialization:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <Provider store={store}>
      <InitializationWrapper>
        <NavigationContainer>          <Stack.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="VoiceActiveConversation" component={VoiceActiveConversation} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="LifeArea" component={LifeAreaScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </InitializationWrapper>
    </Provider>
  );
}