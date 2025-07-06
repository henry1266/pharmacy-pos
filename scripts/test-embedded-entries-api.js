const mongoose = require('mongoose');

// 測試新的內嵌分錄 API
async function testEmbeddedEntriesAPI() {
  try {
    console.log('🧪 開始測試內嵌分錄 API...');
    
    // 連接資料庫
    await mongoose.connect('mongodb://192.168.68.79:27017/pharmacy-pos');
    console.log('✅ 資料庫連接成功');
    
    // 測試 1: 檢查新模型是否可以正常載入
    console.log('\n📋 測試 1: 檢查 TransactionGroupWithEntries 模型');
    try {
      const TransactionGroupWithEntries = require('../backend/models/TransactionGroupWithEntries').default;
      console.log('✅ TransactionGroupWithEntries 模型載入成功');
      
      // 檢查模型的 collection 名稱
      console.log('📊 Collection 名稱:', TransactionGroupWithEntries.collection.name);
      
      // 檢查現有文檔數量
      const count = await TransactionGroupWithEntries.countDocuments();
      console.log('📈 現有文檔數量:', count);
      
    } catch (error) {
      console.error('❌ 模型載入失敗:', error.message);
    }
    
    // 測試 2: 檢查驗證器是否正常工作
    console.log('\n📋 測試 2: 檢查借貸平衡驗證器');
    try {
      const DoubleEntryValidator = require('../backend/utils/doubleEntryValidation').default;
      
      // 測試平衡的分錄
      const balancedEntries = [
        { debitAmount: 1000, creditAmount: 0 },
        { debitAmount: 0, creditAmount: 1000 }
      ];
      
      const balanceResult = DoubleEntryValidator.validateDebitCreditBalance(balancedEntries);
      console.log('✅ 平衡驗證結果:', balanceResult);
      
      // 測試不平衡的分錄
      const unbalancedEntries = [
        { debitAmount: 1000, creditAmount: 0 },
        { debitAmount: 0, creditAmount: 500 }
      ];
      
      const unbalanceResult = DoubleEntryValidator.validateDebitCreditBalance(unbalancedEntries);
      console.log('⚠️ 不平衡驗證結果:', unbalanceResult);
      
    } catch (error) {
      console.error('❌ 驗證器測試失敗:', error.message);
    }
    
    // 測試 3: 創建測試交易群組（內嵌分錄）
    console.log('\n📋 測試 3: 創建測試交易群組');
    try {
      const TransactionGroupWithEntries = require('../backend/models/TransactionGroupWithEntries').default;
      
      // 創建測試用的內嵌分錄交易群組
      const testTransactionGroup = new TransactionGroupWithEntries({
        groupNumber: 'TEST-' + Date.now(),
        description: '測試內嵌分錄交易',
        transactionDate: new Date(),
        totalAmount: 1000,
        status: 'draft',
        fundingType: 'original',
        createdBy: new mongoose.Types.ObjectId(),
        entries: [
          {
            sequence: 1,
            accountId: new mongoose.Types.ObjectId(),
            debitAmount: 1000,
            creditAmount: 0,
            description: '測試借方分錄'
          },
          {
            sequence: 2,
            accountId: new mongoose.Types.ObjectId(),
            debitAmount: 0,
            creditAmount: 1000,
            description: '測試貸方分錄'
          }
        ]
      });
      
      // 儲存測試交易群組
      const savedGroup = await testTransactionGroup.save();
      console.log('✅ 測試交易群組創建成功');
      console.log('📊 交易群組 ID:', savedGroup._id);
      console.log('📊 內嵌分錄數量:', savedGroup.entries.length);
      
      // 驗證內嵌分錄的 _id 是否自動生成
      savedGroup.entries.forEach((entry, index) => {
        console.log(`📝 分錄 ${index + 1} ID:`, entry._id);
        console.log(`📝 分錄 ${index + 1} 序號:`, entry.sequence);
      });
      
      // 測試查詢功能
      console.log('\n📋 測試查詢功能');
      const foundGroup = await TransactionGroupWithEntries.findById(savedGroup._id);
      if (foundGroup) {
        console.log('✅ 查詢測試交易群組成功');
        console.log('📊 查詢到的分錄數量:', foundGroup.entries.length);
      }
      
      // 清理測試資料
      await TransactionGroupWithEntries.findByIdAndDelete(savedGroup._id);
      console.log('🧹 測試資料已清理');
      
    } catch (error) {
      console.error('❌ 創建測試交易群組失敗:', error.message);
      if (error.errors) {
        Object.keys(error.errors).forEach(key => {
          console.error(`  - ${key}: ${error.errors[key].message}`);
        });
      }
    }
    
    // 測試 4: 檢查索引是否正確創建
    console.log('\n📋 測試 4: 檢查資料庫索引');
    try {
      const TransactionGroupWithEntries = require('../backend/models/TransactionGroupWithEntries').default;
      const indexes = await TransactionGroupWithEntries.collection.getIndexes();
      
      console.log('📊 現有索引:');
      Object.keys(indexes).forEach(indexName => {
        console.log(`  - ${indexName}:`, indexes[indexName]);
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