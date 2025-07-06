const mongoose = require('mongoose');

// 連接資料庫
const MONGODB_URI = 'mongodb://192.168.68.79:27017/pharmacy-pos';

async function testMigrationDryRun() {
  try {
    console.log('🧪 開始數據遷移測試（乾跑模式）...');
    
    // 連接資料庫
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 資料庫連接成功');
    
    // 獲取原始 collections
    const transactionGroupsCollection = mongoose.connection.db.collection('transactionGroups');
    const accountingEntriesCollection = mongoose.connection.db.collection('accountingentries');
    
    // 1. 統計現有數據
    console.log('\n📊 步驟 1: 統計現有數據...');
    
    const totalTransactionGroups = await transactionGroupsCollection.countDocuments();
    const totalAccountingEntries = await accountingEntriesCollection.countDocuments();
    
    console.log(`📋 交易群組總數: ${totalTransactionGroups}`);
    console.log(`📋 分錄總數: ${totalAccountingEntries}`);
    
    // 2. 檢查數據完整性
    console.log('\n🔍 步驟 2: 檢查數據完整性...');
    
    // 檢查孤立的分錄（沒有對應交易群組的分錄）
    const orphanedEntries = await accountingEntriesCollection.aggregate([
      {
        $lookup: {
          from: 'transactionGroups',
          localField: 'transactionGroupId',
          foreignField: '_id',
          as: 'transactionGroup'
        }
      },
      {
        $match: {
          transactionGroup: { $size: 0 }
        }
      }
    ]).toArray();
    
    if (orphanedEntries.length > 0) {
      console.log(`⚠️  發現 ${orphanedEntries.length} 筆孤立分錄`);
      orphanedEntries.slice(0, 3).forEach(entry => {
        console.log(`   - 分錄 ID: ${entry._id}, 交易群組 ID: ${entry.transactionGroupId}`);
      });
      if (orphanedEntries.length > 3) {
        console.log(`   ... 還有 ${orphanedEntries.length - 3} 筆`);
      }
    } else {
      console.log('✅ 沒有發現孤立分錄');
    }
    
    // 檢查沒有分錄的交易群組
    const transactionGroupsWithoutEntries = await transactionGroupsCollection.aggregate([
      {
        $lookup: {
          from: 'accountingentries',
          localField: '_id',
          foreignField: 'transactionGroupId',
          as: 'entries'
        }
      },
      {
        $match: {
          entries: { $size: 0 }
        }
      }
    ]).toArray();
    
    if (transactionGroupsWithoutEntries.length > 0) {
      console.log(`⚠️  發現 ${transactionGroupsWithoutEntries.length} 個沒有分錄的交易群組`);
      transactionGroupsWithoutEntries.slice(0, 3).forEach(group => {
        console.log(`   - 交易群組: ${group.groupNumber} (${group.description})`);
      });
      if (transactionGroupsWithoutEntries.length > 3) {
        console.log(`   ... 還有 ${transactionGroupsWithoutEntries.length - 3} 個`);
      }
    } else {
      console.log('✅ 所有交易群組都有對應分錄');
    }
    
    // 3. 模擬遷移過程（不實際修改數據）
    console.log('\n🔄 步驟 3: 模擬遷移過程...');
    
    let validCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // 取樣測試前 10 個交易群組
    const sampleGroups = await transactionGroupsCollection
      .find({})
      .limit(10)
      .toArray();
    
    console.log(`📦 測試 ${sampleGroups.length} 個交易群組樣本...`);
    
    for (const group of sampleGroups) {
      try {
        // 獲取該交易群組的所有分錄
        const entries = await accountingEntriesCollection
          .find({ transactionGroupId: group._id })
          .sort({ sequence: 1 })
          .toArray();
        
        if (entries.length === 0) {
          console.log(`⚠️  跳過沒有分錄的交易群組: ${group.groupNumber}`);
          continue;
        }
        
        // 轉換分錄格式為內嵌格式
        const embeddedEntries = entries.map(entry => ({
          sequence: entry.sequence,
          accountId: entry.accountId,
          debitAmount: entry.debitAmount || 0,
          creditAmount: entry.creditAmount || 0,
          categoryId: entry.categoryId || null,
          description: entry.description,
          sourceTransactionId: entry.sourceTransactionId || null,
          fundingPath: entry.fundingPath || []
        }));
        
        // 驗證借貸平衡
        const totalDebit = embeddedEntries.reduce((sum, entry) => sum + entry.debitAmount, 0);
        const totalCredit = embeddedEntries.reduce((sum, entry) => sum + entry.creditAmount, 0);
        const difference = Math.abs(totalDebit - totalCredit);
        
        if (difference >= 0.01) {
          const error = `借貸不平衡: ${group.groupNumber} - 借方: ${totalDebit}, 貸方: ${totalCredit}, 差額: ${difference}`;
          console.log(`❌ ${error}`);
          errors.push(error);
          errorCount++;
          continue;
        }
        
        console.log(`✅ ${group.groupNumber}: ${entries.length} 筆分錄, 借貸平衡`);
        validCount++;
        
      } catch (error) {
        const errorMsg = `處理交易群組 ${group.groupNumber} 時發生錯誤: ${error.message}`;
        console.log(`❌ ${errorMsg}`);
        errors.push(errorMsg);
        errorCount++;
      }
    }
    
    // 4. 生成測試報告
    console.log('\n📋 步驟 4: 生成測試報告...');
    
    const report = {
      timestamp: new Date().toISOString(),
      testMode: 'DRY_RUN',
      originalData: {
        transactionGroups: totalTransactionGroups,
        accountingEntries: totalAccountingEntries
      },
      dataIntegrity: {
        orphanedEntries: orphanedEntries.length,
        groupsWithoutEntries: transactionGroupsWithoutEntries.length
      },
      sampleTest: {
        tested: sampleGroups.length,
        valid: validCount,
        errors: errorCount
      },
      errors: errors
    };
    
    console.log('\n📊 測試報告:');
    console.log(JSON.stringify(report, null, 2));
    
    // 5. 評估遷移可行性
    console.log('\n🎯 步驟 5: 評估遷移可行性...');
    
    const successRate = validCount / (validCount + errorCount) * 100;
    const dataIntegrityScore = 100 - ((orphanedEntries.length + transactionGroupsWithoutEntries.length) / totalTransactionGroups * 100);
    
    console.log(`📈 成功率: ${successRate.toFixed(2)}%`);
    console.log(`📊 數據完整性: ${dataIntegrityScore.toFixed(2)}%`);
    
    if (successRate >= 95 && dataIntegrityScore >= 95) {
      console.log('\n🎉 遷移可行性評估: 優秀 - 可以安全執行遷移');
    } else if (successRate >= 90 && dataIntegrityScore >= 90) {
      console.log('\n⚠️  遷移可行性評估: 良好 - 建議修復問題後執行遷移');
    } else {
      console.log('\n❌ 遷移可行性評估: 風險較高 - 需要先解決數據問題');
    }
    
    // 6. 提供建議
    console.log('\n💡 建議:');
    if (orphanedEntries.length > 0) {
      console.log(`- 處理 ${orphanedEntries.length} 筆孤立分錄`);
    }
    if (transactionGroupsWithoutEntries.length > 0) {
      console.log(`- 檢查 ${transactionGroupsWithoutEntries.length} 個沒有分錄的交易群組`);
    }
    if (errorCount > 0) {
      console.log(`- 修復 ${errorCount} 個借貸不平衡問題`);
    }
    if (successRate >= 95 && dataIntegrityScore >= 95) {
      console.log('- 可以直接執行完整遷移腳本');
    }
    
  } catch (error) {
    console.error('❌ 測試過程中發生嚴重錯誤:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 資料庫連接已關閉');
  }
}

// 執行測試
if (require.main === module) {
  testMigrationDryRun()
    .then(() => {
      console.log('✅ 遷移測試完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 遷移測試失敗:', error);
      process.exit(1);
    });
}

module.exports = { testMigrationDryRun };