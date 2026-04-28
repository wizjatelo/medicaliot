import express from 'express';
import { register, login, logout, refresh, getMe, updateMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticate, logout);
router.post('/refresh', refresh);
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, updateMe);

export default router;
