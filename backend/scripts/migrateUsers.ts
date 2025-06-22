/**
 * 用戶遷移腳本
 * 為現有用戶添加用戶名
 */
import mongoose from 'mongoose';
import config from 'config';
import User from '../models/User';
import { IUserDocument } from '../src/types/models';

// 連接資料庫
const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.get('mongoURI'));
    console.log('MongoDB 連接成功...');
  } catch (err) {
    const error = err as Error;
    console.error('MongoDB 連接失敗:', error.message);
    process.exit(1);
  }
};

// 為現有用戶添加用戶名
const migrateUsers = async (): Promise<void> => {
  try {
    // 獲取所有沒有用戶名或用戶名為空的用戶
    const users: IUserDocument[] = await User.find({
      $or: [
        { username: { $exists: false } },
        { username: '' },
        { username: null }
      ]
    });
    
    console.log(`找到 ${users.length} 個需要遷移的用戶`);
    
    for (const user of users) {
      // 生成基礎用戶名
      let baseUsername = `user_${user._id.toString().slice(-6)}`;
      
      // 檢查用戶名是否已存在
      let isUnique = false;
      let counter = 1;
      let username = baseUsername;
      
      while (!isUnique) {
        const existingUser = await User.findOne({ username });
        if (!existingUser) {
          isUnique = true;
        } else {
          username = `${baseUsername}_${counter}`;
          counter++;
        }
      }
      
      // 更新用戶
      user.username = username;
      await user.save();
      
      console.log(`用戶 ${user._id} 已更新，新用戶名: ${username}`);
    }
    
    console.log('用戶遷移完成');
  } catch (err) {
    const error = err as Error;
    console.error('遷移失敗:', error);
  } finally {
    await mongoose.disconnect();
    console.log('資料庫連接已關閉');
  }
};

// 執行遷移
connectDB().then(() => {
  migrateUsers();
});