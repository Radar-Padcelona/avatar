import React, { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface AvatarConfig {
  name: string;
  avatarId: string;
  voiceId: string;
  description: string;
  knowledgeBase: string;
  backgroundUrl?: string;
}

interface StatusMessage {
  type: 'success' | 'error' | 'info';
  message: string;
  timestamp: number;
}

const ControlPanel: React.FC = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string>('Dexter_Doctor_Standing2_public');
  const [isAvatarReady, setIsAvatarReady] = useState(false);
  const [isChangingAvatar, setIsChangingAvatar] = useState(false);
  const [lastChange, setLastChange] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [textInput, setTextInput] = useState<string>('');
  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);

  // Estados editables para los avatares
  const [avatarConfigs, setAvatarConfigs] = useState<AvatarConfig[]>([
    {
      name: '👨‍⚕️ Doctor Dexter',
      avatarId: 'Dexter_Doctor_Standing2_public',
      voiceId: '7d51b57751f54a2c8ea646713cc2dd96',
      description: 'Avatar médico profesional',
      knowledgeBase: 'Jefe de Clientes Globales y Excelencia en Tecnologías de Fertilidad en la Franquicia Global de Fertilidad, Boston, Massachusetts. Treinta y tres años de experiencia combinada en tecnologías reproductivas avanzadas (TRA), tanto en humanos como en animales. Veinte años gestionando su propio negocio de TRA en Sudamérica, desarrolló cinco laboratorios exitosos en Tecnologías Reproductivas Avanzadas y transfirió más de 3000 embriones al año. Veintitrés años de experiencia en TRA humana y en la industria biofarmacéutica, siete años en EE. UU. y dieciséis años a nivel mundial. Tienes un doctorado en Medicina Veterinaria por la Universidad de Buenos Aires, una beca en Ciencia Animal por la Universidad de Davis, un máster en Embriología Humana y Andrología por el Instituto Jones de la Facultad de Medicina de Virginia Oriental y una beca ejecutiva por el Babson College de Boston\n' +
          '\n' +
          'Responde de manera MUY CONCISA en español o en el idioma que te indiquen en cada momento, máximo 2-3 oraciones. Tus respuestas serán leídas en voz alta por un avatar, así que deben ser naturales para hablar (evita usar emojis, asteriscos o formato especial). Sé breve, directo y amigable.',
      backgroundUrl: 'https://www.padcelona.com/wp-content/uploads/2022/01/padcelona-social.png'
    },
    {
      name: '👔 CEO Ann',
      avatarId: 'Ann_Therapist_public',
      voiceId: '6eafa43fdc16437b8f5abe512cc2b3cf',
      description: 'Avatar ejecutivo empresarial',
      knowledgeBase: 'Eres un experto en finanzas y estrategia empresarial. Ayudas con análisis de negocios, inversiones, gestión financiera y decisiones estratégicas. Tu estilo es analítico, profesional y orientado a resultados.',
      backgroundUrl: 'https://www.padcelona.com/wp-content/uploads/2022/01/padcelona-social.png'
    }
  ]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Función para agregar mensajes de estado
  const addStatusMessage = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const newMessage: StatusMessage = {
      type,
      message,
      timestamp: Date.now()
    };

    setStatusMessages(prev => {
      // Mantener solo los últimos 5 mensajes
      const updated = [...prev, newMessage].slice(-5);
      return updated;
    });
  }, []);

  // Inicialización del socket
  useEffect(() => {
    // Evitar múltiples conexiones
    if (socketRef.current) return;

    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

    const socketInstance = io(serverUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current = socketInstance;

    // Eventos de conexión
    socketInstance.on('connect', () => {
      setIsConnected(true);
      addStatusMessage('success', '🟢 Conectado al servidor');
      console.log('✅ Conectado al servidor');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      setIsAvatarReady(false);
      addStatusMessage('error', '🔴 Desconectado del servidor');
      console.log('⚠️ Desconectado del servidor');
    });

    socketInstance.on('connect_error', (error) => {
      addStatusMessage('error', '❌ Error de conexión');
      console.error('❌ Error de conexión:', error);
    });

    // Eventos del avatar
    socketInstance.on('avatar-state', (state) => {
      console.log('📊 Estado recibido:', state);
      setCurrentAvatar(state.avatarId);
    });

    socketInstance.on('avatar-ready', () => {
      setIsAvatarReady(true);
      setIsChangingAvatar(false);
      addStatusMessage('success', '✅ Avatar listo');
      console.log('✅ Avatar listo');
    });

    socketInstance.on('avatar-change-start', () => {
      setIsChangingAvatar(true);
      setIsAvatarReady(false);
      addStatusMessage('info', '🔄 Cambiando avatar...');
      console.log('🔄 Inicio del cambio de avatar');
    });

    socketInstance.on('avatar-change-complete', (data) => {
      setIsChangingAvatar(false);
      setIsAvatarReady(true);
      addStatusMessage('success', `✅ Avatar cambiado exitosamente`);
      console.log('✅ Cambio de avatar completado:', data);
    });

    socketInstance.on('voice-chat-started', () => {
      setIsListening(true);
      addStatusMessage('success', '🎤 Chat de voz iniciado');
      console.log('✅ Confirmación: Chat de voz iniciado');
    });

    socketInstance.on('voice-chat-stopped', () => {
      setIsListening(false);
      addStatusMessage('info', '🛑 Chat de voz detenido');
      console.log('✅ Confirmación: Chat de voz detenido');
    });

    socketInstance.on('text-spoken', () => {
      addStatusMessage('success', '✅ Texto enviado correctamente');
      console.log('✅ Confirmación: Texto enviado');
    });

    socketInstance.on('avatar-start-talking', () => {
      setIsSpeaking(true);
      console.log('🗣️ Avatar comenzó a hablar');
    });

    socketInstance.on('avatar-stop-talking', () => {
      setIsSpeaking(false);
      console.log('🤐 Avatar dejó de hablar');
    });

    socketInstance.on('error', (error) => {
      addStatusMessage('error', `❌ Error: ${error.message}`);
      console.error('❌ Error del servidor:', error);
    });

    // Limpieza al desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [addStatusMessage]);

  // Validación antes de acciones
  const validateAction = (actionName: string): boolean => {
    if (!socketRef.current) {
      addStatusMessage('error', '❌ Socket no disponible');
      console.error('❌ Socket no disponible');
      return false;
    }

    if (!isConnected) {
      addStatusMessage('error', '❌ No conectado al servidor');
      console.error('❌ No conectado al servidor');
      return false;
    }

    if (!isAvatarReady && actionName !== 'change-avatar') {
      addStatusMessage('error', '❌ Avatar no está listo');
      console.error('❌ Avatar no está listo');
      return false;
    }

    if (isChangingAvatar) {
      addStatusMessage('error', '⚠️ Cambio de avatar en progreso');
      console.error('⚠️ Cambio de avatar en progreso');
      return false;
    }

    return true;
  };

  const changeAvatar = (config: AvatarConfig) => {
    if (!socketRef.current || !isConnected) {
      addStatusMessage('error', '❌ No se puede cambiar el avatar');
      return;
    }

    if (isChangingAvatar) {
      addStatusMessage('error', '⚠️ Ya hay un cambio en progreso');
      return;
    }

    if (currentAvatar === config.avatarId) {
      addStatusMessage('info', 'ℹ️ Este avatar ya está activo');
      return;
    }

    console.log('🔄 Cambiando avatar a:', config.name);
    addStatusMessage('info', `🔄 Cambiando a ${config.name}...`);

    socketRef.current.emit('change-avatar', {
      avatarId: config.avatarId,
      voiceId: config.voiceId,
      knowledgeBase: config.knowledgeBase,
      backgroundUrl: config.backgroundUrl
    });

    setCurrentAvatar(config.avatarId);
    setLastChange(new Date().toLocaleTimeString('es-ES'));
    setIsChangingAvatar(true);
    setIsAvatarReady(false);
  };

  const handleStartVoiceChat = () => {
    if (!validateAction('start-voice-chat')) return;

    console.log('🎤 [PANEL] Emitiendo evento: start-voice-chat');
    addStatusMessage('info', '🎤 Iniciando chat de voz...');
    socketRef.current!.emit('start-voice-chat');
  };

  const handleStopVoiceChat = () => {
    if (!validateAction('stop-voice-chat')) return;

    console.log('🛑 [PANEL] Emitiendo evento: stop-voice-chat');
    addStatusMessage('info', '🛑 Deteniendo chat de voz...');
    socketRef.current!.emit('stop-voice-chat');
  };

  const handleSendText = (taskType: string = 'REPEAT') => {
    if (!validateAction('speak-text')) return;

    if (!textInput.trim()) {
      addStatusMessage('error', '❌ El texto no puede estar vacío');
      console.error('❌ Texto vacío');
      return;
    }

    console.log('📝 [PANEL] Emitiendo evento: speak-text con texto:', textInput);
    console.log('⚡ [PANEL] Tipo de tarea:', taskType);

    addStatusMessage('info', taskType === 'INTERRUPT' ? '⚡ Interrumpiendo...' : '📝 Enviando texto...');
    socketRef.current!.emit('speak-text', {
      text: textInput,
      taskType: taskType
    });
    setTextInput('');
  };

  const updateAvatarConfig = (index: number, field: 'avatarId' | 'voiceId' | 'knowledgeBase' | 'backgroundUrl', value: string) => {
    const newConfigs = [...avatarConfigs];
    newConfigs[index][field] = value;
    setAvatarConfigs(newConfigs);
  };

  const getCurrentAvatarName = () => {
    const config = avatarConfigs.find(c => c.avatarId === currentAvatar);
    return config ? config.name : 'Desconocido';
  };

  const isDoctorDexter = currentAvatar === 'Dexter_Doctor_Standing2_public';
  const isCEOAnn = currentAvatar === 'Ann_Therapist_public';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{
          textAlign: 'center',
          color: '#333',
          marginBottom: '10px',
          fontSize: '32px',
          fontWeight: 'bold'
        }}>
          Avatar - Padcelona
        </h1>

        {/* Estado de conexión */}
        <div style={{
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: isConnected ? '#d4edda' : '#f8d7da',
          borderRadius: '10px',
          border: `2px solid ${isConnected ? '#28a745' : '#dc3545'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <strong style={{ fontSize: '18px' }}>
              {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
            </strong>
            {isConnected && (
              <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                Avatar: {isAvatarReady ? '✅ Listo' : isChangingAvatar ? '🔄 Cambiando...' : '⏳ Cargando...'}
              </div>
            )}
            {isConnected && lastChange && (
              <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                Último cambio: {lastChange}
              </div>
            )}
          </div>
        </div>

        {/* Sistema de mensajes de estado */}
        {statusMessages.length > 0 && (
          <div style={{
            marginBottom: '20px',
            maxHeight: '120px',
            overflowY: 'auto'
          }}>
            {statusMessages.map((msg, index) => (
              <div
                key={msg.timestamp}
                style={{
                  padding: '10px 15px',
                  marginBottom: '5px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor:
                    msg.type === 'success' ? '#d4edda' :
                    msg.type === 'error' ? '#f8d7da' : '#d1ecf1',
                  color:
                    msg.type === 'success' ? '#155724' :
                    msg.type === 'error' ? '#721c24' : '#0c5460',
                  border: `1px solid ${
                    msg.type === 'success' ? '#c3e6cb' :
                    msg.type === 'error' ? '#f5c6cb' : '#bee5eb'
                  }`,
                  animation: 'fadeIn 0.3s ease-in'
                }}
              >
                {msg.message}
              </div>
            ))}
          </div>
        )}

        {/* Avatar actual */}
        <div style={{
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '10px',
          border: '2px solid #e9ecef'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
            Avatar Activo:
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
            {getCurrentAvatarName()}
          </div>
        </div>

        {/* Selector de avatares */}
        <h2 style={{
          color: '#333',
          marginBottom: '20px',
          fontSize: '24px'
        }}>
          Seleccionar Avatar
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {avatarConfigs.map((config, index) => {
            const isActive = currentAvatar === config.avatarId;
            const isDisabled = !isConnected || isActive || isChangingAvatar || !isAvatarReady;
            const isEditing = editingIndex === index;

            return (
              <div key={index} style={{
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '15px',
                border: isActive ? '3px solid #28a745' : '2px solid #e9ecef'
              }}>
                {/* Título y botón de editar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <h3 style={{ margin: 0, fontSize: '20px', color: '#333' }}>{config.name}</h3>
                  <button
                    onClick={() => setEditingIndex(isEditing ? null : index)}
                    style={{
                      padding: '5px 12px',
                      fontSize: '14px',
                      backgroundColor: isEditing ? '#dc3545' : '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {isEditing ? '✓ Cerrar' : '✏️ Editar'}
                  </button>
                </div>

                {/* Campos editables */}
                {isEditing && (
                  <div style={{ marginBottom: '15px', backgroundColor: 'white', padding: '15px', borderRadius: '8px' }}>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>
                        Avatar ID:
                      </label>
                      <input
                        type="text"
                        value={config.avatarId}
                        onChange={(e) => updateAvatarConfig(index, 'avatarId', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          fontSize: '14px',
                          border: '2px solid #667eea',
                          borderRadius: '5px',
                          boxSizing: 'border-box',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>
                        Voice ID:
                      </label>
                      <input
                        type="text"
                        value={config.voiceId}
                        onChange={(e) => updateAvatarConfig(index, 'voiceId', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          fontSize: '14px',
                          border: '2px solid #667eea',
                          borderRadius: '5px',
                          boxSizing: 'border-box',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>
                        🧠 Knowledge Base (Prompt del "Cerebro"):
                      </label>
                      <textarea
                        value={config.knowledgeBase}
                        onChange={(e) => updateAvatarConfig(index, 'knowledgeBase', e.target.value)}
                        rows={4}
                        placeholder="Ej: Eres un experto en finanzas..."
                        style={{
                          width: '100%',
                          padding: '10px',
                          fontSize: '14px',
                          border: '2px solid #667eea',
                          borderRadius: '5px',
                          boxSizing: 'border-box',
                          fontFamily: 'inherit',
                          resize: 'vertical'
                        }}
                      />
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '5px', fontStyle: 'italic' }}>
                        💡 Cambia el "cerebro" del avatar en tiempo real. Define su personalidad y área de expertise.
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>
                        🖼️ Background URL (Fondo de Escenario):
                      </label>
                      <input
                        type="text"
                        value={config.backgroundUrl || ''}
                        onChange={(e) => updateAvatarConfig(index, 'backgroundUrl', e.target.value)}
                        placeholder="https://ejemplo.com/imagen-oficina.jpg"
                        style={{
                          width: '100%',
                          padding: '10px',
                          fontSize: '14px',
                          border: '2px solid #667eea',
                          borderRadius: '5px',
                          boxSizing: 'border-box',
                          fontFamily: 'monospace'
                        }}
                      />
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '5px', fontStyle: 'italic' }}>
                        🏢 URL de imagen para el fondo (oficina, sala de juntas, etc.)
                      </div>
                    </div>
                  </div>
                )}

                {/* Botón del avatar */}
                <button
                  onClick={() => changeAvatar(config)}
                  disabled={isDisabled}
                  style={{
                    width: '100%',
                    padding: '20px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    backgroundColor: isActive ? '#28a745' : '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    opacity: isDisabled ? 0.6 : 1,
                    transition: 'all 0.3s ease',
                    boxShadow: isActive
                      ? '0 8px 16px rgba(40, 167, 69, 0.3)'
                      : '0 8px 16px rgba(102, 126, 234, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isDisabled) {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <div>{config.description}</div>
                  {isActive && <div style={{ marginTop: '10px', fontSize: '16px' }}>✓ Activo</div>}
                </button>
              </div>
            );
          })}
        </div>

        {/* Controles específicos del avatar */}
        {isConnected && isAvatarReady && !isChangingAvatar && (
          <div style={{
            marginTop: '40px',
            padding: '25px',
            backgroundColor: '#f8f9fa',
            borderRadius: '15px',
            border: '2px solid #e9ecef'
          }}>
            <h2 style={{
              color: '#333',
              marginBottom: '20px',
              fontSize: '24px',
              textAlign: 'center'
            }}>
              🎛️ Controles del Avatar
            </h2>

            {/* Doctor Dexter - Control de Voz */}
            {isDoctorDexter && (
              <div style={{ textAlign: 'center' }}>
                <h3 style={{
                  color: '#666',
                  marginBottom: '15px',
                  fontSize: '18px'
                }}>
                  Chat de Voz con Doctor Dexter
                </h3>
                <button
                  onClick={isListening ? handleStopVoiceChat : handleStartVoiceChat}
                  style={{
                    padding: '15px 30px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    backgroundColor: isListening ? '#dc3545' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.3s ease',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {isListening ? '🛑 Detener Conversación' : '🎤 Iniciar Conversación'}
                </button>
                {isListening && (
                  <p style={{
                    color: '#28a745',
                    marginTop: '15px',
                    fontSize: '16px',
                    fontWeight: '500',
                    animation: 'pulse 2s ease-in-out infinite'
                  }}>
                    🎙️ El micrófono está activo. Habla con el doctor en la vista del avatar.
                  </p>
                )}
              </div>
            )}

            {/* CEO Ann - Control de Texto */}
            {isCEOAnn && (
              <div>
                <h3 style={{
                  color: '#666',
                  marginBottom: '15px',
                  fontSize: '18px',
                  textAlign: 'center'
                }}>
                  Texto a Voz con CEO Ann
                </h3>

                {/* Nota sobre emociones */}
                <div style={{
                  marginBottom: '15px',
                  padding: '12px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#856404'
                }}>
                  💡 <strong>Nota:</strong> Las emociones de voz se configuran al crear el avatar. Para cambiar la emoción, edita el avatar y selecciona una emoción diferente al crearlo.
                </div>

                {/* Input de Texto */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSendText('REPEAT');
                      }
                    }}
                    placeholder="Escribe lo que Ann debe decir..."
                    style={{
                      flex: 1,
                      padding: '15px',
                      fontSize: '16px',
                      border: '2px solid #667eea',
                      borderRadius: '12px',
                      outline: 'none',
                      backgroundColor: 'white'
                    }}
                  />
                  <button
                    onClick={() => handleSendText('REPEAT')}
                    disabled={!textInput.trim()}
                    style={{
                      padding: '15px 30px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      backgroundColor: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: !textInput.trim() ? 'not-allowed' : 'pointer',
                      opacity: !textInput.trim() ? 0.5 : 1,
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (textInput.trim()) {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    📤 Enviar
                  </button>
                </div>

                {/* Botón de Interrupción */}
                <button
                  onClick={() => handleSendText('INTERRUPT')}
                  disabled={!textInput.trim() || !isSpeaking}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    backgroundColor: !textInput.trim() || !isSpeaking ? '#ccc' : '#ff6b6b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: !textInput.trim() || !isSpeaking ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(255, 107, 107, 0.4)',
                    transition: 'all 0.3s ease',
                    marginBottom: '10px'
                  }}
                  onMouseEnter={(e) => {
                    if (textInput.trim() && isSpeaking) {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  ⚡ Interrumpir y Hablar
                </button>

                <p style={{
                  color: '#666',
                  fontSize: '13px',
                  textAlign: 'center',
                  fontStyle: 'italic',
                  lineHeight: '1.5'
                }}>
                  💡 Tip: Usa "Interrumpir" para cambiar el tema mientras Ann está hablando
                </p>
              </div>
            )}
          </div>
        )}

        {/* Información adicional */}
        <div style={{
          marginTop: '40px',
          padding: '20px',
          backgroundColor: '#e7f3ff',
          borderRadius: '10px',
          border: '2px solid #b3d9ff'
        }}>
          <h3 style={{
            color: '#0066cc',
            marginBottom: '10px',
            fontSize: '18px'
          }}>
            💡 Instrucciones
          </h3>
          <ul style={{
            color: '#333',
            lineHeight: '1.8',
            paddingLeft: '20px',
            margin: 0
          }}>
            <li>Abre la vista del avatar en otra pestaña o navegador</li>
            <li><a href="https://heygen-avatar-client.onrender.com" target="_blank" rel="noopener noreferrer">https://heygen-avatar-client.onrender.com</a></li>
          </ul>
        </div>
      </div>

      {/* Animaciones CSS */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
};

export default ControlPanel;
