const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const config = require('config');
const User = require('./backend/models/User');

async function resetAdminPassword() {
  try {
    // 連接資料庫
    await mongoose.connect(config.get('mongoURI'));
    console.log('✅ 資料庫連接成功');

    // 查找 admin 用戶
    const adminUser = await User.findOne({ username: 'admin' });
    
    if (!adminUser) {
      console.log('❌ 找不到 admin 用戶');
      process.exit(1);
    }

    console.log('📋 找到 admin 用戶:', adminUser.username);

    // 設定新密碼
    const newPassword = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 更新密碼
    adminUser.password = hashedPassword;
    await adminUser.save();

    console.log('✅ admin 用戶密碼已重設為: admin123');
    console.log('🔐 現在可以使用以下憑證登入:');
    console.log('   用戶名: admin');
    console.log('   密碼: admin123');

    process.exit(0);
  } catch (error) {
    console.error('❌ 重設密碼失敗:', error);
    process.exit(1);
  }
}

resetAdminPassword();