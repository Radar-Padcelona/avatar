import express from 'express';
import cors from 'cors';
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import dotenv from 'dotenv';

dotenv.config();

// Cache simple para tokens de HeyGen (evitar llamadas innecesarias)
interface TokenCache {
  token: string;
  expiresAt: number;
}
let tokenCache: TokenCache | null = null;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  },
  // Optimizaciones de Socket.IO para menor latencia
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
  pingTimeout: 20000, // Reducido de 60s a 20s para detectar desconexiones más rápido
  pingInterval: 25000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e6, // 1MB
  perMessageDeflate: {
    threshold: 4096 // Aumentado de 1KB a 4KB - no comprimir mensajes pequeños
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
  quality?: 'low' | 'medium' | 'high';
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3';
  ready: boolean;
}

// Estado global del avatar
let currentAvatarState: AvatarState = {
  avatarId: 'Dexter_Doctor_Standing2_public',
  voiceId: '7d51b57751f54a2c8ea646713cc2dd96',
  knowledgeBase: 'Eres un experto en tecnologías de fertilidad con 33 años de experiencia. Doctorado en Medicina Veterinaria, máster en Embriología Humana.\n\nResponde MUY CONCISO en español, máximo 2-3 oraciones naturales para voz. Evita emojis y formato especial. Sé breve y amigable.',
  backgroundUrl: 'https://www.padcelona.com/wp-content/uploads/2022/01/padcelona-social.png',
  quality: 'medium',
  aspectRatio: '16:9',
  ready: false
};

// Endpoint para obtener el token de HeyGen (con cache reducido para seguridad)
app.post('/api/get-token', async (req, res) => {
  try {
    // Verificar si hay un token en cache válido (cachear solo 5 min por seguridad)
    const now = Date.now();
    if (tokenCache && tokenCache.expiresAt > now) {
      console.log('✅ Usando token cacheado (válido hasta ' + new Date(tokenCache.expiresAt).toLocaleTimeString() + ')');
      return res.json({ token: tokenCache.token });
    }

    // Si había un token expirado, limpiarlo
    if (tokenCache && tokenCache.expiresAt <= now) {
      console.log('🗑️ Token en cache expirado, solicitando nuevo...');
      tokenCache = null;
    }

    console.log('🔑 Solicitando nuevo token a HeyGen...');
    console.log('🔑 API Key (primeros 10 chars):', (process.env.HEYGEN_API_KEY || '').substring(0, 10) + '...');

    const response = await fetch('https://api.heygen.com/v1/streaming.create_token', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.HEYGEN_API_KEY || '',
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Status de respuesta de HeyGen:', response.status, response.statusText);

    const data = await response.json();
    console.log('📦 Respuesta completa de HeyGen:', JSON.stringify(data, null, 2));

    // Verificar si la respuesta tiene errores
    if (data.error) {
      console.error('❌ Error de HeyGen API:', JSON.stringify(data.error, null, 2));
      tokenCache = null; // Limpiar cache en caso de error
      return res.status(400).json({ error: data.error });
    }

    // Si el status code no es 200, también es error
    if (response.status !== 200) {
      console.error('❌ Status code no exitoso:', response.status);
      console.error('❌ Data recibida:', JSON.stringify(data, null, 2));
      tokenCache = null;
      return res.status(response.status).json({ error: data });
    }

    // Extraer el token del objeto data
    if (data.data && data.data.token) {
      // Cachear el token por solo 5 minutos (300000 ms) para mayor seguridad
      // Los tokens de HeyGen pueden durar más, pero preferimos refrescar frecuentemente
      tokenCache = {
        token: data.data.token,
        expiresAt: now + 300000 // 5 minutos
      };
      console.log('💾 Token nuevo cacheado hasta:', new Date(tokenCache.expiresAt).toLocaleTimeString());
      res.json({ token: data.data.token });
    } else {
      console.error('❌ Respuesta inesperada de HeyGen:', data);
      tokenCache = null; // Limpiar cache
      res.status(500).json({ error: 'Formato de respuesta inesperado' });
    }
  } catch (error) {
    console.error('❌ Error al obtener token:', error);
    tokenCache = null; // Limpiar cache en caso de error
    res.status(500).json({ error: 'Error al obtener token' });
  }
});

// Endpoint para obtener el estado actual del avatar
app.get('/api/avatar-state', (req, res) => {
  res.json(currentAvatarState);
});

// Endpoint para invalidar el cache de token (usado al cambiar avatares)
app.post('/api/invalidate-token', (req, res) => {
  console.log('🗑️ Invalidando cache de token por solicitud explícita');
  tokenCache = null;
  res.json({ success: true, message: 'Token cache invalidated' });
});

// Endpoint para forzar cierre de sesión de HeyGen
app.post('/api/force-close-session', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID requerido' });
    }

    console.log('🔨 Forzando cierre de sesión:', sessionId);

    const response = await fetch(`https://api.heygen.com/v1/streaming.stop`, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.HEYGEN_API_KEY || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ session_id: sessionId })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Sesión cerrada exitosamente:', sessionId);
      res.json({ success: true, data });
    } else {
      console.warn('⚠️ Error al cerrar sesión:', data);
      // Aún así devolvemos éxito porque no queremos bloquear
      res.json({ success: true, warning: 'No se pudo forzar cierre, pero continuando' });
    }
  } catch (error) {
    console.error('❌ Error al forzar cierre de sesión:', error);
    // No devolvemos error para no bloquear el flujo
    res.json({ success: true, warning: 'Error en forzar cierre, pero continuando' });
  }
});

// Endpoint para limpiar todas las sesiones activas
app.post('/api/cleanup-sessions', async (req, res) => {
  try {
    console.log('🧹 Solicitando limpieza de todas las sesiones activas...');

    // Intentar obtener la lista de sesiones activas
    const listResponse = await fetch('https://api.heygen.com/v1/streaming.list', {
      method: 'GET',
      headers: {
        'x-api-key': process.env.HEYGEN_API_KEY || '',
        'Content-Type': 'application/json'
      }
    });

    if (!listResponse.ok) {
      console.warn('⚠️ No se pudo obtener lista de sesiones activas');
      return res.json({ success: true, message: 'No se pudo obtener lista de sesiones' });
    }

    const listData = await listResponse.json();
    const sessions = listData.data?.sessions || [];

    if (sessions.length === 0) {
      console.log('✅ No hay sesiones activas para limpiar');
      return res.json({ success: true, message: 'No hay sesiones activas' });
    }

    console.log(`🔨 Cerrando ${sessions.length} sesiones activas...`);

    // Cerrar cada sesión activa
    const closePromises = sessions.map(async (session: any) => {
      try {
        const response = await fetch(`https://api.heygen.com/v1/streaming.stop`, {
          method: 'POST',
          headers: {
            'x-api-key': process.env.HEYGEN_API_KEY || '',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ session_id: session.session_id })
        });

        if (response.ok) {
          console.log(`✅ Sesión cerrada: ${session.session_id}`);
          return { sessionId: session.session_id, success: true };
        } else {
          console.warn(`⚠️ Error al cerrar sesión ${session.session_id}`);
          return { sessionId: session.session_id, success: false };
        }
      } catch (err) {
        console.error(`❌ Error al cerrar sesión ${session.session_id}:`, err);
        return { sessionId: session.session_id, success: false, error: err };
      }
    });

    const results = await Promise.all(closePromises);
    const successCount = results.filter(r => r.success).length;

    console.log(`✅ Limpieza completada: ${successCount}/${sessions.length} sesiones cerradas`);

    res.json({
      success: true,
      message: `${successCount}/${sessions.length} sesiones cerradas`,
      results
    });

  } catch (error) {
    console.error('❌ Error al limpiar sesiones:', error);
    res.json({ success: true, warning: 'Error al limpiar sesiones, pero continuando' });
  }
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
  // EVENTOS DE CONTROL DE AVATAR
  // ==============================

  // Iniciar avatar (nuevo flujo simplificado)
  socket.on('start-avatar', (config: { avatarId: string; voiceId: string; knowledgeBase: string; backgroundUrl?: string; quality?: 'low' | 'medium' | 'high'; aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3'; interactionMode?: 'streaming' | 'text' }) => {
    console.log('🚀 [SERVER] Solicitud de inicio de avatar:', config);

    // Invalidar cache de token para obtener uno fresco
    console.log('🗑️ Invalidando cache de token para nuevo avatar');
    tokenCache = null;

    // Actualizar estado del servidor
    currentAvatarState = {
      avatarId: config.avatarId,
      voiceId: config.voiceId,
      knowledgeBase: config.knowledgeBase,
      backgroundUrl: config.backgroundUrl,
      quality: config.quality || 'high',
      aspectRatio: config.aspectRatio || '16:9',
      ready: false
    };

    // Broadcast a todas las vistas de avatar para que inicien
    io.emit('start-avatar', config);

    console.log('📢 [SERVER] Start avatar broadcasted to all avatar views');
  });

  // Detener avatar (nuevo flujo simplificado)
  socket.on('stop-avatar', () => {
    console.log('🛑 [SERVER] Solicitud de detención de avatar');

    // Marcar como no listo
    currentAvatarState.ready = false;

    // Invalidar cache de token
    console.log('🗑️ Invalidando cache de token');
    tokenCache = null;

    // Broadcast a todas las vistas de avatar para que detengan
    io.emit('stop-avatar');

    console.log('📢 [SERVER] Stop avatar broadcasted to all avatar views');
  });

  // Actualizar estado del servidor sin hacer broadcast de cambio (para carga inicial de avatar personalizado)
  socket.on('avatar-state-update', (newState: { avatarId: string; voiceId: string; knowledgeBase: string; backgroundUrl?: string; quality?: 'low' | 'medium' | 'high'; aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' }) => {
    console.log('🔄 [SERVER] Actualización silenciosa de estado de avatar:', newState.avatarId);

    // Actualizar estado
    currentAvatarState = {
      avatarId: newState.avatarId,
      voiceId: newState.voiceId,
      knowledgeBase: newState.knowledgeBase,
      backgroundUrl: newState.backgroundUrl,
      quality: newState.quality || 'high',
      aspectRatio: newState.aspectRatio || '16:9',
      ready: false // Se marcará como ready cuando llegue avatar-ready
    };

    console.log('📦 [SERVER] Estado actualizado a:', currentAvatarState.avatarId);

    // Notificar solo el estado actualizado al panel de control (sin hacer cambio de avatar)
    io.emit('avatar-state', currentAvatarState);
  });

  // Cuando el avatar está listo (viene desde AvatarView)
  socket.on('avatar-ready', (data?: { avatarId?: string }) => {
    console.log('✅ [SERVER] Avatar reporta que está listo');

    // Si viene con avatarId, actualizar el estado para estar sincronizado
    if (data?.avatarId) {
      console.log('📦 [SERVER] Sincronizando avatar ID desde avatar-ready:', data.avatarId);
      currentAvatarState.avatarId = data.avatarId;
    }

    currentAvatarState.ready = true;

    // Notificar a todos que el avatar está listo
    io.emit('avatar-ready');
  });

  // Cuando el avatar se detiene (viene desde AvatarView)
  socket.on('avatar-stopped', () => {
    console.log('🛑 [SERVER] Avatar reporta que se detuvo');
    currentAvatarState.ready = false;

    // Notificar a todos
    io.emit('avatar-stopped');
  });

  // Cuando hay un error en el avatar (viene desde AvatarView)
  socket.on('avatar-error', (data: { message: string }) => {
    console.error('❌ [SERVER] Error del avatar:', data.message);
    currentAvatarState.ready = false;

    // Notificar a todos
    io.emit('avatar-error', data);
  });

  // Cuando el avatar inicia el cambio (viene desde AvatarView)
  socket.on('avatar-change-start', () => {
    console.log('🔄 [SERVER] Avatar iniciando cambio');
    currentAvatarState.ready = false;

    // Invalidar cache de token para forzar uno nuevo
    console.log('🗑️ Invalidando cache de token para nuevo avatar');
    tokenCache = null;

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

    // Invalidar token al desconectar para forzar uno nuevo en la próxima conexión
    console.log('🗑️ Invalidando cache de token por desconexión de cliente');
    tokenCache = null;
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
