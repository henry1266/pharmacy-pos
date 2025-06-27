import mongoose, { Schema, Document } from 'mongoose';
import { UserTheme } from '@pharmacy-pos/shared/types/theme';

// 用戶角色枚舉
export type UserRole = 'admin' | 'pharmacist' | 'staff';

// 用戶設定介面
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

// 用戶介面
export interface IUser {
  name: string;
  username: string;
  email?: string;
  password: string;
  role: UserRole;
  settings: IUserSettings;
  date: Date;
}

// 用戶文檔介面
export interface IUserDocument extends IUser, Document {
  _id: mongoose.Types.ObjectId;
  id: string; // 添加 Mongoose 虛擬屬性 id
}

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
  date: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model<IUserDocument>("user", UserSchema);

// 雙重導出策略以確保兼容性
export default User;

// CommonJS 兼容性
module.exports = User;
module.exports.default = User;