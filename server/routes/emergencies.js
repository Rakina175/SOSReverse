import express from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// All emergencies endpoints are protected
router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const list = await db.emergencies.getAll();
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', authorizeRoles('citizen', 'admin'), async (req, res) => {
  try {
    const { type, description, latitude, longitude, address } = req.body;
    if (!type || !latitude || !longitude || !address) {
      return res.status(400).json({ message: 'Emergency type, location, and address are required' });
    }

    // Get current user fullName
    const user = await db.users.find({ uid: req.user.uid });
    const userName = user ? user.fullName : 'Unknown User';

    const newEmergency = {
      id: 'emergency_' + crypto.randomUUID(),
      userId: req.user.uid,
      userName,
      type,
      description: description || '',
      latitude,
      longitude,
      address,
      timestamp: new Date().toISOString(),
      status: 'Pending',
      responderId: null,
      responderName: null,
      responderLatitude: null,
      responderLongitude: null,
      resolvedAt: null
    };

    await db.emergencies.add(newEmergency);
    console.log(`[Security] Emergency alert triggered: ${type} by ${userName} at ${address}`);
    res.status(201).json(newEmergency);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, responderId, responderName, responderLatitude, responderLongitude, resolvedAt } = req.body;

    const emergenciesList = await db.emergencies.getAll();
    const emergency = emergenciesList.find(e => e.id === id);
    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (responderId !== undefined) updates.responderId = responderId;
    if (responderName !== undefined) updates.responderName = responderName;
    if (responderLatitude !== undefined) updates.responderLatitude = responderLatitude;
    if (responderLongitude !== undefined) updates.responderLongitude = responderLongitude;
    if (resolvedAt !== undefined) updates.resolvedAt = resolvedAt;

    const updated = await db.emergencies.update(id, updates);
    console.log(`[Security] Emergency ${id} status updated to ${status} by UID ${req.user.uid}`);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
