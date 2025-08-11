import mongoose, { Schema, Document } from 'mongoose';
import { UserTheme } from '@pharmacy-pos/shared/types/theme';

/**
 * @description 用戶角色類型定義
 * @typedef {('admin'|'pharmacist'|'staff')} UserRole
 */
export type UserRole = 'admin' | 'pharmacist' | 'staff';

/**
 * @description 用戶設定介面
 * @interface IUserSettings
 */
export interface IUserSettings {
  shortcuts?: Array<{
    id: string;
    name: string;
    productIds: string[];
  }>;
  theme?: {
    currentThemeId?: string;
    themes: UserTheme[];
  };
  notifications?: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
  };
  [key: string]: any; // 保持彈性以支援其他設定
}

/**
 * @description 用戶基本介面
 * @interface IUser
 */
export interface IUser {
  name: string;
  username: string;
  email?: string;
  password: string;
  role: UserRole;
  settings: IUserSettings;
  isActive: boolean;
  lastLogin?: Date;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @description 用戶文檔介面，擴展自基本用戶介面和Mongoose文檔
 * @interface IUserDocument
 * @extends {IUser}
 * @extends {Document}
 */
export interface IUserDocument extends IUser, Document {
  _id: mongoose.Types.ObjectId;
  id: string; // 添加 Mongoose 虛擬屬性 id
}

/**
 * @description 用戶模型模式定義
 * @type {Schema<IUserDocument>}
 */
const UserSchema = new Schema<IUserDocument>({
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    // 使用自定義驗證器來確保電子郵件是唯一的（如果提供）
    validate: {
      validator: async function(this: IUserDocument, email: string) {
        // 如果沒有提供電子郵件，則跳過驗證
        if (!email) return true;
        
        // 檢查是否有其他用戶使用相同的電子郵件
        const User = mongoose.model<IUserDocument>('user');
        const count = await User.countDocuments({
          email: email,
          _id: { $ne: this._id } // 排除當前用戶
        });
        
        // 如果沒有其他用戶使用此電子郵件，則返回 true
        return count === 0;
      },
      message: '此電子郵件已被使用'
    }
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["admin", "pharmacist", "staff"],
    default: "staff"
  },
  // Add a new field to store user-specific settings
  settings: {
    type: mongoose.Schema.Types.Mixed, // Use Mixed type for flexibility
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // 自動添加 createdAt 和 updatedAt
});

/**
 * @description 用戶模型
 * @type {mongoose.Model<IUserDocument>}
 */
const User = mongoose.model<IUserDocument>("user", UserSchema);

/**
 * @description 雙重導出策略以確保兼容性
 */
export default User;

/**
 * @description CommonJS 兼容性導出
 */
module.exports = User;
module.exports.default = User;