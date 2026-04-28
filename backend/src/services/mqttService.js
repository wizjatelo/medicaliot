import mqtt from 'mqtt';
import prisma from '../config/database.js';

let mqttClient;

export const connectMQTT = async (io) => {
  const options = {
    host: process.env.MQTT_HOST || 'localhost',
    port: process.env.MQTT_PORT || 1883,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: 'backend_service_' + Math.random().toString(16).substr(2, 8),
  };

  mqttClient = mqtt.connect(options);

  mqttClient.on('connect', () => {
    console.log('MQTT connected');
    
    // Subscribe to all device telemetry
    mqttClient.subscribe('devices/+/telemetry', (err) => {
      if (err) console.error('MQTT subscribe error:', err);
    });
    
    // Subscribe to heartbeats
    mqttClient.subscribe('devices/+/heartbeat', (err) => {
      if (err) console.error('MQTT subscribe error:', err);
    });
  });

  mqttClient.on('message', async (topic, message) => {
    try {
      const rawMessage = message.toString().trim();
      console.log('Raw MQTT message:', rawMessage);
      
      if (topic.includes('/telemetry')) {
        await handleTelemetryPacket(rawMessage, io);
      } else if (topic.includes('/heartbeat')) {
        await handleHeartbeatPacket(rawMessage, io);
      }
    } catch (error) {
      console.error('MQTT message error:', error);
    }
  });

  mqttClient.on('error', (err) => {
    console.error('MQTT error:', err);
  });

  return mqttClient;
};

const parsePacket = (rawMessage) => {
  // Parse packet format: "MD001,20260207,0900,DOSE_TAKEN,CONFIRMED,15"
  const parts = rawMessage.split(',');
  
  if (parts.length !== 6) {
    throw new Error(`Invalid packet format. Expected 6 parts, got ${parts.length}`);
  }

  const [deviceId, dateStr, timeStr, eventType, status, pillsRemaining] = parts;

  // Parse date and time
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1; // JS months are 0-based
  const day = parseInt(dateStr.substring(6, 8));
  const hour = parseInt(timeStr.substring(0, 2));
  const minute = parseInt(timeStr.substring(2, 4));

  const timestamp = new Date(year, month, day, hour, minute);

  return {
    deviceId: deviceId.trim(),
    timestamp,
    eventType: eventType.trim(),
    status: status.trim(),
    pillsRemaining: parseInt(pillsRemaining.trim()),
    rawPacket: rawMessage
  };
};

const handleTelemetryPacket = async (rawMessage, io) => {
  try {
    const packet = parsePacket(rawMessage);
    
    // Find device
    const device = await prisma.device.findUnique({
      where: { deviceCode: packet.deviceId },
      include: {
        patientLinks: {
          where: { isActive: true },
          include: { patient: true }
        }
      }
    });

    if (!device) {
      console.warn('Device not found:', packet.deviceId);
      return;
    }

    const activeLink = device.patientLinks[0];
    
    // Create dose event
    const doseEvent = await prisma.doseEvent.create({
      data: {
        deviceId: device.id,
        patientId: activeLink?.patientId,
        eventType: packet.eventType,
        status: packet.status,
        dispensedAt: packet.timestamp,
        pillsDispensed: 1,
        pillsRemainingAfter: packet.pillsRemaining,
        loraPacketRaw: packet.rawPacket
      }
    });

    // Update device
    await prisma.device.update({
      where: { id: device.id },
      data: {
        pillsRemaining: packet.pillsRemaining,
        lastSeenAt: new Date(),
        status: 'online'
      }
    });

    // Check for alerts
    if (packet.eventType === 'DOSE_MISSED' || packet.status === 'NOT_CONFIRMED') {
      await createAlert(device, activeLink?.patient, doseEvent, packet.eventType);
    }

    if (packet.pillsRemaining <= 10) {
      await createLowSupplyAlert(device, activeLink?.patient);
    }

    // Emit to frontend
    io.emit('dose_event', {
      event: doseEvent,
      device: device,
      patient: activeLink?.patient,
      packet: packet
    });

    console.log(`Processed telemetry from ${packet.deviceId}: ${packet.eventType}`);
  } catch (error) {
    console.error('Error processing telemetry packet:', error);
  }
};

const handleHeartbeatPacket = async (rawMessage, io) => {
  try {
    const packet = parsePacket(rawMessage);
    
    // For heartbeat, we mainly update device status
    const device = await prisma.device.findUnique({
      where: { deviceCode: packet.deviceId }
    });

    if (device) {
      await prisma.device.update({
        where: { id: device.id },
        data: {
          pillsRemaining: packet.pillsRemaining,
          lastSeenAt: new Date(),
          status: 'online'
        }
      });

      io.emit('device_heartbeat', { 
        deviceId: device.id, 
        deviceCode: packet.deviceId,
        pillsRemaining: packet.pillsRemaining,
        timestamp: packet.timestamp
      });

      console.log(`Heartbeat from ${packet.deviceId}: ${packet.pillsRemaining} pills remaining`);
    }
  } catch (error) {
    console.error('Error processing heartbeat packet:', error);
  }
};

const createAlert = async (device, patient, doseEvent, eventType) => {
  if (!patient) return;

  const alert = await prisma.alert.create({
    data: {
      patientId: patient.id,
      deviceId: device.id,
      doseEventId: doseEvent.id,
      alertType: eventType === 'DOSE_MISSED' ? 'missed_dose' : 'dispense_fail',
      severity: 'critical',
      title: eventType === 'DOSE_MISSED' ? 'Missed Dose' : 'Dispense Failed',
      message: `${patient.fullName} - ${eventType === 'DOSE_MISSED' ? 'missed scheduled dose' : 'pill dispensing failed'}`
    }
  });

  // Queue notification
  // TODO: Add to BullMQ queue for SMS/email
  
  return alert;
};

const createLowSupplyAlert = async (device, patient) => {
  if (!patient) return;

  // Check if alert already exists
  const existing = await prisma.alert.findFirst({
    where: {
      deviceId: device.id,
      alertType: 'low_supply',
      isResolved: false
    }
  });

  if (existing) return;

  await prisma.alert.create({
    data: {
      patientId: patient.id,
      deviceId: device.id,
      alertType: 'low_supply',
      severity: 'warning',
      title: 'Low Pill Supply',
      message: `Device ${device.deviceCode} has only ${device.pillsRemaining} pills remaining`
    }
  });
};

export const publishCommand = (deviceCode, command, payload = {}) => {
  if (!mqttClient) {
    throw new Error('MQTT not connected');
  }
  
  const topic = `devices/${deviceCode}/commands`;
  mqttClient.publish(topic, JSON.stringify({ command, ...payload }));
};

// Test function to simulate packet reception
export const simulatePacket = async (packetString, io) => {
  console.log('Simulating packet:', packetString);
  
  try {
    if (packetString.includes('HEARTBEAT')) {
      await handleHeartbeatPacket(packetString, io);
    } else {
      await handleTelemetryPacket(packetString, io);
    }
    return { success: true, message: 'Packet processed successfully' };
  } catch (error) {
    console.error('Error simulating packet:', error);
    return { success: false, error: error.message };
  }
};

export default mqttClient;
