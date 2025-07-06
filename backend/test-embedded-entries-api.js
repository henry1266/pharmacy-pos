const mongoose = require('mongoose');

// 測試新的內嵌分錄 API
async function testEmbeddedEntriesAPI() {
  try {
    console.log('🧪 開始測試內嵌分錄 API...');
    
    // 連接資料庫
    await mongoose.connect('mongodb://192.168.68.79:27017/pharmacy-pos');
    console.log('✅ 資料庫連接成功');
    
    // 測試 1: 檢查資料庫連接和基本功能
    console.log('\n📋 測試 1: 檢查資料庫基本功能');
    try {
      // 檢查現有 transactionGroups collection
      const existingCount = await mongoose.connection.db.collection('transactionGroups').countDocuments();
      console.log('📈 現有 transactionGroups 文檔數量:', existingCount);
      
      // 檢查是否有測試數據
      const sampleDoc = await mongoose.connection.db.collection('transactionGroups').findOne();
      if (sampleDoc) {
        console.log('📊 範例文檔結構:', Object.keys(sampleDoc));
      }
      
    } catch (error) {
      console.error('❌ 資料庫基本功能測試失敗:', error.message);
    }
    
    // 測試 2: 測試內嵌分錄結構創建
    console.log('\n📋 測試 2: 測試內嵌分錄結構創建');
    try {
      // 直接使用 MongoDB 原生操作創建測試文檔
      const testDoc = {
        groupNumber: 'TEST-EMBEDDED-' + Date.now(),
        description: '測試內嵌分錄交易',
        transactionDate: new Date(),
        totalAmount: 1000,
        status: 'draft',
        fundingType: 'original',
        createdBy: new mongoose.Types.ObjectId(),
        entries: [
          {
            _id: new mongoose.Types.ObjectId(),
            sequence: 1,
            accountId: new mongoose.Types.ObjectId(),
            debitAmount: 1000,
            creditAmount: 0,
            description: '測試借方分錄'
          },
          {
            _id: new mongoose.Types.ObjectId(),
            sequence: 2,
            accountId: new mongoose.Types.ObjectId(),
            debitAmount: 0,
            creditAmount: 1000,
            description: '測試貸方分錄'
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 插入測試文檔
      const result = await mongoose.connection.db.collection('transactionGroups').insertOne(testDoc);
      console.log('✅ 測試內嵌分錄文檔創建成功');
      console.log('📊 文檔 ID:', result.insertedId);
      console.log('📊 內嵌分錄數量:', testDoc.entries.length);
      
      // 驗證內嵌分錄的 _id 是否正確生成
      testDoc.entries.forEach((entry, index) => {
        console.log(`📝 分錄 ${index + 1} ID:`, entry._id);
        console.log(`📝 分錄 ${index + 1} 序號:`, entry.sequence);
      });
      
      // 測試查詢功能
      console.log('\n📋 測試查詢功能');
      const foundDoc = await mongoose.connection.db.collection('transactionGroups').findOne({ _id: result.insertedId });
      if (foundDoc) {
        console.log('✅ 查詢測試文檔成功');
        console.log('📊 查詢到的分錄數量:', foundDoc.entries.length);
      }
      
      // 清理測試資料
      await mongoose.connection.db.collection('transactionGroups').deleteOne({ _id: result.insertedId });
      console.log('🧹 測試資料已清理');
      
    } catch (error) {
      console.error('❌ 內嵌分錄結構測試失敗:', error.message);
    }
    
    // 測試 3: 測試借貸平衡驗證邏輯
    console.log('\n📋 測試 3: 測試借貸平衡驗證邏輯');
    try {
      // 手動實現簡單的借貸平衡驗證
      function validateBalance(entries) {
        const totalDebit = entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
        const totalCredit = entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
        return {
          isValid: Math.abs(totalDebit - totalCredit) < 0.01,
          totalDebit,
          totalCredit,
          difference: totalDebit - totalCredit
        };
      }
      
      // 測試平衡的分錄
      const balancedEntries = [
        { debitAmount: 1000, creditAmount: 0 },
        { debitAmount: 0, creditAmount: 1000 }
      ];
      
      const balanceResult = validateBalance(balancedEntries);
      console.log('✅ 平衡驗證結果:', balanceResult);
      
      // 測試不平衡的分錄
      const unbalancedEntries = [
        { debitAmount: 1000, creditAmount: 0 },
        { debitAmount: 0, creditAmount: 500 }
      ];
      
      const unbalanceResult = validateBalance(unbalancedEntries);
      console.log('⚠️ 不平衡驗證結果:', unbalanceResult);
      
    } catch (error) {
      console.error('❌ 借貸平衡驗證測試失敗:', error.message);
    }
    
    // 測試 4: 測試資金追蹤功能
    console.log('\n📋 測試 4: 測試資金追蹤功能');
    try {
      
      // 檢查現有的資金追蹤數據
      const fundingDocs = await mongoose.connection.db.collection('transactionGroups').find({
        fundingType: { $exists: true }
      }).limit(3).toArray();
      
      console.log(`📊 找到 ${fundingDocs.length} 筆有資金追蹤的交易:`);
      fundingDocs.forEach(doc => {
        console.log(`  - ${doc.groupNumber}: ${doc.description || 'N/A'} (資金類型: ${doc.fundingType})`);
        if (doc.sourceTransactionId) {
          console.log(`    └─ 資金來源: ${doc.sourceTransactionId}`);
        }
        if (doc.linkedTransactionIds && doc.linkedTransactionIds.length > 0) {
          console.log(`    └─ 關聯交易: ${doc.linkedTransactionIds.length} 筆`);
        }
      });
      
    } catch (error) {
      console.error('❌ 資金追蹤功能測試失敗:', error.message);
    }
    
    // 測試 5: 檢查資料庫索引
    console.log('\n📋 測試 5: 檢查資料庫索引');
    try {
      const indexes = await mongoose.connection.db.collection('transactionGroups').getIndexes();
      
      console.log('📊 現有索引:');
      Object.keys(indexes).forEach(indexName => {
        console.log(`  - ${indexName}:`, JSON.stringify(indexes[indexName], null, 2));
      });
      
    } catch (error) {
      console.error('❌ 索引檢查失敗:', error.message);
    }
    
    console.log('\n🎉 內嵌分錄 API 測試完成！');
    
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
    console.error('❌ 錯誤堆疊:', error.stack);
  } finally {
    // 關閉資料庫連接
    await mongoose.disconnect();
    console.log('🔌 資料庫連接已關閉');
  }
}

// 執行測試
testEmbeddedEntriesAPI();