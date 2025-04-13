const mongoose = require('mongoose');

// 出貨單項目子模型
const ShippingOrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'baseproduct',
    required: true
  },
  did: {
    type: String,
    required: true
  },
  dname: {
    type: String,
    required: true
  },
  dquantity: {
    type: Number,
    required: true
  },
  dtotalCost: {
    type: Number,
    required: true
  },
  unitPrice: {
    type: Number,
    default: function() {
      return this.dquantity > 0 ? this.dtotalCost / this.dquantity : 0;
    }
  }
});

// 出貨單主模型
const ShippingOrderSchema = new mongoose.Schema({
  soid: {
    type: String,
    required: true,
    unique: true
  },
  orderNumber: {
    type: String,
    default: function() {
      // 使用soid作為orderNumber的默認值
      return this.soid;
    },
    unique: true
  },
  // 發票欄位已移除
  sobilldate: {
    type: Date,
    required: false
  },
  sosupplier: {
    type: String,
    required: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'supplier'
  },
  items: [ShippingOrderItemSchema],
  totalAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['未收', '已收款', '已開立'],
    default: '未收'
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 計算總金額的中間件
ShippingOrderSchema.pre('save', function(next) {
  this.totalAmount = this.items.reduce((total, item) => total + Number(item.dtotalCost), 0);
  this.updatedAt = Date.now();
  
  // 確保orderNumber有值
  if (!this.orderNumber) {
    this.orderNumber = this.soid;
  }
  
  next();
});

module.exports = mongoose.model('shippingorder', ShippingOrderSchema);
