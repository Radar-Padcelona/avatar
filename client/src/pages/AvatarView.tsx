import React, { useEffect, useRef, useState } from 'react';
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

  useEffect(() => {
    // Evitar doble inicialización en React Strict Mode
    if (initializingRef.current) return;
    initializingRef.current = true;

    // Conectar a Socket.IO
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
    socketRef.current = io(serverUrl);

    socketRef.current.on('connect', () => {
      console.log('✅ Conectado al servidor');
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('❌ Error de conexión:', err);
      setError('Error de conexión con el servidor');
    });

    // Escuchar eventos desde el panel de control
    socketRef.current.on('avatar-changed', handleAvatarChange);
    socketRef.current.on('start-voice-chat', () => {
      console.log('🔔 Evento recibido: start-voice-chat');
      handleStartVoiceChat();
    });
    socketRef.current.on('stop-voice-chat', () => {
      console.log('🔔 Evento recibido: stop-voice-chat');
      handleStopVoiceChat();
    });
    socketRef.current.on('speak-text', (data: { text: string }) => {
      console.log('🔔 Evento recibido: speak-text', data);
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

      // Configurar evento cuando el stream esté listo
      avatarInstance.on(StreamingEvents.STREAM_READY, (event: any) => {
        console.log('🎥 Stream listo');
        if (videoRef.current && event?.detail) {
          videoRef.current.srcObject = event.detail;
          // El usuario ya hizo clic para iniciar, así que podemos reproducir con audio
          videoRef.current.muted = false;
          videoRef.current.play().then(() => {
            console.log('✅ Video reproduciéndose con audio');
          }).catch(err => {
            console.log('⚠️ Error en autoplay:', err);
          });
          setIsLoading(false);
        }
      });

      avatarInstance.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log('⚠️ Stream desconectado');
      });

      avatarInstance.on(StreamingEvents.AVATAR_START_TALKING, () => {
        console.log('🗣️ Avatar empezó a hablar');
        setIsSpeaking(true);
      });

      avatarInstance.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        console.log('🤐 Avatar dejó de hablar');
        setIsSpeaking(false);
      });

      // Iniciar avatar con configuración STT para chat de voz
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
    }
  };

  const handleAvatarChange = async (newState: { avatarId: string; voiceId: string }) => {
    try {
      console.log(`🔄 Cambiando a avatar: ${newState.avatarId}`);
      setIsLoading(true);
      setError(null);

      // Detener y limpiar avatar actual
      if (avatar) {
        await avatar.stopAvatar();
      }

      // Solo resetear el estado de audio si nunca se ha activado
      if (!audioActivatedOnce.current) {
        setAudioEnabled(false);
        setShowAudioButton(true);
      }

      const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

      // Obtener nuevo token para el cambio de avatar
      console.log('🔑 Obteniendo nuevo token...');
      const tokenResponse = await fetch(`${serverUrl}/api/get-token`, {
        method: 'POST'
      });

      if (!tokenResponse.ok) {
        throw new Error('Error al obtener token de HeyGen');
      }

      const { token } = await tokenResponse.json();

      // Crear nueva instancia del avatar con el nuevo token
      console.log('🎭 Creando nueva instancia del avatar...');
      const avatarInstance = new StreamingAvatar({ token });
      setAvatar(avatarInstance);
      avatarRef.current = avatarInstance;

      // Configurar eventos
      avatarInstance.on(StreamingEvents.STREAM_READY, (event: any) => {
        console.log('🎥 Stream listo');
        if (videoRef.current && event?.detail) {
          videoRef.current.srcObject = event.detail;
          // Si el audio ya fue activado antes, mantenerlo activado
          videoRef.current.muted = false;
          videoRef.current.play().then(() => {
            console.log('✅ Video reproduciéndose con audio');
          }).catch(err => {
            console.log('⚠️ Error en autoplay:', err);
          });
          setIsLoading(false);
        }
      });

      avatarInstance.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        console.log('⚠️ Stream desconectado');
      });

      avatarInstance.on(StreamingEvents.AVATAR_START_TALKING, () => {
        console.log('🗣️ Avatar empezó a hablar');
        setIsSpeaking(true);
      });

      avatarInstance.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        console.log('🤐 Avatar dejó de hablar');
        setIsSpeaking(false);
      });

      // Iniciar nuevo avatar con configuración STT
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
    }
  };

  // Handlers para eventos desde el panel de control
  const handleStartVoiceChat = async () => {
    const currentAvatar = avatarRef.current;
    console.log('🎤 handleStartVoiceChat llamado');
    console.log('🎤 Avatar actual:', currentAvatar ? 'existe' : 'null');
    console.log('🎤 Ya está escuchando:', isListening);

    if (!currentAvatar) {
      console.error('❌ No hay avatar disponible para chat de voz');
      return;
    }

    if (isListening) {
      console.log('⚠️ Ya está en modo escucha');
      return;
    }

    try {
      // Verificar permisos de micrófono primero
      console.log('🎤 Solicitando permisos de micrófono...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Permisos de micrófono concedidos');

      // Detener el stream de prueba
      stream.getTracks().forEach(track => track.stop());

      console.log('🎤 Llamando a currentAvatar.startVoiceChat()...');
      const result = await currentAvatar.startVoiceChat();
      console.log('🎤 Resultado de startVoiceChat():', result);
      setIsListening(true);
      console.log('✅ Chat de voz iniciado correctamente');
    } catch (error) {
      console.error('❌ Error en chat de voz:', error);
      setError(error instanceof Error ? error.message : 'Error en chat de voz');
    }
  };

  const handleStopVoiceChat = async () => {
    const currentAvatar = avatarRef.current;
    if (!currentAvatar || !isListening) return;

    try {
      console.log('🛑 Deteniendo chat de voz...');
      await currentAvatar.closeVoiceChat();
      setIsListening(false);
    } catch (error) {
      console.error('❌ Error al detener chat de voz:', error);
    }
  };

  const handleSpeakText = async (data: { text: string }) => {
    console.log('🎯 handleSpeakText llamado con:', data);
    const currentAvatar = avatarRef.current;
    console.log('🎯 Estado del avatar:', currentAvatar ? 'existe' : 'null');
    console.log('🎯 Texto válido:', data.text?.trim() ? 'sí' : 'no');

    if (!currentAvatar) {
      console.error('❌ No hay instancia de avatar disponible');
      return;
    }

    if (!data.text.trim()) {
      console.error('❌ Texto vacío');
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
    } catch (error) {
      console.error('❌ Error al enviar texto:', error);
      setError(error instanceof Error ? error.message : 'Error al enviar texto');
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
          textAlign: 'center'
        }}>
          ❌ {error}
        </div>
      )}

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

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default AvatarView;
