import prisma from '../config/database.js';
import { publishCommand } from '../services/mqttService.js';

export const getDevices = async (req, res, next) => {
  try {
    const { status } = req.query;
    
    const where = status ? { status } : {};
    
    const devices = await prisma.device.findMany({
      where,
      include: {
        patientLinks: {
          where: { isActive: true },
          include: { patient: { select: { id: true, fullName: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ devices });
  } catch (error) {
    next(error);
  }
};

export const getDevice = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const device = await prisma.device.findUnique({
      where: { id },
      include: {
        patientLinks: {
          where: { isActive: true },
          include: { patient: true }
        },
        doseEvents: {
          take: 50,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json({ device });
  } catch (error) {
    next(error);
  }
};

export const createDevice = async (req, res, next) => {
  try {
    const { deviceCode, label, firmwareVersion, macAddress, loraDevEui, notes } = req.body;
    
    const device = await prisma.device.create({
      data: {
        deviceCode,
        label,
        firmwareVersion,
        macAddress,
        loraDevEui,
        notes,
        registeredById: req.user.userId
      }
    });
    
    res.status(201).json({ device });
  } catch (error) {
    next(error);
  }
};

export const updateDevice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { label, notes, status } = req.body;
    
    const device = await prisma.device.update({
      where: { id },
      data: { label, notes, status }
    });
    
    res.json({ device });
  } catch (error) {
    next(error);
  }
};

export const deleteDevice = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await prisma.device.update({
      where: { id },
      data: { status: 'maintenance' }
    });
    
    res.json({ message: 'Device deactivated' });
  } catch (error) {
    next(error);
  }
};

export const linkDevice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { patientId } = req.body;
    
    // Unlink any existing active links for this device
    await prisma.devicePatientLink.updateMany({
      where: { deviceId: id, isActive: true },
      data: { isActive: false, unlinkedAt: new Date() }
    });
    
    const link = await prisma.devicePatientLink.create({
      data: {
        deviceId: id,
        patientId,
        linkedById: req.user.userId
      }
    });
    
    await prisma.device.update({
      where: { id },
      data: { status: 'online' }
    });
    
    res.status(201).json({ link });
  } catch (error) {
    next(error);
  }
};

export const unlinkDevice = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await prisma.devicePatientLink.updateMany({
      where: { deviceId: id, isActive: true },
      data: { isActive: false, unlinkedAt: new Date() }
    });
    
    await prisma.device.update({
      where: { id },
      data: { status: 'unlinked' }
    });
    
    res.json({ message: 'Device unlinked' });
  } catch (error) {
    next(error);
  }
};

export const sendCommand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { command, payload } = req.body;
    
    const device = await prisma.device.findUnique({
      where: { id }
    });
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    publishCommand(device.deviceCode, command, payload);
    
    res.json({ message: 'Command sent', command });
  } catch (error) {
    next(error);
  }
};

export const testBuzz = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const device = await prisma.device.findUnique({
      where: { id }
    });
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    publishCommand(device.deviceCode, 'TEST_BUZZ');
    
    res.json({ message: 'Test buzz sent' });
  } catch (error) {
    next(error);
  }
};
