/**
 * 用戶遷移腳本
 * 為現有用戶添加用戶名
 */
const mongoose = require('mongoose');
const config = require('config');
const User = require('../models/User');

// 連接資料庫
const connectDB = async () => {
  try {
    await mongoose.connect(config.get('mongoURI'), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB 連接成功...');
  } catch (err) {
    console.error('MongoDB 連接失敗:', err.message);
    process.exit(1);
  }
};

// 為現有用戶添加用戶名
const migrateUsers = async () => {
  try {
    // 獲取所有沒有用戶名的用戶
    const users = await User.find({ username: { $exists: false } });
    
    console.log(`找到 ${users.length} 個需要遷移的用戶`);
    
    for (const user of users) {
      // 從電子郵件生成用戶名
      let username = user.email.split('@')[0];
      
      // 檢查用戶名是否已存在
      let isUnique = false;
      let counter = 1;
      let tempUsername = username;
      
      while (!isUnique) {
        const existingUser = await User.findOne({ username: tempUsername });
        if (!existingUser) {
          isUnique = true;
          username = tempUsername;
        } else {
          tempUsername = `${username}${counter}`;
          counter++;
        }
      }
      
      // 更新用戶
      user.username = username;
      await user.save();
      
      console.log(`用戶 ${user.email} 已更新，新用戶名: ${username}`);
    }
    
    console.log('用戶遷移完成');
  } catch (err) {
    console.error('遷移失敗:', err);
  } finally {
    mongoose.disconnect();
    console.log('資料庫連接已關閉');
  }
};

// 執行遷移
connectDB().then(() => {
  migrateUsers();
});