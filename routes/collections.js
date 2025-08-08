const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Card = require('../models/Card');
const Collection = require('../models/Collection');
const auth = require('../middleware/auth');

// GET: Get all collection items for a specific user (with auth check)
router.get('/:userId', auth, async (req, res) => {
  if (req.user.userId !== req.params.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const collection = await Collection.find({ user_id: req.params.userId }).populate('card_id');
    res.json(collection);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load collection' });
  }
});

// POST: Add a card to collection or update quantity if it exists
router.post('/', async (req, res) => {
  const { user_id, card_id, quantity = 1, acquired_date, notes } = req.body;

  console.log('Received user_id:', user_id);
  console.log('Received card_id:', card_id);
  console.log('Received payload:', req.body);

  try {
    const existing = await Collection.findOne({ user_id, card_id });

    if (existing) {
      existing.quantity += quantity;
      await existing.save();
      return res.status(200).json({ message: 'Quantity updated', item: existing });
    }

    const newEntry = new Collection({
      user_id,
      card_id,
      quantity,
      notes,
      acquired_date
    });

    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (err) {
    console.error('Error adding card to collection:', err);
    res.status(500).json({ error: 'Failed to add card to collection' });
  }
});

// PATCH: Update collection entry (quantity, notes, acquired_date)
router.patch('/:id', async (req, res) => {
  try {
    const updated = await Collection.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// DELETE: Remove a card from collection
router.delete('/:id', async (req, res) => {
  try {
    await Collection.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted from collection' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// GET: Get collection for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const collection = await Collection.find({ user_id: userId }).populate('card_id');
    res.json(collection);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load collection' });
  }
});

// GET: Export user's collection as plain text file
router.get('/:id/export/text', async (req, res) => {
  try {
    const collection = await Collection.find({ user_id: req.params.id }).populate('card_id');

    if (!collection.length) {
      return res.status(404).json({ error: 'No cards in collection.' });
    }

    const lines = [];

    collection.forEach(item => {
      lines.push(`${item.quantity} ${item.card_id.name} (${item.card_id.set_name})`);
    });

    const exportText = lines.join('\n');

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename=my_collection.txt');
    res.send(exportText);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export collection.' });
  }
});

module.exports = router;
