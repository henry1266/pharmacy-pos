import mongoose, { Schema, Document } from 'mongoose';

// 產品筆記文檔介面
export interface IProductNote extends Document {
  productId: mongoose.Types.ObjectId;
  summary: string; // 重點摘要 - 在產品列表顯示
  content: string; // 完整內容 - 細文
  contentType: 'markdown' | 'html' | 'text';
  wordCount: number;
  summaryWordCount: number;
  lastEditedBy?: string;
  tags?: string[];
  attachments?: {
    filename: string;
    url: string;
    size: number;
    mimeType: string;
    uploadedAt: Date;
  }[];
  metadata?: {
    readTime?: number; // 預估閱讀時間（分鐘）
    complexity?: 'simple' | 'medium' | 'complex';
    category?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 產品筆記 Schema
const ProductNoteSchema = new Schema<IProductNote>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'baseproduct',
    required: true,
    unique: true, // 每個產品只能有一個主筆記
    index: true
  },
  summary: {
    type: String,
    default: '',
    maxlength: 5000 // 重點摘要限制 5KB
  },
  content: {
    type: String,
    default: '',
    maxlength: 1000000 // 1MB 文本限制
  },
  contentType: {
    type: String,
    enum: ['markdown', 'html', 'text'],
    default: 'markdown'
  },
  wordCount: {
    type: Number,
    default: 0,
    index: true
  },
  summaryWordCount: {
    type: Number,
    default: 0,
    index: true
  },
  lastEditedBy: {
    type: String,
    ref: 'User'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    readTime: {
      type: Number,
      min: 0
    },
    complexity: {
      type: String,
      enum: ['simple', 'medium', 'complex'],
      default: 'simple'
    },
    category: {
      type: String,
      trim: true
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true,
  // 優化查詢性能
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引優化
ProductNoteSchema.index({ productId: 1, isActive: 1 });
ProductNoteSchema.index({ tags: 1 });
ProductNoteSchema.index({ wordCount: 1 });
ProductNoteSchema.index({ summaryWordCount: 1 });
ProductNoteSchema.index({ 'metadata.complexity': 1 });
ProductNoteSchema.index({ updatedAt: -1 });

// 全文搜索索引
ProductNoteSchema.index({
  summary: 'text',
  content: 'text',
  tags: 'text',
  'metadata.category': 'text'
}, {
  weights: {
    summary: 15, // 重點摘要權重最高
    content: 10,
    tags: 5,
    'metadata.category': 1
  },
  name: 'ProductNote_text_index'
});

// 虛擬欄位：關聯產品資訊
ProductNoteSchema.virtual('product', {
  ref: 'baseproduct',
  localField: 'productId',
  foreignField: '_id',
  justOne: true
});

// 中間件：自動計算字數
ProductNoteSchema.pre('save', function(next) {
  let totalWordCount = 0;
  
  // 計算摘要字數
  if (this.isModified('summary')) {
    const summaryPlainText = this.summary
      .replace(/[#*`_~\[\]()]/g, '') // 移除 Markdown 符號
      .replace(/\s+/g, ' ') // 合併空白
      .trim();
    
    this.summaryWordCount = summaryPlainText.length;
    totalWordCount += this.summaryWordCount;
  }
  
  // 計算內容字數
  if (this.isModified('content')) {
    const contentPlainText = this.content
      .replace(/[#*`_~\[\]()]/g, '') // 移除 Markdown 符號
      .replace(/\s+/g, ' ') // 合併空白
      .trim();
    
    this.wordCount = contentPlainText.length;
    totalWordCount += this.wordCount;
  } else {
    totalWordCount += this.wordCount;
  }
  
  // 計算預估閱讀時間（中文約 300 字/分鐘）
  if (this.isModified('summary') || this.isModified('content')) {
    this.metadata = this.metadata || {};
    this.metadata.readTime = Math.ceil(totalWordCount / 300);
    
    // 根據總字數判斷複雜度
    if (totalWordCount < 500) {
      this.metadata.complexity = 'simple';
    } else if (totalWordCount < 2000) {
      this.metadata.complexity = 'medium';
    } else {
      this.metadata.complexity = 'complex';
    }
  }
  
  next();
});

// 靜態方法：根據產品ID獲取筆記
ProductNoteSchema.statics.findByProductId = function(productId: string) {
  return this.findOne({ productId, isActive: true });
};

// 靜態方法：搜索筆記
ProductNoteSchema.statics.searchNotes = function(query: string, options: any = {}) {
  const {
    limit = 20,
    skip = 0,
    complexity,
    tags,
    minWordCount,
    maxWordCount
  } = options;

  let searchQuery: any = {
    $text: { $search: query },
    isActive: true
  };

  // 添加篩選條件
  if (complexity) {
    searchQuery['metadata.complexity'] = complexity;
  }
  
  if (tags && tags.length > 0) {
    searchQuery.tags = { $in: tags };
  }
  
  if (minWordCount || maxWordCount) {
    searchQuery.wordCount = {};
    if (minWordCount) searchQuery.wordCount.$gte = minWordCount;
    if (maxWordCount) searchQuery.wordCount.$lte = maxWordCount;
  }

  return this.find(searchQuery, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, updatedAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('product', 'name code shortCode');
};

// 實例方法：添加標籤
ProductNoteSchema.methods.addTag = function(tag: string) {
  if (!this.tags.includes(tag.toLowerCase())) {
    this.tags.push(tag.toLowerCase());
  }
  return this.save();
};

// 實例方法：移除標籤
ProductNoteSchema.methods.removeTag = function(tag: string) {
  this.tags = this.tags.filter((t: string) => t !== tag.toLowerCase());
  return this.save();
};

const ProductNote = mongoose.model<IProductNote>('ProductNote', ProductNoteSchema);

export default ProductNote;