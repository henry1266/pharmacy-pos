/**
 * 修復早期交易缺失分錄的問題
 * 為沒有分錄的 draft 狀態交易建立預設分錄
 */

const mongoose = require('mongoose');

// 連接資料庫
mongoose.connect('mongodb://192.168.68.79:27017/pharmacy-pos')
  .then(async () => {
    console.log('✅ 資料庫連接成功');
    
    try {
      // 1. 找出所有沒有分錄的 draft 狀態交易
      console.log('\n🔍 步驟 1: 查找沒有分錄的 draft 交易...');
      
      const transactionsWithoutEntries = await mongoose.connection.db.collection('transactionGroups').find({
        status: 'draft'
      }).toArray();
      
      console.log(`📊 找到 ${transactionsWithoutEntries.length} 筆 draft 狀態交易`);
      
      let fixedCount = 0;
      let skippedCount = 0;
      
      for (const transaction of transactionsWithoutEntries) {
        // 檢查是否已有分錄
        const existingEntries = await mongoose.connection.db.collection('accountingentries').find({
          transactionGroupId: transaction._id
        }).toArray();
        
        if (existingEntries.length === 0) {
          console.log(`\n🔧 修復交易: ${transaction.groupNumber} - ${transaction.description}`);
          
          // 建立兩筆預設分錄
          const defaultEntries = [
            {
              transactionGroupId: transaction._id,
              accountId: '', // 空的會計科目，需要用戶手動選擇
              debitAmount: 0,
              creditAmount: 0,
              description: transaction.description || '待編輯',
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              transactionGroupId: transaction._id,
              accountId: '', // 空的會計科目，需要用戶手動選擇
              debitAmount: 0,
              creditAmount: 0,
              description: transaction.description || '待編輯',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ];
          
          // 插入預設分錄
          await mongoose.connection.db.collection('accountingentries').insertMany(defaultEntries);
          
          console.log(`  ✅ 已建立 2 筆預設分錄`);
          fixedCount++;
        } else {
          console.log(`  ⏭️  跳過 ${transaction.groupNumber} (已有 ${existingEntries.length} 筆分錄)`);
          skippedCount++;
        }
      }
      
      console.log('\n📊 修復結果統計:');
      console.log(`  ✅ 修復的交易: ${fixedCount} 筆`);
      console.log(`  ⏭️  跳過的交易: ${skippedCount} 筆`);
      console.log(`  📋 總計檢查: ${transactionsWithoutEntries.length} 筆`);
      
      // 2. 驗證修復結果
      console.log('\n🔍 步驟 2: 驗證修復結果...');
      
      const problemTransactionIds = [
        '686891d71aab2f7538faea55', // 24/10/15 問題交易
        '6867ab2a5d87badee88880d3', // 用戶反饋的問題交易
        '6868925d1aab2f7538faf1eb'  // 正常交易作為對比
      ];
      
      for (const txId of problemTransactionIds) {
        const entries = await mongoose.connection.db.collection('accountingentries').find({
          transactionGroupId: new mongoose.Types.ObjectId(txId)
        }).toArray();
        
        const transaction = await mongoose.connection.db.collection('transactionGroups').findOne({
          _id: new mongoose.Types.ObjectId(txId)
        });
        
        console.log(`\n📋 交易 ${transaction?.groupNumber}:`);
        console.log(`  - 描述: ${transaction?.description}`);
        console.log(`  - 分錄數量: ${entries.length}`);
        console.log(`  - 確認按鈕應該可用: ${entries.length >= 2 ? '✅ 是' : '❌ 否'}`);
      }
      
      console.log('\n🎉 修復完成！');
      console.log('💡 提示: 用戶現在可以編輯這些交易的分錄並確認交易了');
      
    } catch (error) {
      console.error('❌ 修復過程發生錯誤:', error);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch(err => {
    console.error('❌ 資料庫連接失敗:', err.message);
    mongoose.disconnect();
  });