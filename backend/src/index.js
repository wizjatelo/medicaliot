import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectMQTT } from './services/mqttService.js';
import { initRedis } from './config/redis.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import doseEventRoutes from './routes/doseEventRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import medicationRoutes from './routes/medicationRoutes.js';
import testRoutes from './routes/testRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('combined'));

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/devices', deviceRoutes);
app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/v1/events', doseEventRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/medications', medicationRoutes);
app.use('/api/v1/test', testRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Initialize services
const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Initialize Redis (non-blocking)
    initRedis()
      .then(() => console.log('✓ Redis connected'))
      .catch((err) => console.warn('⚠ Redis connection failed:', err.message));
    
    // Initialize MQTT (non-blocking)
    connectMQTT(io)
      .then(() => console.log('✓ MQTT connected'))
      .catch((err) => console.warn('⚠ MQTT connection failed:', err.message));
    
    // Start server immediately
    httpServer.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ API available at http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { io };
