const mongoose = require('mongoose');
require('dotenv').config();

async function cleanDuplicateAccounts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacy-pos');
    console.log('✅ 連接到 MongoDB');

    const Account2 = mongoose.model('Account2', require('../models/Account2').default.schema);
    
    // 查找重複的代碼
    const duplicates = await Account2.aggregate([
      {
        $group: {
          _id: { code: '$code', organizationId: '$organizationId' },
          count: { $sum: 1 },
          docs: { $push: '$_id' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    console.log(`🔍 找到 ${duplicates.length} 組重複資料`);

    for (const duplicate of duplicates) {
      console.log(`📋 代碼: ${duplicate._id.code}, 機構: ${duplicate._id.organizationId}, 重複數量: ${duplicate.count}`);
      
      // 保留第一個，刪除其他
      const docsToDelete = duplicate.docs.slice(1);
      if (docsToDelete.length > 0) {
        await Account2.deleteMany({ _id: { $in: docsToDelete } });
        console.log(`🗑️ 刪除了 ${docsToDelete.length} 個重複項目`);
      }
    }

    console.log('✅ 清理完成');
  } catch (error) {
    console.error('❌ 清理失敗:', error);
  } finally {
    await mongoose.disconnect();
  }
}

cleanDuplicateAccounts();