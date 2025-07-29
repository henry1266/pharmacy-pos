import mongoose from 'mongoose';
import * as path from 'path';

// 載入環境變數 - 簡化版本
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// 導入模型
import BaseProduct from '../backend/models/BaseProduct';
import ProductNote from '../backend/models/ProductNote';

// 連接資料庫
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://192.168.68.79:27017/pharmacy-pos';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB 連接成功');
  } catch (error) {
    console.error('❌ MongoDB 連接失敗:', error);
    process.exit(1);
  }
};

// 遷移統計
interface MigrationStats {
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{
    productId: string;
    productName: string;
    error: string;
  }>;
}

/**
 * 遷移產品描述到獨立集合
 */
async function migrateProductDescriptions(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
    errorDetails: []
  };

  try {
    console.log('🚀 開始遷移產品描述...');

    // 查找所有有描述的產品
    const products = await BaseProduct.find({
      description: { $exists: true, $ne: '', $nin: [null, ''] },
      isActive: { $ne: false }
    }).select('_id name code description');

    stats.total = products.length;
    console.log(`📊 找到 ${stats.total} 個需要遷移的產品`);

    if (stats.total === 0) {
      console.log('✅ 沒有需要遷移的產品描述');
      return stats;
    }

    // 批次處理
    const batchSize = 50;
    const batches = Math.ceil(products.length / batchSize);

    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, products.length);
      const batch = products.slice(start, end);

      console.log(`📦 處理批次 ${i + 1}/${batches} (${start + 1}-${end})`);

      // 並行處理批次內的產品
      const batchPromises = batch.map(async (product) => {
        try {
          // 檢查是否已經存在筆記
          const existingNote = await ProductNote.findOne({
            productId: product._id,
            isActive: true
          });

          if (existingNote) {
            console.log(`⏭️  產品 ${product.name} (${product.code}) 的筆記已存在，跳過`);
            stats.skipped++;
            return;
          }

          // 創建新的產品筆記
          const productNote = new ProductNote({
            productId: product._id,
            content: product.description || '',
            contentType: 'markdown',
            lastEditedBy: 'migration-script',
            metadata: {
              category: 'migrated-from-product'
            },
            isActive: true
          });

          await productNote.save();
          
          console.log(`✅ 成功遷移產品 ${product.name} (${product.code})`);
          stats.migrated++;

        } catch (error) {
          console.error(`❌ 遷移產品 ${product.name} (${product.code}) 失敗:`, error);
          stats.errors++;
          stats.errorDetails.push({
            productId: String(product._id),
            productName: product.name,
            error: error instanceof Error ? error.message : '未知錯誤'
          });
        }
      });

      // 等待批次完成
      await Promise.all(batchPromises);

      // 顯示進度
      const processed = Math.min(end, products.length);
      const progress = ((processed / products.length) * 100).toFixed(1);
      console.log(`📈 進度: ${processed}/${products.length} (${progress}%)`);
    }

    console.log('\n🎉 遷移完成！');
    return stats;

  } catch (error) {
    console.error('❌ 遷移過程中發生錯誤:', error);
    throw error;
  }
}

/**
 * 驗證遷移結果
 */
async function validateMigration(): Promise<void> {
  console.log('\n🔍 驗證遷移結果...');

  try {
    // 統計原始產品描述數量
    const productsWithDescription = await BaseProduct.countDocuments({
      description: { $exists: true, $ne: '', $nin: [null, ''] },
      isActive: { $ne: false }
    });

    // 統計遷移後的筆記數量
    const migratedNotes = await ProductNote.countDocuments({
      isActive: true
    });

    console.log(`📊 原始產品描述數量: ${productsWithDescription}`);
    console.log(`📊 遷移後筆記數量: ${migratedNotes}`);

    // 檢查是否有遺漏
    const unmigrated = await BaseProduct.find({
      description: { $exists: true, $ne: '', $nin: [null, ''] },
      isActive: { $ne: false }
    }).select('_id name code');

    const unmigratedIds = unmigrated.map(p => p._id);
    const notesForUnmigrated = await ProductNote.find({
      productId: { $in: unmigratedIds },
      isActive: true
    }).select('productId');

    const migratedProductIds = new Set(notesForUnmigrated.map(n => n.productId.toString()));
    const actuallyUnmigrated = unmigrated.filter(p => !migratedProductIds.has(String(p._id)));

    if (actuallyUnmigrated.length > 0) {
      console.log(`⚠️  發現 ${actuallyUnmigrated.length} 個未遷移的產品:`);
      actuallyUnmigrated.forEach(p => {
        console.log(`   - ${p.name} (${p.code})`);
      });
    } else {
      console.log('✅ 所有產品描述都已成功遷移');
    }

    // 檢查資料完整性
    const sampleNote = await ProductNote.findOne({ isActive: true }).populate('product', 'name code');
    if (sampleNote) {
      console.log(`✅ 資料關聯正常，範例: ${(sampleNote as any).product?.name || '未知產品'}`);
    }

  } catch (error) {
    console.error('❌ 驗證過程中發生錯誤:', error);
  }
}

/**
 * 清理選項 - 移除已遷移的產品描述欄位（可選）
 */
async function cleanupOriginalDescriptions(confirm: boolean = false): Promise<void> {
  if (!confirm) {
    console.log('\n⚠️  清理功能未啟用。如需清理原始描述欄位，請設置 confirm 參數為 true');
    return;
  }

  console.log('\n🧹 開始清理原始產品描述欄位...');

  try {
    // 只清理已成功遷移的產品
    const migratedNotes = await ProductNote.find({ isActive: true }).select('productId');
    const migratedProductIds = migratedNotes.map(n => n.productId);

    const result = await BaseProduct.updateMany(
      { _id: { $in: migratedProductIds } },
      { $unset: { description: 1 } }
    );

    console.log(`✅ 已清理 ${result.modifiedCount} 個產品的原始描述欄位`);

  } catch (error) {
    console.error('❌ 清理過程中發生錯誤:', error);
  }
}

/**
 * 主執行函數
 */
async function main() {
  try {
    await connectDB();

    // 執行遷移
    const stats = await migrateProductDescriptions();

    // 顯示統計結果
    console.log('\n📈 遷移統計:');
    console.log(`   總計: ${stats.total}`);
    console.log(`   成功: ${stats.migrated}`);
    console.log(`   跳過: ${stats.skipped}`);
    console.log(`   錯誤: ${stats.errors}`);

    if (stats.errorDetails.length > 0) {
      console.log('\n❌ 錯誤詳情:');
      stats.errorDetails.forEach(error => {
        console.log(`   - ${error.productName}: ${error.error}`);
      });
    }

    // 驗證遷移結果
    await validateMigration();

    // 可選：清理原始描述欄位
    // await cleanupOriginalDescriptions(false); // 設為 true 以啟用清理

    console.log('\n🎉 遷移腳本執行完成！');

  } catch (error) {
    console.error('❌ 腳本執行失敗:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 資料庫連接已關閉');
  }
}

// 執行腳本
if (require.main === module) {
  main();
}

export { migrateProductDescriptions, validateMigration, cleanupOriginalDescriptions };