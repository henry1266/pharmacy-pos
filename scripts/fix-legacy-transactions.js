const mongoose = require('mongoose');

async function fixLegacyTransactions() {
  try {
    console.log('🔧 開始修復早期交易的缺失欄位...');
    
    // 連接資料庫
    await mongoose.connect('mongodb://192.168.68.79:27017/pharmacy-pos');
    console.log('✅ 資料庫連接成功');
    
    // 檢查缺少 fundingType 的交易
    const missingFundingType = await mongoose.connection.db.collection('transactionGroups').find({
      fundingType: { $exists: false }
    }).toArray();
    
    console.log(`📊 發現 ${missingFundingType.length} 筆缺少 fundingType 的交易`);
    
    if (missingFundingType.length > 0) {
      // 批量更新缺少 fundingType 的交易
      const result = await mongoose.connection.db.collection('transactionGroups').updateMany(
        { fundingType: { $exists: false } },
        { 
          $set: { 
            fundingType: 'original',
            linkedTransactionIds: []
          }
        }
      );
      
      console.log(`✅ 已修復 ${result.modifiedCount} 筆交易的 fundingType 欄位`);
    }
    
    // 檢查缺少 status 的交易
    const missingStatus = await mongoose.connection.db.collection('transactionGroups').find({
      status: { $exists: false }
    }).toArray();
    
    console.log(`📊 發現 ${missingStatus.length} 筆缺少 status 的交易`);
    
    if (missingStatus.length > 0) {
      // 批量更新缺少 status 的交易
      const statusResult = await mongoose.connection.db.collection('transactionGroups').updateMany(
        { status: { $exists: false } },
        { $set: { status: 'draft' } }
      );
      
      console.log(`✅ 已修復 ${statusResult.modifiedCount} 筆交易的 status 欄位`);
    }
    
    // 檢查缺少 linkedTransactionIds 的交易
    const missingLinkedIds = await mongoose.connection.db.collection('transactionGroups').find({
      linkedTransactionIds: { $exists: false }
    }).toArray();
    
    console.log(`📊 發現 ${missingLinkedIds.length} 筆缺少 linkedTransactionIds 的交易`);
    
    if (missingLinkedIds.length > 0) {
      // 批量更新缺少 linkedTransactionIds 的交易
      const linkedResult = await mongoose.connection.db.collection('transactionGroups').updateMany(
        { linkedTransactionIds: { $exists: false } },
        { $set: { linkedTransactionIds: [] } }
      );
      
      console.log(`✅ 已修復 ${linkedResult.modifiedCount} 筆交易的 linkedTransactionIds 欄位`);
    }
    
    // 驗證修復結果
    console.log('\n🔍 驗證修復結果...');
    
    // 檢查問題交易
    const problemTransactions = [
      '686891d71aab2f7538faea55', // 沒有確認按鈕的交易
      '6867ab2a5d87badee88880d3'  // 用戶反饋的交易
    ];
    
    for (const txId of problemTransactions) {
      const tx = await mongoose.connection.db.collection('transactionGroups').findOne({
        _id: new mongoose.Types.ObjectId(txId)
      });
      
      if (tx) {
        console.log(`\n📋 交易 ${txId} 修復後狀態:`);
        console.log(`  - 狀態: ${tx.status}`);
        console.log(`  - 資金類型: ${tx.fundingType}`);
        console.log(`  - 連結交易: ${JSON.stringify(tx.linkedTransactionIds)}`);
        console.log(`  - 建立時間: ${tx.createdAt}`);
        
        // 模擬權限檢查
        const statusForCheck = tx.status || 'draft';
        let canConfirm = false;
        switch (statusForCheck) {
          case 'confirmed':
          case 'cancelled':
            canConfirm = false;
            break;
          default:
            canConfirm = true;
        }
        console.log(`  - 修復後 canConfirm: ${canConfirm}`);
      }
    }
    
    // 最終統計
    const finalStats = await mongoose.connection.db.collection('transactionGroups').aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          withStatus: { $sum: { $cond: [{ $ne: ['$status', null] }, 1, 0] } },
          withFundingType: { $sum: { $cond: [{ $ne: ['$fundingType', null] }, 1, 0] } },
          withLinkedIds: { $sum: { $cond: [{ $ne: ['$linkedTransactionIds', null] }, 1, 0] } }
        }
      }
    ]).toArray();
    
    if (finalStats.length > 0) {
      const stats = finalStats[0];
      console.log('\n📊 最終統計:');
      console.log(`  - 總交易數: ${stats.total}`);
      console.log(`  - 有 status 欄位: ${stats.withStatus}`);
      console.log(`  - 有 fundingType 欄位: ${stats.withFundingType}`);
      console.log(`  - 有 linkedTransactionIds 欄位: ${stats.withLinkedIds}`);
      
      if (stats.total === stats.withStatus && stats.total === stats.withFundingType && stats.total === stats.withLinkedIds) {
        console.log('✅ 所有交易都已具備必要欄位！');
      } else {
        console.log('⚠️ 仍有交易缺少必要欄位');
      }
    }
    
    console.log('\n🎉 修復完成！');
    
  } catch (error) {
    console.error('❌ 修復過程發生錯誤:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 資料庫連接已關閉');
  }
}

// 執行修復
fixLegacyTransactions();