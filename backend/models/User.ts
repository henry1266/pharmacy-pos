import mongoose, { Schema, Document, Model } from 'mongoose';
import { IUser, IUserDocument } from '../src/types/models';

// User Schema 定義
const UserSchema = new Schema<IUserDocument>({
  username: {
    type: String,
    required: [true, '使用者名稱為必填項目'],
    unique: true,
    trim: true,
    minlength: [3, '使用者名稱至少需要3個字元'],
    maxlength: [50, '使用者名稱不能超過50個字元']
  },
  password: {
    type: String,
    required: [true, '密碼為必填項目'],
    minlength: [6, '密碼至少需要6個字元']
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'user', 'employee'],
      message: '角色必須是 admin、user 或 employee'
    },
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  settings: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    language: {
      type: String,
      enum: ['zh-TW', 'zh-CN', 'en'],
      default: 'zh-TW'
    },
    notifications: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// 索引設定
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ lastLogin: -1 });

// 實例方法：比較密碼
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(candidatePassword, this.password);
};

// 靜態方法：根據使用者名稱查找用戶
UserSchema.statics.findByUsername = function(username: string) {
  return this.findOne({ username, isActive: true });
};

// 靜態方法：根據角色查找用戶
UserSchema.statics.findByRole = function(role: string) {
  return this.find({ role, isActive: true });
};

// 靜態方法：創建管理員用戶
UserSchema.statics.createAdmin = async function(userData: Partial<IUser>) {
  const bcrypt = require('bcryptjs');
  
  if (userData.password) {
    const salt = await bcrypt.genSalt(10);
    userData.password = await bcrypt.hash(userData.password, salt);
  }
  
  return this.create({
    ...userData,
    role: 'admin',
    isActive: true
  });
};

// 中間件：密碼加密
UserSchema.pre<IUserDocument>('save', async function(next) {
  // 只有在密碼被修改時才進行加密
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// 中間件：更新最後登入時間
UserSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update && (update as any).lastLogin !== undefined) {
    this.set({ lastLogin: new Date() });
  }
  next();
});

// 虛擬屬性：是否為管理員
UserSchema.virtual('isAdmin').get(function(this: IUserDocument) {
  return this.role === 'admin';
});

// 虛擬屬性：顯示名稱
UserSchema.virtual('displayName').get(function(this: IUserDocument) {
  return this.username;
});

// 擴展靜態方法介面
interface IUserModel extends Model<IUserDocument> {
  findByUsername(username: string): Promise<IUserDocument | null>;
  findByRole(role: string): Promise<IUserDocument[]>;
  createAdmin(userData: Partial<IUser>): Promise<IUserDocument>;
}

// 創建並匯出模型
const User = mongoose.model<IUserDocument, IUserModel>('User', UserSchema);

export default User;
export type { IUser, IUserDocument, IUserModel };