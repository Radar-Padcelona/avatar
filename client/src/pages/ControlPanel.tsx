import React, { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface AvatarConfig {
  avatarId: string;
  voiceId: string;
  knowledgeBase: string;
  backgroundUrl: string;
  quality: 'low' | 'medium' | 'high';
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
}

interface AvatarPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  config: AvatarConfig;
}

interface StatusMessage {
  type: 'success' | 'error' | 'info';
  message: string;
  timestamp: number;
}

const ControlPanel: React.FC = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAvatarActive, setIsAvatarActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [textInput, setTextInput] = useState<string>('');
  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);
  const [interactionMode, setInteractionMode] = useState<'streaming' | 'text'>('streaming');

  // Estados del formulario
  const [showForm, setShowForm] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<AvatarConfig>({
    avatarId: '',
    voiceId: '',
    knowledgeBase: '',
    backgroundUrl: 'https://www.padcelona.com/wp-content/uploads/2022/01/padcelona-social.png',
    quality: 'high',
    aspectRatio: '16:9'
  });
  const [selectedPresetName, setSelectedPresetName] = useState<string>('');

  // Avatares predefinidos
  const avatarPresets: AvatarPreset[] = [
    {
      id: 'dexter',
      name: 'Doctor Dexter',
      description: 'Experto médico en fertilidad',
      icon: '👨‍⚕️',
      config: {
        avatarId: 'Dexter_Doctor_Standing2_public',
        voiceId: '7d51b57751f54a2c8ea646713cc2dd96',
        knowledgeBase: 'Eres un experto en tecnologías de fertilidad con 33 años de experiencia. Doctorado en Medicina Veterinaria, máster en Embriología Humana.\n\nResponde MUY CONCISO en español, máximo 2-3 oraciones naturales para voz. Evita emojis y formato especial. Sé breve y amigable.',
        backgroundUrl: 'https://www.padcelona.com/wp-content/uploads/2022/01/padcelona-social.png',
        quality: 'medium',
        aspectRatio: '16:9'
      }
    },
    {
      id: 'ann',
      name: 'CEO Ann',
      description: 'Experta en finanzas y negocios',
      icon: '👩‍💼',
      config: {
        avatarId: 'Ann_Therapist_public',
        voiceId: '6eafa43fdc16437b8f5abe512cc2b3cf',
        knowledgeBase: 'Eres una experta en finanzas y estrategia empresarial. Ayudas con análisis de negocios, inversiones, gestión financiera y decisiones estratégicas. Tu estilo es analítico, profesional y orientado a resultados.\n\nResponde MUY CONCISO en español, máximo 2-3 oraciones naturales para voz. Evita emojis y formato especial. Sé breve y amigable.',
        backgroundUrl: 'https://www.padcelona.com/wp-content/uploads/2022/01/padcelona-social.png',
        quality: 'high',
        aspectRatio: '16:9'
      }
    },
    {
      id: 'custom',
      name: 'Personalizado',
      description: 'Crea tu propio avatar',
      icon: '⚙️',
      config: {
        avatarId: '',
        voiceId: '',
        knowledgeBase: 'Eres un asistente útil y amigable.\n\nResponde MUY CONCISO en español, máximo 2-3 oraciones naturales para voz. Evita emojis y formato especial. Sé breve y amigable.',
        backgroundUrl: 'https://www.padcelona.com/wp-content/uploads/2022/01/padcelona-social.png',
        quality: 'high',
        aspectRatio: '16:9'
      }
    }
  ];

  const addStatusMessage = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const newMessage: StatusMessage = {
      type,
      message,
      timestamp: Date.now()
    };
    setStatusMessages(prev => [...prev, newMessage].slice(-3));
  }, []);

  // Inicialización del socket
  useEffect(() => {
    // Si ya hay un socket y está conectado, no crear uno nuevo
    if (socketRef.current?.connected) return;

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
      setIsConnected(true);
      addStatusMessage('success', '✅ Conectado');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      addStatusMessage('error', '🔴 Desconectado');
    });

    socketInstance.on('connect_error', () => {
      addStatusMessage('error', '❌ Error de conexión');
    });

    socketInstance.on('avatar-ready', () => {
      setIsAvatarActive(true);
      setIsStarting(false);
      addStatusMessage('success', '✅ Avatar iniciado');
    });

    socketInstance.on('avatar-stopped', () => {
      setIsAvatarActive(false);
      setIsStopping(false);
      setIsListening(false);
      addStatusMessage('info', '🛑 Avatar detenido');
    });

    socketInstance.on('avatar-error', (data: { message: string }) => {
      setIsAvatarActive(false);
      setIsStarting(false);
      setIsStopping(false);

      // Si es "Stream desconectado", mostrarlo como info (azul) en lugar de error (rojo)
      if (data.message === 'Stream desconectado') {
        addStatusMessage('info', `ℹ️ ${data.message}`);
      } else {
        addStatusMessage('error', `❌ ${data.message}`);
      }
    });

    socketInstance.on('voice-chat-started', () => {
      setIsListening(true);
      addStatusMessage('success', '🎤 Voz activa');
    });

    socketInstance.on('voice-chat-stopped', () => {
      setIsListening(false);
      addStatusMessage('info', '🛑 Voz detenida');
    });

    socketInstance.on('avatar-start-talking', () => {
      setIsSpeaking(true);
    });

    socketInstance.on('avatar-stop-talking', () => {
      setIsSpeaking(false);
    });

    socketInstance.on('text-spoken', () => {
      addStatusMessage('success', '✅ Texto enviado');
    });

    return () => {
      // No desconectar el socket en cleanup para evitar problemas con React Strict Mode
      // El socket se desconectará cuando la página se cierre
    };
  }, [addStatusMessage]);

  const handleSelectPreset = (preset: AvatarPreset) => {
    setCurrentConfig(preset.config);
    setSelectedPresetName(preset.name);
    setShowForm(true);
  };

  const handleStartAvatar = useCallback(() => {
    if (!socketRef.current || !isConnected) {
      addStatusMessage('error', '❌ No conectado');
      return;
    }

    if (!currentConfig.avatarId || !currentConfig.voiceId) {
      addStatusMessage('error', '❌ Completa Avatar ID y Voice ID');
      return;
    }

    addStatusMessage('info', `🚀 Iniciando ${selectedPresetName}...`);
    setIsStarting(true);
    setShowForm(false);

    socketRef.current.emit('start-avatar', {
      ...currentConfig,
      interactionMode: interactionMode
    });
  }, [isConnected, currentConfig, interactionMode, selectedPresetName, addStatusMessage]);

  const handleStopAvatar = useCallback(() => {
    if (!socketRef.current || !isConnected) return;

    addStatusMessage('info', '🛑 Deteniendo...');
    setIsStopping(true);
    socketRef.current.emit('stop-avatar');
  }, [isConnected, addStatusMessage]);

  const handleStartVoiceChat = useCallback(() => {
    if (!socketRef.current || !isConnected || !isAvatarActive) return;
    socketRef.current.emit('start-voice-chat');
  }, [isConnected, isAvatarActive]);

  const handleStopVoiceChat = useCallback(() => {
    if (!socketRef.current || !isConnected || !isAvatarActive) return;
    socketRef.current.emit('stop-voice-chat');
  }, [isConnected, isAvatarActive]);

  const handleSendText = useCallback((taskType: string = 'REPEAT') => {
    if (!socketRef.current || !isConnected || !isAvatarActive) {
      addStatusMessage('error', '❌ Avatar no listo');
      return;
    }

    if (!textInput.trim()) {
      addStatusMessage('error', '❌ Escribe un texto');
      return;
    }

    socketRef.current.emit('speak-text', {
      text: textInput,
      taskType: taskType
    });

    setTextInput('');
  }, [isConnected, isAvatarActive, textInput, addStatusMessage]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#333', marginBottom: '10px', fontSize: '36px', fontWeight: 'bold' }}>
            Panel de Control
          </h1>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 20px',
            backgroundColor: isConnected ? '#d4edda' : '#f8d7da',
            borderRadius: '20px',
            fontSize: '16px',
            fontWeight: 'bold',
            color: isConnected ? '#155724' : '#721c24'
          }}>
            {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
          </div>
        </div>

        {/* Mensajes - Solo los últimos 2 */}
        {statusMessages.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            {statusMessages.slice(-2).map((msg) => (
              <div
                key={msg.timestamp}
                style={{
                  padding: '12px 20px',
                  marginBottom: '8px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: msg.type === 'success' ? '#d4edda' : msg.type === 'error' ? '#f8d7da' : '#d1ecf1',
                  color: msg.type === 'success' ? '#155724' : msg.type === 'error' ? '#721c24' : '#0c5460',
                  border: `2px solid ${msg.type === 'success' ? '#c3e6cb' : msg.type === 'error' ? '#f5c6cb' : '#bee5eb'}`
                }}
              >
                {msg.message}
              </div>
            ))}
          </div>
        )}

        {/* Selección de Avatar (si no hay avatar activo ni formulario abierto) */}
        {!isAvatarActive && !showForm && !isStarting && (
          <div>
            <h2 style={{ fontSize: '24px', marginBottom: '25px', color: '#333', textAlign: 'center' }}>
              Selecciona un Avatar
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {avatarPresets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  style={{
                    padding: '40px 30px',
                    borderRadius: '15px',
                    border: '2px solid #e9ecef',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3)';
                    e.currentTarget.style.borderColor = '#667eea';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    e.currentTarget.style.borderColor = '#e9ecef';
                  }}
                >
                  <div style={{ fontSize: '72px', marginBottom: '15px' }}>{preset.icon}</div>
                  <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>
                    {preset.name}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '0' }}>
                    {preset.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formulario de Configuración */}
        {showForm && !isAvatarActive && !isStarting && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ fontSize: '24px', color: '#333', margin: 0 }}>
                {selectedPresetName}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                ← Volver
              </button>
            </div>

            <div style={{
              padding: '30px',
              backgroundColor: '#f8f9fa',
              borderRadius: '15px',
              marginBottom: '20px'
            }}>
              {/* Avatar ID */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555', fontSize: '14px' }}>
                  Avatar ID *
                </label>
                <input
                  type="text"
                  value={currentConfig.avatarId}
                  onChange={(e) => setCurrentConfig({ ...currentConfig, avatarId: e.target.value })}
                  placeholder="Ej: Dexter_Doctor_Standing2_public"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '15px',
                    borderRadius: '8px',
                    border: '2px solid #ddd',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              {/* Voice ID */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555', fontSize: '14px' }}>
                  Voice ID *
                </label>
                <input
                  type="text"
                  value={currentConfig.voiceId}
                  onChange={(e) => setCurrentConfig({ ...currentConfig, voiceId: e.target.value })}
                  placeholder="Ej: 7d51b57751f54a2c8ea646713cc2dd96"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '15px',
                    borderRadius: '8px',
                    border: '2px solid #ddd',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              {/* Quality y Aspect Ratio en la misma fila */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555', fontSize: '14px' }}>
                    Calidad
                  </label>
                  <select
                    value={currentConfig.quality}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, quality: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '15px',
                      borderRadius: '8px',
                      border: '2px solid #ddd',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555', fontSize: '14px' }}>
                    Aspecto
                  </label>
                  <select
                    value={currentConfig.aspectRatio}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, aspectRatio: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '15px',
                      borderRadius: '8px',
                      border: '2px solid #ddd',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="16:9">16:9 (Horizontal)</option>
                    <option value="9:16">9:16 (Vertical)</option>
                    <option value="1:1">1:1 (Cuadrado)</option>
                    <option value="4:3">4:3 (Clásico)</option>
                  </select>
                </div>
              </div>

              {/* Background URL */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555', fontSize: '14px' }}>
                  URL de Fondo
                </label>
                <input
                  type="text"
                  value={currentConfig.backgroundUrl}
                  onChange={(e) => setCurrentConfig({ ...currentConfig, backgroundUrl: e.target.value })}
                  placeholder="URL de imagen de fondo"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '15px',
                    borderRadius: '8px',
                    border: '2px solid #ddd'
                  }}
                />
              </div>

              {/* Knowledge Base */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555', fontSize: '14px' }}>
                  Knowledge Base / Prompt del Sistema
                </label>
                <textarea
                  value={currentConfig.knowledgeBase}
                  onChange={(e) => setCurrentConfig({ ...currentConfig, knowledgeBase: e.target.value })}
                  rows={6}
                  placeholder="Define la personalidad y comportamiento del avatar..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '15px',
                    borderRadius: '8px',
                    border: '2px solid #ddd',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Modo de Interacción */}
              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#555', fontSize: '14px' }}>
                  Modo de Interacción
                </label>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button
                    onClick={() => setInteractionMode('streaming')}
                    style={{
                      flex: 1,
                      padding: '15px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      backgroundColor: interactionMode === 'streaming' ? '#667eea' : '#e9ecef',
                      color: interactionMode === 'streaming' ? 'white' : '#666',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    🎤 Voz (Streaming)
                  </button>
                  <button
                    onClick={() => setInteractionMode('text')}
                    style={{
                      flex: 1,
                      padding: '15px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      backgroundColor: interactionMode === 'text' ? '#667eea' : '#e9ecef',
                      color: interactionMode === 'text' ? 'white' : '#666',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    📝 Texto
                  </button>
                </div>
              </div>
            </div>

            {/* Botón Iniciar */}
            <button
              onClick={handleStartAvatar}
              disabled={!isConnected || !currentConfig.avatarId || !currentConfig.voiceId}
              style={{
                width: '100%',
                padding: '18px',
                fontSize: '20px',
                fontWeight: 'bold',
                backgroundColor: (!isConnected || !currentConfig.avatarId || !currentConfig.voiceId) ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: (!isConnected || !currentConfig.avatarId || !currentConfig.voiceId) ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}
            >
              ▶️ Iniciar Avatar
            </button>
          </div>
        )}

        {/* Avatar Activo */}
        {(isAvatarActive || isStopping) && (
          <div>
            <div style={{
              marginBottom: '25px',
              padding: '25px',
              backgroundColor: '#e7f3ff',
              borderRadius: '15px',
              border: '2px solid #667eea',
              textAlign: 'center'
            }}>
              <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '5px' }}>
                {selectedPresetName}
              </h2>
              <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                Modo: {interactionMode === 'streaming' ? '🎤 Voz' : '📝 Texto'}
              </p>
            </div>

            {/* Controles de voz */}
            {interactionMode === 'streaming' && isAvatarActive && (
              <div style={{
                marginBottom: '25px',
                padding: '25px',
                backgroundColor: '#d4edda',
                borderRadius: '15px',
                border: '2px solid #28a745'
              }}>
                <h3 style={{ fontSize: '18px', marginBottom: '15px', color: '#333' }}>
                  🎤 Control de Voz
                </h3>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button
                    onClick={handleStartVoiceChat}
                    disabled={isListening}
                    style={{
                      flex: 1,
                      padding: '15px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      backgroundColor: isListening ? '#ccc' : '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: isListening ? 'not-allowed' : 'pointer'
                    }}
                  >
                    🎤 Iniciar Voz
                  </button>
                  <button
                    onClick={handleStopVoiceChat}
                    disabled={!isListening}
                    style={{
                      flex: 1,
                      padding: '15px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      backgroundColor: !isListening ? '#ccc' : '#ffc107',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: !isListening ? 'not-allowed' : 'pointer'
                    }}
                  >
                    🛑 Detener Voz
                  </button>
                </div>
                {isListening && (
                  <div style={{
                    marginTop: '15px',
                    padding: '15px',
                    backgroundColor: '#fff3cd',
                    borderRadius: '10px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: '#856404'
                  }}>
                    🎤 Escuchando...
                  </div>
                )}
                {isSpeaking && (
                  <div style={{
                    marginTop: '15px',
                    padding: '15px',
                    backgroundColor: '#d1ecf1',
                    borderRadius: '10px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: '#0c5460'
                  }}>
                    🗣️ Avatar hablando...
                  </div>
                )}
              </div>
            )}

            {/* Controles de texto */}
            {interactionMode === 'text' && isAvatarActive && (
              <div style={{
                marginBottom: '25px',
                padding: '25px',
                backgroundColor: '#fff3cd',
                borderRadius: '15px',
                border: '2px solid #ffc107'
              }}>
                <h3 style={{ fontSize: '18px', marginBottom: '15px', color: '#333' }}>
                  📝 Enviar Texto
                </h3>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Escribe lo que quieres que diga el avatar..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '15px',
                    fontSize: '16px',
                    borderRadius: '10px',
                    border: '2px solid #ddd',
                    marginBottom: '15px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button
                    onClick={() => handleSendText('REPEAT')}
                    disabled={!textInput.trim()}
                    style={{
                      flex: 1,
                      padding: '15px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      backgroundColor: !textInput.trim() ? '#ccc' : '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: !textInput.trim() ? 'not-allowed' : 'pointer'
                    }}
                  >
                    📤 Enviar
                  </button>
                  <button
                    onClick={() => handleSendText('INTERRUPT')}
                    disabled={!textInput.trim()}
                    style={{
                      flex: 1,
                      padding: '15px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      backgroundColor: !textInput.trim() ? '#ccc' : '#fd7e14',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: !textInput.trim() ? 'not-allowed' : 'pointer'
                    }}
                  >
                    ⚡ Interrumpir
                  </button>
                </div>
                {isSpeaking && (
                  <div style={{
                    marginTop: '15px',
                    padding: '15px',
                    backgroundColor: '#d1ecf1',
                    borderRadius: '10px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: '#0c5460'
                  }}>
                    🗣️ Avatar hablando...
                  </div>
                )}
              </div>
            )}

            {/* Botón Detener */}
            <button
              onClick={handleStopAvatar}
              disabled={isStopping}
              style={{
                width: '100%',
                padding: '18px',
                fontSize: '20px',
                fontWeight: 'bold',
                backgroundColor: isStopping ? '#ccc' : '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: isStopping ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}
            >
              {isStopping ? '⏳ Deteniendo...' : '⏹️ Detener Avatar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;
