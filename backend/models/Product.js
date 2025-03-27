const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  shortCode: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  healthInsuranceCode: {
    type: String
  },
  category: {
    type: String
  },
  unit: {
    type: String
  },
  purchasePrice: {
    type: Number,
    default: 0
  },
  sellingPrice: {
    type: Number,
    default: 0
  },
  description: {
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
