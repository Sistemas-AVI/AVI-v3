import React, { useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { VoiceActiveConversation } from '../components/VoiceActiveConversation';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

interface VoiceChatProps {
  onClose: () => void;
  categoria?: string;
  chatId?: number;
}

interface ConversationResponse {
  success: boolean;
  id_insertado?: string;
}

const getCategoryColor = (categoria: string) => {
  switch (categoria.toLowerCase()) {
    case 'coach': return '#9D00FF';
    case 'salud': return '#34C759';
    case 'laboral': return '#FF9500';
    case 'emocional': return '#FF2D55';
    case 'familia': return '#5856D6';
    default: return '#007AFF';
  }
};

export const VoiceChat = ({ onClose, categoria = 'general',chatId=0 }: VoiceChatProps) => {
  const [isActiveVoiceMode, setIsActiveVoiceMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);  const [inputText, setInputText] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [phrases, setPhrases] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isMicDisabled, setIsMicDisabled] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<number>(chatId || 0);
  const scrollViewRef = useRef<ScrollView>(null);
   const [showPrompts, setShowPrompts] = useState(true);
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  console.log(chatId)
  useEffect(() => {
    const animateDots = () => {
      Animated.loop(
        Animated.stagger(200, [
          Animated.sequence([
            Animated.timing(dot1, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(dot1, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(dot2, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(dot2, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(dot3, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(dot3, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };
    if (isThinking) animateDots();
  }, [isThinking]);

  useEffect(() => {
    const initialize = async () => {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos permisos de audio para grabar mensajes de voz.');
        return;
      }

      const id = await AsyncStorage.getItem('userId');
      if (!id) {
        Alert.alert('Error', 'No se encontró ID de usuario');
        onClose();
        return;
      }

      setUserId(id);
      fetchPrompts(id);
    };

    const fetchPrompts = async (id: string) => {
      const formData = new FormData();
      formData.append('user_id', id);
      formData.append('categoria', categoria);
      const res = await fetch('https://api.loveavi.com/api/get_prompts.php', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.success && Array.isArray(data.frases)) setPhrases(data.frases);
    };

    initialize();
  }, []);

  const speechToText = async (audioUri: string): Promise<string> => {
    const formData = new FormData();
    const ext = audioUri.split('.').pop() || 'm4a';
    const mime = {
      m4a: 'audio/m4a', mp4: 'audio/mp4', wav: 'audio/wav', aac: 'audio/aac',
    }[ext] || 'audio/m4a';
    formData.append('file', { uri: audioUri, type: mime, name: `record.${ext}` } as any);
    formData.append('model', 'whisper-1');
    formData.append('language', 'es');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: 'Bearer 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', },
      body: formData,
    });
    const result = await res.json();
    return result.text || '';
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
    } catch {
      Alert.alert('Error', 'No se pudo iniciar la grabación');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);
      setIsMicDisabled(true);
      if (uri) {
        const transcribed = await speechToText(uri);
        setInputText(prev => `${prev} ${transcribed}`.trim());
      }
    } catch {
      Alert.alert('Error', 'No se pudo detener la grabación');
    } finally {
      setIsMicDisabled(false);
    }
  };

  const handleSend = async (textOverride?: string) => {
    const text = textOverride ?? inputText.trim();
    if (!text) return;
    setShowPrompts(false);
    setInputText('');
    setIsLoading(true);
    setIsThinking(true);
    setMessages(prev => [...prev, { id: Date.now().toString(), text, isUser: true }]);

    let fraseIntro = 'Dame un momento...';
    try {
      const pre = await fetch('https://api.loveavi.com/api/get_random_phrase.php');
      const data = await pre.json();
      if (data.success) fraseIntro = data.frase;
    } catch {}

    const loadingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: loadingId, text: fraseIntro, isUser: false }]);

    try {
      console.log(JSON.stringify({ prompt: text, user_id: userId, categoria: categoria ,chat_id:chatId}))
      const res = await fetch('https://api.loveavi.com/openai/openai-api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, user_id: userId, categoria: categoria ,chat_id:chatId}),
      });
      const { respuesta } = await res.json();
      setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, text: respuesta } : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === loadingId ? { ...m, text: 'Error al obtener respuesta' } : m));
    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {categoria === 'general' ? 'AVI Chat' : `AVI ${categoria.charAt(0).toUpperCase() + categoria.slice(1)}`}
        </Text>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={28} color="#333" /></TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, index) => {
          const isLastMessage = index === messages.length - 1;

          return (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.isUser ? styles.userMessage : { backgroundColor: getCategoryColor(categoria) },
              ]}
            >
              <Text style={styles.messageText}>{msg.text}</Text>

              {isThinking && isLastMessage && !msg.isUser && (
                <View style={[{ backgroundColor: getCategoryColor(categoria), flexDirection: 'row' }]}>
                  <Animated.View style={[styles.typingDot, { opacity: dot1, backgroundColor: 'white' }]} />
                  <Animated.View style={[styles.typingDot, { opacity: dot2, backgroundColor: 'white' }]} />
                  <Animated.View style={[styles.typingDot, { opacity: dot3, backgroundColor: 'white' }]} />
                </View>
              )}
            </View>
          );
        })}
        
      </ScrollView>
      {phrases.length > 0 && !isThinking && showPrompts && (
  <View style={styles.suggestionsContainer}>
    {phrases.map((phrase, idx) => (
      <TouchableOpacity
        key={idx}
        style={[styles.suggestionButton, { backgroundColor: getCategoryColor(categoria) }]}
        onPress={() => handleSend(phrase)}
      >
        <Text style={styles.suggestionText}>{phrase}</Text>
      </TouchableOpacity>
    ))}
  </View>
)}
      <View style={styles.inputContainer}>
        <TextInput style={styles.input} value={inputText} onChangeText={setInputText} placeholder="Escribe un mensaje..." />
        <TouchableOpacity
          onPress={isRecording ? stopRecording : startRecording}
          style={[styles.iconButton, isRecording && { backgroundColor: '#FF3B30' }, isMicDisabled && { opacity: 0.5 }]}
          disabled={isMicDisabled}
        >
          <MaterialIcons name={isRecording ? 'stop' : 'mic'} size={24} color="white" />
        </TouchableOpacity>
        {inputText.trim() && (
          <TouchableOpacity onPress={() => handleSend()} style={[styles.iconButton, { backgroundColor: getCategoryColor(categoria) }]}>
            <MaterialIcons name="send" size={24} color="white" />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity onPress={() => setIsActiveVoiceMode(true)} style={[styles.voiceModeButton, { backgroundColor: getCategoryColor(categoria) }]}>
        <Text style={styles.voiceModeButtonText}>🧠 Conversar por voz</Text>
      </TouchableOpacity>

      {isActiveVoiceMode && userId && (
        <View style={StyleSheet.absoluteFillObject}>
          <VoiceActiveConversation
            userId={userId}
            categoria={categoria}
            onClose={() => setIsActiveVoiceMode(false)}
            onSpeechResult={() => {}}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  messagesContainer: { flex: 1, padding: 10, paddingBottom: 80 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 20, marginVertical: 5 },
  userMessage: { alignSelf: 'flex-end', backgroundColor: '#007AFF' },
  messageText: { color: 'white', fontSize: 16 },
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: 'white', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F0F0F0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, fontSize: 16 },
  iconButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 5, backgroundColor: '#007AFF' },
  voiceModeButton: { padding: 12, margin: 15, borderRadius: 20, alignItems: 'center' },
  voiceModeButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  typingDot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 2 },
  suggestionsContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  padding: 10,
  gap: 8,
  justifyContent: 'center',
},
suggestionButton: {
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 15,
  margin: 4,
},
suggestionText: {
  color: 'white',
  fontSize: 14,
},
});