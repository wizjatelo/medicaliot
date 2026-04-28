import express from 'express';
import prisma from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, fullName: true, email: true, phone: true, role: true, isActive: true, createdAt: true }
    });
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

export default router;
