import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const EditProfileScreen = () => {  const navigation = useNavigation();

  const handleFieldChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    if (value !== originalData[field]) {
      setChangedFields(prev => ({ ...prev, [field]: value }));
    } else {
      const newChangedFields = { ...changedFields };
      delete newChangedFields[field];
      setChangedFields(newChangedFields);
    }
  };

  const handleSave = async () => {
    if (Object.keys(changedFields).length === 0) {
      navigation.goBack();
      return;
    }

    setIsLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      const response = await fetch('https://api.loveavi.com/api/update_user_profile.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          ...changedFields
        }),
      });

      const data = await response.json();
      if (data) {
        // Actualizar el estado original con los nuevos valores
        setOriginalData({ ...originalData, ...changedFields });
        // Limpiar los campos cambiados
        setChangedFields({});
        Alert.alert('Éxito', 'Perfil actualizado correctamente');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };  const [isLoading, setIsLoading] = useState(false);
  const [changedFields, setChangedFields] = useState<Record<string, any>>({});
  const [originalData, setOriginalData] = useState<Record<string, any>>({});
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    edad: '',
    peso: '',
    estatura: '',
    sexo: '',
    hobbie: '',
    pais: '',
    profesion: '',
  });  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const userId = await AsyncStorage.getItem('userId');
        const response = await fetch('https://api.loveavi.com/api/get_user_profile.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId
          }),
        });

        const data = await response.json();
        const profileData = {
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          edad: data.edad || '',
          peso: data.peso || '',
          estatura: data.estatura || '',
          sexo: data.sexo || '',
          hobbie: data.hobbie || '',
          pais: data.pais || '',
          profesion: data.profesion || '',
        };
        setProfileData(profileData);
        setOriginalData(profileData);
      } catch (error) {
        console.error('Error fetching profile:', error);
        Alert.alert('Error', 'No se pudo cargar el perfil');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>        <TouchableOpacity 
          onPress={handleSave}
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#007AFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              {Object.keys(changedFields).length > 0 ? 'Guardar' : 'Volver'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.profileImageContainer}>
        <Image
          source={{ uri: 'https://api.a0.dev/assets/image?text=profile%20picture%20professional%20male&aspect=1:1' }}
          style={styles.profileImage}
        />
        <TouchableOpacity style={styles.changePhotoButton}>
          <Text style={styles.changePhotoText}>Cambiar foto</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre completo</Text>
          <TextInput
            style={styles.input}          value={profileData.full_name}
          onChangeText={(text) => handleFieldChange('full_name', text)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            value={profileData.email}
            onChangeText={(text) => setProfileData({ ...profileData, email: text })}
            keyboardType="email-address"
            editable={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}          value={profileData.phone}
          onChangeText={(text) => handleFieldChange('phone', text)}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Edad</Text>
          <TextInput
            style={styles.input}          value={profileData.edad}
          onChangeText={(text) => handleFieldChange('edad', text)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Peso (kg)</Text>
          <TextInput
            style={styles.input}          value={profileData.peso}
          onChangeText={(text) => handleFieldChange('peso', text)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Estatura (cm)</Text>
          <TextInput
            style={styles.input}          value={profileData.estatura}
          onChangeText={(text) => handleFieldChange('estatura', text)}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Sexo</Text>
          <TextInput
            style={styles.input}          value={profileData.sexo}
          onChangeText={(text) => handleFieldChange('sexo', text)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hobbies</Text>
          <TextInput
            style={styles.input}          value={profileData.hobbie}
          onChangeText={(text) => handleFieldChange('hobbie', text)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>País</Text>
          <TextInput
            style={styles.input}          value={profileData.pais}
          onChangeText={(text) => handleFieldChange('pais', text)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Profesión</Text>
          <TextInput
            style={styles.input}          value={profileData.profesion}
          onChangeText={(text) => handleFieldChange('profesion', text)}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 44,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  profileImageContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  changePhotoButton: {
    padding: 8,
  },
  changePhotoText: {
    color: '#007AFF',
    fontSize: 16,
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
});

export default EditProfileScreen;