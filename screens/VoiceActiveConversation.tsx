import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Animated } from 'react-native';

interface VoiceActiveConversationProps {
  onClose?: () => void;
  onSpeechResult?: (text: string) => void;
  userId: string;
  categoria?: string;
}

export const VoiceActiveConversation: React.FC<VoiceActiveConversationProps> = ({
  onClose,
  onSpeechResult,
  userId,
   categoria = 'general',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  
  // Animaciones principales
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.4)).current;
  
  // Círculos concéntricos para efecto de ondas
  const circle1Scale = useRef(new Animated.Value(1)).current;
  const circle1Opacity = useRef(new Animated.Value(0)).current;
  const circle2Scale = useRef(new Animated.Value(1)).current;
  const circle2Opacity = useRef(new Animated.Value(0)).current;
  const circle3Scale = useRef(new Animated.Value(1)).current;
  const circle3Opacity = useRef(new Animated.Value(0)).current;

  // Animaciones según el estado del componente
  useEffect(() => {
    // Detener todas las animaciones previas
    Animated.parallel([
      pulseAnim, opacityAnim, 
      circle1Scale, circle1Opacity,
      circle2Scale, circle2Opacity,
      circle3Scale, circle3Opacity
    ].map(anim => Animated.timing(anim, {
      toValue: 0,
      duration: 0,
      useNativeDriver: true
    }))).stop();
    
    // Resetear valores
    opacityAnim.setValue(0.4);
    
    if (isListening) {
      // Animación de escucha (círculo púrpura pulsante)
      animateListening();
    } else if (isSpeaking) {
      // Animación de respuesta (círculo azul con ondas)
      animateSpeaking();
    } else if (isProcessing) {
      // Animación de procesamiento (más lenta y sutil)
      animateProcessing();
    } else {
      pulseAnim.setValue(1);
    }
    
    return () => {
      // Cleanup animations
      Animated.parallel([
        pulseAnim, opacityAnim, 
        circle1Scale, circle1Opacity,
        circle2Scale, circle2Opacity,
        circle3Scale, circle3Opacity
      ].map(anim => Animated.timing(anim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true
      }))).stop();
    };
  }, [isListening, isProcessing, isSpeaking]);

  // Animación para el modo de escucha
  const animateListening = () => {
    // Simula reactividad al audio con variaciones aleatorias
    const createRandomPulse = () => {
      const randomScale = 1 + Math.random() * 0.4; // Entre 1.0 y 1.4
      const randomDuration = 300 + Math.random() * 200; // Entre 300ms y 500ms
      
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: randomScale,
            duration: randomDuration,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: randomDuration,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.8,
            duration: randomDuration,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.4,
            duration: randomDuration,
            useNativeDriver: true,
          }),
        ])
      ]).start(() => {
        if (isListening) createRandomPulse();
      });
    };
    
    createRandomPulse();
    animateWaveCircles(800, 0.7);
  };
  
  // Animación para cuando la app está hablando
  const animateSpeaking = () => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.9,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.7,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ])
    ).start();
    
    animateWaveCircles(1000, 0.5);
  };
  
  // Animación para el estado de procesamiento
  const animateProcessing = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };
  
  // Crea el efecto de ondas con círculos concéntricos
  const animateWaveCircles = (duration: number, maxOpacity: number) => {
    // Resetear valores
    circle1Scale.setValue(1);
    circle1Opacity.setValue(maxOpacity);
    circle2Scale.setValue(1);
    circle2Opacity.setValue(0);
    circle3Scale.setValue(1);
    circle3Opacity.setValue(0);
    
    // Animación de círculos en secuencia
    const animateCircle = (scaleAnim: Animated.Value, opacityAnim: Animated.Value, delay = 0) => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 2,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        if (isListening || isSpeaking) {
          scaleAnim.setValue(1);
          opacityAnim.setValue(maxOpacity);
          animateCircle(scaleAnim, opacityAnim, 0);
        }
      });
    };
    
    animateCircle(circle1Scale, circle1Opacity, 0);
    animateCircle(circle2Scale, circle2Opacity, duration / 3);
    animateCircle(circle3Scale, circle3Opacity, (duration / 3) * 2);
  };

  useEffect(() => {
    startVoiceCycle();

    return () => {
      Speech.stop();
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
    };
  }, []);

  const startVoiceCycle = async () => {
    setInterimText('');
    await startRecording();
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

      recordingRef.current = recording;
      setIsListening(true);

      setTimeout(() => stopRecording(), 5000); // auto-stop después de 5s
    } catch (err) {
      Alert.alert('Error', 'No se pudo iniciar la grabación');
      setIsListening(false);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      setIsListening(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri) {
        setIsProcessing(true);
        const text = await speechToText(uri);
        setInterimText(text);
        onSpeechResult?.(text);
        await handleAIResponse(text);
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo detener la grabación');
    }
  };

  const speechToText = async (audioUri: string): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'record.m4a',
      } as any);
      formData.append('model', 'whisper-1');
      formData.append('language', 'es');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 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',
        },
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const result = await response.json();
      return result.text;
    } catch (error) {
      console.error('Transcripción fallida', error);
      return 'No se pudo transcribir';
    }
  };

  const handleAIResponse = async (text: string) => {
    try {
      setIsProcessing(false);
      setIsSpeaking(true);

      // 1. Obtener frase aleatoria y decirla primero
      const preResponse = await fetch('https://api.loveavi.com/api/get_random_phrase.php');
      const preData = await preResponse.json();
      const fraseIntro = preData.success && preData.frase ? preData.frase : 'Dame un momento...';
      
      await new Promise<void>((resolve) => {
        Speech.speak(fraseIntro, {
          language: 'es-ES',
          onDone: resolve,
        });
      });

      setIsProcessing(true);
      setIsSpeaking(false);

      // 2. Luego pedimos respuesta a la IA
      const response = await fetch('https://api.loveavi.com/openai/openai-api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, prompt: text, categoria: categoria }),
      });

      const data = await response.json();
      const respuesta = data.respuesta || 'No hay respuesta';
      
      setIsProcessing(false);
      setIsSpeaking(true);

      // 3. Decimos la respuesta de la IA
      await new Promise<void>((resolve) => {
        Speech.speak(respuesta, {
          language: 'es-ES',
          onDone: resolve,
        });
      });

      setIsSpeaking(false);

      // 4. Reinicia el ciclo
      setTimeout(() => {
        startVoiceCycle();
      }, 500);
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener respuesta de la IA');
      setIsProcessing(false);
      setIsSpeaking(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.circleContainer}>
        {/* Círculos concéntricos para el efecto de ondas */}
        <Animated.View
          style={[
            styles.waveCircle,
            {
              transform: [{ scale: circle1Scale }],
              opacity: circle1Opacity,
              backgroundColor: isListening ? '#9D00FF' : isSpeaking ? '#00A3FF' : '#666',
            },
          ]}
        />
        <Animated.View
          style={[
            styles.waveCircle,
            {
              transform: [{ scale: circle2Scale }],
              opacity: circle2Opacity,
              backgroundColor: isListening ? '#9D00FF' : isSpeaking ? '#00A3FF' : '#666',
            },
          ]}
        />
        <Animated.View
          style={[
            styles.waveCircle,
            {
              transform: [{ scale: circle3Scale }],
              opacity: circle3Opacity,
              backgroundColor: isListening ? '#9D00FF' : isSpeaking ? '#00A3FF' : '#666',
            },
          ]}
        />
        
        {/* Círculo principal */}
        <Animated.View
          style={[
            styles.pulsingCircle,
            {
              transform: [{ scale: pulseAnim }],
              opacity: opacityAnim,
              backgroundColor: isSpeaking 
                ? '#00A3FF' 
                : isProcessing 
                  ? '#444' 
                  : isListening 
                    ? '#9D00FF' 
                    : '#666',
            },
          ]}
        />
        
        {/* Icono en el centro */}
        <View style={styles.iconContainer}>
          <Ionicons
            name={isSpeaking ? 'volume-high' : isListening ? 'mic' : 'radio'}
            size={50}
            color="#FFF"
          />
        </View>
      </View>

      <Text style={styles.text}>
        {isProcessing
          ? 'Procesando...'
          : isSpeaking
          ? 'Hablando...'
          : isListening
          ? 'Escuchando...'
          : 'Modo conversación activa'}
      </Text>
      {interimText ? <Text style={styles.userText}>Tú: {interimText}</Text> : null}
      {onClose && (
        <TouchableOpacity
          onPress={async () => {
            try {
              // Detener grabación si hay
              if (recordingRef.current) {
                await recordingRef.current.stopAndUnloadAsync();
                recordingRef.current = null;
              }
              setIsListening(false);

              // Detener reproducción
              Speech.stop();
            } catch (e) {
              console.warn('Error al cerrar:', e);
            } finally {
              onClose?.();
            }
          }}
          style={styles.exitButton}
        >
          <Text style={styles.exitText}>Salir</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  circleContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  pulsingCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    position: 'absolute',
  },
  waveCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    position: 'absolute',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  text: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  userText: {
    color: '#ccc',
    fontSize: 18,
    marginTop: 20,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  exitButton: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#9D00FF',
    padding: 14,
    borderRadius: 30,
    paddingHorizontal: 30,
  },
  exitText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default VoiceActiveConversation;