const mongoose = require('mongoose');

const deckSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  format: String,
  custom_image_url: { type: String, default: null },
  cards: [{
    card_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' },
    quantity: { type: Number, default: 1 },
    owned: { type: Boolean, default: true },
    tag: { type: String, default: null }
  }],
  sideboard: [{
    card_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' },
    quantity: { type: Number, default: 1 },
    owned: { type: Boolean, default: true },
    tag: { type: String, default: null }
  }],
  is_public: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Deck', deckSchema);
