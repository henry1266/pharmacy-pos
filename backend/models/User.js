const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
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
      validator: async function(email) {
        // 如果沒有提供電子郵件，則跳過驗證
        if (!email) return true;
        
        // 檢查是否有其他用戶使用相同的電子郵件
        const User = mongoose.model('user');
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

module.exports = mongoose.model("user", UserSchema);

