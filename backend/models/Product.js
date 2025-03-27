const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    sparse: true
  },
  sku: {
    type: String,
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

// 移除sku欄位的唯一索引
ProductSchema.index({ sku: 1 }, { unique: false, sparse: true });

module.exports = mongoose.model('product', ProductSchema);
