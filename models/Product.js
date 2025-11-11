const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String },
  price: { type: Number, required: true },
  unit: { type: String, default: 'kg' },
  stock: { type: Number, default: 0 },
  status: { type: String, enum: ['Available', 'Out of Stock'], default: 'Available' },
  image: String,
  description: String
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
