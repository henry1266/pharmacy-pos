/**
 * 資金來源追蹤功能資料庫遷移腳本
 * 為現有的 TransactionGroup 和 AccountingEntry 添加新的資金追蹤欄位
 */

const mongoose = require('mongoose');
const TransactionGroup = require('../models/TransactionGroup');
const AccountingEntry = require('../models/AccountingEntry');

// 資料庫連接配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://192.168.68.79:27017/pharmacy-pos';

async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ 資料庫連接成功');
  } catch (error) {
    console.error('❌ 資料庫連接失敗:', error);
    process.exit(1);
  }
}

async function migrateTransactionGroups() {
  console.log('\n🔄 開始遷移 TransactionGroup 資料...');
  
  try {
    // 查找所有沒有資金追蹤欄位的交易群組
    const transactionGroups = await TransactionGroup.find({
      $or: [
        { linkedTransactionIds: { $exists: false } },
        { fundingType: { $exists: false } }
      ]
    });

    console.log(`📊 找到 ${transactionGroups.length} 個需要遷移的交易群組`);

    let migratedCount = 0;
    
    for (const group of transactionGroups) {
      const updateData = {};
      
      // 添加 linkedTransactionIds 欄位（預設為空陣列）
      if (!group.linkedTransactionIds) {
        updateData.linkedTransactionIds = [];
      }
      
      // 添加 fundingType 欄位（預設為 'original'）
      if (!group.fundingType) {
        updateData.fundingType = 'original';
      }
      
      // 如果有需要更新的欄位，執行更新
      if (Object.keys(updateData).length > 0) {
        await TransactionGroup.findByIdAndUpdate(group._id, updateData);
        migratedCount++;
        
        if (migratedCount % 100 === 0) {
          console.log(`⏳ 已遷移 ${migratedCount} 個交易群組...`);
        }
      }
    }
    
    console.log(`✅ TransactionGroup 遷移完成，共遷移 ${migratedCount} 筆資料`);
  } catch (error) {
    console.error('❌ TransactionGroup 遷移失敗:', error);
    throw error;
  }
}

async function migrateAccountingEntries() {
  console.log('\n🔄 開始遷移 AccountingEntry 資料...');
  
  try {
    // 查找所有沒有資金追蹤欄位的記帳分錄
    const accountingEntries = await AccountingEntry.find({
      $or: [
        { fundingPath: { $exists: false } }
      ]
    });

    console.log(`📊 找到 ${accountingEntries.length} 個需要遷移的記帳分錄`);

    let migratedCount = 0;
    
    for (const entry of accountingEntries) {
      const updateData = {};
      
      // 添加 fundingPath 欄位（預設為空陣列）
      if (!entry.fundingPath) {
        updateData.fundingPath = [];
      }
      
      // 如果有需要更新的欄位，執行更新
      if (Object.keys(updateData).length > 0) {
        await AccountingEntry.findByIdAndUpdate(entry._id, updateData);
        migratedCount++;
        
        if (migratedCount % 100 === 0) {
          console.log(`⏳ 已遷移 ${migratedCount} 個記帳分錄...`);
        }
      }
    }
    
    console.log(`✅ AccountingEntry 遷移完成，共遷移 ${migratedCount} 筆資料`);
  } catch (error) {
    console.error('❌ AccountingEntry 遷移失敗:', error);
    throw error;
  }
}

async function createIndexes() {
  console.log('\n🔄 建立資金追蹤相關索引...');
  
  try {
    // TransactionGroup 索引
    await TransactionGroup.collection.createIndex({ linkedTransactionIds: 1 });
    await TransactionGroup.collection.createIndex({ sourceTransactionId: 1 });
    await TransactionGroup.collection.createIndex({ fundingType: 1, transactionDate: -1 });
    await TransactionGroup.collection.createIndex({ sourceTransactionId: 1, fundingType: 1 });
    
    console.log('✅ TransactionGroup 索引建立完成');
    
    // AccountingEntry 索引
    await AccountingEntry.collection.createIndex({ sourceTransactionId: 1 });
    await AccountingEntry.collection.createIndex({ sourceTransactionId: 1, accountId: 1 });
    await AccountingEntry.collection.createIndex({ fundingPath: 1 });
    
    console.log('✅ AccountingEntry 索引建立完成');
  } catch (error) {
    console.error('❌ 索引建立失敗:', error);
    throw error;
  }
}

async function validateMigration() {
  console.log('\n🔍 驗證遷移結果...');
  
  try {
    // 檢查 TransactionGroup
    const totalTransactionGroups = await TransactionGroup.countDocuments();
    const migratedTransactionGroups = await TransactionGroup.countDocuments({
      linkedTransactionIds: { $exists: true },
      fundingType: { $exists: true }
    });
    
    console.log(`📊 TransactionGroup 總數: ${totalTransactionGroups}`);
    console.log(`📊 已遷移的 TransactionGroup: ${migratedTransactionGroups}`);
    
    if (totalTransactionGroups === migratedTransactionGroups) {
      console.log('✅ TransactionGroup 遷移驗證通過');
    } else {
      console.log('⚠️ TransactionGroup 遷移可能不完整');
    }
    
    // 檢查 AccountingEntry
    const totalAccountingEntries = await AccountingEntry.countDocuments();
    const migratedAccountingEntries = await AccountingEntry.countDocuments({
      fundingPath: { $exists: true }
    });
    
    console.log(`📊 AccountingEntry 總數: ${totalAccountingEntries}`);
    console.log(`📊 已遷移的 AccountingEntry: ${migratedAccountingEntries}`);
    
    if (totalAccountingEntries === migratedAccountingEntries) {
      console.log('✅ AccountingEntry 遷移驗證通過');
    } else {
      console.log('⚠️ AccountingEntry 遷移可能不完整');
    }
    
    // 顯示範例資料
    const sampleTransactionGroup = await TransactionGroup.findOne({}).lean();
    if (sampleTransactionGroup) {
      console.log('\n📋 TransactionGroup 範例資料:');
      console.log(`   - linkedTransactionIds: ${JSON.stringify(sampleTransactionGroup.linkedTransactionIds)}`);
      console.log(`   - fundingType: ${sampleTransactionGroup.fundingType}`);
      console.log(`   - sourceTransactionId: ${sampleTransactionGroup.sourceTransactionId || 'null'}`);
    }
    
    const sampleAccountingEntry = await AccountingEntry.findOne({}).lean();
    if (sampleAccountingEntry) {
      console.log('\n📋 AccountingEntry 範例資料:');
      console.log(`   - fundingPath: ${JSON.stringify(sampleAccountingEntry.fundingPath)}`);
      console.log(`   - sourceTransactionId: ${sampleAccountingEntry.sourceTransactionId || 'null'}`);
    }
    
  } catch (error) {
    console.error('❌ 遷移驗證失敗:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 開始資金來源追蹤功能資料庫遷移');
  console.log('=' .repeat(50));
  
  try {
    // 連接資料庫
    await connectDatabase();
    
    // 執行遷移
    await migrateTransactionGroups();
    await migrateAccountingEntries();
    
    // 建立索引
    await createIndexes();
    
    // 驗證遷移結果
    await validateMigration();
    
    console.log('\n🎉 資金來源追蹤功能遷移完成！');
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('\n💥 遷移過程中發生錯誤:', error);
    process.exit(1);
  } finally {
    // 關閉資料庫連接
    await mongoose.connection.close();
    console.log('📴 資料庫連接已關閉');
  }
}

// 執行遷移
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  migrateTransactionGroups,
  migrateAccountingEntries,
  createIndexes,
  validateMigration
};