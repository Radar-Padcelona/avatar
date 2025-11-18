import React, { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  VoiceEmotion,
  TaskType,
  TaskMode
} from '@heygen/streaming-avatar';

interface AvatarConfig {
  avatarId: string;
  voiceId: string;
  knowledgeBase: string;
  backgroundUrl?: string;
  quality?: 'low' | 'medium' | 'high';
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3';
  interactionMode?: 'streaming' | 'text';
}

const AvatarView: React.FC = () => {
  // Estados del avatar
  const [avatar, setAvatar] = useState<StreamingAvatar | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [backgroundUrl, setBackgroundUrl] = useState<string>('https://www.padcelona.com/wp-content/uploads/2022/01/padcelona-social.png');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:3'>('16:9');
  const [pendingVoiceChatRequest, setPendingVoiceChatRequest] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<AvatarConfig | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const avatarRef = useRef<StreamingAvatar | null>(null);
  const currentSessionId = useRef<string | null>(null);
  const audioActivatedOnce = useRef<boolean>(false);
  const socketInitializedRef = useRef<boolean>(false);
  const subtitleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fullTextRef = useRef<string>('');
  const microphonePermissionGranted = useRef<boolean>(false);

  // Detectar Safari iOS
  const isSafariIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  // Funciones de utilidad para subtítulos
  const clearSubtitle = useCallback(() => {
    if (subtitleTimeoutRef.current) {
      clearTimeout(subtitleTimeoutRef.current);
      subtitleTimeoutRef.current = null;
    }
    setCurrentSubtitle('');
    fullTextRef.current = '';
  }, []);

  const animateSubtitle = useCallback((text: string) => {
    fullTextRef.current = text;
    let currentIndex = 0;

    if (subtitleTimeoutRef.current) {
      clearTimeout(subtitleTimeoutRef.current);
    }

    const displayNextChunk = () => {
      if (currentIndex < fullTextRef.current.length) {
        const chunkSize = Math.min(3, fullTextRef.current.length - currentIndex);
        setCurrentSubtitle(fullTextRef.current.substring(0, currentIndex + chunkSize));
        currentIndex += chunkSize;
        subtitleTimeoutRef.current = setTimeout(displayNextChunk, 50);
      } else {
        subtitleTimeoutRef.current = setTimeout(() => {
          clearSubtitle();
        }, 3000);
      }
    };

    displayNextChunk();
  }, [clearSubtitle]);

  // Activar audio con interacción del usuario
  const handleActivateAudio = useCallback(async () => {
    console.log('🔊 Activando audio con gesto de usuario...');

    // Pre-solicitar permisos de micrófono para Safari iOS
    if (isSafariIOS) {
      console.log('🎤 Pre-solicitando permisos de micrófono...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        microphonePermissionGranted.current = true;
        console.log('✅ Permisos de micrófono pre-concedidos');
      } catch (err) {
        console.warn('⚠️ No se pudieron pre-conceder permisos de micrófono:', err);
      }
    }

    setAudioEnabled(true);
    audioActivatedOnce.current = true;
  }, [isSafariIOS]);

  // Inicializar avatar con configuración recibida
  const startAvatar = useCallback(async (config: AvatarConfig) => {
    if (avatarRef.current) {
      console.warn('⚠️ Avatar ya existe, limpiando primero...');
      await stopAvatar();
      // Dar tiempo a HeyGen para liberar la conexión completamente
      console.log('⏳ Esperando 2 segundos a que HeyGen libere la conexión...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    try {
      console.log('🚀 Iniciando avatar con configuración:', config);
      setIsLoading(true);
      setError(null);
      setCurrentConfig(config);

      // Actualizar UI
      setBackgroundUrl(config.backgroundUrl || '');
      setAspectRatio(config.aspectRatio || '16:9');

      // Activar audio automáticamente
      if (!audioEnabled && !audioActivatedOnce.current) {
        await handleActivateAudio();
      }

      const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

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

      // Configurar eventos
      avatarInstance.on(StreamingEvents.STREAM_READY, (event: any) => {
        console.log('🎥 Stream listo');
        if (videoRef.current && event?.detail) {
          videoRef.current.srcObject = event.detail;
          videoRef.current.muted = false;
          videoRef.current.play().then(() => {
            console.log('✅ Video reproduciéndose con audio');
            setIsLoading(false);

            // Notificar que el avatar está listo
            if (socketRef.current) {
              socketRef.current.emit('avatar-ready');
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
          socketRef.current.emit('avatar-error', { message: 'Stream desconectado' });
        }
      });

      avatarInstance.on(StreamingEvents.AVATAR_START_TALKING, (event: any) => {
        console.log('🗣️ Avatar empezó a hablar');
        setIsSpeaking(true);
        setIsProcessing(false);
        setUserSpeaking(false);

        if (event?.detail?.message) {
          animateSubtitle(event.detail.message);
        }

        if (socketRef.current) {
          socketRef.current.emit('avatar-start-talking');
        }
      });

      avatarInstance.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        console.log('🤐 Avatar dejó de hablar');
        setIsSpeaking(false);
        setIsProcessing(false);

        if (socketRef.current) {
          socketRef.current.emit('avatar-stop-talking');
        }
      });

      avatarInstance.on(StreamingEvents.USER_START, () => {
        console.log('🎤 Usuario empezó a hablar');
        setUserSpeaking(true);
        clearSubtitle();
      });

      avatarInstance.on(StreamingEvents.USER_STOP, () => {
        console.log('🤐 Usuario dejó de hablar');
        setUserSpeaking(false);
        setIsProcessing(true);
      });

      avatarInstance.on(StreamingEvents.USER_TALKING_MESSAGE, (event: any) => {
        if (event?.detail?.message) {
          console.log('📝 Mensaje del usuario:', event.detail.message);
          animateSubtitle(event.detail.message);
        }
      });

      // Iniciar avatar
      console.log('🚀 Iniciando avatar:', config.avatarId);
      const quality = (config.quality || 'high') as AvatarQuality;

      const startParams = {
        avatarName: config.avatarId,
        voice: {
          voiceId: config.voiceId,
          rate: 1.2, // Velocidad ligeramente más rápida para respuestas ágiles
          emotion: VoiceEmotion.FRIENDLY
        },
        quality: quality,
        language: 'es',
        videoEncoding: 'H264', // Mejor compatibilidad y potencialmente menor latencia
        knowledgeBase: config.knowledgeBase || 'Eres un asistente útil y amigable.'
      };

      console.log('📤 Parámetros de inicio:', JSON.stringify(startParams, null, 2));
      const result = await avatarInstance.createStartAvatar(startParams);

      // Guardar Session ID
      if (result && (result as any).session_id) {
        currentSessionId.current = (result as any).session_id;
        console.log('🆔 Session ID guardado:', currentSessionId.current);
      }

      console.log('✅ Avatar iniciado exitosamente');

    } catch (err: any) {
      console.error('❌ Error al iniciar avatar:', err);
      console.error('❌ Error completo:', JSON.stringify(err, null, 2));
      console.error('❌ Error details:', {
        message: err.message,
        code: err.code,
        status: err.status,
        statusText: err.statusText,
        response: err.response
      });

      const errorMessage = err.message || 'Error al iniciar avatar';
      setError(errorMessage);
      setIsLoading(false);

      if (socketRef.current) {
        socketRef.current.emit('avatar-error', { message: errorMessage });
      }
    }
  }, [animateSubtitle, clearSubtitle]);

  // Detener avatar
  const stopAvatar = useCallback(async () => {
    console.log('🛑 Deteniendo avatar...');

    try {
      const currentAvatar = avatarRef.current;

      if (!currentAvatar) {
        console.log('⚠️ No hay avatar para detener');
        return;
      }

      // Cerrar chat de voz si está activo
      if (isListening) {
        try {
          await currentAvatar.closeVoiceChat();
          setIsListening(false);
          console.log('✅ Chat de voz cerrado');
        } catch (err) {
          console.warn('⚠️ Error al cerrar chat de voz:', err);
        }
      }

      // Detener avatar
      try {
        await currentAvatar.stopAvatar();
        console.log('✅ Avatar detenido');
      } catch (err) {
        console.warn('⚠️ Error al detener avatar (ignorado):', err);
      }

      // Forzar cierre de sesión si tenemos session ID
      if (currentSessionId.current) {
        console.log('🔨 Forzando cierre de sesión:', currentSessionId.current);
        try {
          const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
          const response = await fetch(`${serverUrl}/api/force-close-session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: currentSessionId.current })
          });
          const result = await response.json();
          console.log('✅ Sesión cerrada en servidor:', result);

          // Esperar un poco más después del cierre forzado
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err) {
          console.warn('⚠️ Error al forzar cierre:', err);
        }
      }

      // Limpiar video
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.load(); // Forzar reset del elemento video
        console.log('✅ Video limpiado');
      }

      // Limpiar estados
      avatarRef.current = null;
      setAvatar(null);
      currentSessionId.current = null;
      setCurrentConfig(null);
      clearSubtitle();
      setIsListening(false);
      setIsSpeaking(false);
      setIsProcessing(false);

      console.log('✅ Avatar completamente detenido');

      // Notificar al servidor
      if (socketRef.current) {
        socketRef.current.emit('avatar-stopped');
      }

    } catch (error) {
      console.error('❌ Error al detener avatar:', error);

      // Intentar limpiar de todas formas
      avatarRef.current = null;
      setAvatar(null);
      currentSessionId.current = null;
      setCurrentConfig(null);

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [isListening, clearSubtitle]);

  // Iniciar chat de voz
  const handleStartVoiceChat = useCallback(async () => {
    if (!avatarRef.current) {
      console.error('❌ No hay avatar activo');
      return;
    }

    if (!audioEnabled && !audioActivatedOnce.current) {
      console.log('🔊 Esperando activación de audio...');
      await handleActivateAudio();
    }

    try {
      console.log('🎤 Iniciando chat de voz...');
      await avatarRef.current.startVoiceChat();
      setIsListening(true);
      console.log('✅ Chat de voz iniciado');

      if (socketRef.current) {
        socketRef.current.emit('voice-chat-started');
      }
    } catch (err) {
      console.error('❌ Error al iniciar chat de voz:', err);
      setError('Error al iniciar chat de voz');
    }
  }, [audioEnabled, handleActivateAudio]);

  // Detener chat de voz
  const handleStopVoiceChat = useCallback(async () => {
    if (!avatarRef.current) {
      console.error('❌ No hay avatar activo');
      return;
    }

    try {
      console.log('🛑 Deteniendo chat de voz...');
      await avatarRef.current.closeVoiceChat();
      setIsListening(false);
      clearSubtitle();
      console.log('✅ Chat de voz detenido');

      if (socketRef.current) {
        socketRef.current.emit('voice-chat-stopped');
      }
    } catch (err) {
      console.error('❌ Error al detener chat de voz:', err);
      setError('Error al detener chat de voz');
    }
  }, [clearSubtitle]);

  // Enviar texto al avatar
  const handleSpeakText = useCallback(async (text: string, taskType: string = 'REPEAT') => {
    if (!avatarRef.current) {
      console.error('❌ No hay avatar activo');
      return;
    }

    try {
      console.log('📝 Enviando texto al avatar:', text);
      console.log('⚡ Tipo de tarea:', taskType);

      // TaskType solo tiene TALK y REPEAT, no INTERRUPT
      // TALK interrumpe la conversación actual
      const task = taskType === 'INTERRUPT' ? TaskType.TALK : TaskType.REPEAT;

      await avatarRef.current.speak({
        text: text,
        taskType: task,
        taskMode: TaskMode.SYNC
      });

      console.log('✅ Texto enviado exitosamente');

      if (socketRef.current) {
        socketRef.current.emit('text-spoken');
      }
    } catch (err) {
      console.error('❌ Error al enviar texto:', err);
      setError('Error al enviar texto al avatar');
    }
  }, []);

  // Inicialización del socket
  useEffect(() => {
    // Si ya hay un socket y está conectado, no crear uno nuevo
    if (socketRef.current?.connected) {
      console.log('✅ Socket ya está conectado, reutilizando...');
      return;
    }

    if (socketInitializedRef.current) return;
    socketInitializedRef.current = true;

    console.log('🔌 Inicializando socket...');

    // Limpiar cualquier sesión anterior que pueda haber quedado abierta
    const cleanupPreviousSessions = async () => {
      try {
        console.log('🧹 Limpiando sesiones anteriores...');
        const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
        await fetch(`${serverUrl}/api/cleanup-sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        console.log('✅ Limpieza de sesiones anteriores completada');
      } catch (err) {
        console.warn('⚠️ Error al limpiar sesiones anteriores (no crítico):', err);
      }
    };

    cleanupPreviousSessions();

    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
    const socketInstance = io(serverUrl, {
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 2000,
      reconnectionAttempts: 10,
      timeout: 5000,
      transports: ['websocket', 'polling'],
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

    // Evento para iniciar avatar
    socketInstance.on('start-avatar', async (config: AvatarConfig) => {
      console.log('🚀 [AVATAR] Recibida solicitud de inicio:', config);
      await startAvatar(config);
    });

    // Evento para detener avatar
    socketInstance.on('stop-avatar', () => {
      console.log('🛑 [AVATAR] Recibida solicitud de detención');
      stopAvatar();
    });

    // Eventos de chat de voz
    socketInstance.on('start-voice-chat', () => {
      console.log('🔔 [AVATAR] Solicitud de chat de voz recibida');

      if (isSafariIOS) {
        console.log('🍎 Safari iOS detectado - mostrando confirmación');
        setPendingVoiceChatRequest(true);
      } else {
        handleStartVoiceChat();
      }
    });

    socketInstance.on('stop-voice-chat', () => {
      console.log('🔔 [AVATAR] Solicitud de detener chat de voz');
      handleStopVoiceChat();
    });

    // Evento de texto
    socketInstance.on('speak-text', (data: { text: string; taskType?: string }) => {
      console.log('📝 [AVATAR] Solicitud de hablar texto:', data);
      handleSpeakText(data.text, data.taskType);
    });

    return () => {
      console.log('🔌 Cleanup de socket (no desconectando para evitar problemas con React Strict Mode)...');
      // No desconectar el socket en cleanup para evitar problemas con React Strict Mode
      // El socket se desconectará cuando la página se cierre

      // Tampoco limpiar el avatar aquí para evitar problemas con Strict Mode
      // El avatar se limpiará manualmente cuando el usuario lo detenga
    };
  }, [startAvatar, stopAvatar, handleStartVoiceChat, handleStopVoiceChat, handleSpeakText, isSafariIOS]);

  // Confirmación para Safari iOS
  const handleConfirmVoiceChat = useCallback(async () => {
    setPendingVoiceChatRequest(false);
    await handleStartVoiceChat();
  }, [handleStartVoiceChat]);

  const handleCancelVoiceChat = useCallback(() => {
    setPendingVoiceChatRequest(false);
  }, []);

  // Calcular dimensiones del contenedor manteniendo el mismo tamaño visual
  const getVideoDimensions = () => {
    // Altura base fija para mantener tamaño visual consistente
    const baseHeight = '80vh';

    switch (aspectRatio) {
      case '16:9':
        return { width: '142.22vh', height: baseHeight }; // 16/9 * 80vh
      case '9:16':
        return { width: '45vh', height: baseHeight }; // 9/16 * 80vh
      case '1:1':
        return { width: baseHeight, height: baseHeight };
      case '4:3':
        return { width: '106.67vh', height: baseHeight }; // 4/3 * 80vh
      default:
        return { width: '142.22vh', height: baseHeight };
    }
  };

  const videoDimensions = getVideoDimensions();

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#000',
      backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      {/* Video del avatar con aspect ratio */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: videoDimensions.width,
        height: videoDimensions.height,
        maxWidth: '100vw',
        maxHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={!audioEnabled}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            backgroundColor: 'transparent'
          }}
        />
      </div>

      {/* Mensaje de espera */}
      {!currentConfig && !isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: 'white',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '40px',
          borderRadius: '20px',
          maxWidth: '500px'
        }}>
          <h2 style={{ fontSize: '32px', marginBottom: '20px' }}>Esperando inicio...</h2>
          <p style={{ fontSize: '18px', opacity: 0.8 }}>
            Configura y inicia el avatar desde el Panel de Control
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: 'white',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: '40px',
          borderRadius: '20px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '6px solid rgba(255, 255, 255, 0.3)',
            borderTop: '6px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p style={{ fontSize: '20px' }}>Iniciando avatar...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#dc3545',
          color: 'white',
          padding: '15px 30px',
          borderRadius: '10px',
          fontSize: '16px',
          fontWeight: 'bold',
          maxWidth: '80%',
          textAlign: 'center',
          zIndex: 1000
        }}>
          {error}
        </div>
      )}

      {/* Botón de activar audio */}

      {/* Confirmación de voz para Safari iOS */}
      {pendingVoiceChatRequest && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          zIndex: 1000,
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <h3 style={{ marginBottom: '20px', color: '#333' }}>Iniciar Chat de Voz</h3>
          <p style={{ marginBottom: '30px', color: '#666' }}>
            ¿Deseas activar el micrófono para hablar con el avatar?
          </p>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button
              onClick={handleConfirmVoiceChat}
              style={{
                flex: 1,
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '15px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ✅ Sí, activar
            </button>
            <button
              onClick={handleCancelVoiceChat}
              style={{
                flex: 1,
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '15px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ❌ Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Indicadores de estado */}
      {currentConfig && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 100
        }}>
          {isListening && (
            <div style={{
              backgroundColor: 'rgba(0, 123, 255, 0.9)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              🎤 Escuchando...
            </div>
          )}

          {userSpeaking && (
            <div style={{
              backgroundColor: 'rgba(255, 193, 7, 0.9)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              👤 Hablando...
            </div>
          )}

          {isProcessing && (
            <div style={{
              backgroundColor: 'rgba(108, 117, 125, 0.9)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              🧠 Procesando...
            </div>
          )}

          {isSpeaking && (
            <div style={{
              backgroundColor: 'rgba(40, 167, 69, 0.9)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              🗣️ Avatar hablando...
            </div>
          )}
        </div>
      )}

      {/* Subtítulos */}
      {currentSubtitle && (
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '15px 30px',
          borderRadius: '10px',
          fontSize: '18px',
          maxWidth: '80%',
          textAlign: 'center',
          zIndex: 100
        }}>
          {currentSubtitle}
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AvatarView;
