import express from 'express';
import prisma from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const medications = await prisma.medication.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ medications });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const medication = await prisma.medication.create({ data: req.body });
    res.status(201).json({ medication });
  } catch (error) {
    next(error);
  }
});

export default router;
