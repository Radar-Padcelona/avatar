import express from 'express';
import cors from 'cors';
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Interfaz para el estado del avatar
interface AvatarState {
  avatarId: string;
  voiceId: string;
  knowledgeBase: string;
  backgroundUrl?: string;
  ready: boolean;
}

// Estado global del avatar
let currentAvatarState: AvatarState = {
  avatarId: 'Dexter_Doctor_Standing2_public',
  voiceId: '7d51b57751f54a2c8ea646713cc2dd96',
  knowledgeBase: 'Eres un cardiólogo experto. Respondes preguntas sobre salud cardiovascular, tratamientos, prevención de enfermedades del corazón y hábitos de vida saludables. Tu estilo es profesional, empático y educativo.',
  backgroundUrl: 'https://www.padcelona.com/wp-content/uploads/2022/01/padcelona-social.png',
  ready: false
};

// Endpoint para obtener el token de HeyGen
app.post('/api/get-token', async (req, res) => {
  try {
    const response = await fetch('https://api.heygen.com/v1/streaming.create_token', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.HEYGEN_API_KEY || '',
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    // Verificar si la respuesta tiene errores
    if (data.error) {
      console.error('Error de HeyGen API:', data.error);
      return res.status(400).json({ error: data.error });
    }

    // Extraer el token del objeto data
    if (data.data && data.data.token) {
      res.json({ token: data.data.token });
    } else {
      console.error('Respuesta inesperada de HeyGen:', data);
      res.status(500).json({ error: 'Formato de respuesta inesperado' });
    }
  } catch (error) {
    console.error('Error al obtener token:', error);
    res.status(500).json({ error: 'Error al obtener token' });
  }
});

// Endpoint para obtener el estado actual del avatar
app.get('/api/avatar-state', (req, res) => {
  res.json(currentAvatarState);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO para comunicación bidireccional en tiempo real
io.on('connection', (socket: Socket) => {
  console.log('✅ Cliente conectado:', socket.id);

  // Enviar estado actual al conectarse
  socket.emit('avatar-state', currentAvatarState);

  // ==============================
  // EVENTOS DE CAMBIO DE AVATAR
  // ==============================

  // Escuchar cambios de avatar desde el panel de control
  socket.on('change-avatar', (newState: { avatarId: string; voiceId: string; knowledgeBase: string; backgroundUrl?: string }) => {
    console.log('🔄 [SERVER] Solicitud de cambio de avatar:', newState);

    // Actualizar estado (marca como no listo hasta que el avatar confirme)
    currentAvatarState = {
      avatarId: newState.avatarId,
      voiceId: newState.voiceId,
      knowledgeBase: newState.knowledgeBase,
      backgroundUrl: newState.backgroundUrl,
      ready: false
    };

    // Notificar a todos que el cambio comenzó
    io.emit('avatar-change-start');

    // Broadcast a todos los clientes (especialmente a la vista del avatar)
    io.emit('avatar-changed', currentAvatarState);

    console.log('📢 [SERVER] Avatar change broadcasted to all clients');
  });

  // Cuando el avatar está listo (viene desde AvatarView)
  socket.on('avatar-ready', () => {
    console.log('✅ [SERVER] Avatar reporta que está listo');
    currentAvatarState.ready = true;

    // Notificar a todos que el avatar está listo
    io.emit('avatar-ready');
  });

  // Cuando el avatar inicia el cambio (viene desde AvatarView)
  socket.on('avatar-change-start', () => {
    console.log('🔄 [SERVER] Avatar iniciando cambio');
    currentAvatarState.ready = false;

    // Broadcast a todos
    io.emit('avatar-change-start');
  });

  // Cuando el cambio de avatar se completó (viene desde AvatarView)
  socket.on('avatar-change-complete', (data: { avatarId: string; voiceId: string }) => {
    console.log('✅ [SERVER] Cambio de avatar completado:', data);
    currentAvatarState.ready = true;

    // Broadcast a todos
    io.emit('avatar-change-complete', data);
  });

  // ==============================
  // EVENTOS DE CHAT DE VOZ
  // ==============================

  // Iniciar chat de voz (desde el panel de control)
  socket.on('start-voice-chat', () => {
    console.log('🎤 [SERVER] Solicitud de inicio de chat de voz');

    // Broadcast a todas las vistas de avatar
    io.emit('start-voice-chat');
  });

  // Confirmación de que el chat de voz inició (desde AvatarView)
  socket.on('voice-chat-started', () => {
    console.log('✅ [SERVER] Chat de voz iniciado correctamente');

    // Notificar a todos (especialmente al panel de control)
    io.emit('voice-chat-started');
  });

  // Detener chat de voz (desde el panel de control)
  socket.on('stop-voice-chat', () => {
    console.log('🛑 [SERVER] Solicitud de detención de chat de voz');

    // Broadcast a todas las vistas de avatar
    io.emit('stop-voice-chat');
  });

  // Confirmación de que el chat de voz se detuvo (desde AvatarView)
  socket.on('voice-chat-stopped', () => {
    console.log('✅ [SERVER] Chat de voz detenido correctamente');

    // Notificar a todos (especialmente al panel de control)
    io.emit('voice-chat-stopped');
  });

  // ==============================
  // EVENTOS DE TEXTO A VOZ
  // ==============================

  // Control de texto (desde el panel de control)
  socket.on('speak-text', (data: { text: string; taskType?: string }) => {
    console.log('📝 [SERVER] Solicitud de texto a voz:', data.text);
    console.log('⚡ [SERVER] Tipo de tarea:', data.taskType);

    // Broadcast a todas las vistas de avatar
    io.emit('speak-text', data);
  });

  // Confirmación de que el texto se envió (desde AvatarView)
  socket.on('text-spoken', () => {
    console.log('✅ [SERVER] Texto enviado correctamente');

    // Notificar a todos (especialmente al panel de control)
    io.emit('text-spoken');
  });

  // Avatar empezó a hablar (desde AvatarView)
  socket.on('avatar-start-talking', () => {
    console.log('🗣️ [SERVER] Avatar comenzó a hablar');

    // Broadcast a todos los clientes
    io.emit('avatar-start-talking');
  });

  // Avatar dejó de hablar (desde AvatarView)
  socket.on('avatar-stop-talking', () => {
    console.log('🤐 [SERVER] Avatar dejó de hablar');

    // Broadcast a todos los clientes
    io.emit('avatar-stop-talking');
  });

  // ==============================
  // EVENTOS DE ERRORES
  // ==============================

  // Errores desde el cliente (puede venir de cualquier vista)
  socket.on('error', (error: { message: string }) => {
    console.error('❌ [SERVER] Error del cliente:', error);

    // Broadcast el error a todos los clientes
    io.emit('error', error);
  });

  // ==============================
  // DESCONEXIÓN
  // ==============================

  socket.on('disconnect', () => {
    console.log('⚠️ Cliente desconectado:', socket.id);
  });

  // ==============================
  // SOLICITUD DE ESTADO
  // ==============================

  // Permitir que los clientes soliciten el estado actual
  socket.on('request-avatar-state', () => {
    console.log('📊 [SERVER] Solicitud de estado del avatar');
    socket.emit('avatar-state', currentAvatarState);
  });
});

// Middleware de manejo de errores
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error del servidor:', err);
  res.status(500).json({
    error: err.message || 'Error interno del servidor'
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 Estado inicial del avatar:`, currentAvatarState);
  console.log(`🔑 API Key configurada:`, process.env.HEYGEN_API_KEY ? '✅ Sí' : '❌ No');
});
