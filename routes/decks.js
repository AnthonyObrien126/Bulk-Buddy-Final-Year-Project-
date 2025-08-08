const express = require('express');
const router = express.Router();
const Deck = require('../models/Deck');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');
const Collection = require('../models/Collection');
const User = require('../models/User');
const Card = require('../models/Card');
const axios = require('axios');

// GET: Return all public decks
router.get('/public', async (req, res) => {
  try {
    const decks = await Deck.find({ is_public: true });
    res.json(decks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch decks' });
  }
});

// GET: Return all decks for a specific user
router.get('/:userId', async (req, res) => {
  try {
    const decks = await Deck.find({ user_id: req.params.userId });
    res.json(decks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch decks' });
  }
});

// GET: Return full deck details with analysis (card counts, warnings)
router.get('/view/:deckId', async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.deckId)
      .populate('cards.card_id')
      .populate('sideboard.card_id');

    if (!deck) return res.status(404).json({ error: 'Deck not found' });

    // Calculate total cards in deck & sideboard
    const total_cards = deck.cards.reduce((sum, c) => sum + c.quantity, 0);
    const sideboard_cards = deck.sideboard.reduce((sum, c) => sum + c.quantity, 0);

    const warnings = [];

    // Apply deck format rules
    if (deck.format === 'Commander' && total_cards !== 100) {
      warnings.push(`Commander decks must have exactly 100 cards. You have ${total_cards}.`);
    }
    if ((deck.format === 'Standard' || deck.format === 'Modern') && total_cards < 60) {
      warnings.push(`${deck.format} decks must have at least 60 cards. You have ${total_cards}.`);
    }
    if (sideboard_cards > 15) {
      warnings.push(`Sideboard can only contain up to 15 cards. You have ${sideboard_cards}.`);
    }

    // Check for illegal duplicates (excluding basic lands)
    const cardCounts = {};
    deck.cards.forEach(c => {
      if (!c.card_id || !c.card_id.name) return;
      const name = c.card_id.name;
      cardCounts[name] = (cardCounts[name] || 0) + c.quantity;
    });

    for (const [name, count] of Object.entries(cardCounts)) {
      const isBasic = name.toLowerCase().includes("basic") ||
        ["plains", "island", "swamp", "mountain", "forest"].some(b => name.toLowerCase().includes(b));
      if (!isBasic && count > 4) {
        warnings.push(`${name} appears ${count} times — most formats only allow 4.`);
      }
    }

    // Check sideboard ownership
    deck.sideboard.forEach(c => {
      if (!c.owned) {
        warnings.push(`${c.card_id.name} is in your sideboard but not owned.`);
      }
    });

    // Count owned vs missing cards
    let cards_owned = 0;
    let cards_missing = 0;

    deck.cards.forEach(c => c.owned ? cards_owned += c.quantity : cards_missing += c.quantity);
    deck.sideboard.forEach(c => c.owned ? cards_owned += c.quantity : cards_missing += c.quantity);

    const ownership_complete = cards_missing === 0;

    res.json({
      ...deck.toObject(),
      total_cards,
      sideboard_cards,
      warnings,
      cards_owned,
      cards_missing,
      ownership_complete
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error loading deck' });
  }
});

// POST: Create a new deck (only if user exists)
router.post('/', async (req, res) => {
    const { user_id, name, description, format } = req.body;
  
    try {
      const userExists = await User.findById(user_id);
      if (!userExists) return res.status(404).json({ error: 'User not found' });
  
      const newDeck = new Deck({ user_id, name, description, format });
      const saved = await newDeck.save();
  
      res.status(201).json(saved);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create deck' });
    }
  });
  
  // POST: Add a card to a deck (fetch from Scryfall if not in DB)
  router.post('/:deckId/cards', async (req, res) => {
    const { card, quantity = 1 } = req.body;
  
    if (!card || !card.id) return res.status(400).json({ error: 'Invalid card data' });
  
    try {
      const deck = await Deck.findById(req.params.deckId);
      if (!deck) return res.status(404).json({ error: 'Deck not found' });
  
      const user_id = deck.user_id;
  
      // Check if card already exists locally
      let cardDoc = await Card.findOne({ scryfall_id: card.id }).lean();
  
      // Add card to local DB if missing
      if (!cardDoc) {
        const newCard = new Card({
          scryfall_id: card.id,
          name: card.name.trim(),
          type_line: card.type_line,
          mana_cost: card.mana_cost,
          oracle_text: card.oracle_text || '',
          colors: card.colors || [],
          rarity: card.rarity,
          set: card.set,
          set_name: card.set_name,
          image_uris: card.image_uris || null,
          image_url: card.image_uris?.normal || '',
          price_usd: card.prices?.usd || null,
          price_usd_foil: card.prices?.usd_foil || null,
          price_eur: card.prices?.eur || null,
          price_tix: card.prices?.tix || null,
          legalities: card.legalities || {},
          created_at: new Date(),
          updated_at: new Date()
        });
  
        await newCard.save();
        cardDoc = newCard;
      }
  
      // Check ownership
      const ownedEntry = await Collection.findOne({ user_id, card_id: cardDoc._id }).lean();
      const owned = !!ownedEntry;
  
      // Add or update card in deck
      const existingCard = deck.cards.find(c => c.card_id.equals(cardDoc._id));
  
      if (existingCard) {
        existingCard.quantity += quantity;
        if (!existingCard.owned && owned) existingCard.owned = true;
      } else {
        deck.cards.push({ card_id: cardDoc._id, quantity, owned });
      }
  
      deck.updated_at = new Date();
      await deck.save();
  
      res.json(deck);
    } catch (err) {
      console.error('Error adding card to deck:', err);
      res.status(500).json({ error: 'Failed to add card to deck' });
    }
  });
  
  // DELETE: Remove card from deck
  router.delete('/:deckId/cards/:cardId', async (req, res) => {
    try {
      const deck = await Deck.findById(req.params.deckId);
      if (!deck) return res.status(404).json({ error: 'Deck not found' });
  
      deck.cards = deck.cards.filter(c => !c.card_id.equals(req.params.cardId));
      deck.updated_at = new Date();
      await deck.save();
  
      res.json(deck);
    } catch (err) {
      res.status(500).json({ error: 'Failed to remove card' });
    }
  });
  
  // DELETE: Remove entire deck
  router.delete('/:deckId', async (req, res) => {
    try {
      await Deck.findByIdAndDelete(req.params.deckId);
      res.json({ message: 'Deck deleted' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete deck' });
    }
  });
  
  // POST: Copy an existing deck (for same user)
  router.post('/:deckId/copy', async (req, res) => {
    try {
      const originalDeck = await Deck.findById(req.params.deckId);
      if (!originalDeck) return res.status(404).json({ error: 'Original deck not found' });
  
      const copy = new Deck({
        user_id: originalDeck.user_id,
        name: `${originalDeck.name} (Copy)`,
        description: originalDeck.description,
        format: originalDeck.format,
        cards: originalDeck.cards.map(c => ({
          card_id: c.card_id,
          quantity: c.quantity
        })),
        created_at: new Date(),
        updated_at: new Date()
      });
  
      const savedCopy = await copy.save();
      res.status(201).json(savedCopy);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to copy deck' });
    }
  });

  // GET: Export deck as CSV file
router.get('/:deckId/export', async (req, res) => {
    try {
      const deck = await Deck.findById(req.params.deckId).populate('cards.card_id');
      if (!deck) return res.status(404).json({ error: 'Deck not found' });
  
      // Prepare deck data for CSV export
      const rows = deck.cards.map(c => ({
        Name: c.card_id.name,
        Set: c.card_id.set_name,
        Quantity: c.quantity,
        ManaCost: c.card_id.mana_cost,
        Type: c.card_id.type_line,
        Rarity: c.card_id.rarity,
        OracleText: c.card_id.oracle_text
      }));
  
      const parser = new Parser();
      const csv = parser.parse(rows);
  
      res.header('Content-Type', 'text/csv');
      res.attachment(`${deck.name.replace(/ /g, "_")}.csv`);
      res.send(csv);
    } catch (err) {
      res.status(500).json({ error: 'Failed to export deck' });
    }
  });
  
  // GET: Return all missing (unowned) cards in a deck
  router.get('/:deckId/missing', async (req, res) => {
    try {
      const deck = await Deck.findById(req.params.deckId).populate('cards.card_id');
      if (!deck) return res.status(404).json({ error: 'Deck not found' });
  
      const missing = deck.cards
        .filter(c => !c.owned)
        .map(c => ({
          card_id: c.card_id._id,
          name: c.card_id.name,
          set: c.card_id.set_name,
          mana_cost: c.card_id.mana_cost,
          type_line: c.card_id.type_line,
          rarity: c.card_id.rarity,
          oracle_text: c.card_id.oracle_text,
          quantity: c.quantity
        }));
  
      res.json({
        deck_id: deck._id,
        deck_name: deck.name,
        missing_cards: missing,
        total_missing: missing.reduce((sum, c) => sum + c.quantity, 0)
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to get missing cards' });
    }
  });
  
  // POST: Add card to deck sideboard
  router.post('/:deckId/sideboard', async (req, res) => {
    const { card_id, quantity = 1, tag = null } = req.body;
  
    try {
      const deck = await Deck.findById(req.params.deckId);
      if (!deck) return res.status(404).json({ error: 'Deck not found' });
  
      // Enforce 15 card sideboard limit
      const currentSideboardSize = deck.sideboard.reduce((sum, c) => sum + c.quantity, 0);
      if (currentSideboardSize + quantity > 15) {
        return res.status(400).json({ error: 'Sideboard cannot exceed 15 cards.' });
      }
  
      const user_id = deck.user_id;
      const ownedEntry = await Collection.findOne({ user_id, card_id });
      const owned = !!ownedEntry;
  
      const existingCard = deck.sideboard.find(c => c.card_id.equals(card_id));
  
      if (existingCard) {
        existingCard.quantity += quantity;
        if (!existingCard.owned && owned) existingCard.owned = true;
        if (tag) existingCard.tag = tag;
      } else {
        deck.sideboard.push({ card_id, quantity, owned, tag });
      }
  
      deck.updated_at = new Date();
      await deck.save();
  
      res.json(deck);
    } catch (err) {
      res.status(500).json({ error: 'Failed to add card to sideboard' });
    }
  });
  
  // DELETE: Remove card from sideboard
  router.delete('/:deckId/sideboard/:cardId', async (req, res) => {
    try {
      const deck = await Deck.findById(req.params.deckId);
      if (!deck) return res.status(404).json({ error: 'Deck not found' });
  
      deck.sideboard = deck.sideboard.filter(c => !c.card_id.equals(req.params.cardId));
      deck.updated_at = new Date();
      await deck.save();
  
      res.json(deck);
    } catch (err) {
      res.status(500).json({ error: 'Failed to remove card from sideboard' });
    }
  });
  
  // PATCH: Update tag on card in main deck
  router.patch('/:deckId/cards/:cardId/tag', async (req, res) => {
    const { tag } = req.body;
    try {
      const deck = await Deck.findById(req.params.deckId);
      if (!deck) return res.status(404).json({ error: 'Deck not found' });
  
      const cardEntry = deck.cards.find(c => c.card_id.equals(req.params.cardId));
      if (!cardEntry) return res.status(404).json({ error: 'Card not found in deck' });
  
      cardEntry.tag = tag;
      deck.updated_at = new Date();
      await deck.save();
  
      res.json(deck);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update tag' });
    }
  });
  
  // PATCH: Update tag on card in sideboard
  router.patch('/:deckId/sideboard/:cardId/tag', async (req, res) => {
    const { tag } = req.body;
    try {
      const deck = await Deck.findById(req.params.deckId);
      if (!deck) return res.status(404).json({ error: 'Deck not found' });
  
      const cardEntry = deck.sideboard.find(c => c.card_id.equals(req.params.cardId));
      if (!cardEntry) return res.status(404).json({ error: 'Card not found in deck' });
  
      cardEntry.tag = tag;
      deck.updated_at = new Date();
      await deck.save();
  
      res.json(deck);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update tag' });
    }
  });

// PATCH: Update deck visibility (Public or Private)
router.patch('/:deckId/visibility', async (req, res) => {
    const { is_public } = req.body;
  
    try {
      const deck = await Deck.findByIdAndUpdate(
        req.params.deckId,
        { is_public, updated_at: new Date() },
        { new: true }
      );
      res.json(deck);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update deck visibility' });
    }
  });
  
  // GET: Return a public deck (by ID) if it's marked as public
  router.get('/public/:deckId', async (req, res) => {
    try {
      const deck = await Deck.findById(req.params.deckId)
        .populate('cards.card_id')
        .populate('sideboard.card_id');
  
      if (!deck || !deck.is_public) {
        return res.status(404).json({ error: 'Public deck not found' });
      }
  
      const total_cards = deck.cards.reduce((sum, c) => sum + c.quantity, 0);
      const sideboard_cards = deck.sideboard.reduce((sum, c) => sum + c.quantity, 0);
  
      res.json({
        name: deck.name,
        format: deck.format,
        description: deck.description,
        total_cards,
        sideboard_cards,
        cards: deck.cards,
        sideboard: deck.sideboard
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to load public deck' });
    }
  });
  
  // POST: Clone a public deck (for another user)
  router.post('/:deckId/clone', async (req, res) => {
    const { user_id } = req.body;
  
    try {
      const originalDeck = await Deck.findById(req.params.deckId);
      if (!originalDeck || !originalDeck.is_public) {
        return res.status(404).json({ error: 'Deck not found or not public' });
      }
  
      const clonedDeck = new Deck({
        user_id,
        name: `${originalDeck.name} (Copy)`,
        description: originalDeck.description,
        format: originalDeck.format,
        cards: originalDeck.cards.map(c => ({
          card_id: c.card_id,
          quantity: c.quantity,
          owned: false,
          tag: c.tag || null
        })),
        sideboard: originalDeck.sideboard.map(c => ({
          card_id: c.card_id,
          quantity: c.quantity,
          owned: false,
          tag: c.tag || null
        })),
        is_public: false,
        created_at: new Date(),
        updated_at: new Date()
      });
  
      const saved = await clonedDeck.save();
      res.status(201).json(saved);
    } catch (err) {
      res.status(500).json({ error: 'Failed to clone deck' });
    }
  });
  
  // GET: Export deck as plain text file
  router.get('/:deckId/export/text', async (req, res) => {
    try {
      const deck = await Deck.findById(req.params.deckId)
        .populate('cards.card_id')
        .populate('sideboard.card_id');
  
      if (!deck) return res.status(404).json({ error: 'Deck not found' });
  
      const lines = [];
  
      deck.cards.forEach(c => {
        lines.push(`${c.quantity} ${c.card_id.name}`);
      });
  
      if (deck.sideboard.length > 0) {
        lines.push('');
        lines.push('Sideboard:');
        deck.sideboard.forEach(c => {
          lines.push(`${c.quantity} ${c.card_id.name}`);
        });
      }
  
      const exportText = lines.join('\n');
  
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename=${deck.name.replace(/\s/g, '_')}.txt`);
      res.send(exportText);
    } catch (err) {
      res.status(500).json({ error: 'Failed to export deck as text' });
    }
  });
  
  // GET: Mana curve analysis for deck (counts cards by mana cost)
  router.get('/:deckId/analysis', async (req, res) => {
    try {
      const deck = await Deck.findById(req.params.deckId).populate('cards.card_id');
      if (!deck) return res.status(404).json({ error: 'Deck not found' });
  
      const curve = { "0": 0, "1": 0, "2": 0, "3": 0, "4": 0, "5+": 0 };
  
      deck.cards.forEach(c => {
        const manaCost = c.card_id.mana_cost;
        if (!manaCost || typeof manaCost !== 'string') return;
  
        // Extract numeric part of mana cost
        const numericCost = manaCost.replace(/[^\d]/g, '').trim();
        const cmc = parseInt(numericCost || '0', 10);
  
        if (isNaN(cmc)) return;
  
        if (cmc >= 5) curve["5+"] += c.quantity;
        else curve[cmc.toString()] += c.quantity;
      });
  
      res.json({
        deck_id: deck._id,
        deck_name: deck.name,
        format: deck.format,
        mana_curve: curve
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to analyze mana curve' });
    }
  });
  
  // PATCH: Update quantity of a specific card in a deck
  router.patch('/:deckId/cards/:cardId', async (req, res) => {
    const { quantity } = req.body;
  
    const deck = await Deck.findById(req.params.deckId);
    if (!deck) return res.status(404).json({ error: 'Deck not found' });
  
    const cardInDeck = deck.cards.find(c => c.card_id.equals(req.params.cardId));
    if (!cardInDeck) return res.status(404).json({ error: 'Card not found in deck' });
  
    cardInDeck.quantity = quantity;
    deck.updated_at = new Date();
    await deck.save();
  
    res.json(deck);
  });
  
  // PATCH: Update deck name, format, or description
  router.patch('/:deckId', async (req, res) => {
    const { name, format, description } = req.body;
  
    const deck = await Deck.findByIdAndUpdate(req.params.deckId, {
      name, format, description, updated_at: new Date()
    }, { new: true });
  
    res.json(deck);
  });
  
  // PUT: Replace entire deck (details + cards array)
  router.put('/:deckId', async (req, res) => {
    try {
      const deck = await Deck.findById(req.params.deckId);
      if (!deck) return res.status(404).json({ error: 'Deck not found' });
  
      deck.name = req.body.name || deck.name;
      deck.format = req.body.format || deck.format;
      deck.description = req.body.description || deck.description;
      deck.cards = req.body.cards || deck.cards;
      deck.updated_at = new Date();
  
      await deck.save();
      res.json(deck);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update deck' });
    }
  });
  
  // PATCH: Update deck image URL
  router.patch('/:deckId/image', async (req, res) => {
    const { custom_image_url } = req.body;
  
    try {
      const deck = await Deck.findByIdAndUpdate(
        req.params.deckId,
        { custom_image_url, updated_at: new Date() },
        { new: true }
      );
  
      res.json(deck);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update deck image' });
    }
  });
  
  module.exports = router;
  