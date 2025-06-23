import mongoose, { Schema, Model } from 'mongoose';
import {
  BaseProduct as IBaseProduct,
  Product as IProduct,
  Medicine as IMedicine
} from '@pharmacy-pos/shared/types/entities';
import { ProductType } from '@pharmacy-pos/shared/enums';

// 擴展 Mongoose Document 介面，處理 ObjectId 與 string 的差異
// 定義 BaseProduct 文檔類型別名
type BaseProductDocumentFields = {
  category?: mongoose.Types.ObjectId;
  supplier?: mongoose.Types.ObjectId;
};

// 使用類型別名替代聯合類型
type IBaseProductDocument = Omit<IBaseProduct, '_id' | 'category' | 'supplier' | 'createdAt' | 'updatedAt'> & mongoose.Document & BaseProductDocumentFields;

interface IProductDocument extends Omit<IProduct, '_id' | 'category' | 'supplier' | 'createdAt' | 'updatedAt'>, mongoose.Document {
  category?: mongoose.Types.ObjectId;
  supplier?: mongoose.Types.ObjectId;
}

interface IMedicineDocument extends Omit<IMedicine, '_id' | 'category' | 'supplier' | 'createdAt' | 'updatedAt'>, mongoose.Document {
  category?: mongoose.Types.ObjectId;
  supplier?: mongoose.Types.ObjectId;
}

// 定義可能為空的產品文檔類型別名
type MaybeBaseProduct = IBaseProductDocument | null;

// 擴展 Model 介面以包含自定義靜態方法
interface IBaseProductModel extends Model<IBaseProductDocument> {
  findByCode(code: string): Promise<MaybeBaseProduct>;
}

// 基礎產品 Schema (使用 shared 類型定義)
const BaseProductSchema = new Schema<IBaseProductDocument>({
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
  category: {
    type: Schema.Types.ObjectId,
    ref: 'ProductCategory'
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
    type: Schema.Types.ObjectId,
    ref: 'supplier'
  },
  minStock: {
    type: Number,
    default: 10
  },
  productType: {
    type: String,
    required: true,
    enum: Object.values(ProductType)  // 使用 shared 枚舉
  },
  date: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  discriminatorKey: 'productType',
  timestamps: true
});

// 靜態方法 - 類型安全
BaseProductSchema.statics.findByCode = function(code: string): Promise<MaybeBaseProduct> {
  return this.findOne({ code });
};

// 創建基礎模型
const BaseProductModel = mongoose.model<IBaseProductDocument, IBaseProductModel>('baseproduct', BaseProductSchema);

// 商品擴展模型
const ProductModel = BaseProductModel.discriminator<IProductDocument>(ProductType.PRODUCT, new Schema({
  barcode: {
    type: String
  }
}));

// 藥品擴展模型 - 使用 shared 類型結構
const MedicineModel = BaseProductModel.discriminator<IMedicineDocument>(ProductType.MEDICINE, new Schema({
  barcode: {
    type: String
  },
  medicineInfo: {
    licenseNumber: {
      type: String
    },
    ingredients: {
      type: String
    },
    dosage: {
      type: String
    },
    sideEffects: {
      type: String
    },
    contraindications: {
      type: String
    },
    storageConditions: {
      type: String
    },
    manufacturer: {
      type: String
    },
    approvalNumber: {
      type: String
    },
    expiryDate: {
      type: Date
    }
  },
  // 保持向後兼容性的舊欄位
  healthInsuranceCode: {
    type: String
  },
  healthInsurancePrice: {
    type: Number,
    default: 0
  }
}));

// 雙重導出策略以確保兼容性
export default BaseProductModel;
export { ProductModel as Product, MedicineModel as Medicine };

// CommonJS 兼容性
module.exports = BaseProductModel;
module.exports.default = BaseProductModel;
module.exports.Product = ProductModel;
module.exports.Medicine = MedicineModel;