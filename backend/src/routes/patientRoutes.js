import express from 'express';
import {
  getPatients, getPatient, createPatient, updatePatient, deletePatient,
  getPatientAdherence, assignCaregiver, removeCaregiver
} from '../controllers/patientController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin', 'caregiver', 'nurse'), getPatients);
router.post('/', authorize('admin', 'caregiver'), createPatient);
router.get('/:id', authorize('admin', 'caregiver', 'nurse'), getPatient);
router.patch('/:id', authorize('admin', 'caregiver'), updatePatient);
router.delete('/:id', authorize('admin', 'caregiver'), deletePatient);
router.get('/:id/adherence', authorize('admin', 'caregiver', 'nurse'), getPatientAdherence);
router.post('/:id/caregivers', authorize('admin', 'caregiver'), assignCaregiver);
router.delete('/:id/caregivers/:userId', authorize('admin', 'caregiver'), removeCaregiver);

export default router;
