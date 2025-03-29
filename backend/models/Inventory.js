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
  purchaseOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'purchaseorder'
  },
  purchaseOrderNumber: {
    type: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('inventory', InventorySchema);
