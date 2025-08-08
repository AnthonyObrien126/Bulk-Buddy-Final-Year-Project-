const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  card_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Card', required: true },
  quantity: { type: Number, default: 1 },
  notes: String,
  acquired_date: Date
});

module.exports = mongoose.model('Collection', collectionSchema);
