# MediDispense - Automatic Medicine Dispenser System

A full-stack IoT platform for automatic medicine dispensing and remote monitoring, connecting ESP32-based hardware dispensers to a web dashboard for caregivers via LoRa + MQTT + REST API.

## System Architecture

```
ESP32 Device → LoRa Radio → USB Receiver → Python Bridge → MQTT Broker → Backend API → Frontend Dashboard
```

## Tech Stack

### Hardware
- **Device**: ESP32 (Heltec WiFi LoRa 32 V3)
- **Communication**: LoRa SX1262 (868 MHz)
- **Sensors**: Fingerprint scanner, IR sensor, RTC (DS3231)
- **Actuators**: Servo motor, buzzer, LEDs, OLED display

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4
- **Database**: PostgreSQL 16 + Prisma ORM
- **Cache**: Redis 7
- **MQTT**: Eclipse Mosquitto 2.0
- **Real-time**: Socket.io
- **Queue**: BullMQ

### Frontend
- **Framework**: React 18 + Vite
- **UI**: Tailwind CSS
- **State**: Zustand
- **Charts**: Recharts
- **Real-time**: Socket.io + MQTT WebSocket

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **OS**: Ubuntu 24.04 LTS

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- PlatformIO (for ESP32 firmware)
- USB LoRa receiver dongle

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/medidispense.git
cd medidispense
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Services
```bash
docker-compose up -d
```

This will start:
- Frontend (http://localhost:3000)
- Backend API (http://localhost:4000)
- PostgreSQL (localhost:5432)
- Redis (localhost:6379)
- MQTT Broker (localhost:1883, WebSocket: 9001)
- LoRa Bridge
- Notification Worker

### 4. Initialize Database
```bash
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed
```

### 5. Default Login
```
Email: admin@medidispense.co.ke
Password: Admin!2025
```

## ESP32 Firmware Setup

### 1. Install PlatformIO
```bash
pip install platformio
```

### 2. Configure Device
Edit `esp32_firmware/include/config.h`:
- Set `DEVICE_CODE` (e.g., "MD001")
- Configure LoRa frequency for your region
- Set pin assignments

### 3. Build & Upload
```bash
cd esp32_firmware
pio run --target upload
```

### 4. Monitor Serial
```bash
pio device monitor
```

## Project Structure

```
medidispense/
├── backend/              # Node.js Express API
│   ├── src/
│   │   ├── config/       # Database, Redis, JWT config
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Auth, validation, error handling
│   │   ├── routes/       # API routes
│   │   ├── services/     # MQTT, notifications
│   │   └── index.js      # Main server file
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── Dockerfile
├── frontend/             # React + Vite app
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client, Socket.io
│   │   ├── store/        # Zustand state management
│   │   └── App.jsx
│   └── Dockerfile
├── esp32_firmware/       # Arduino/PlatformIO firmware
│   ├── include/
│   │   └── config.h      # Hardware configuration
│   ├── src/
│   │   └── main.cpp      # Main firmware logic
│   └── platformio.ini
├── lora_bridge/          # Python LoRa-to-MQTT bridge
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── database/             # SQL init & seed files
│   ├── init.sql
│   └── seed.sql
├── mqtt/                 # Mosquitto config
│   ├── mosquitto.conf
│   └── passwd
├── nginx/                # Reverse proxy config
│   └── nginx.conf
└── docker-compose.yml
```

## API Documentation

### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Get current user

### Patients
- `GET /api/v1/patients` - List patients
- `POST /api/v1/patients` - Create patient
- `GET /api/v1/patients/:id` - Get patient details
- `PATCH /api/v1/patients/:id` - Update patient
- `GET /api/v1/patients/:id/adherence` - Get adherence report

### Devices
- `GET /api/v1/devices` - List devices
- `POST /api/v1/devices` - Register device
- `GET /api/v1/devices/:id` - Get device details
- `POST /api/v1/devices/:id/link` - Link device to patient
- `POST /api/v1/devices/:id/unlink` - Unlink device
- `POST /api/v1/devices/:id/test-buzz` - Send test alert

### Alerts
- `GET /api/v1/alerts` - List alerts
- `PATCH /api/v1/alerts/:id/resolve` - Resolve alert

### Dashboard
- `GET /api/v1/dashboard/summary` - Get dashboard summary

## MQTT Topics

### Device Telemetry
```
Topic: devices/{device_code}/telemetry
Payload: {
  "device_id": "MD001",
  "date": "20260427",
  "time": "0900",
  "event_type": "DOSE_TAKEN",
  "status": "CONFIRMED",
  "pills_remaining": 15
}
```

### Device Heartbeat
```
Topic: devices/{device_code}/heartbeat
Payload: {
  "device_id": "MD001",
  "battery_pct": 92,
  "pills_remaining": 15,
  "rtc_synced": true
}
```

### Device Commands
```
Topic: devices/{device_code}/commands
Payload: {
  "command": "TEST_BUZZ" | "UPDATE_SCHEDULE" | "REBOOT"
}
```

## Development

### Backend Development
```bash
cd backend
npm install
npm run dev
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Database Migrations
```bash
cd backend
npx prisma migrate dev --name migration_name
npx prisma generate
```

## Production Deployment

### 1. Update Environment Variables
```bash
# Set production values in .env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your_secure_secret
```

### 2. Build & Deploy
```bash
docker-compose -f docker-compose.yml up -d --build
```

### 3. SSL/TLS Setup
Configure Nginx with Let's Encrypt certificates for HTTPS.

## Monitoring

### View Logs
```bash
# Backend logs
docker-compose logs -f backend

# LoRa bridge logs
docker-compose logs -f lora_bridge

# MQTT broker logs
docker-compose logs -f mqtt_broker
```

### Health Checks
- Backend: http://localhost:4000/health
- Frontend: http://localhost:3000

## Troubleshooting

### MQTT Connection Issues
1. Check broker is running: `docker-compose ps mqtt_broker`
2. Verify credentials in `mqtt/passwd`
3. Test connection: `mosquitto_sub -h localhost -p 1883 -t '#' -u backend_service -P password`

### LoRa Bridge Not Receiving
1. Check USB device: `ls /dev/ttyUSB*`
2. Verify baud rate matches ESP32 (115200)
3. Check bridge logs: `docker-compose logs lora_bridge`

### Database Connection Failed
1. Ensure PostgreSQL is running: `docker-compose ps postgres`
2. Verify DATABASE_URL in .env
3. Check migrations: `npx prisma migrate status`

## License

MIT License - See LICENSE file for details

## Author

Antony Oyagi Ombati  
Meru University of Science and Technology  
Department of Electrical and Electronics Engineering  
EG209/109737/22

## Support

For issues and questions, please open an issue on GitHub or contact the development team.
"# medicaliot" 
