import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
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

// Estado global del avatar
let currentAvatarState = {
  avatarId: 'Dexter_Doctor_Standing2_public',
  voiceId: '7d51b57751f54a2c8ea646713cc2dd96'
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

// Socket.IO para comunicación en tiempo real
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Enviar estado actual al conectarse
  socket.emit('avatar-state', currentAvatarState);

  // Escuchar cambios de avatar desde el panel de control
  socket.on('change-avatar', (newState: { avatarId: string; voiceId: string }) => {
    currentAvatarState = newState;
    // Broadcast a todos los clientes excepto el emisor
    socket.broadcast.emit('avatar-changed', currentAvatarState);
    console.log('Avatar cambiado a:', currentAvatarState);
  });

  // Controles de voz para Doctor Dexter
  socket.on('start-voice-chat', () => {
    console.log('🎤 Iniciando chat de voz');
    // Broadcast a todas las vistas de avatar
    io.emit('start-voice-chat');
  });

  socket.on('stop-voice-chat', () => {
    console.log('🛑 Deteniendo chat de voz');
    // Broadcast a todas las vistas de avatar
    io.emit('stop-voice-chat');
  });

  // Control de texto para CEO Ann
  socket.on('speak-text', (data: { text: string }) => {
    console.log('📝 Texto a enviar:', data.text);
    // Broadcast a todas las vistas de avatar
    io.emit('speak-text', data);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
