const mongoose = require('mongoose');

async function fixIndexes() {
  try {
    await mongoose.connect('mongodb://192.168.68.79:27017/pharmacy-pos');
    console.log('✅ 連接到 MongoDB (192.168.68.79)');

    const db = mongoose.connection.db;
    const collection = db.collection('accounts2');
    
    // 1. 查看現有索引
    console.log('🔍 現有索引:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
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
        console.error('❌ 刪除索引失敗:', error.message);
      }
    }

    // 3. 建立新的複合索引
    await collection.createIndex(
      { organizationId: 1, code: 1 }, 
      { 
        unique: true,
        partialFilterExpression: { organizationId: { $ne: null } },
        name: 'organizationId_1_code_1'
      }
    );
    console.log('✅ 建立索引: organizationId_1_code_1');

    // 4. 建立個人帳戶索引
    await collection.createIndex(
      { createdBy: 1, code: 1 }, 
      { 
        unique: true,
        partialFilterExpression: { organizationId: null },
        name: 'createdBy_1_code_1_personal'
      }
    );
    console.log('✅ 建立索引: createdBy_1_code_1_personal');

    // 5. 確認新索引
    console.log('\n🔍 更新後的索引:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ 索引修復完成！');
    console.log('📝 現在竹文診所和興安藥局都可以使用相同的代碼了');

  } catch (error) {
    console.error('❌ 索引修復失敗:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixIndexes();