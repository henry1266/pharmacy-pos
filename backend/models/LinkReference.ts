import mongoose, { Schema, Document, Model } from 'mongoose';

// 超連結參考文檔介面
export interface ILinkReference extends Document {
  keyword: string; // 關鍵字，如 "蝦青素"
  displayText: string; // 顯示文字
  url: string; // 完整 URL
  category: string; // 分類，如 "成分"、"藥品"、"參考資料"
  description?: string; // 描述
  usageCount: number; // 使用次數統計
  isActive: boolean; // 是否啟用
  createdBy?: string; // 建立者
  lastUsedAt?: Date; // 最後使用時間
  createdAt: Date;
  updatedAt: Date;
  
  // 實例方法
  incrementUsage(): Promise<ILinkReference>;
  toMarkdownLink(): string;
}

// 靜態方法介面
export interface ILinkReferenceModel extends Model<ILinkReference> {
  searchLinks(query: string, options?: any): Promise<ILinkReference[]>;
  getPopularLinks(limit?: number): Promise<ILinkReference[]>;
  findByKeyword(keyword: string): Promise<ILinkReference | null>;
}

// 超連結參考 Schema
const LinkReferenceSchema = new Schema<ILinkReference>({
  keyword: {
    type: String,
    required: true,
    unique: true, // 關鍵字必須唯一
    trim: true,
    maxlength: 100,
    index: true
  },
  displayText: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  url: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
    validate: {
      validator: function(v: string) {
        // 簡單的 URL 驗證
        return /^https?:\/\/.+/.test(v);
      },
      message: 'URL 格式不正確'
    }
  },
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    index: true,
    default: '一般'
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdBy: {
    type: String,
    ref: 'User'
  },
  lastUsedAt: {
    type: Date,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 複合索引優化
LinkReferenceSchema.index({ category: 1, isActive: 1 });
LinkReferenceSchema.index({ usageCount: -1, isActive: 1 });
LinkReferenceSchema.index({ keyword: 1, isActive: 1 });
LinkReferenceSchema.index({ lastUsedAt: -1 });

// 全文搜索索引
LinkReferenceSchema.index({
  keyword: 'text',
  displayText: 'text',
  description: 'text',
  category: 'text'
}, {
  weights: {
    keyword: 10, // 關鍵字權重最高
    displayText: 8,
    category: 5,
    description: 1
  },
  name: 'LinkReference_text_index'
});

// 靜態方法：搜索超連結
LinkReferenceSchema.statics.searchLinks = function(query: string, options: any = {}) {
  const {
    limit = 20,
    skip = 0,
    sortBy = 'relevance' // 'relevance', 'usage', 'recent', 'alphabetical'
  } = options;

  let searchQuery: any = {
    isActive: true
  };

  // 如果有搜索關鍵字，使用全文搜索
  if (query && query.trim()) {
    searchQuery.$text = { $search: query.trim() };
  }

  let sortOptions: any = {};
  
  // 根據排序方式設定
  switch (sortBy) {
    case 'usage':
      sortOptions = { usageCount: -1, updatedAt: -1 };
      break;
    case 'recent':
      sortOptions = { lastUsedAt: -1, updatedAt: -1 };
      break;
    case 'alphabetical':
      sortOptions = { keyword: 1 };
      break;
    case 'relevance':
    default:
      if (query && query.trim()) {
        sortOptions = { score: { $meta: 'textScore' }, usageCount: -1 };
      } else {
        sortOptions = { usageCount: -1, updatedAt: -1 };
      }
      break;
  }

  const projection = query && query.trim() ? { score: { $meta: 'textScore' } } : {};

  return this.find(searchQuery, projection)
    .sort(sortOptions)
    .limit(limit)
    .skip(skip);
};

// 靜態方法：獲取熱門連結
LinkReferenceSchema.statics.getPopularLinks = function(limit: number = 10) {
  return this.find({ isActive: true })
    .sort({ usageCount: -1, updatedAt: -1 })
    .limit(limit);
};

// 靜態方法：根據關鍵字查找
LinkReferenceSchema.statics.findByKeyword = function(keyword: string) {
  return this.findOne({ 
    keyword: keyword.trim(), 
    isActive: true 
  });
};

// 實例方法：增加使用次數
LinkReferenceSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.lastUsedAt = new Date();
  return this.save();
};

// 實例方法：生成 Markdown 連結
LinkReferenceSchema.methods.toMarkdownLink = function() {
  return `[${this.displayText}](${this.url})`;
};

// 中間件：更新時間戳
LinkReferenceSchema.pre('save', function(next) {
  if (this.isNew) {
    this.lastUsedAt = this.lastUsedAt || new Date();
  }
  next();
});

const LinkReference = mongoose.model<ILinkReference, ILinkReferenceModel>('LinkReference', LinkReferenceSchema);

export default LinkReference;