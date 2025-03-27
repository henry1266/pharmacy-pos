const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: true
  },
  specification: {
    type: String
  },
  category: {
    type: String
  },
  unit: {
    type: String,
    required: true
  },
  purchasePrice: {
    type: Number,
    required: true
  },
  sellingPrice: {
    type: Number,
    required: true
  },
  description: {
    type: String
  },
  manufacturer: {
    type: String
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'supplier'
  },
  minStock: {
    type: Number,
    default: 10
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('product', ProductSchema);
