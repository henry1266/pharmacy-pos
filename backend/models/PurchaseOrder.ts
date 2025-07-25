import mongoose, { Schema, Document } from 'mongoose';
import {
  PurchaseOrderStatus,
  PaymentStatus,
  PurchaseOrderItem as SharedPurchaseOrderItem,
  PurchaseOrder as SharedPurchaseOrder
} from '@pharmacy-pos/shared/types/purchase-order';

// 後端專用的 MongoDB 文檔介面
export interface IPurchaseOrderItem extends Omit<SharedPurchaseOrderItem, 'product' | '_id'> {
  product: mongoose.Types.ObjectId; // 後端使用 ObjectId
}

// 進貨單項目文檔介面
export interface IPurchaseOrderItemDocument extends IPurchaseOrderItem, Document {
  _id: mongoose.Types.ObjectId;
}

// 後端專用的進貨單介面
export interface IPurchaseOrder extends Omit<SharedPurchaseOrder, '_id' | 'supplier' | 'organizationId' | 'selectedAccountIds' | 'items' | 'createdAt' | 'updatedAt'> {
  supplier?: mongoose.Types.ObjectId; // 後端使用 ObjectId
  organizationId?: mongoose.Types.ObjectId; // 機構 ObjectId
  transactionType?: string; // 交易類型
  selectedAccountIds?: mongoose.Types.ObjectId[]; // 選中的會計科目ID
  relatedTransactionGroupId?: mongoose.Types.ObjectId; // 關聯的會計分錄群組ID
  items: IPurchaseOrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

// 進貨單文檔介面
export interface IPurchaseOrderDocument extends IPurchaseOrder, Document {
  _id: mongoose.Types.ObjectId;
  items: IPurchaseOrderItemDocument[];
}

// 重新匯出型別以保持向後兼容
export type { PurchaseOrderStatus, PaymentStatus };

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
  },
  batchNumber: {
    type: String,
    required: false
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
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: false
  },
  transactionType: {
    type: String,
    enum: ['進貨', '支出'],
    required: false
  },
  selectedAccountIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account2',
    required: false
  }],
  relatedTransactionGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TransactionGroup',
    required: false
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