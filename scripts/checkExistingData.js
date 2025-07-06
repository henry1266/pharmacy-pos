const mongoose = require('mongoose');

async function checkExistingData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://192.168.68.79:27017/pharmacy-pos');
    console.log('✅ 連接到 MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('accounts2');
    
    // 查看所有會計科目
    console.log('🔍 現有會計科目:');
    const accounts = await collection.find({}).toArray();
    
    accounts.forEach(account => {
      console.log(`  - 代碼: ${account.code}, 名稱: ${account.name}, 機構ID: ${account.organizationId || '無'}`);
    });

    // 特別檢查 code "1001" 的記錄
    console.log('\n🔍 代碼 "1001" 的記錄:');
    const code1001Records = await collection.find({ code: "1001" }).toArray();
    code1001Records.forEach(record => {
      console.log(`  - ID: ${record._id}, 機構ID: ${record.organizationId || '無'}, 名稱: ${record.name}`);
    });

    // 檢查竹文診所的 organizationId
    const targetOrgId = '686390c76ac0ff7bb8bb8387';
    console.log(`\n🔍 機構 ${targetOrgId} 的會計科目:`);
    const orgAccounts = await collection.find({ organizationId: targetOrgId }).toArray();
    orgAccounts.forEach(account => {
      console.log(`  - 代碼: ${account.code}, 名稱: ${account.name}`);
    });

    console.log(`\n📊 總計: ${accounts.length} 個會計科目`);
    console.log(`📊 代碼 "1001": ${code1001Records.length} 個記錄`);
    console.log(`📊 機構 ${targetOrgId}: ${orgAccounts.length} 個科目`);

  } catch (error) {
    console.error('❌ 檢查失敗:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkExistingData();