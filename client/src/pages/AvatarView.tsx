import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import { io, Socket } from 'socket.io-client';
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  VoiceEmotion,
  TaskType,
  TaskMode
} from '@heygen/streaming-avatar';

const AvatarView: React.FC = () => {
  const [avatar, setAvatar] = useState<StreamingAvatar | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAvatarId, setCurrentAvatarId] = useState<string>('Dexter_Doctor_Standing2_public');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showAudioButton, setShowAudioButton] = useState(true);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [backgroundUrl, setBackgroundUrl] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:3'>('16:9');
  const [pendingVoiceChatRequest, setPendingVoiceChatRequest] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Nuevo: indica cuando está procesando la respuesta
  const [userSpeaking, setUserSpeaking] = useState(false); // Nuevo: indica cuando el usuario está hablando
  const [showAvatarSelector, setShowAvatarSelector] = useState(true); // Mostrar selector antes de iniciar
  const [selectedInitialAvatar, setSelectedInitialAvatar] = useState<string>('Dexter_Doctor_Standing2_public');
  const subtitleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fullTextRef = useRef<string>('');
  const microphonePermissionGranted = useRef<boolean>(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Configuración de avatares disponibles
  const availableAvatars = [
    {
      id: 'Dexter_Doctor_Standing2_public',
      name: 'Doctor Dexter',
      description: 'Avatar médico profesional',
      icon: '👨‍⚕️'
    },
    {
      id: 'Ann_Therapist_public',
      name: 'CEO Ann',
      description: 'Avatar ejecutivo empresarial',
      icon: '👩‍💼'
    }
  ];

  // Detectar si es Safari iOS
  const isSafariIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) &&
                      /Safari/.test(navigator.userAgent) &&
                      !/CriOS|FxiOS|OPiOS|mercury/.test(navigator.userAgent);

  // Función para calcular las dimensiones del contenedor según el aspect ratio
  const getAspectRatioStyles = (ratio: '16:9' | '9:16' | '1:1' | '4:3') => {
    const ratios = {
      '16:9': { paddingTop: '56.25%' },  // 9/16 * 100
      '9:16': { paddingTop: '177.78%' }, // 16/9 * 100
      '1:1': { paddingTop: '100%' },     // 1/1 * 100
      '4:3': { paddingTop: '75%' }       // 3/4 * 100
    };
    return ratios[ratio];
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const socketInitializedRef = useRef<boolean>(false); // Para evitar doble init del socket
  const initializingAvatarRef = useRef<boolean>(false); // Para evitar doble init del avatar
  const avatarRef = useRef<StreamingAvatar | null>(null);
  const audioActivatedOnce = useRef<boolean>(false);
  const isChangingAvatar = useRef<boolean>(false);
  const currentAvatarIdRef = useRef<string>('Dexter_Doctor_Standing2_public'); // Ref síncrona del avatar actual
  const pendingServerNotification = useRef<any>(null); // Config pendiente para notificar al servidor
  const currentSessionId = useRef<string | null>(null); // Session ID del avatar actual para forzar cierre

  // Auto-limpieza de errores después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Función para animar subtítulos en bloques de 5 palabras deslizantes (memoizada)
  const animateSubtitle = useCallback((text: string) => {
    // Limpiar cualquier animación anterior
    if (subtitleTimeoutRef.current) {
      clearTimeout(subtitleTimeoutRef.current);
    }

    fullTextRef.current = text;
    const words = text.split(' ');
    let currentIndex = 0;
    const maxWordsToShow = 5; // Máximo de palabras a mostrar a la vez

    // Limpiar subtítulo inicial
    setCurrentSubtitle('');

    const showNextWord = () => {
      if (currentIndex < words.length) {
        // Calcular el inicio del bloque (para mostrar solo las últimas 5 palabras)
        const startIndex = Math.max(0, currentIndex - maxWordsToShow + 1);
        const wordsToShow = words.slice(startIndex, currentIndex + 1).join(' ');
        setCurrentSubtitle(wordsToShow);
        currentIndex++;

        // Velocidad ajustada para mejor sincronización (300ms por palabra)
        const delay = 300;
        subtitleTimeoutRef.current = setTimeout(showNextWord, delay);
      } else {
        // Al terminar todas las palabras, limpiar después de un momento
        subtitleTimeoutRef.current = setTimeout(() => {
          setCurrentSubtitle('');
        }, 1000);
      }
    };

    // Comenzar animación
    showNextWord();
  }, []);

  // Función para limpiar subtítulos (memoizada)
  const clearSubtitle = useCallback(() => {
    if (subtitleTimeoutRef.current) {
      clearTimeout(subtitleTimeoutRef.current);
      subtitleTimeoutRef.current = null;
    }
    fullTextRef.current = '';
    setCurrentSubtitle('');
  }, []);

  // Limpieza del avatar
  const cleanupAvatar = useCallback(async () => {
    const currentAvatar = avatarRef.current;
    const sessionId = currentSessionId.current;

    if (!currentAvatar) return;

    try {
      console.log('🧹 Limpiando avatar anterior...');
      if (sessionId) {
        console.log('🆔 Session ID:', sessionId);
      }

      // Detener chat de voz si está activo
      if (isListening) {
        console.log('🛑 Cerrando chat de voz activo...');
        try {
          await currentAvatar.closeVoiceChat();
          setIsListening(false);
          console.log('✅ Chat de voz cerrado');
        } catch (err) {
          console.warn('⚠️ Error al cerrar chat de voz:', err);
        }
      }

      // Detener avatar y esperar a que termine
      console.log('🛑 Deteniendo avatar...');
      try {
        await currentAvatar.stopAvatar();
        console.log('✅ Avatar detenido');
      } catch (err) {
        // Error de CORS es común al detener - HeyGen lo cierra por su cuenta
        console.warn('⚠️ Error al detener avatar (ignorado, intentaremos forzar cierre):', err);
      }

      // Si tenemos Session ID, forzar cierre mediante API directa
      if (sessionId) {
        console.log('🔨 Forzando cierre de sesión vía API de HeyGen...');
        try {
          const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
          await fetch(`${serverUrl}/api/force-close-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
          });
          console.log('✅ Sesión forzada a cerrar');
        } catch (err) {
          console.warn('⚠️ No se pudo forzar cierre (continuando):', err);
        }
      }

      // Limpiar video
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        console.log('✅ Video limpiado');
      }

      // Esperar un momento adicional para asegurar que HeyGen procese el cierre
      await new Promise(resolve => setTimeout(resolve, 3000));

      avatarRef.current = null;
      setAvatar(null);
      currentSessionId.current = null;
      console.log('✅ Limpieza completada');
    } catch (error) {
      console.error('❌ Error al limpiar avatar:', error);
    }
  }, [isListening]);

  // Inicialización del socket
  useEffect(() => {
    // Evitar doble inicialización en React Strict Mode
    if (socketInitializedRef.current) return;
    socketInitializedRef.current = true;

    // Log de detección de Safari iOS
    if (isSafariIOS) {
      console.log('🍎 Safari iOS detectado - usando flujo compatible con permisos de micrófono');
    }

    // Conectar a Socket.IO con configuración optimizada
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
    const socketInstance = io(serverUrl, {
      reconnection: true,
      reconnectionDelay: 500, // Reducido de 1000ms para reconexión más rápida
      reconnectionDelayMax: 2000, // Reducido de 5000ms
      reconnectionAttempts: 10,
      timeout: 5000, // Reducido de 20000ms para detección rápida de fallos
      transports: ['websocket', 'polling'], // Preferir websocket para menor latencia
      upgrade: true,
      rememberUpgrade: true
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      console.log('✅ [AVATAR] Conectado al servidor');
    });

    socketInstance.on('connect_error', (err) => {
      console.error('❌ [AVATAR] Error de conexión:', err);
      setError('Error de conexión con el servidor');
    });

    // Escuchar eventos desde el panel de control
    socketInstance.on('avatar-changed', handleAvatarChange);
    socketInstance.on('start-voice-chat', () => {
      console.log('🔔 [AVATAR] Solicitud de chat de voz recibida');

      if (isSafariIOS) {
        // Safari iOS requiere gesto de usuario directo para getUserMedia
        // Mostrar botón de confirmación en lugar de llamar directamente
        console.log('🍎 Safari iOS detectado - mostrando botón de confirmación');
        setPendingVoiceChatRequest(true);
      } else {
        // Otros navegadores pueden llamar directamente
        console.log('🌐 Navegador estándar - llamando directamente');
        handleStartVoiceChat();
      }
    });
    socketInstance.on('stop-voice-chat', () => {
      console.log('🔔 [AVATAR] Evento recibido: stop-voice-chat');
      handleStopVoiceChat();
    });
    socketInstance.on('speak-text', (data: { text: string; taskType?: string }) => {
      console.log('🔔 [AVATAR] Evento recibido: speak-text', data);
      // Animar subtítulo palabra por palabra
      animateSubtitle(data.text);
      handleSpeakText(data);
    });

    return () => {
      socketInitializedRef.current = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (avatarRef.current) {
        avatarRef.current.stopAvatar?.();
      }
    };
  }, []);

  const initializeAvatar = async () => {
    // Protección contra inicializaciones múltiples
    if (initializingAvatarRef.current) {
      console.log('⚠️ Ya hay una inicialización de avatar en curso, ignorando...');
      return;
    }

    try {
      initializingAvatarRef.current = true;
      setIsLoading(true);
      setError(null);

      const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

      // Configuración de avatares locales (para usar si es diferente al default del servidor)
      const avatarConfigs: Record<string, any> = {
        'Dexter_Doctor_Standing2_public': {
          avatarId: 'Dexter_Doctor_Standing2_public',
          voiceId: '7d51b57751f54a2c8ea646713cc2dd96',
          knowledgeBase: 'Eres un experto en tecnologías de fertilidad con 33 años de experiencia. Doctorado en Medicina Veterinaria, máster en Embriología Humana.\n\nResponde MUY CONCISO en español, máximo 2-3 oraciones naturales para voz. Evita emojis y formato especial. Sé breve y amigable.',
          backgroundUrl: 'https://www.padcelona.com/wp-content/uploads/2022/01/padcelona-social.png',
          quality: 'medium',
          aspectRatio: '16:9'
        },
        'Ann_Therapist_public': {
          avatarId: 'Ann_Therapist_public',
          voiceId: '6eafa43fdc16437b8f5abe512cc2b3cf',
          knowledgeBase: 'Experta en finanzas y estrategia empresarial. Análisis de negocios, inversiones y decisiones estratégicas. Estilo analítico y profesional.\n\nResponde MUY CONCISO en español, máximo 2-3 oraciones naturales para voz. Evita emojis y formato especial. Sé breve y amigable.',
          backgroundUrl: 'https://www.padcelona.com/wp-content/uploads/2022/01/padcelona-social.png',
          quality: 'medium',
          aspectRatio: '16:9'
        }
      };

      // Si seleccionaste un avatar diferente al inicial, usa la config local
      let avatarState;
      if (selectedInitialAvatar !== 'Dexter_Doctor_Standing2_public') {
        console.log(`🎯 Usando configuración local para avatar seleccionado: ${selectedInitialAvatar}`);
        avatarState = avatarConfigs[selectedInitialAvatar];

        // Actualizar estado local y ref
        currentAvatarIdRef.current = selectedInitialAvatar;
        setCurrentAvatarId(selectedInitialAvatar);
        setBackgroundUrl(avatarState.backgroundUrl || '');
        setAspectRatio(avatarState.aspectRatio || '16:9');

        // Guardar config para notificar al servidor DESPUÉS de cargar exitosamente
        pendingServerNotification.current = avatarState;
      } else {
        // Obtener estado del servidor si usamos el default
        console.log('📊 Obteniendo estado del avatar del servidor...');
        const stateResponse = await fetch(`${serverUrl}/api/avatar-state`);
        avatarState = await stateResponse.json();

        console.log('📦 Estado recibido del servidor:', JSON.stringify(avatarState, null, 2));

        currentAvatarIdRef.current = avatarState.avatarId;
        setCurrentAvatarId(avatarState.avatarId);
        setBackgroundUrl(avatarState.backgroundUrl || '');
        setAspectRatio(avatarState.aspectRatio || '16:9');
      }

      // Obtener token
      console.log('🔑 Obteniendo token de HeyGen...');
      const tokenResponse = await fetch(`${serverUrl}/api/get-token`, {
        method: 'POST'
      });

      if (!tokenResponse.ok) {
        throw new Error('Error al obtener token de HeyGen');
      }

      const { token } = await tokenResponse.json();

      // Crear instancia del avatar
      console.log('🎭 Creando instancia del avatar...');
      const avatarInstance = new StreamingAvatar({ token });
      setAvatar(avatarInstance);
      avatarRef.current = avatarInstance;

      // Configurar eventos del avatar
      avatarInstance.on(StreamingEvents.STREAM_READY, (event: any) => {
        console.log('🎥 Stream listo');
        if (videoRef.current && event?.detail) {
          videoRef.current.srcObject = event.detail;
          videoRef.current.muted = false;
          videoRef.current.play().then(() => {
            console.log('✅ Video reproduciéndose con audio');
            setIsLoading(false);

            // Notificar al servidor que el avatar está listo
            if (socketRef.current) {
              // Si hay un cambio de avatar pendiente, notificarlo primero para actualizar el estado del servidor
              if (pendingServerNotification.current) {
                console.log('📡 Notificando estado de avatar al servidor:', pendingServerNotification.current.avatarId);
                // Solo enviar para actualizar estado, no para hacer broadcast
                socketRef.current.emit('avatar-state-update', pendingServerNotification.current);
                pendingServerNotification.current = null;
              }

              console.log('📡 Emitiendo evento avatar-ready al servidor con ID:', currentAvatarIdRef.current);
              socketRef.current.emit('avatar-ready', { avatarId: currentAvatarIdRef.current });
            } else {
              console.warn('⚠️ No hay conexión socket para emitir avatar-ready');
            }
          }).catch(err => {
            console.log('⚠️ Error en autoplay:', err);
            setIsLoading(false);
          });
        }
      });

      avatarInstance.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log('⚠️ Stream desconectado');
        if (socketRef.current) {
          socketRef.current.emit('error', { message: 'Stream desconectado' });
        }
      });

      avatarInstance.on(StreamingEvents.AVATAR_START_TALKING, () => {
        console.log('🗣️ Avatar empezó a hablar');
        // Batch state updates para reducir re-renders
        React.startTransition(() => {
          setIsSpeaking(true);
          setIsProcessing(false);
        });
        // Notificar al servidor para sincronizar con el panel de control
        if (socketRef.current) {
          socketRef.current.emit('avatar-start-talking');
        }
      });

      avatarInstance.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        console.log('🤐 Avatar dejó de hablar');
        setIsSpeaking(false);
        setIsProcessing(false); // Ya no está procesando
        // Limpiar subtítulo cuando termina de hablar
        clearSubtitle();
        // Notificar al servidor
        if (socketRef.current) {
          socketRef.current.emit('avatar-stop-talking');
        }
      });

      // Eventos de detección de voz del usuario (para feedback inmediato)
      avatarInstance.on(StreamingEvents.USER_START, () => {
        console.log('👤 Usuario empezó a hablar');
        // Batch state updates
        React.startTransition(() => {
          setUserSpeaking(true);
          setIsProcessing(false);
        });
      });

      avatarInstance.on(StreamingEvents.USER_STOP, () => {
        console.log('👤 Usuario dejó de hablar');
        // Batch state updates - mostrar "pensando" inmediatamente
        React.startTransition(() => {
          setUserSpeaking(false);
          setIsProcessing(true);
        });
      });

      avatarInstance.on(StreamingEvents.USER_SILENCE, () => {
        console.log('🤫 Silencio detectado');
        setUserSpeaking(false);
      });

      // Iniciar avatar
      console.log(`🚀 Iniciando avatar: ${avatarState.avatarId}`);
      console.log(`🧠 Knowledge Base: ${avatarState.knowledgeBase}`);
      console.log(`🎥 Calidad: ${avatarState.quality || 'high'}`);

      // Mapear calidad del servidor a enum de HeyGen
      const qualityMap: { [key: string]: AvatarQuality } = {
        'low': AvatarQuality.Low,
        'medium': AvatarQuality.Medium,
        'high': AvatarQuality.High
      };
      const quality = qualityMap[(avatarState as any).quality || 'high'] || AvatarQuality.High;

      // Log detallado de parámetros antes de enviar a HeyGen
      const createParams = {
        avatarName: avatarState.avatarId,
        voice: {
          voiceId: avatarState.voiceId,
          rate: 1.15, // Velocidad aumentada para respuestas más rápidas
          emotion: VoiceEmotion.FRIENDLY
        },
        quality: quality,
        language: 'es',
        knowledgeBase: avatarState.knowledgeBase || 'Eres un asistente útil y amigable.'
      };
      console.log('📤 Parámetros a enviar a HeyGen API:', JSON.stringify(createParams, null, 2));

      const result = await avatarInstance.createStartAvatar(createParams);

      // Guardar Session ID si está disponible
      if (result && (result as any).session_id) {
        currentSessionId.current = (result as any).session_id;
        console.log('🆔 Session ID guardado:', currentSessionId.current);
      } else if (avatarInstance && (avatarInstance as any).sessionId) {
        currentSessionId.current = (avatarInstance as any).sessionId;
        console.log('🆔 Session ID guardado desde instancia:', currentSessionId.current);
      }

      console.log('✅ Avatar iniciado exitosamente');
      initializingAvatarRef.current = false; // Liberar el flag

    } catch (error) {
      console.error('❌ Error al inicializar avatar:', error);
      initializingAvatarRef.current = false; // Liberar el flag en caso de error

      // Extraer detalles del error de HeyGen
      let errorMessage = 'Error desconocido';
      let errorDetails = '';

      if (error instanceof Error) {
        errorMessage = error.message;
        // Intentar parsear detalles adicionales del error
        try {
          const errorString = error.toString();
          console.error('🔍 Error completo:', errorString);
          console.error('🔍 Error stack:', error.stack);

          // Intentar extraer el body del error de la API
          const errorObj = error as any;
          console.error('🔍 Error completo (objeto):', JSON.stringify(errorObj, null, 2));

          // Si el error tiene propiedades adicionales
          if (errorObj.response) {
            console.error('🔍 Response del error:', errorObj.response);
            errorDetails = JSON.stringify(errorObj.response);
          }
          if (errorObj.data) {
            console.error('🔍 Data del error:', errorObj.data);
            errorDetails += ' | Data: ' + JSON.stringify(errorObj.data);
          }
          if (errorObj.body) {
            console.error('🔍 Body del error:', errorObj.body);
            errorDetails += ' | Body: ' + JSON.stringify(errorObj.body);
          }
          if (errorObj.details) {
            console.error('🔍 Details del error:', errorObj.details);
            errorDetails += ' | Details: ' + JSON.stringify(errorObj.details);
          }
        } catch (e) {
          console.error('No se pudo parsear detalles del error');
        }
      }

      // Mensaje especial para error 503
      let displayError = errorDetails ? `${errorMessage} | ${errorDetails}` : errorMessage;
      if (errorMessage.includes('503')) {
        displayError = 'Servicio de HeyGen temporalmente no disponible. Por favor espera 1-2 minutos e intenta de nuevo.';
        console.warn('⚠️ Error 503: Probablemente límite de rate o sesiones concurrentes alcanzado');
      }

      setError(displayError);
      setIsLoading(false);

      // Notificar error al servidor con detalles completos
      if (socketRef.current) {
        socketRef.current.emit('error', {
          message: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }
  };

  const handleAvatarChange = async (newState: { avatarId: string; voiceId: string; knowledgeBase: string; backgroundUrl?: string; quality?: string; aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' }) => {
    // Prevenir cambios concurrentes
    if (isChangingAvatar.current) {
      console.log('⚠️ Ya hay un cambio de avatar en proceso');
      return;
    }

    // Prevenir cambios si ya estamos en ese avatar (usar ref para verificación síncrona)
    if (currentAvatarIdRef.current === newState.avatarId) {
      console.log(`⚠️ Ya estamos usando el avatar ${newState.avatarId}, ignorando cambio`);
      return;
    }

    isChangingAvatar.current = true;

    try {
      console.log(`🔄 [AVATAR] Cambiando de ${currentAvatarIdRef.current} a avatar: ${newState.avatarId}`);
      setIsLoading(true);
      setError(null);

      // Limpiar subtítulos al cambiar de avatar
      clearSubtitle();

      // Notificar inicio del cambio
      if (socketRef.current) {
        socketRef.current.emit('avatar-change-start');
      }

      // Limpiar avatar actual (incluye 3 segundos de espera interna + forzado de cierre via API)
      await cleanupAvatar();

      // Esperar solo 2 segundos ya que estamos forzando el cierre de sesión
      console.log('⏳ Esperando 2 segundos para confirmar cierre de sesión...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Solo resetear el estado de audio si nunca se ha activado
      if (!audioActivatedOnce.current) {
        setAudioEnabled(false);
        setShowAudioButton(true);
      }

      const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

      // Obtener nuevo token
      console.log('🔑 Obteniendo nuevo token...');
      const tokenResponse = await fetch(`${serverUrl}/api/get-token`, {
        method: 'POST'
      });

      if (!tokenResponse.ok) {
        throw new Error('Error al obtener token de HeyGen');
      }

      const { token } = await tokenResponse.json();

      // Crear nueva instancia del avatar
      console.log('🎭 Creando nueva instancia del avatar...');
      const avatarInstance = new StreamingAvatar({ token });
      setAvatar(avatarInstance);
      avatarRef.current = avatarInstance;

      // Configurar eventos
      avatarInstance.on(StreamingEvents.STREAM_READY, (event: any) => {
        console.log('🎥 Stream listo');
        if (videoRef.current && event?.detail) {
          videoRef.current.srcObject = event.detail;
          videoRef.current.muted = false;
          videoRef.current.play().then(() => {
            console.log('✅ Video reproduciéndose con audio');
            setIsLoading(false);

            // Notificar que el cambio se completó
            if (socketRef.current) {
              socketRef.current.emit('avatar-change-complete', {
                avatarId: newState.avatarId,
                voiceId: newState.voiceId
              });
              socketRef.current.emit('avatar-ready');
            }

            isChangingAvatar.current = false;
          }).catch(err => {
            console.log('⚠️ Error en autoplay:', err);
            setIsLoading(false);
            isChangingAvatar.current = false;
          });
        }
      });

      avatarInstance.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log('⚠️ Stream desconectado');
        if (socketRef.current) {
          socketRef.current.emit('error', { message: 'Stream desconectado' });
        }
      });

      avatarInstance.on(StreamingEvents.AVATAR_START_TALKING, () => {
        console.log('🗣️ Avatar empezó a hablar');
        setIsSpeaking(true);
        setIsProcessing(false);
        // Notificar al servidor
        if (socketRef.current) {
          socketRef.current.emit('avatar-start-talking');
        }
      });

      avatarInstance.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        console.log('🤐 Avatar dejó de hablar');
        setIsSpeaking(false);
        setIsProcessing(false);
        // Limpiar subtítulo cuando termina de hablar
        clearSubtitle();
        // Notificar al servidor
        if (socketRef.current) {
          socketRef.current.emit('avatar-stop-talking');
        }
      });

      // Eventos de detección de voz del usuario
      avatarInstance.on(StreamingEvents.USER_START, () => {
        console.log('👤 Usuario empezó a hablar');
        setUserSpeaking(true);
        setIsProcessing(false);
      });

      avatarInstance.on(StreamingEvents.USER_STOP, () => {
        console.log('👤 Usuario dejó de hablar');
        setUserSpeaking(false);
        setIsProcessing(true);
      });

      avatarInstance.on(StreamingEvents.USER_SILENCE, () => {
        console.log('🤫 Silencio detectado');
        setUserSpeaking(false);
      });

      // Iniciar nuevo avatar con reintentos
      console.log(`🚀 Iniciando nuevo avatar: ${newState.avatarId}`);
      console.log(`🧠 Nuevo Knowledge Base: ${newState.knowledgeBase}`);
      console.log(`🎥 Nueva Calidad: ${newState.quality || 'high'}`);
      console.log(`📦 Estado completo recibido para cambio:`, JSON.stringify(newState, null, 2));

      // Mapear calidad del servidor a enum de HeyGen
      const qualityMap: { [key: string]: AvatarQuality } = {
        'low': AvatarQuality.Low,
        'medium': AvatarQuality.Medium,
        'high': AvatarQuality.High
      };
      const quality = qualityMap[newState.quality || 'high'] || AvatarQuality.High;

      const changeParams = {
        avatarName: newState.avatarId,
        voice: {
          voiceId: newState.voiceId,
          rate: 1.15, // Velocidad aumentada para respuestas más rápidas
          emotion: VoiceEmotion.FRIENDLY
        },
        quality: quality,
        language: 'es',
        knowledgeBase: newState.knowledgeBase || 'Eres un asistente útil y amigable.'
      };
      console.log('📤 Parámetros de cambio a enviar a HeyGen API:', JSON.stringify(changeParams, null, 2));

      // Intentar crear avatar con reintentos en caso de error 400/503
      let retries = 0;
      const maxRetries = 2;
      while (retries <= maxRetries) {
        try {
          await avatarInstance.createStartAvatar(changeParams);
          console.log('✅ Avatar creado exitosamente');
          break; // Salir del bucle si tiene éxito
        } catch (err: any) {
          retries++;
          const errorMsg = err?.message || err?.toString() || 'Error desconocido';

          // Si es error 400 o 503 y aún quedan reintentos
          if ((errorMsg.includes('400') || errorMsg.includes('503')) && retries <= maxRetries) {
            console.warn(`⚠️ Error ${errorMsg.includes('400') ? '400' : '503'} al crear avatar. Reintento ${retries}/${maxRetries} en 3 segundos...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
          } else {
            // Si no es error 400/503 o se acabaron los reintentos, lanzar el error
            throw err;
          }
        }
      }

      currentAvatarIdRef.current = newState.avatarId;
      setCurrentAvatarId(newState.avatarId);
      setBackgroundUrl(newState.backgroundUrl || '');
      setAspectRatio(newState.aspectRatio || '16:9');

    } catch (error) {
      console.error('❌ Error al cambiar avatar:', error);

      let errorMsg = error instanceof Error ? error.message : 'Error al cambiar avatar';

      // Mensaje especial para error 503
      if (errorMsg.includes('503')) {
        errorMsg = 'Servicio de HeyGen temporalmente no disponible. Espera 1-2 minutos e intenta de nuevo.';
        console.warn('⚠️ Error 503 al cambiar avatar: Límite de rate o sesiones alcanzado');
      }

      setError(errorMsg);
      setIsLoading(false);
      isChangingAvatar.current = false;

      // Notificar error
      if (socketRef.current) {
        socketRef.current.emit('error', {
          message: errorMsg
        });
      }
    }
  };

  const handleStartVoiceChat = async () => {
    const currentAvatar = avatarRef.current;
    console.log('🎤 handleStartVoiceChat llamado');
    console.log('🎤 Avatar actual:', currentAvatar ? 'existe' : 'null');
    console.log('🎤 Ya está escuchando:', isListening);

    if (!currentAvatar) {
      console.error('❌ No hay avatar disponible para chat de voz');
      if (socketRef.current) {
        socketRef.current.emit('error', { message: 'No hay avatar disponible' });
      }
      return;
    }

    if (isListening) {
      console.log('⚠️ Ya está en modo escucha');
      return;
    }

    try {
      // Solo solicitar permisos si aún no se han concedido (optimización de latencia)
      if (!microphonePermissionGranted.current) {
        console.log('🎤 Solicitando acceso al micrófono...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('✅ Permisos de micrófono concedidos');
        stream.getTracks().forEach(track => track.stop());
        microphonePermissionGranted.current = true;
      } else {
        console.log('✅ Usando permisos de micrófono pre-concedidos');
      }

      console.log('🎤 Llamando a currentAvatar.startVoiceChat()...');
      const result = await currentAvatar.startVoiceChat();
      console.log('🎤 Resultado de startVoiceChat():', result);

      // Batch state updates para reducir re-renders
      setIsListening(true);
      setPendingVoiceChatRequest(false);
      console.log('✅ Chat de voz iniciado correctamente');

      // Notificar al servidor
      if (socketRef.current) {
        socketRef.current.emit('voice-chat-started');
      }
    } catch (error) {
      console.error('❌ Error en chat de voz:', error);

      // Mensaje específico para errores de permisos (Safari iOS)
      let errorMessage = error instanceof Error ? error.message : 'Error en chat de voz';
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Permiso de micrófono denegado. Por favor, permite el acceso al micrófono en la configuración de tu navegador.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No se encontró ningún micrófono. Por favor, conecta un micrófono y vuelve a intentarlo.';
        }
      }

      setError(errorMessage);
      setPendingVoiceChatRequest(false);

      // Notificar error
      if (socketRef.current) {
        socketRef.current.emit('error', { message: errorMessage });
      }
    }
  };

  const handleStopVoiceChat = useCallback(async () => {
    const currentAvatar = avatarRef.current;

    console.log('🛑 [STOP] Intentando detener chat de voz...');
    console.log('🛑 [STOP] Avatar existe:', currentAvatar ? 'sí' : 'no');

    if (!currentAvatar) {
      console.warn('⚠️ No hay avatar disponible para detener');
      return;
    }

    try {
      console.log('🛑 Deteniendo chat de voz...');
      await currentAvatar.closeVoiceChat();
      setIsListening(false);
      console.log('✅ Chat de voz detenido - estado actualizado a false');

      // Notificar al servidor
      if (socketRef.current) {
        socketRef.current.emit('voice-chat-stopped');
      }
    } catch (error) {
      console.error('❌ Error al detener chat de voz:', error);
      // Forzar actualización de estado incluso si hay error
      setIsListening(false);
      setError(error instanceof Error ? error.message : 'Error al detener chat de voz');

      // Notificar error
      if (socketRef.current) {
        socketRef.current.emit('error', {
          message: error instanceof Error ? error.message : 'Error al detener chat de voz'
        });
      }
    }
  }, []); // Sin dependencias - usa solo refs que no cambian

  const handleSpeakText = async (data: { text: string; taskType?: string }) => {
    console.log('🎯 handleSpeakText llamado con:', data);
    const currentAvatar = avatarRef.current;
    console.log('🎯 Estado del avatar:', currentAvatar ? 'existe' : 'null');
    console.log('🎯 Texto válido:', data.text?.trim() ? 'sí' : 'no');

    if (!currentAvatar) {
      console.error('❌ No hay instancia de avatar disponible');
      if (socketRef.current) {
        socketRef.current.emit('error', { message: 'No hay avatar disponible' });
      }
      return;
    }

    if (!data.text.trim()) {
      console.error('❌ Texto vacío');
      if (socketRef.current) {
        socketRef.current.emit('error', { message: 'Texto vacío' });
      }
      return;
    }

    try {
      console.log('📝 Enviando texto al avatar:', data.text);
      console.log('⚡ Tipo de tarea:', data.taskType || 'REPEAT');

      // Si es interrupción, primero interrumpir el habla actual
      if (data.taskType === 'INTERRUPT') {
        console.log('⚡ Interrumpiendo habla actual...');
        await currentAvatar.interrupt();
      }

      const response = await currentAvatar.speak({
        text: data.text,
        taskType: TaskType.REPEAT,
        taskMode: TaskMode.SYNC
      });
      console.log('✅ Texto enviado correctamente:', response);

      // Notificar al servidor
      if (socketRef.current) {
        socketRef.current.emit('text-spoken');
      }
    } catch (error) {
      console.error('❌ Error al enviar texto:', error);
      setError(error instanceof Error ? error.message : 'Error al enviar texto');

      // Notificar error
      if (socketRef.current) {
        socketRef.current.emit('error', {
          message: error instanceof Error ? error.message : 'Error al enviar texto'
        });
      }
    }
  };

  const handleEnableAudio = async () => {
    console.log('🔊 Activando audio con gesto de usuario...');

    // Marcar que el audio ya se activó
    setAudioEnabled(true);
    setShowAudioButton(false);
    setShowAvatarSelector(false); // Ocultar selector de avatar
    audioActivatedOnce.current = true;

    // Pre-solicitar permisos de micrófono para reducir latencia en chat de voz
    if (!microphonePermissionGranted.current) {
      try {
        console.log('🎤 Pre-solicitando permisos de micrófono...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        microphonePermissionGranted.current = true;
        console.log('✅ Permisos de micrófono pre-concedidos');
      } catch (err) {
        console.log('⚠️ No se pudieron pre-solicitar permisos de micrófono:', err);
      }
    }

    // Inicializar el avatar DESPUÉS del gesto de usuario
    await initializeAvatar();
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#1a1a1a',
      position: 'relative',
      backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      {/* Indicador de carga */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          zIndex: 10
        }}>
          <div style={{
            color: 'white',
            fontSize: '24px',
            marginBottom: '20px'
          }}>
            ⏳ Cargando avatar...
          </div>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
        </div>
      )}

      {/* Mensajes de error */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#ff4444',
          color: 'white',
          padding: '15px 30px',
          borderRadius: '8px',
          zIndex: 20,
          maxWidth: '80%',
          textAlign: 'center',
          animation: 'slideDown 0.3s ease-out'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Subtítulos */}
      {currentSubtitle && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          minWidth: '200px',
          maxWidth: '500px',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          color: 'white',
          padding: '12px 25px',
          borderRadius: '10px',
          fontSize: '18px',
          fontWeight: '500',
          textAlign: 'center',
          zIndex: 20,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          lineHeight: '1.4',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {currentSubtitle}
        </div>
      )}

      {/* Indicadores de estado */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 15,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        alignItems: 'flex-end'
      }}>
        {/* Indicador de micrófono activo */}
        {isListening && (
          <div style={{
            padding: '10px 20px',
            backgroundColor: 'rgba(40, 167, 69, 0.9)',
            color: 'white',
            borderRadius: '25px',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            <span style={{
              width: '10px',
              height: '10px',
              backgroundColor: 'white',
              borderRadius: '50%',
              animation: 'pulse 1s ease-in-out infinite'
            }}></span>
            🎤 Micrófono Activo
          </div>
        )}

        {/* Indicador de usuario hablando */}
        {userSpeaking && (
          <div style={{
            padding: '10px 20px',
            backgroundColor: 'rgba(255, 193, 7, 0.95)',
            color: 'white',
            borderRadius: '25px',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(255, 193, 7, 0.5)',
            animation: 'pulse 1s ease-in-out infinite'
          }}>
            <span style={{
              width: '10px',
              height: '10px',
              backgroundColor: 'white',
              borderRadius: '50%',
              animation: 'pulse 0.6s ease-in-out infinite'
            }}></span>
            👤 Te escucho...
          </div>
        )}

        {/* Indicador de procesando */}
        {isProcessing && !isSpeaking && (
          <div style={{
            padding: '10px 20px',
            backgroundColor: 'rgba(156, 39, 176, 0.95)',
            color: 'white',
            borderRadius: '25px',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(156, 39, 176, 0.5)'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              border: '2px solid white',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }}></div>
            💭 Pensando...
          </div>
        )}

        {/* Indicador de avatar hablando */}
        {isSpeaking && (
          <div style={{
            padding: '10px 20px',
            backgroundColor: 'rgba(102, 126, 234, 0.9)',
            color: 'white',
            borderRadius: '25px',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🗣️ Avatar Hablando
          </div>
        )}
      </div>

      {/* Botón de confirmación para chat de voz (Safari iOS requiere gesto de usuario) */}
      {pendingVoiceChatRequest && audioEnabled && avatar && !isLoading && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          textAlign: 'center'
        }}>
          <button
            onClick={() => {
              handleStartVoiceChat();
            }}
            style={{
              padding: '20px 40px',
              fontSize: '20px',
              fontWeight: 'bold',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(40, 167, 69, 0.4)',
              transition: 'all 0.3s ease',
              animation: 'pulse 2s ease-in-out infinite'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(40, 167, 69, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(40, 167, 69, 0.4)';
            }}
          >
            🎤 Activar Chat de Voz
          </button>
          <p style={{
            color: 'white',
            marginTop: '15px',
            fontSize: '14px',
            opacity: 0.9,
            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
          }}>
            Se requiere tu permiso para acceder al micrófono
          </p>
          <button
            onClick={() => setPendingVoiceChatRequest(false)}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              fontSize: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid white',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Botón de inicio */}
      {showAudioButton && !isLoading && !avatar && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 30,
          textAlign: 'center'
        }}>
          {/* Avatar Selector */}
          {showAvatarSelector && (
            <div style={{
              marginBottom: '30px'
            }}>
              <h3 style={{
                color: 'white',
                fontSize: '18px',
                marginBottom: '20px',
                fontWeight: '600'
              }}>
                Selecciona tu avatar
              </h3>
              <div style={{
                display: 'flex',
                gap: '20px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                {availableAvatars.map((avatar) => (
                  <div
                    key={avatar.id}
                    onClick={() => setSelectedInitialAvatar(avatar.id)}
                    style={{
                      width: '200px',
                      padding: '20px',
                      backgroundColor: selectedInitialAvatar === avatar.id
                        ? 'rgba(102, 126, 234, 0.9)'
                        : 'rgba(255, 255, 255, 0.1)',
                      border: selectedInitialAvatar === avatar.id
                        ? '3px solid #667eea'
                        : '2px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '15px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(10px)',
                      transform: selectedInitialAvatar === avatar.id ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: selectedInitialAvatar === avatar.id
                        ? '0 8px 20px rgba(102, 126, 234, 0.5)'
                        : '0 4px 10px rgba(0, 0, 0, 0.2)'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedInitialAvatar !== avatar.id) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedInitialAvatar !== avatar.id) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    <div style={{
                      fontSize: '48px',
                      marginBottom: '10px'
                    }}>
                      {avatar.icon}
                    </div>
                    <div style={{
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      marginBottom: '8px'
                    }}>
                      {avatar.name}
                    </div>
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '13px',
                      lineHeight: '1.4'
                    }}>
                      {avatar.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleEnableAudio}
            style={{
              padding: '20px 40px',
              fontSize: '20px',
              fontWeight: 'bold',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 12px 28px rgba(102, 126, 234, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
            }}
          >
            🎬 Iniciar Avatar
          </button>
        </div>
      )}

      {/* Contenedor de video con aspect ratio */}
      <div style={{
        position: 'relative',
        width: aspectRatio === '9:16' ? '40%' : aspectRatio === '1:1' ? '60%' : '80%',
        maxWidth: aspectRatio === '9:16' ? '400px' : aspectRatio === '1:1' ? '600px' : '1200px',
        margin: '0 auto',
        display: isLoading ? 'none' : 'block'
      }}>
        <div style={{
          position: 'relative',
          width: '100%',
          paddingTop: getAspectRatioStyles(aspectRatio).paddingTop,
          backgroundColor: '#000',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)'
        }}>
          <video
            ref={videoRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            autoPlay
            playsInline
            muted={false}
          />
        </div>
      </div>

      {/* Animaciones CSS */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(0.95);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AvatarView;
