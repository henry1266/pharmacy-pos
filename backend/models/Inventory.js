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
  totalAmount: {
    type: Number,
    default: 0
  },
  purchaseOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'purchaseorder'
  },
  purchaseOrderNumber: {
    type: String
  },
  type: {
    type: String,
    enum: ['purchase', 'sale', 'return', 'adjustment', 'ship'],
    default: 'purchase'
  },
  saleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'sale'
  },
  saleNumber: {
    type: String
  },
  shippingOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'shippingorder'
  },
  shippingOrderNumber: {
    type: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('inventory', InventorySchema);
