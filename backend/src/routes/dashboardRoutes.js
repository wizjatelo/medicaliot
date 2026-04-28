import express from 'express';
import prisma from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/summary', async (req, res, next) => {
  try {
    const [totalPatients, onlineDevices, todayEvents] = await Promise.all([
      prisma.patient.count({ where: { isActive: true } }),
      prisma.device.count({ where: { status: 'online' } }),
      prisma.doseEvent.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      })
    ]);
    
    res.json({ totalPatients, onlineDevices, todayEvents });
  } catch (error) {
    next(error);
  }
});

export default router;
