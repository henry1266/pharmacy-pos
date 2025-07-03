const mongoose = require('mongoose');

async function createSimpleIndexes() {
  try {
    await mongoose.connect('mongodb://192.168.68.79:27017/pharmacy-pos');
    console.log('✅ 連接到 MongoDB (192.168.68.79)');

    const db = mongoose.connection.db;
    const collection = db.collection('accounts2');
    
    // 建立簡單的複合索引：機構 + 代碼
    try {
      await collection.createIndex(
        { organizationId: 1, code: 1 }, 
        { 
          unique: true,
          name: 'organizationId_1_code_1'
        }
      );
      console.log('✅ 建立索引: organizationId_1_code_1');
    } catch (error) {
      console.log('ℹ️ 索引可能已存在:', error.message);
    }

    // 確認索引
    console.log('\n🔍 當前索引:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ 索引建立完成！');
    console.log('🧪 現在可以測試竹文診所的會計科目新增功能了');

  } catch (error) {
    console.error('❌ 索引建立失敗:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createSimpleIndexes();