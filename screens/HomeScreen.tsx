import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

interface VoiceChatProps {
  onClose: () => void;
}

export const VoiceChat = ({ onClose }: VoiceChatProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos permisos de audio para grabar mensajes de voz.');
      }
    })();
  }, []);
const LoadingDots = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length < 3 ? prev + '.' : ''));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>{dots}</Text>
    </View>
  );
};

  const speechToText = async (audioUri: string): Promise<string> => {
  try {
    const formData = new FormData();

    formData.append('audio', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'record.m4a',
    });

    const response = await fetch('https://api.loveavi.com/openai/speech_to_text.php', {
      method: 'POST',
      body: formData,
    });
    console.log(response);
    if (!response.ok) {
  console.log('response.status:', response.status);
  console.log('response.statusText:', response.statusText);
  const responseText = await response.text();
  console.log('Raw response body:', responseText);
  throw new Error('Error al obtener respuesta del servidor');
}


    const result = await response.json();

    if (result && result.text) {
      return result.text;
    } else {
      throw new Error('Respuesta inválida del servidor');
    }
  } catch (error) {
    console.error('Error en speechToText:', error);
    throw error;
  }
 
};

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      Alert.alert('Error', 'No se pudo iniciar la grabación');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        const transcribedText = await speechToText(uri);
        setInputText(transcribedText);
      }

      setRecording(null);
      setIsRecording(false);
    } catch (err) {
      Alert.alert('Error', 'No se pudo detener la grabación');
    }
  };

  const handleSend = async () => {
    setIsLoading(true);
    if (inputText.trim()) {
      const userMessage = {
        id: Date.now().toString(),
        text: inputText.trim(),
        isUser: true,
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputText('');
      
      try {
        
        

        const response = await fetch('https://api.loveavi.com/openai/openai-api.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userMessage.text,
        }),
      });
        
        const data = await response.json();
        
        const botMessage = {
          id: (Date.now() + 1).toString(),
          text: data.respuesta,
          isUser: false,
        };

        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        Alert.alert('Error', 'No se pudo obtener respuesta de la API');
      }
       finally{
          setIsLoading(false);
        }
    }
  };

  return (
    
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close" size={28} color="#333" />
      </TouchableOpacity>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(message => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.isUser ? styles.userMessage : styles.botMessage,
            ]}
          >
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Escribe un mensaje..."
          multiline
        />
        <TouchableOpacity
          onPress={isRecording ? stopRecording : startRecording}
          style={[styles.iconButton, isRecording && styles.recordingButton]}
        >
          <MaterialIcons name={isRecording ? 'stop' : 'mic'} size={24} color="white" />
        </TouchableOpacity>
        {inputText.trim() && (
          <TouchableOpacity onPress={handleSend} style={styles.iconButton}>
            <MaterialIcons name="send" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>
      {isLoading && <LoadingDots />}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 40 },
  closeButton: { position: 'absolute', top: 40, right: 20, zIndex: 10 },
  messagesContainer: { flex: 1, padding: 10,paddingTop:30 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 20, marginVertical: 5 },
  userMessage: { alignSelf: 'flex-end', backgroundColor: '#007AFF' },
  botMessage: { alignSelf: 'flex-start', backgroundColor: '#9D00FF' },
  messageText: { color: 'white', fontSize: 16 },
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: 'white', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E5E5EA' },
  input: { flex: 1, backgroundColor: '#F0F0F0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginRight: 10, fontSize: 16, maxHeight: 100 },
  iconButton: { backgroundColor: '#007AFF', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 5 },
  recordingButton: { backgroundColor: '#FF3B30' },
loadingContainer: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  zIndex: 20,
},
loadingText: {
  color: 'white',
  fontSize: 18,
  fontWeight: '600',
},
});
