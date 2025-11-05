// models/Item.js
const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  // AQUI ESTÁ A LIGAÇÃO:
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  work: { type: String },
  platform: { type: String },
  link: { type: String },
  image: { type: String },
  notes: { type: String },
  purchased: { type: Boolean, default: false },
});

module.exports = mongoose.model('Item', ItemSchema);