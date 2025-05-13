const mongoose = require('mongoose');

// 進貨單項目子模型
const PurchaseOrderItemSchema = new mongoose.Schema({
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

// 進貨單主模型
const PurchaseOrderSchema = new mongoose.Schema({
  poid: {
    type: String,
    required: true,
    unique: true
  },
  orderNumber: {
    type: String,
    default: function() {
      // 使用poid作為orderNumber的默認值
      return this.poid;
    },
    unique: true
  },
  pobill: {
    type: String,
    required: false
  },
  pobilldate: {
    type: Date,
    required: false
  },
  posupplier: {
    type: String,
    required: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'supplier'
  },
  items: [PurchaseOrderItemSchema],
  totalAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['處理中', '已完成', 'cancelled'], // 更新 enum，保留 cancelled 以防現有資料問題，但新邏輯應主要使用前兩者
    default: '處理中' // 更新 default
  },
  paymentStatus: {
    type: String,
    enum: ['未付款', '已付款', '已匯款'], // 更新 enum
    default: '未付款' // 更新 default
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
PurchaseOrderSchema.pre('save', function(next) {
  this.totalAmount = this.items.reduce((total, item) => total + Number(item.dtotalCost), 0);
  this.updatedAt = Date.now();
  
  // 確保orderNumber有值
  if (!this.orderNumber) {
    this.orderNumber = this.poid;
  }
  
  next();
});

module.exports = mongoose.model('purchaseorder', PurchaseOrderSchema);

