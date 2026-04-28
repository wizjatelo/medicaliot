import express from 'express';
import prisma from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/patient/:patientId', async (req, res, next) => {
  try {
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: req.params.patientId },
      include: { medication: true }
    });
    res.json({ prescriptions });
  } catch (error) {
    next(error);
  }
});

router.post('/', authorize('admin', 'caregiver'), async (req, res, next) => {
  try {
    const prescription = await prisma.prescription.create({
      data: { ...req.body, createdById: req.user.userId }
    });
    res.status(201).json({ prescription });
  } catch (error) {
    next(error);
  }
});

export default router;
