import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface AvatarConfig {
  name: string;
  avatarId: string;
  voiceId: string;
  description: string;
}

const avatarConfigs: AvatarConfig[] = [
  {
    name: '👨‍⚕️ Doctor Dexter',
    avatarId: 'Dexter_Doctor_Standing2_public',
    voiceId: '7d51b57751f54a2c8ea646713cc2dd96',
    description: 'Avatar médico profesional'
  },
  {
    name: '👔 CEO Ann',
    avatarId: 'Ann_Therapist_public',
    voiceId: '6eafa43fdc16437b8f5abe512cc2b3cf',
    description: 'Avatar ejecutivo empresarial'
  }
];

const ControlPanel: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState<string>('Dexter_Doctor_Standing2_public');
  const [isConnected, setIsConnected] = useState(false);
  const [lastChange, setLastChange] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [textInput, setTextInput] = useState<string>('');

  useEffect(() => {
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';
    const socketInstance = io(serverUrl);
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('✅ Conectado al servidor');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('⚠️ Desconectado del servidor');
    });

    socketInstance.on('avatar-state', (state) => {
      console.log('📊 Estado recibido:', state);
      setCurrentAvatar(state.avatarId);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Error de conexión:', error);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const changeAvatar = (config: AvatarConfig) => {
    if (socket && isConnected) {
      console.log('🔄 Cambiando avatar a:', config.name);
      socket.emit('change-avatar', {
        avatarId: config.avatarId,
        voiceId: config.voiceId
      });
      setCurrentAvatar(config.avatarId);
      setLastChange(new Date().toLocaleTimeString('es-ES'));
    }
  };

  const getCurrentAvatarName = () => {
    const config = avatarConfigs.find(c => c.avatarId === currentAvatar);
    return config ? config.name : 'Desconocido';
  };

  const handleStartVoiceChat = () => {
    if (!socket) {
      console.error('❌ Socket no disponible');
      return;
    }
    if (!isConnected) {
      console.error('❌ No conectado al servidor');
      return;
    }
    console.log('🎤 [PANEL] Emitiendo evento: start-voice-chat');
    socket.emit('start-voice-chat');
    setIsListening(true);
  };

  const handleStopVoiceChat = () => {
    if (!socket) {
      console.error('❌ Socket no disponible');
      return;
    }
    if (!isConnected) {
      console.error('❌ No conectado al servidor');
      return;
    }
    console.log('🛑 [PANEL] Emitiendo evento: stop-voice-chat');
    socket.emit('stop-voice-chat');
    setIsListening(false);
  };

  const handleSendText = () => {
    if (!socket) {
      console.error('❌ Socket no disponible');
      return;
    }
    if (!isConnected) {
      console.error('❌ No conectado al servidor');
      return;
    }
    if (!textInput.trim()) {
      console.error('❌ Texto vacío');
      return;
    }
    console.log('📝 [PANEL] Emitiendo evento: speak-text con texto:', textInput);
    socket.emit('speak-text', { text: textInput });
    setTextInput('');
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
          🎮 Panel de Control
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#666',
          marginBottom: '30px',
          fontSize: '16px'
        }}>
          Controla tus avatares HeyGen en tiempo real
        </p>
        
        {/* Estado de conexión */}
        <div style={{ 
          marginBottom: '30px', 
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
            {isConnected && lastChange && (
              <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                Último cambio: {lastChange}
              </div>
            )}
          </div>
        </div>

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
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          {avatarConfigs.map((config) => {
            const isActive = currentAvatar === config.avatarId;
            const isDisabled = !isConnected || isActive;
            
            return (
              <button
                key={config.avatarId}
                onClick={() => changeAvatar(config)}
                disabled={isDisabled}
                style={{
                  padding: '25px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  backgroundColor: isActive ? '#28a745' : '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '15px',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.6 : 1,
                  transition: 'all 0.3s ease',
                  boxShadow: isActive 
                    ? '0 8px 16px rgba(40, 167, 69, 0.3)' 
                    : '0 8px 16px rgba(102, 126, 234, 0.3)',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px'
                }}
                onMouseEnter={(e) => {
                  if (!isDisabled) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(102, 126, 234, 0.3)';
                  }
                }}
              >
                <div style={{ fontSize: '24px' }}>
                  {config.name}
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  opacity: 0.9,
                  fontWeight: 'normal'
                }}>
                  {config.description}
                </div>
                {isActive && (
                  <div style={{ 
                    fontSize: '20px',
                    marginTop: '5px'
                  }}>
                    ✓ Activo
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Controles específicos del avatar */}
        {isConnected && (
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
                  👨‍⚕️ Chat de Voz con Doctor Dexter
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
                    fontWeight: '500'
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
                  👔 Texto a Voz con CEO Ann
                </h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSendText();
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
                    onClick={handleSendText}
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
                <p style={{
                  color: '#666',
                  marginTop: '10px',
                  fontSize: '14px',
                  textAlign: 'center',
                  fontStyle: 'italic'
                }}>
                  Presiona Enter o haz clic en Enviar para que Ann hable
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
            <li>Selecciona un avatar para cambiarlo en tiempo real</li>
            <li>Usa los controles de arriba para interactuar con el avatar</li>
            <li>Doctor Dexter: Habla por micrófono</li>
            <li>CEO Ann: Escribe texto para que hable</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
