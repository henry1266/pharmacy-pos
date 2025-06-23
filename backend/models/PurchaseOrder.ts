import mongoose, { Schema, Document } from 'mongoose';

// 進貨單狀態枚舉
export type PurchaseOrderStatus = 'pending' | 'completed' | 'cancelled';
export type PaymentStatus = '未付' | '已下收' | '已匯款';

// 進貨單項目介面
export interface IPurchaseOrderItem {
  product: mongoose.Types.ObjectId;
  did: string;
  dname: string;
  dquantity: number;
  dtotalCost: number;
  unitPrice: number;
}

// 進貨單項目文檔介面
export interface IPurchaseOrderItemDocument extends IPurchaseOrderItem, Document {
  _id: mongoose.Types.ObjectId;
}

// 進貨單介面
export interface IPurchaseOrder {
  poid: string;
  orderNumber: string;
  pobill?: string;
  pobilldate?: Date;
  posupplier: string;
  supplier?: mongoose.Types.ObjectId;
  items: IPurchaseOrderItem[];
  totalAmount: number;
  status: PurchaseOrderStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 進貨單文檔介面
export interface IPurchaseOrderDocument extends IPurchaseOrder, Document {
  _id: mongoose.Types.ObjectId;
  items: IPurchaseOrderItemDocument[];
}

// 進貨單項目子模型
const PurchaseOrderItemSchema = new Schema<IPurchaseOrderItemDocument>({
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
    default: function(this: IPurchaseOrderItemDocument) {
      return this.dquantity > 0 ? this.dtotalCost / this.dquantity : 0;
    }
  }
});

// 進貨單主模型
const PurchaseOrderSchema = new Schema<IPurchaseOrderDocument>({
  poid: {
    type: String,
    required: true,
    unique: true
  },
  orderNumber: {
    type: String,
    default: function(this: IPurchaseOrderDocument) {
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
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['未付', '已下收', '已匯款'],
    default: '未付'
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
  this.updatedAt = new Date();
  
  // 確保orderNumber有值
  this.orderNumber ??= this.poid;
  
  next();
});

const PurchaseOrder = mongoose.model<IPurchaseOrderDocument>('purchaseorder', PurchaseOrderSchema);

// 同時支持 ES6 和 CommonJS 導入
export default PurchaseOrder;
module.exports = PurchaseOrder;
module.exports.default = PurchaseOrder;