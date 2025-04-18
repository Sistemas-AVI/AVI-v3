import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { VoiceChat } from '../components/VoiceChat';

type RouteParams = {
  area: string;
};

export default function LifeAreaScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { area } = route.params as RouteParams;
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleOpenChat = () => {
    setIsChatOpen(true);
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
        <Text style={styles.headerTitle}>{area}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.description}>Área de {area}</Text>
      </View>

      <Modal
        visible={isChatOpen}
        animationType="slide"
        onRequestClose={() => setIsChatOpen(false)}
      >        <VoiceChat 
          onClose={() => setIsChatOpen(false)} 
          categoria={area.toLowerCase()}
        />
      </Modal>

      <TouchableOpacity style={styles.fabButton} onPress={handleOpenChat}>
        <Text style={styles.fabText}>AVI HABLA</Text>
      </TouchableOpacity>
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
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
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