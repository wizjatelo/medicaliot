import express from 'express';
import prisma from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { resolved } = req.query;
    const where = resolved !== undefined ? { isResolved: resolved === 'true' } : {};
    
    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { patient: { select: { fullName: true } }, device: { select: { deviceCode: true } } }
    });
    
    res.json({ alerts });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/resolve', async (req, res, next) => {
  try {
    const alert = await prisma.alert.update({
      where: { id: req.params.id },
      data: { isResolved: true, resolvedById: req.user.userId, resolvedAt: new Date() }
    });
    res.json({ alert });
  } catch (error) {
    next(error);
  }
});

export default router;
