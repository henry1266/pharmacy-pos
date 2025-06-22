import mongoose, { Schema, Document } from 'mongoose';

// 出貨單狀態枚舉
export type ShippingOrderStatus = 'pending' | 'completed' | 'cancelled';
export type ShippingPaymentStatus = '未收' | '已收款' | '已開立';

// 出貨單項目介面
export interface IShippingOrderItem {
  product: mongoose.Types.ObjectId;
  did: string;
  dname: string;
  dquantity: number;
  dtotalCost: number;
  unitPrice: number;
}

// 出貨單項目文檔介面
export interface IShippingOrderItemDocument extends IShippingOrderItem, Document {
  _id: mongoose.Types.ObjectId;
}

// 出貨單介面
export interface IShippingOrder {
  soid: string;
  orderNumber: string;
  sosupplier: string;
  supplier?: mongoose.Types.ObjectId;
  items: IShippingOrderItem[];
  totalAmount: number;
  status: ShippingOrderStatus;
  paymentStatus: ShippingPaymentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 出貨單文檔介面
export interface IShippingOrderDocument extends IShippingOrder, Document {
  _id: mongoose.Types.ObjectId;
  items: IShippingOrderItemDocument[];
}

// 出貨單項目子模型
const ShippingOrderItemSchema = new Schema<IShippingOrderItemDocument>({
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
    default: function(this: IShippingOrderItemDocument) {
      return this.dquantity > 0 ? this.dtotalCost / this.dquantity : 0;
    }
  }
});

// 出貨單主模型
const ShippingOrderSchema = new Schema<IShippingOrderDocument>({
  soid: {
    type: String,
    required: true,
    unique: true
  },
  orderNumber: {
    type: String,
    default: function(this: IShippingOrderDocument) {
      // 使用soid作為orderNumber的默認值
      return this.soid;
    },
    unique: true
  },
  // 發票欄位和日期欄位已移除
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
  this.updatedAt = new Date();
  
  // 確保orderNumber有值
  if (!this.orderNumber) {
    this.orderNumber = this.soid;
  }
  
  next();
});

const ShippingOrder = mongoose.model<IShippingOrderDocument>('shippingorder', ShippingOrderSchema);

// 同時支持 ES6 和 CommonJS 導入
export default ShippingOrder;
module.exports = ShippingOrder;
module.exports.default = ShippingOrder;