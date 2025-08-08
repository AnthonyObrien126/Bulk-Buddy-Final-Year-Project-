const express = require('express');
const router = express.Router();
const Card = require('../models/Card');
const fetch = require('node-fetch');

// GET: Search cards in local database with filters
router.get('/', async (req, res) => {
  const query = {};

  // Search filters for name, type, rarity, set, colors
  if (req.query.name) query.name = { $regex: req.query.name, $options: 'i' };
  if (req.query.type_line) query.type_line = { $regex: req.query.type_line, $options: 'i' };
  if (req.query.rarity) query.rarity = req.query.rarity;
  if (req.query.set) query.set = req.query.set;

  // Filter by colors or colorless
  if (req.query.colorless === 'true') {
    query.colors = { $size: 0 };
  } else if (req.query.colors) {
    const colorsArray = req.query.colors.split(',');
    query.colors = req.query.match === 'any' ? { $in: colorsArray } : { $all: colorsArray };
  }

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  try {
    const cards = await Card.find(query).limit(limit).skip(skip);
    const total = await Card.countDocuments(query);

    res.json({
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
      results: cards
    });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// GET: Search by exact name + set in local DB or fallback to Scryfall
router.get('/exact', async (req, res) => {
  const { name, set } = req.query;

  if (!name || !set) {
    return res.status(400).json({ message: 'Name and set code are required.' });
  }

  try {
    const card = await Card.findOne({
      name: { $regex: `^${name}$`, $options: 'i' },
      set: set.toLowerCase()
    }).lean();

    if (card) return res.json({ existsLocally: true, card });

    // Fetch from Scryfall if not found locally
    const response = await axios.get(`https://api.scryfall.com/cards/named?exact=${name}&set=${set}`);
    res.json({ existsLocally: false, scryfallData: response.data });

  } catch (error) {
    res.status(500).json({ message: 'Error searching for card.' });
  }
});

// GET: Fetch single card by ID
router.get('/:id', async (req, res) => {
  const card = await Card.findById(req.params.id);
  if (!card) return res.status(404).send("Card not found");
  res.json(card);
});

// GET: Import card from Scryfall by ID and save locally
router.get('/import/:id', async (req, res) => {
  const scryfallId = req.params.id;
  const scryfallUrl = `https://api.scryfall.com/cards/${scryfallId}`;

  try {
    const existing = await Card.findOne({ scryfall_id: scryfallId });
    if (existing) return res.status(409).json({ message: 'Card already exists in the database.' });

    const response = await fetch(scryfallUrl);
    if (!response.ok) return res.status(404).json({ error: 'Card not found on Scryfall.' });

    const card = await response.json();
    if (!card.image_uris) return res.status(400).json({ error: 'Card has no image; skipping.' });

    // Create card document
    const newCard = new Card({
      scryfall_id: card.id,
      name: card.name,
      type_line: card.type_line || '',
      rarity: card.rarity || '',
      set: card.set || '',
      set_name: card.set_name || '',
      oracle_text: card.oracle_text || '',
      mana_cost: card.mana_cost || '',
      colors: card.colors || [],
      image_url: card.image_uris.normal,
      price_usd: card.prices?.usd,
      price_usd_foil: card.prices?.usd_foil,
      price_eur: card.prices?.eur,
      price_tix: card.prices?.tix,
      legalities: card.legalities || {},
      created_at: new Date(),
      updated_at: new Date()
    });

    const savedCard = await newCard.save();
    res.status(201).json(savedCard);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong importing the card.' });
  }
});

// GET: Search Scryfall by name and set
router.get('/scryfall/search', async (req, res) => {
  const { name, set } = req.query;
  if (!name || !set) return res.status(400).json({ error: 'Both card name and set are required.' });

  const url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&set=${encodeURIComponent(set)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return res.status(404).json({ error: 'Card not found or incorrect card name/set.' });

    const card = await response.json();
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch card from Scryfall' });
  }
});

// GET: Fuzzy search Scryfall for any matching cards
router.get('/scryfall/search-all', async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Name is required.' });

  const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(name)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return res.status(404).json({ error: 'No cards found.' });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to search Scryfall' });
  }
});

// POST: Add a card to a deck (fetch from Scryfall if missing locally)
router.post('/:deckId/cards', async (req, res) => {
  const { name, set, quantity = 1 } = req.body;

  try {
    const deck = await Deck.findById(req.params.deckId);
    if (!deck) return res.status(404).json({ error: 'Deck not found' });

    let card = await Card.findOne({ name, set });

    // Fetch from Scryfall if not found locally
    if (!card) {
      const scryfallUrl = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}&set=${encodeURIComponent(set)}`;
      const response = await fetch(scryfallUrl);
      if (!response.ok) return res.status(404).json({ error: 'Card not found on Scryfall.' });

      const cardData = await response.json();

      card = new Card({
        scryfall_id: cardData.id,
        name: cardData.name,
        type_line: cardData.type_line || '',
        rarity: cardData.rarity || '',
        set: cardData.set || '',
        set_name: cardData.set_name || '',
        oracle_text: cardData.oracle_text || '',
        mana_cost: cardData.mana_cost || '',
        colors: cardData.colors || [],
        image_url: cardData.image_uris?.normal || '',
        legalities: cardData.legalities || {},
        created_at: new Date(),
        updated_at: new Date()
      });

      await card.save();
    }

    // Check if card already exists in deck
    const existingCard = deck.cards.find(c => c.card_id.equals(card._id));
    const user_id = deck.user_id;
    const ownedEntry = await Collection.findOne({ user_id, card_id: card._id });
    const owned = !!ownedEntry;

    if (existingCard) {
      existingCard.quantity += quantity;
      if (!existingCard.owned && owned) existingCard.owned = true;
    } else {
      deck.cards.push({ card_id: card._id, quantity, owned });
    }

    deck.updated_at = new Date();
    await deck.save();

    res.json(deck);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add card to deck' });
  }
});

// POST: Add a specific card (already fetched from Scryfall) to deck
router.post('/:deckId/add-card', async (req, res) => {
  const { card, quantity } = req.body;
  if (!card || !card.name) return res.status(400).json({ error: 'Invalid card data' });

  let existingCard = await Card.findOne({ scryfall_id: card.id });

  // Save card locally if it doesn't exist
  if (!existingCard) {
    existingCard = new Card({
      name: card.name,
      set: card.set,
      image_url: card.image_uris?.normal || '',
      mana_cost: card.mana_cost || '',
      type_line: card.type_line || '',
      rarity: card.rarity || '',
      scryfall_id: card.id,
    });

    await existingCard.save();
  }

  const deck = await Deck.findById(req.params.deckId);
  if (!deck) return res.status(404).json({ error: 'Deck not found' });

  const existingEntry = deck.cards.find(c => c.card_id.equals(existingCard._id));
  if (existingEntry) {
    existingEntry.quantity += quantity;
  } else {
    deck.cards.push({ card_id: existingCard._id, quantity, owned: false });
  }

  await deck.save();
  res.json(deck);
});

module.exports = router;
