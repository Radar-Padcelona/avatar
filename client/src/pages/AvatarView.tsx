import React, { useEffect, useRef, useState, useCallback } from 'react';
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const initializingRef = useRef<boolean>(false);
  const avatarRef = useRef<StreamingAvatar | null>(null);
  const audioActivatedOnce = useRef<boolean>(false);
  const isChangingAvatar = useRef<boolean>(false);

  // Auto-limpieza de errores después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Limpieza del avatar
  const cleanupAvatar = useCallback(async () => {
    const currentAvatar = avatarRef.current;
    if (!currentAvatar) return;

    try {
      console.log('🧹 Limpiando avatar anterior...');

      // Detener chat de voz si está activo
      if (isListening) {
        await currentAvatar.closeVoiceChat();
        setIsListening(false);
      }

      // Detener avatar
      await currentAvatar.stopAvatar();

      // Limpiar video
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      avatarRef.current = null;
      setAvatar(null);
      console.log('✅ Limpieza completada');
    } catch (error) {
      console.error('❌ Error al limpiar avatar:', error);
    }
  }, [isListening]);

  // Inicialización del socket
  useEffect(() => {
    // Evitar doble inicialización en React Strict Mode
    if (initializingRef.current) return;
    initializingRef.current = true;

    // Conectar a Socket.IO
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
    const socketInstance = io(serverUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
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
      console.log('🔔 [AVATAR] Evento recibido: start-voice-chat');
      handleStartVoiceChat();
    });
    socketInstance.on('stop-voice-chat', () => {
      console.log('🔔 [AVATAR] Evento recibido: stop-voice-chat');
      handleStopVoiceChat();
    });
    socketInstance.on('speak-text', (data: { text: string }) => {
      console.log('🔔 [AVATAR] Evento recibido: speak-text', data);
      handleSpeakText(data);
    });

    return () => {
      initializingRef.current = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (avatarRef.current) {
        avatarRef.current.stopAvatar?.();
      }
    };
  }, []);

  const initializeAvatar = async () => {
    try {
      setIsLoading(true);
      setError(null);

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

      // Obtener estado actual del avatar
      console.log('📊 Obteniendo estado del avatar...');
      const stateResponse = await fetch(`${serverUrl}/api/avatar-state`);
      const avatarState = await stateResponse.json();
      setCurrentAvatarId(avatarState.avatarId);

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
          socketRef.current.emit('error', { message: 'Stream desconectado' });
        }
      });

      avatarInstance.on(StreamingEvents.AVATAR_START_TALKING, () => {
        console.log('🗣️ Avatar empezó a hablar');
        setIsSpeaking(true);
      });

      avatarInstance.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        console.log('🤐 Avatar dejó de hablar');
        setIsSpeaking(false);
      });

      // Iniciar avatar
      console.log(`🚀 Iniciando avatar: ${avatarState.avatarId}`);
      await avatarInstance.createStartAvatar({
        avatarName: avatarState.avatarId,
        voice: {
          voiceId: avatarState.voiceId,
          rate: 1.0,
          emotion: VoiceEmotion.FRIENDLY
        },
        quality: AvatarQuality.High,
        language: 'es',
        knowledgeBase: 'Eres un asistente útil y amigable.'
      });

    } catch (error) {
      console.error('❌ Error al inicializar avatar:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      setIsLoading(false);

      // Notificar error al servidor
      if (socketRef.current) {
        socketRef.current.emit('error', {
          message: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }
  };

  const handleAvatarChange = async (newState: { avatarId: string; voiceId: string }) => {
    // Prevenir cambios concurrentes
    if (isChangingAvatar.current) {
      console.log('⚠️ Ya hay un cambio de avatar en proceso');
      return;
    }

    isChangingAvatar.current = true;

    try {
      console.log(`🔄 [AVATAR] Cambiando a avatar: ${newState.avatarId}`);
      setIsLoading(true);
      setError(null);

      // Notificar inicio del cambio
      if (socketRef.current) {
        socketRef.current.emit('avatar-change-start');
      }

      // Limpiar avatar actual
      await cleanupAvatar();

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
      });

      avatarInstance.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        console.log('🤐 Avatar dejó de hablar');
        setIsSpeaking(false);
      });

      // Iniciar nuevo avatar
      await avatarInstance.createStartAvatar({
        avatarName: newState.avatarId,
        voice: {
          voiceId: newState.voiceId,
          rate: 1.0,
          emotion: VoiceEmotion.FRIENDLY
        },
        quality: AvatarQuality.High,
        language: 'es',
        knowledgeBase: 'Eres un asistente útil y amigable.'
      });

      setCurrentAvatarId(newState.avatarId);

    } catch (error) {
      console.error('❌ Error al cambiar avatar:', error);
      setError(error instanceof Error ? error.message : 'Error al cambiar avatar');
      setIsLoading(false);
      isChangingAvatar.current = false;

      // Notificar error
      if (socketRef.current) {
        socketRef.current.emit('error', {
          message: error instanceof Error ? error.message : 'Error al cambiar avatar'
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
      // Verificar permisos de micrófono primero
      console.log('🎤 Verificando permisos de micrófono...');

      const permissionStatus = await navigator.permissions.query({
        name: 'microphone' as PermissionName
      });

      if (permissionStatus.state === 'denied') {
        throw new Error('Permiso de micrófono denegado. Por favor, habilita el micrófono en la configuración de tu navegador.');
      }

      console.log('🎤 Solicitando acceso al micrófono...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Permisos de micrófono concedidos');

      // Detener el stream de prueba
      stream.getTracks().forEach(track => track.stop());

      console.log('🎤 Llamando a currentAvatar.startVoiceChat()...');
      const result = await currentAvatar.startVoiceChat();
      console.log('🎤 Resultado de startVoiceChat():', result);
      setIsListening(true);
      console.log('✅ Chat de voz iniciado correctamente');

      // Notificar al servidor
      if (socketRef.current) {
        socketRef.current.emit('voice-chat-started');
      }
    } catch (error) {
      console.error('❌ Error en chat de voz:', error);
      setError(error instanceof Error ? error.message : 'Error en chat de voz');

      // Notificar error
      if (socketRef.current) {
        socketRef.current.emit('error', {
          message: error instanceof Error ? error.message : 'Error en chat de voz'
        });
      }
    }
  };

  const handleStopVoiceChat = async () => {
    const currentAvatar = avatarRef.current;
    if (!currentAvatar || !isListening) return;

    try {
      console.log('🛑 Deteniendo chat de voz...');
      await currentAvatar.closeVoiceChat();
      setIsListening(false);
      console.log('✅ Chat de voz detenido');

      // Notificar al servidor
      if (socketRef.current) {
        socketRef.current.emit('voice-chat-stopped');
      }
    } catch (error) {
      console.error('❌ Error al detener chat de voz:', error);
      setError(error instanceof Error ? error.message : 'Error al detener chat de voz');

      // Notificar error
      if (socketRef.current) {
        socketRef.current.emit('error', {
          message: error instanceof Error ? error.message : 'Error al detener chat de voz'
        });
      }
    }
  };

  const handleSpeakText = async (data: { text: string }) => {
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
    audioActivatedOnce.current = true;

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
      position: 'relative'
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
          <p style={{
            color: 'white',
            marginTop: '15px',
            fontSize: '14px',
            opacity: 0.9
          }}>
            Haz clic para cargar el avatar con audio
          </p>
        </div>
      )}

      {/* Video del avatar */}
      <video
        ref={videoRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: isLoading ? 'none' : 'block'
        }}
        autoPlay
        playsInline
        muted={false}
      />

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
