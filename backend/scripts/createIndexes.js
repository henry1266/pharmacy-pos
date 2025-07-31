/**
 * 資料庫索引創建腳本
 * 用於優化查詢性能
 */

const mongoose = require('mongoose');
const config = require('config');

// 連接資料庫
async function connectDB() {
  try {
    const db = config.get('mongoURI');
    await mongoose.connect(db);
    console.log('✅ MongoDB 連接成功');
  } catch (err) {
    console.error('❌ MongoDB 連接失敗:', err.message);
    process.exit(1);
  }
}

// 創建索引的函數
async function createIndexes() {
  try {
    const db = mongoose.connection.db;
    
    console.log('🔧 開始創建資料庫索引...\n');

    // 1. BaseProducts 集合索引
    console.log('📦 創建 BaseProducts 索引...');
    
    // 文字搜尋索引
    await db.collection('baseproducts').createIndex({
      name: 'text',
      code: 'text',
      shortCode: 'text',
      barcode: 'text',
      healthInsuranceCode: 'text'
    }, {
      name: 'text_search_index',
      weights: {
        name: 10,
        code: 8,
        shortCode: 6,
        barcode: 4,
        healthInsuranceCode: 2
      }
    });
    console.log('  ✅ 文字搜尋索引');

    // 複合索引
    await db.collection('baseproducts').createIndex({ isActive: 1, productType: 1 });
    console.log('  ✅ isActive + productType 複合索引');

    await db.collection('baseproducts').createIndex({ category: 1, isActive: 1 });
    console.log('  ✅ category + isActive 複合索引');

    await db.collection('baseproducts').createIndex({ supplier: 1, isActive: 1 });
    console.log('  ✅ supplier + isActive 複合索引');

    // 價格範圍索引
    await db.collection('baseproducts').createIndex({ sellingPrice: 1, isActive: 1 });
    console.log('  ✅ sellingPrice + isActive 複合索引');

    // 產品代碼唯一索引
    await db.collection('baseproducts').createIndex({ code: 1 }, { unique: true });
    console.log('  ✅ code 唯一索引');

    // 2. Sales 集合索引
    console.log('\n💰 創建 Sales 索引...');
    
    // 銷貨單號唯一索引
    await db.collection('sales').createIndex({ saleNumber: 1 }, { unique: true });
    console.log('  ✅ saleNumber 唯一索引');

    // 日期範圍查詢索引
    await db.collection('sales').createIndex({ createdAt: -1 });
    console.log('  ✅ createdAt 降序索引');

    // 客戶銷售記錄索引
    await db.collection('sales').createIndex({ customer: 1, createdAt: -1 });
    console.log('  ✅ customer + createdAt 複合索引');

    // 收銀員記錄索引
    await db.collection('sales').createIndex({ cashier: 1, createdAt: -1 });
    console.log('  ✅ cashier + createdAt 複合索引');

    // 付款狀態索引
    await db.collection('sales').createIndex({ paymentStatus: 1, createdAt: -1 });
    console.log('  ✅ paymentStatus + createdAt 複合索引');

    // 3. Inventories 集合索引
    console.log('\n📦 創建 Inventories 索引...');
    
    // 產品庫存查詢索引
    await db.collection('inventories').createIndex({ product: 1, type: 1 });
    console.log('  ✅ product + type 複合索引');

    // 銷售相關庫存索引
    await db.collection('inventories').createIndex({ saleId: 1, type: 1 });
    console.log('  ✅ saleId + type 複合索引');

    // 進貨相關庫存索引
    await db.collection('inventories').createIndex({ purchaseOrderId: 1, type: 1 });
    console.log('  ✅ purchaseOrderId + type 複合索引');

    // 日期範圍查詢索引
    await db.collection('inventories').createIndex({ lastUpdated: -1 });
    console.log('  ✅ lastUpdated 降序索引');

    // 4. Customers 集合索引
    console.log('\n👥 創建 Customers 索引...');
    
    // 客戶搜尋索引
    await db.collection('customers').createIndex({
      name: 'text',
      phone: 'text',
      email: 'text'
    }, { name: 'customer_search_index' });
    console.log('  ✅ 客戶搜尋文字索引');

    // 電話號碼索引
    await db.collection('customers').createIndex({ phone: 1 });
    console.log('  ✅ phone 索引');

    // 最後購買日期索引
    await db.collection('customers').createIndex({ lastPurchaseDate: -1 });
    console.log('  ✅ lastPurchaseDate 降序索引');

    // 5. ProductPackageUnits 集合索引
    console.log('\n📏 創建 ProductPackageUnits 索引...');
    
    // 產品包裝單位查詢索引
    await db.collection('productpackageunits').createIndex({ productId: 1, isActive: 1 });
    console.log('  ✅ productId + isActive 複合索引');

    // 有效期間索引
    await db.collection('productpackageunits').createIndex({ 
      productId: 1, 
      effectiveFrom: 1, 
      effectiveTo: 1 
    });
    console.log('  ✅ productId + 有效期間複合索引');

    // 6. PurchaseOrders 集合索引
    console.log('\n🛒 創建 PurchaseOrders 索引...');
    
    // 進貨單號唯一索引
    await db.collection('purchaseorders').createIndex({ poid: 1 }, { unique: true });
    console.log('  ✅ poid 唯一索引');

    // 供應商索引
    await db.collection('purchaseorders').createIndex({ posupplier: 1, createdAt: -1 });
    console.log('  ✅ posupplier + createdAt 複合索引');

    // 狀態索引
    await db.collection('purchaseorders').createIndex({ status: 1, createdAt: -1 });
    console.log('  ✅ status + createdAt 複合索引');

    // 7. Users 集合索引
    console.log('\n👤 創建 Users 索引...');
    
    // 用戶名唯一索引
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    console.log('  ✅ username 唯一索引');

    // 電子郵件唯一索引
    await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
    console.log('  ✅ email 唯一索引（稀疏）');

    // 角色索引
    await db.collection('users').createIndex({ role: 1 });
    console.log('  ✅ role 索引');

    // 8. Accounting 相關索引
    console.log('\n💼 創建 Accounting 索引...');
    
    // Account2 索引
    await db.collection('accounts2').createIndex({ organizationId: 1, code: 1 }, { unique: true });
    console.log('  ✅ Account2 organizationId + code 唯一索引');

    await db.collection('accounts2').createIndex({ organizationId: 1, accountType: 1, isActive: 1 });
    console.log('  ✅ Account2 organizationId + accountType + isActive 複合索引');

    // TransactionGroups 索引
    await db.collection('transactiongroupswithentries').createIndex({ 
      organizationId: 1, 
      transactionDate: -1 
    });
    console.log('  ✅ TransactionGroups organizationId + transactionDate 複合索引');

    console.log('\n🎉 所有索引創建完成！');
    
    // 顯示索引統計
    await showIndexStats();
    
  } catch (error) {
    console.error('❌ 創建索引時發生錯誤:', error);
    throw error;
  }
}

// 顯示索引統計
async function showIndexStats() {
  try {
    console.log('\n📊 索引統計資訊:');
    const db = mongoose.connection.db;
    
    const collections = [
      'baseproducts',
      'sales', 
      'inventories',
      'customers',
      'productpackageunits',
      'purchaseorders',
      'users',
      'accounts2',
      'transactiongroupswithentries'
    ];

    for (const collectionName of collections) {
      try {
        const indexes = await db.collection(collectionName).indexes();
        console.log(`  📁 ${collectionName}: ${indexes.length} 個索引`);
      } catch (err) {
        console.log(`  📁 ${collectionName}: 集合不存在或無法訪問`);
      }
    }
  } catch (error) {
    console.error('獲取索引統計時發生錯誤:', error);
  }
}

// 刪除所有自定義索引（謹慎使用）
async function dropCustomIndexes() {
  try {
    console.log('⚠️  開始刪除自定義索引...');
    const db = mongoose.connection.db;
    
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      const collectionName = collection.name;
      const indexes = await db.collection(collectionName).indexes();
      
      for (const index of indexes) {
        // 跳過 _id 索引（無法刪除）
        if (index.name !== '_id_') {
          try {
            await db.collection(collectionName).dropIndex(index.name);
            console.log(`  ✅ 已刪除 ${collectionName}.${index.name}`);
          } catch (err) {
            console.log(`  ⚠️  無法刪除 ${collectionName}.${index.name}: ${err.message}`);
          }
        }
      }
    }
    
    console.log('🎉 自定義索引刪除完成！');
  } catch (error) {
    console.error('❌ 刪除索引時發生錯誤:', error);
    throw error;
  }
}

// 主函數
async function main() {
  try {
    await connectDB();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--drop')) {
      await dropCustomIndexes();
    } else if (args.includes('--stats')) {
      await showIndexStats();
    } else {
      await createIndexes();
    }
    
  } catch (error) {
    console.error('❌ 執行失敗:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 資料庫連接已關閉');
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  main();
}

module.exports = {
  createIndexes,
  dropCustomIndexes,
  showIndexStats
};