import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Animated, Dimensions, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { logout } from '../store/slices/authSlice';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { VoiceChat } from '../components/VoiceChat';


// Datos simulados para las historias
const storiesData = [
  { id: 1, icon: 'game-controller', hasUnread: true },
  { id: 2, icon: 'musical-notes', hasUnread: true },
  { id: 3, icon: 'basketball', hasUnread: false },
  { id: 4, icon: 'cafe', hasUnread: true },
  { id: 5, icon: 'camera', hasUnread: false },
  { id: 6, icon: 'planet', hasUnread: true },
];

const StoryCircle = ({ icon, hasUnread }) => (
  <View style={styles.storyContainer}>
    <View style={[styles.storyCircle, hasUnread && styles.storyCircleUnread]}>
      <View style={styles.storyInnerCircle}>
        <Ionicons name={icon} size={24} color="#666" />
      </View>
    </View>
  </View>
);

const { width } = Dimensions.get('window');

interface Chat {
  id: number;
  id_user: number;
  nombre: string;
  categoria: number;
  estado: number;
  created_at: string;
}

const getChatIcon = (categoria: number): string => {
  switch (categoria) {
    case 1: return 'chatbubble-outline';
    case 2: return 'fitness-outline';
    case 3: return 'briefcase-outline';
    case 4: return 'heart-outline';
    case 5: return 'people-outline';
    default: return 'chatbubble-outline';
  }
};

export default function DashboardScreen() {
  const [userChats, setUserChats] = useState<Chat[]>([]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const response = await fetch('https://api.loveavi.com/api/chat_names_api.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'select',
            id_user: userId
          }),
        });

        const data = await response.json();
        if (data.success) {
          setUserChats(data.chats);
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
      }
    };

    fetchChats();
  }, []);

  const dispatch = useAppDispatch();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;  const toggleSidebar = () => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: isSidebarOpen ? -width : 0,
        useNativeDriver: true,
        bounciness: 0,
      }),
      Animated.timing(fadeAnim, {
        toValue: isSidebarOpen ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
    setSidebarOpen(!isSidebarOpen);
  };
  const navigation = useNavigation<any>();  const [isChatOpen, setIsChatOpen] = useState(false);  const [chatCategoria, setChatCategoria] = useState('general');
  const [currentChatId, setCurrentChatId] = useState(0);
  const [checkedTasks, setCheckedTasks] = useState({});
  const [checkedHabits, setCheckedHabits] = useState({});
  const handleOpenChat = () => {
    setIsChatOpen(true);
  };

  const toggleTask = (taskId) => {
    setCheckedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const toggleHabit = (habitId) => {
    setCheckedHabits(prev => ({
      ...prev,
      [habitId]: !prev[habitId]
    }));
  };  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch('https://api.loveavi.com/api/auth.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'logout',
        }),
      });

      const data = await response.json();

      if (data.success) {
        await AsyncStorage.removeItem('userToken');        await AsyncStorage.removeItem('userData');
        Alert.alert('Éxito', 'Sesión cerrada exitosamente');
        navigation.navigate('Auth');      } else {
        Alert.alert('Error', data.error || 'Error al cerrar sesión');
      }    } catch (error) {
      Alert.alert('Error', 'Error de conexión');
      navigation.navigate('Auth');
    }
  };

  return (    <SafeAreaView style={styles.container}>      {/* Overlay para cerrar el sidebar */}      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
            display: isSidebarOpen ? 'flex' : 'none'
          }
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={toggleSidebar}
        />
      </Animated.View>
      
      <Animated.View style={[
        styles.sidebar,
        {
          transform: [{ translateX: slideAnim }],
        }
      ]}>        <View style={styles.sidebarHeader}>
          <View style={styles.sidebarProfileCircle}>
            <Ionicons name="person" size={40} color="#007AFF" />
          </View>
          <Text style={styles.sidebarName}>Keylor</Text>
          <TouchableOpacity 
            style={styles.settingsButton}            onPress={() => {
              toggleSidebar();
              navigation.navigate('Settings');
            }}
          >
            <Ionicons name="settings-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>        <ScrollView style={styles.sidebarContent}>
          {/* Sección Tools */}
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarSectionTitle}>Tools</Text>
            <TouchableOpacity style={styles.sidebarItem}>
              <Ionicons name="home-outline" size={24} color="#333" />
              <Text style={styles.sidebarItemText}>Inicio</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sidebarItem}>
              <Ionicons name="calendar-outline" size={24} color="#333" />
              <Text style={styles.sidebarItemText}>Calendario</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sidebarItem}>
              <Ionicons name="stats-chart-outline" size={24} color="#333" />
              <Text style={styles.sidebarItemText}>Estadísticas</Text>
            </TouchableOpacity>
          </View>          {/* Sección Chats */}
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarSectionTitle}>Chats</Text>
            {userChats.map((chat) => (              <TouchableOpacity 
                key={chat.id} 
                style={styles.sidebarItem}
                onPress={() => {
                  setIsChatOpen(true);
                  setChatCategoria(chat.categoria.toString());
                  setCurrentChatId(chat.id);
                  toggleSidebar();
                }}
              >
                <Ionicons 
                  name={getChatIcon(chat.categoria)} 
                  size={24} 
                  color="#333" 
                />
                <Text style={styles.sidebarItemText}>{chat.nombre}</Text>
                <Text style={styles.chatDate}>
                  {new Date(chat.created_at).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Animated.View>      <View style={styles.storiesSection}>
        <TouchableOpacity style={styles.profileButton} onPress={toggleSidebar}>
          <View style={styles.profileCircle}>
            <Ionicons name="person" size={24} color="#007AFF" />
          </View>
        </TouchableOpacity>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.storiesContainer}
          contentContainerStyle={styles.storiesContentContainer}
        >
          {storiesData.map((story) => (
            <StoryCircle 
              key={story.id} 
              icon={story.icon} 
              hasUnread={story.hasUnread} 
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        {/* Saludo y Frase del día */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>Buenos días Keylor</Text>
          <Text style={styles.quoteText}>
            "La única manera de hacer un gran trabajo es amar lo que haces"
          </Text>
        </View>

        {/* Sección de Agenda */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Hoy</Text>
          <View style={styles.taskContainer}>
            <TouchableOpacity style={styles.checkboxTask} onPress={() => toggleTask('task1')}>
              <Ionicons 
                name={checkedTasks['task1'] ? 'checkbox' : 'square-outline'} 
                size={24} 
                color="#007AFF" 
              />
              <Text style={[styles.taskText, checkedTasks['task1'] && styles.checkedText]}>
                Reunión de equipo - 9:00 AM
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.checkboxTask} onPress={() => toggleTask('task2')}>
              <Ionicons 
                name={checkedTasks['task2'] ? 'checkbox' : 'square-outline'} 
                size={24} 
                color="#007AFF" 
              />
              <Text style={[styles.taskText, checkedTasks['task2'] && styles.checkedText]}>
                Cita médica - 2:30 PM
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.checkboxTask} onPress={() => toggleTask('task3')}>
              <Ionicons 
                name={checkedTasks['task3'] ? 'checkbox' : 'square-outline'} 
                size={24} 
                color="#007AFF" 
              />
              <Text style={[styles.taskText, checkedTasks['task3'] && styles.checkedText]}>
                Entrenamiento - 6:00 PM
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sección de Hábitos */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Hábitos</Text>
          <View style={styles.habitsContainer}>
            <TouchableOpacity style={styles.habitItem} onPress={() => toggleHabit('habit1')}>
              <Ionicons 
                name={checkedHabits['habit1'] ? 'checkbox' : 'square-outline'} 
                size={24} 
                color="#007AFF" 
              />
              <Text style={[styles.habitText, checkedHabits['habit1'] && styles.checkedText]}>
                Beber 2L de agua
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.habitItem} onPress={() => toggleHabit('habit2')}>
              <Ionicons 
                name={checkedHabits['habit2'] ? 'checkbox' : 'square-outline'} 
                size={24} 
                color="#007AFF" 
              />
              <Text style={[styles.habitText, checkedHabits['habit2'] && styles.checkedText]}>
                Correr 5km
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.habitItem} onPress={() => toggleHabit('habit3')}>
              <Ionicons 
                name={checkedHabits['habit3'] ? 'checkbox' : 'square-outline'} 
                size={24} 
                color="#007AFF" 
              />
              <Text style={[styles.habitText, checkedHabits['habit3'] && styles.checkedText]}>
                Leer 30 minutos
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sección de Áreas de Vida */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Áreas de Vida</Text>
          <View style={styles.areasGrid}>            <TouchableOpacity 
              style={styles.areaButton}
              onPress={() => {
                setIsChatOpen(true);
                setChatCategoria('coach');
              }}
            >
              <Text style={styles.areaButtonText}>Coach</Text>
            </TouchableOpacity>            <TouchableOpacity 
              style={styles.areaButton}
              onPress={() => {
                setIsChatOpen(true);
                setChatCategoria('salud');
              }}
            >
              <Text style={styles.areaButtonText}>Salud</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.areaButton}
              onPress={() => {
                setIsChatOpen(true);
                setChatCategoria('laboral');
              }}
            >
              <Text style={styles.areaButtonText}>Laboral</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.areaButton}
              onPress={() => {
                setIsChatOpen(true);
                setChatCategoria('emocional');
              }}
            >
              <Text style={styles.areaButtonText}>Emocional</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.areaButton}
              onPress={() => {
                setIsChatOpen(true);
                setChatCategoria('familia');
              }}
            >
              <Text style={styles.areaButtonText}>Familia</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.areaButton}
              onPress={() => {
                setIsChatOpen(true);
                setChatCategoria('salud');
              }}
            >
              <Text style={styles.areaButtonText}>Salud</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>      <Modal
        visible={isChatOpen}
        animationType="slide"
        onRequestClose={() => setIsChatOpen(false)}
      >        <VoiceChat 
          onClose={() => setIsChatOpen(false)} 
          navigation={navigation}          
          categoria={chatCategoria}
          chatId={currentChatId}
        />
      </Modal>      <TouchableOpacity 
        style={styles.fabButton} 
        onPress={() => {
          setCurrentChatId(0)
          setIsChatOpen(true);
          setChatCategoria('general');
        }}
      >
        <Text style={styles.fabText}>AVI HABLA</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.8,
    backgroundColor: '#fff',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },  sidebarHeader: { 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee', 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },  sidebarProfileCircle: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: '#f0f0f0', 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  sidebarName: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#333',
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
  },
  sidebarContent: {
    flex: 1,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },  sidebarSection: {
    marginBottom: 20,
  },
  sidebarSectionTitle: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    marginLeft: 15,
    marginBottom: 10,
    fontWeight: '600',
  },  sidebarItemText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
    flex: 1,
  },
  chatDate: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },  profileButton: {
    paddingHorizontal: 15,
  },
  profileCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },  storiesSection: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  storiesContainer: {
    flex: 1,
  },
  storiesContentContainer: {
    paddingRight: 15,
    gap: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyContainer: {
    alignItems: 'center',
    width: 70,
  },
  storyCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eee',
    padding: 2,
    marginBottom: 5,
  },
  storyCircleUnread: {
    backgroundColor: '#007AFF',
  },
  storyInnerCircle: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: 80,
  },
  greetingContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  quoteText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  sectionContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  taskContainer: {
    gap: 1,
  },
  checkboxTask: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  taskText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  checkedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  habitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 1,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 1,
  },
  habitText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  areasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  areaButton: {
    width: '31%',
    height: 40,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  areaButtonText: {
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
  },
  fabButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});