import mongoose, { Schema, Document, Types } from 'mongoose';
import {
  Organization as IOrganization,
  OrganizationType,
  OrganizationStatus
} from '@pharmacy-pos/shared/types/organization';

// MongoDB Document 介面
export interface OrganizationDocument extends Omit<IOrganization, '_id' | 'parentId' | 'createdBy' | 'updatedBy'>, Document {
  _id: Types.ObjectId;
  parentId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
}

// 機構 Schema
const OrganizationSchema = new Schema<OrganizationDocument>({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    match: /^[A-Z0-9]{2,10}$/  // 2-10位英數字代碼
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  type: {
    type: String,
    enum: Object.values(OrganizationType),
    required: true
  },
  status: {
    type: String,
    enum: Object.values(OrganizationStatus),
    default: OrganizationStatus.ACTIVE
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  
  // 聯絡資訊
  contact: {
    address: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    taxId: {
      type: String,
      trim: true,
      match: /^\d{8}$/  // 台灣統一編號格式
    }
  },
  
  // 營業資訊
  business: {
    licenseNumber: {
      type: String,
      trim: true
    },
    establishedDate: {
      type: Date,
      required: true
    }
  },
  
  // 系統設定
  settings: {
    timezone: {
      type: String,
      default: 'Asia/Taipei'
    },
    currency: {
      type: String,
      default: 'TWD',
      match: /^[A-Z]{3}$/
    },
    language: {
      type: String,
      default: 'zh-TW'
    },
  },
  
  // 備註
  notes: {
    type: String,
    trim: true,
    maxlength: 1000  // 限制備註長度
  },
  
  // 審計欄位
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  collection: 'organizations'
});

// 索引設定
// code 欄位已在 schema 中設定 unique: true，不需要重複建立索引
OrganizationSchema.index({ type: 1, status: 1 });
OrganizationSchema.index({ parentId: 1 });
OrganizationSchema.index({ 'contact.taxId': 1 }, { sparse: true });

// 虛擬欄位：子機構
OrganizationSchema.virtual('children', {
  ref: 'Organization',
  localField: '_id',
  foreignField: 'parentId'
});

// 虛擬欄位：上級機構
OrganizationSchema.virtual('parent', {
  ref: 'Organization',
  localField: 'parentId',
  foreignField: '_id',
  justOne: true
});


// 靜態方法：根據類型查詢機構
OrganizationSchema.statics.findByType = function(type: OrganizationType) {
  return this.find({ type, status: OrganizationStatus.ACTIVE });
};

// 靜態方法：查詢子機構
OrganizationSchema.statics.findChildren = function(parentId: string) {
  return this.find({ parentId, status: OrganizationStatus.ACTIVE });
};

// 實例方法：檢查是否為總部
OrganizationSchema.methods.isHeadquarters = function(): boolean {
  return this.type === OrganizationType.HEADQUARTERS;
};


// 實例方法：取得完整階層路徑
OrganizationSchema.methods.getHierarchyPath = async function(this: OrganizationDocument): Promise<string[]> {
  const path: string[] = [this.name];
  let current = this;
  
  while (current.parentId) {
    const parent = await mongoose.model('Organization').findById(current.parentId);
    if (!parent) break;
    path.unshift(parent.name);
    current = parent;
  }
  
  return path;
};

// JSON 轉換時排除敏感資訊
OrganizationSchema.methods.toJSON = function() {
  const obj = this.toObject();
  return obj;
};

export default mongoose.model<OrganizationDocument>('Organization', OrganizationSchema);