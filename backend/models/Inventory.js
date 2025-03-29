const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'baseproduct',  // 修改為正確的引用 'baseproduct'
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  batchNumber: {
    type: String
  },
  expiryDate: {
    type: Date
  },
  location: {
    type: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('inventory', InventorySchema);
