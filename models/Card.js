const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  scryfall_id: { type: String, unique: true },
  name: String,
  type_line: String,
  rarity: String,
  set: String,
  set_name: String,
  oracle_text: String,
  mana_cost: String,
  colors: [String],
  image_url: String,
  price_usd: String,
  price_usd_foil: String,
  price_eur: String,
  price_tix: String,
  legalities: Object,
  created_at: Date
});

module.exports = mongoose.model('Card', cardSchema);
