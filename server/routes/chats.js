import express from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All chats endpoints are protected
router.use(authenticateToken);

router.get('/:emergencyId', async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const messages = await db.chats.getByEmergencyId(emergencyId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { emergencyId, text } = req.body;
    if (!emergencyId || !text) {
      return res.status(400).json({ message: 'EmergencyId and text are required' });
    }

    const user = await db.users.find({ uid: req.user.uid });
    const senderName = user ? user.fullName : 'System';

    const newMessage = {
      id: 'chat_' + crypto.randomUUID(),
      emergencyId,
      senderId: req.user.uid,
      senderName,
      text,
      timestamp: new Date().toISOString()
    };

    await db.chats.add(newMessage);
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
