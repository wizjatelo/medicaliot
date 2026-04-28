import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000', {
  autoConnect: false,
});

export const connectSocket = () => {
  socket.connect();
};

export const disconnectSocket = () => {
  socket.disconnect();
};

export const onDoseEvent = (callback) => {
  socket.on('dose_event', callback);
};

export const onDeviceHeartbeat = (callback) => {
  socket.on('device_heartbeat', callback);
};

export default socket;
