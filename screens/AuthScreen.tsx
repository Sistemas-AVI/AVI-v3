import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { loginUser } from '../store/slices/authSlice';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://api.loveavi.com/api/auth.php';

import { useEffect } from 'react';
import { useAppSelector } from '../hooks/useAppSelector';

export default function AuthScreen() {
  const { token } = useAppSelector(state => state.auth);
  const navigation = useNavigation<any>();
  const [step, setStep] = useState<'email' | 'login' | 'register'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  useEffect(() => {
    if (token) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      });
    }
  }, [token, navigation]);  const showToast = (message: string, type: 'success' | 'error') => {
    Toast.show({
      type: type,
      text1: type === 'success' ? 'Éxito' : 'Error',
      text2: message,
      visibilityTime: 2000,
      position: 'top',
      topOffset: 60,
    });
  };

  const dispatch = useAppDispatch();

  const verifyEmail = async () => {
    if (!email) {
      showToast('Por favor ingrese su correo electrónico', 'error');
      return;
    }

    setLoading(true);
    try {
      console.log(JSON.stringify({ email }))
      const response = await fetch('https://api.loveavi.com/api/verificar_email.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      setStep(data.exists ? 'login' : 'register');
    } catch (error) {
      showToast('Error al verificar el correo', 'error');
    } finally {
      setLoading(false);
    }
  };  const handleAuth = async () => {
    if (loading) return;
    
    if (!email || !password || (step === 'register' && !name)) {
      showToast('Por favor complete todos los campos', 'error');
      return;
    }

    setLoading(true);
    try {
      if (step === 'login') {
        const resultAction = await dispatch(loginUser({ email, password })).unwrap();
        if (resultAction.token && resultAction.user) {
          await AsyncStorage.setItem('userToken', resultAction.token);
          await AsyncStorage.setItem('userData', JSON.stringify(resultAction.user));
          await AsyncStorage.setItem('userId', resultAction.user.id.toString());
          navigation.reset({
            index: 0,
            routes: [{ name: 'Dashboard' }],
          });
        }      } else if (step === 'register') {
        // Registro
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register',
            email,
            password,
            full_name: name,
          }),
        });
        
        const data = await response.json();
        
        if (data.error) {
          showToast(data.error, 'error');
          return;
        }

        if (data.success) {
          // Auto login después del registro
          dispatch(loginUser({ email, password })).unwrap()
            .then(async (userData) => {
              await AsyncStorage.setItem('userToken', userData.token);
              await AsyncStorage.setItem('userData', JSON.stringify(userData.user));
              await AsyncStorage.setItem('userId', userData.user.id.toString());
              navigation.reset({
                index: 0,
                routes: [{ name: 'Dashboard' }],
              });
            })            .catch((error) => {
              Alert.alert('Error', 'No se pudo iniciar sesión automáticamente');
              setStep('login');
            });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo completar la operación');
    } finally {
      setLoading(false);
    }
  };  const handleForgotPassword = async () => {
    if (!email) {
      showToast('Por favor ingrese su correo electrónico', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'forgot_password',
          email,
        }),
      });

      const data = await response.json();      if (data.success) {
        showToast('Instrucciones enviadas al email', 'success');
        setTimeout(() => setIsForgotPassword(false), 2000);
      } else {
        showToast(data.error || 'Email no encontrado', 'error');
      }
    } catch (error) {
      showTemporaryMessage('Error de conexión. Intente nuevamente', true);
    } finally {
      setLoading(false);
    }
  };  const renderEmailStep = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <Image 
          source={{ uri: 'https://api.loveavi.com/logoavi.png' }}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Bienvenido a AVI</Text>
        <Toast />
        
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity 
          style={[styles.authButton, loading && styles.buttonDisabled]}
          onPress={verifyEmail}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.authButtonText}>Continuar</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.orText}>o continuar con</Text>

        <View style={styles.socialButtonsContainer}>
          <TouchableOpacity 
            style={styles.socialButton}            
            onPress={() => Alert.alert('Error', 'Función no disponible')}
          >
            <AntDesign name="google" size={24} color="#DB4437" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.socialButton}            
            onPress={() => Alert.alert('Error', 'Función no disponible')}
          >
            <AntDesign name="facebook-square" size={24} color="#4267B2" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  const renderLoginStep = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <Image 
          source={{ uri: 'https://api.loveavi.com/logoavi.png' }}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Iniciar Sesión</Text>
        <Toast />
        
        <Text style={styles.emailDisplay}>{email}</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.forgotButton}
          onPress={() => setIsForgotPassword(true)}
        >
          <Text style={styles.forgotButtonText}>
            ¿Olvidaste tu contraseña?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.authButton, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.authButtonText}>Iniciar Sesión</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.switchButton}
          onPress={() => setStep('email')}
        >
          <Text style={styles.switchButtonText}>
            ← Usar otro correo
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  const renderRegisterStep = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <Image 
          source={{ uri: 'https://api.loveavi.com/logoavi.png' }}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Crear Cuenta</Text>
        <Toast />
        
        <Text style={styles.emailDisplay}>{email}</Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre completo"
          value={name}
          onChangeText={setName}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={[styles.authButton, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.authButtonText}>Crear Cuenta</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.switchButton}
          onPress={() => setStep('email')}
        >
          <Text style={styles.switchButtonText}>
            ← Usar otro correo
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  if (isForgotPassword) {
    return (
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.formContainer}>
          <Image 
            source={{ uri: 'https://api.loveavi.com/logoavi.png' }}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Recuperar Contraseña</Text>
          <Toast />

          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity 
            style={[styles.authButton, loading && styles.buttonDisabled]}
            onPress={handleForgotPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.authButtonText}>Enviar Instrucciones</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchButton}
            onPress={() => setIsForgotPassword(false)}
          >
            <Text style={styles.switchButtonText}>
              Volver al inicio de sesión
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  switch (step) {
    case 'email':
      return renderEmailStep();
    case 'login':
      return renderLoginStep();
    case 'register':
      return renderRegisterStep();
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  emailDisplay: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  logo: {
    width: '70%',
    height: 100,
    alignSelf: 'center',
    marginBottom: 20,
  },
  errorMessage: {
    color: '#ff3b30',
    textAlign: 'center',
    marginBottom: 10,
    backgroundColor: '#ffe5e5',
    padding: 10,
    borderRadius: 5,
  },
  successMessage: {
    color: '#34c759',
    textAlign: 'center',
    marginBottom: 10,
    backgroundColor: '#e5ffe5',
    padding: 10,
    borderRadius: 5,
  },  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },  formContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0',
    margin: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  authButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  authButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  orText: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#666',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  socialButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    width: 50,
    alignItems: 'center',
  },
  switchButton: {
    marginTop: 20,
  },
  switchButtonText: {
    color: '#007AFF',
    textAlign: 'center',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -5,
    marginBottom: 10,
  },
  forgotButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
});