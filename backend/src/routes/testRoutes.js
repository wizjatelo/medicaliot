import express from 'express';
import { simulatePacket } from '../services/mqttService.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Test endpoint to simulate packet reception
router.post('/simulate-packet', authorize('admin', 'caregiver'), async (req, res, next) => {
  try {
    const { packet } = req.body;
    
    if (!packet) {
      return res.status(400).json({ error: 'Packet string is required' });
    }

    const io = req.app.get('io');
    const result = await simulatePacket(packet, io);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Generate sample packets for testing
router.get('/sample-packets', authorize('admin', 'caregiver'), (req, res) => {
  const now = new Date();
  const dateStr = now.getFullYear().toString() + 
                  (now.getMonth() + 1).toString().padStart(2, '0') + 
                  now.getDate().toString().padStart(2, '0');
  const timeStr = now.getHours().toString().padStart(2, '0') + 
                  now.getMinutes().toString().padStart(2, '0');

  const samples = [
    `MD001,${dateStr},${timeStr},DOSE_TAKEN,CONFIRMED,15`,
    `MD001,${dateStr},${timeStr},DOSE_MISSED,NOT_CONFIRMED,15`,
    `MD001,${dateStr},${timeStr},DISPENSE_FAIL,NA,15`,
    `MD001,${dateStr},${timeStr},HEARTBEAT,NA,14`
  ];

  res.json({ samples });
});

export default router;