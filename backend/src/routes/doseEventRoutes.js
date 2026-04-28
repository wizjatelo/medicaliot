import express from 'express';
import prisma from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { patientId, deviceId, limit = 50 } = req.query;
    const where = {};
    if (patientId) where.patientId = patientId;
    if (deviceId) where.deviceId = deviceId;
    
    const events = await prisma.doseEvent.findMany({
      where,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: { patient: { select: { fullName: true } }, device: { select: { deviceCode: true } } }
    });
    
    res.json({ events });
  } catch (error) {
    next(error);
  }
});

export default router;
