import express from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All contacts endpoints are protected
router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const list = await db.contacts.getByUserId(req.user.uid);
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, phoneNumber, relationship, alternateNumber } = req.body;
    if (!name || !phoneNumber || !relationship) {
      return res.status(400).json({ message: 'Name, phone, and relationship are required' });
    }

    const currentContacts = await db.contacts.getByUserId(req.user.uid);
    const isFirst = currentContacts.length === 0;

    const newContact = {
      id: 'contact_' + crypto.randomUUID(),
      userId: req.user.uid,
      name,
      phoneNumber,
      relationship,
      alternateNumber: alternateNumber || '',
      isPrimary: isFirst
    };

    await db.contacts.add(newContact);
    res.status(201).json(newContact);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phoneNumber, relationship, alternateNumber } = req.body;

    const contactsList = await db.contacts.getByUserId(req.user.uid);
    const contact = contactsList.find(c => c.id === id);
    if (!contact) {
      return res.status(404).json({ message: 'Emergency contact not found' });
    }

    const updates = {
      name: name || contact.name,
      phoneNumber: phoneNumber || contact.phoneNumber,
      relationship: relationship || contact.relationship,
      alternateNumber: alternateNumber !== undefined ? alternateNumber : contact.alternateNumber
    };

    const updated = await db.contacts.update(id, updates);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const contactsList = await db.contacts.getByUserId(req.user.uid);
    const contact = contactsList.find(c => c.id === id);
    if (!contact) {
      return res.status(404).json({ message: 'Emergency contact not found' });
    }

    await db.contacts.delete(id);
    
    // If deleted contact was primary, make the first remaining contact primary if possible
    if (contact.isPrimary) {
      const remaining = await db.contacts.getByUserId(req.user.uid);
      if (remaining.length > 0) {
        await db.contacts.update(remaining[0].id, { isPrimary: true });
      }
    }

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/:id/primary', async (req, res) => {
  try {
    const { id } = req.params;
    const contactsList = await db.contacts.getByUserId(req.user.uid);
    const contact = contactsList.find(c => c.id === id);
    if (!contact) {
      return res.status(404).json({ message: 'Emergency contact not found' });
    }

    await db.contacts.setPrimary(req.user.uid, id);
    res.json({ message: 'Primary contact updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
