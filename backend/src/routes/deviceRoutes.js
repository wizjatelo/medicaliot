import express from 'express';
import {
  getDevices, getDevice, createDevice, updateDevice, deleteDevice,
  linkDevice, unlinkDevice, sendCommand, testBuzz
} from '../controllers/deviceController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getDevices);
router.post('/', authorize('admin', 'caregiver'), createDevice);
router.get('/:id', getDevice);
router.patch('/:id', authorize('admin', 'caregiver'), updateDevice);
router.delete('/:id', authorize('admin'), deleteDevice);
router.post('/:id/link', authorize('admin', 'caregiver'), linkDevice);
router.post('/:id/unlink', authorize('admin', 'caregiver'), unlinkDevice);
router.post('/:id/command', authorize('admin', 'caregiver'), sendCommand);
router.post('/:id/test-buzz', authorize('admin', 'caregiver'), testBuzz);

export default router;
