import mongoose, { Schema, Document } from 'mongoose';

// 用戶角色枚舉
export type UserRole = 'admin' | 'pharmacist' | 'staff';

// 用戶介面
export interface IUser {
  name: string;
  username: string;
  email?: string;
  password: string;
  role: UserRole;
  settings: Record<string, any>; // Use Record type for flexibility
  date: Date;
}

// 用戶文檔介面
export interface IUserDocument extends IUser, Document {
  _id: mongoose.Types.ObjectId;
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

export default mongoose.model<IUserDocument>("user", UserSchema);