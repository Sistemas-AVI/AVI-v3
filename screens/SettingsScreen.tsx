import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { logout } from '../store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    try {
      // Limpiar AsyncStorage
      await AsyncStorage.multiRemove([
        'userToken',
        'userData',
        'userId'
      ]);
      
      // Dispatch logout action
      dispatch(logout());
      
      // Redireccionar al login
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar la sesión');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={styles.optionButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="person-outline" size={24} color="#333" />
          <Text style={styles.optionText}>Editar Perfil</Text>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.optionButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          <Text style={[styles.optionText, styles.logoutText]}>Cerrar Sesión</Text>
          <Ionicons name="chevron-forward" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 44,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  optionsContainer: {
    backgroundColor: '#fff',
    marginTop: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginLeft: 16,
  },
  logoutButton: {
    marginTop: 20,
  },
  logoutText: {
    color: '#FF3B30',
  },
});