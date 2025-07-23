/**
 * 修復 ProductPackageUnit 集合的索引
 * 移除包含 priority 欄位的舊索引，確保新索引正確
 */

const mongoose = require('mongoose');
const config = require('../config/default.json');

async function fixPackageUnitIndexes() {
  try {
    // 連接到 MongoDB
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('已連接到 MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('productpackageunits');

    // 獲取現有索引
    const existingIndexes = await collection.indexes();
    console.log('現有索引:', existingIndexes.map(idx => idx.name));

    // 刪除包含 priority 的舊索引
    const indexesToDrop = existingIndexes.filter(idx => 
      idx.name && idx.name.includes('priority')
    );

    for (const index of indexesToDrop) {
      try {
        await collection.dropIndex(index.name);
        console.log(`已刪除索引: ${index.name}`);
      } catch (error) {
        console.log(`刪除索引 ${index.name} 失敗:`, error.message);
      }
    }

    // 確保正確的索引存在
    const requiredIndexes = [
      {
        key: { productId: 1, unitName: 1, effectiveFrom: 1 },
        options: { 
          unique: true,
          name: 'productId_unitName_effectiveFrom_unique'
        }
      },
      {
        key: { productId: 1, unitValue: 1, effectiveFrom: 1 },
        options: {
          unique: true,
          name: 'productId_unitValue_effectiveFrom_unique'
        }
      },
      {
        key: { productId: 1, isBaseUnit: 1, effectiveFrom: 1 },
        options: {
          unique: true,
          partialFilterExpression: { isBaseUnit: true },
          name: 'productId_baseUnit_effectiveFrom_unique'
        }
      },
      {
        key: { productId: 1, isActive: 1 },
        options: { name: 'productId_isActive' }
      },
      {
        key: { productId: 1, effectiveFrom: 1, effectiveTo: 1 },
        options: { name: 'productId_effectiveFrom_effectiveTo' }
      }
    ];

    for (const indexDef of requiredIndexes) {
      try {
        await collection.createIndex(indexDef.key, indexDef.options);
        console.log(`已創建索引: ${indexDef.options.name}`);
      } catch (error) {
        if (error.code === 85) {
          console.log(`索引 ${indexDef.options.name} 已存在`);
        } else {
          console.log(`創建索引 ${indexDef.options.name} 失敗:`, error.message);
        }
      }
    }

    // 獲取修復後的索引
    const finalIndexes = await collection.indexes();
    console.log('修復後的索引:', finalIndexes.map(idx => idx.name));

    console.log('索引修復完成');

  } catch (error) {
    console.error('修復索引時發生錯誤:', error);
  } finally {
    await mongoose.disconnect();
    console.log('已斷開 MongoDB 連接');
  }
}

// 執行修復
fixPackageUnitIndexes();