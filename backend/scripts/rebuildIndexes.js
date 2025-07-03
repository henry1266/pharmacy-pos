const mongoose = require('mongoose');
require('dotenv').config();

async function rebuildIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacy-pos');
    console.log('✅ 連接到 MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('accounts2');
    
    // 1. 查看現有索引
    console.log('🔍 現有索引:');
    const existingIndexes = await collection.indexes();
    existingIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // 2. 刪除舊的 code_1 索引
    try {
      await collection.dropIndex('code_1');
      console.log('🗑️ 已刪除舊索引: code_1');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️ 索引 code_1 不存在，跳過刪除');
      } else {
        throw error;
      }
    }

    // 3. 建立新的複合索引
    console.log('🔨 建立新索引...');
    
    // 機構隔離的代碼唯一性
    await collection.createIndex(
      { organizationId: 1, code: 1 }, 
      { 
        unique: true,
        partialFilterExpression: { organizationId: { $ne: null } },
        name: 'organizationId_1_code_1'
      }
    );
    console.log('✅ 建立索引: organizationId_1_code_1');

    // 個人帳戶的代碼唯一性
    await collection.createIndex(
      { createdBy: 1, code: 1 }, 
      { 
        unique: true,
        partialFilterExpression: { organizationId: null },
        name: 'createdBy_1_code_1_personal'
      }
    );
    console.log('✅ 建立索引: createdBy_1_code_1_personal');

    // 4. 確認新索引
    console.log('🔍 更新後的索引:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('✅ 索引重建完成');
  } catch (error) {
    console.error('❌ 索引重建失敗:', error);
  } finally {
    await mongoose.disconnect();
  }
}

rebuildIndexes();