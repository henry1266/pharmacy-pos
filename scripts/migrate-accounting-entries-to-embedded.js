const mongoose = require('mongoose');

// 連接資料庫
const MONGODB_URI = 'mongodb://192.168.68.79:27017/pharmacy-pos';

async function migrateAccountingEntries() {
  try {
    console.log('🔄 開始記帳系統合併遷移...');
    
    // 連接資料庫
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 資料庫連接成功');
    
    // 獲取原始 collections
    const transactionGroupsCollection = mongoose.connection.db.collection('transactionGroups');
    const accountingEntriesCollection = mongoose.connection.db.collection('accountingentries');
    
    // 1. 備份現有數據
    console.log('\n📦 步驟 1: 備份現有數據...');
    
    const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupTransactionGroups = `transactionGroups_backup_${backupTimestamp}`;
    const backupAccountingEntries = `accountingentries_backup_${backupTimestamp}`;
    
    // 創建備份 collections
    await transactionGroupsCollection.aggregate([
      { $match: {} },
      { $out: backupTransactionGroups }
    ]).toArray();
    
    await accountingEntriesCollection.aggregate([
      { $match: {} },
      { $out: backupAccountingEntries }
    ]).toArray();
    
    console.log(`✅ 備份完成: ${backupTransactionGroups}, ${backupAccountingEntries}`);
    
    // 2. 統計現有數據
    console.log('\n📊 步驟 2: 統計現有數據...');
    
    const totalTransactionGroups = await transactionGroupsCollection.countDocuments();
    const totalAccountingEntries = await accountingEntriesCollection.countDocuments();
    
    console.log(`📋 交易群組總數: ${totalTransactionGroups}`);
    console.log(`📋 分錄總數: ${totalAccountingEntries}`);
    
    // 3. 檢查數據完整性
    console.log('\n🔍 步驟 3: 檢查數據完整性...');
    
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
      console.log(`⚠️  發現 ${orphanedEntries.length} 筆孤立分錄，將跳過這些分錄`);
      orphanedEntries.forEach(entry => {
        console.log(`   - 分錄 ID: ${entry._id}, 交易群組 ID: ${entry.transactionGroupId}`);
      });
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
      transactionGroupsWithoutEntries.forEach(group => {
        console.log(`   - 交易群組: ${group.groupNumber} (${group.description})`);
      });
    }
    
    // 4. 執行遷移
    console.log('\n🔄 步驟 4: 執行數據遷移...');
    
    let migratedCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // 分批處理交易群組
    const batchSize = 100;
    let skip = 0;
    
    while (true) {
      const transactionGroups = await transactionGroupsCollection
        .find({})
        .skip(skip)
        .limit(batchSize)
        .toArray();
      
      if (transactionGroups.length === 0) {
        break;
      }
      
      console.log(`📦 處理第 ${skip + 1} - ${skip + transactionGroups.length} 個交易群組...`);
      
      for (const group of transactionGroups) {
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
          
          // 更新交易群組，添加內嵌分錄
          const updateResult = await transactionGroupsCollection.updateOne(
            { _id: group._id },
            {
              $set: {
                entries: embeddedEntries,
                totalAmount: Math.max(totalDebit, totalCredit),
                updatedAt: new Date()
              }
            }
          );
          
          if (updateResult.modifiedCount === 1) {
            migratedCount++;
            if (migratedCount % 10 === 0) {
              console.log(`✅ 已遷移 ${migratedCount} 個交易群組...`);
            }
          } else {
            const error = `更新失敗: ${group.groupNumber}`;
            console.log(`❌ ${error}`);
            errors.push(error);
            errorCount++;
          }
          
        } catch (error) {
          const errorMsg = `處理交易群組 ${group.groupNumber} 時發生錯誤: ${error.message}`;
          console.log(`❌ ${errorMsg}`);
          errors.push(errorMsg);
          errorCount++;
        }
      }
      
      skip += batchSize;
    }
    
    // 5. 驗證遷移結果
    console.log('\n🔍 步驟 5: 驗證遷移結果...');
    
    const migratedTransactionGroups = await transactionGroupsCollection.countDocuments({
      entries: { $exists: true, $ne: [] }
    });
    
    console.log(`✅ 成功遷移: ${migratedCount} 個交易群組`);
    console.log(`❌ 遷移失敗: ${errorCount} 個交易群組`);
    console.log(`📊 驗證結果: ${migratedTransactionGroups} 個交易群組包含內嵌分錄`);
    
    // 6. 檢查遷移後的數據完整性
    console.log('\n🔍 步驟 6: 檢查遷移後數據完整性...');
    
    // 隨機抽樣檢查
    const sampleGroups = await transactionGroupsCollection.aggregate([
      { $match: { entries: { $exists: true, $ne: [] } } },
      { $sample: { size: 5 } }
    ]).toArray();
    
    console.log('📋 隨機抽樣檢查:');
    for (const group of sampleGroups) {
      const totalDebit = group.entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
      const totalCredit = group.entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
      const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
      
      console.log(`  - ${group.groupNumber}: ${group.entries.length} 筆分錄, 借貸平衡: ${isBalanced ? '✅' : '❌'}`);
    }
    
    // 7. 生成遷移報告
    console.log('\n📋 步驟 7: 生成遷移報告...');
    
    const report = {
      timestamp: new Date().toISOString(),
      originalData: {
        transactionGroups: totalTransactionGroups,
        accountingEntries: totalAccountingEntries
      },
      migration: {
        successful: migratedCount,
        failed: errorCount,
        orphanedEntries: orphanedEntries.length,
        groupsWithoutEntries: transactionGroupsWithoutEntries.length
      },
      verification: {
        groupsWithEmbeddedEntries: migratedTransactionGroups
      },
      backup: {
        transactionGroups: backupTransactionGroups,
        accountingEntries: backupAccountingEntries
      },
      errors: errors
    };
    
    // 保存報告到資料庫
    await mongoose.connection.db.collection('migrationReports').insertOne({
      type: 'accounting-entries-to-embedded',
      ...report
    });
    
    console.log('\n📊 遷移報告:');
    console.log(JSON.stringify(report, null, 2));
    
    if (errorCount === 0) {
      console.log('\n🎉 遷移完成！所有數據已成功合併。');
      console.log('\n⚠️  下一步建議:');
      console.log('1. 在測試環境驗證所有功能正常');
      console.log('2. 確認前端應用程式正常運作');
      console.log('3. 考慮移除舊的 accountingentries collection');
    } else {
      console.log('\n⚠️  遷移完成，但有部分錯誤。請檢查錯誤日誌並手動處理失敗的項目。');
    }
    
  } catch (error) {
    console.error('❌ 遷移過程中發生嚴重錯誤:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 資料庫連接已關閉');
  }
}

// 執行遷移
if (require.main === module) {
  migrateAccountingEntries()
    .then(() => {
      console.log('✅ 遷移腳本執行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 遷移腳本執行失敗:', error);
      process.exit(1);
    });
}

module.exports = { migrateAccountingEntries };