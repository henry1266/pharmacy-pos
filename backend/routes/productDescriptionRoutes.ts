import express, { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import BaseProduct from '../models/BaseProduct';
import ProductNote from '../models/ProductNote';

const router: Router = express.Router();

// 產品描述版本歷史模型
const DescriptionVersionSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'baseproduct',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  version: {
    type: Number,
    required: true
  },
  autoSaved: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const DescriptionVersion = mongoose.model('DescriptionVersion', DescriptionVersionSchema);

// 獲取產品描述（從新的 ProductNote 集合）
router.get('/:productId/description', async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    // 驗證產品ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({
        success: false,
        message: '無效的產品ID'
      });
      return;
    }

    // 查找產品筆記
    const productNote = await ProductNote.findOne({ productId, isActive: true });
    
    if (!productNote) {
      // 如果沒有筆記，返回空內容
      res.json({
        success: true,
        message: '產品描述獲取成功',
        data: {
          summary: '',
          description: '',
          wordCount: 0,
          summaryWordCount: 0,
          lastEditedBy: null,
          updatedAt: null
        }
      });
      return;
    }

    res.json({
      success: true,
      message: '產品描述獲取成功',
      data: {
        summary: productNote.summary || '',
        description: productNote.content,
        wordCount: productNote.wordCount,
        summaryWordCount: productNote.summaryWordCount || 0,
        lastEditedBy: productNote.lastEditedBy,
        updatedAt: productNote.updatedAt,
        tags: productNote.tags,
        metadata: productNote.metadata
      }
    });

  } catch (error) {
    console.error('獲取產品描述失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

// 更新產品描述
router.patch('/:productId/description', async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { summary, description, isAutoSave = false } = req.body;

    // 驗證產品ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({
        success: false,
        message: '無效的產品ID'
      });
      return;
    }

    // 查找產品
    const product = await BaseProduct.findById(productId);
    if (!product) {
      res.status(404).json({
        success: false,
        message: '產品不存在'
      });
      return;
    }

    // 查找或創建產品筆記
    let productNote = await ProductNote.findOne({ productId, isActive: true });
    
    // 檢查內容是否有變更
    if (productNote &&
        productNote.content === (description || '') &&
        productNote.summary === (summary || '')) {
      res.json({
        success: true,
        message: '內容無變更',
        data: {
          summary: productNote.summary,
          description: productNote.content
        }
      });
      return;
    }

    // 獲取當前版本號
    const lastVersion = await DescriptionVersion
      .findOne({ productId })
      .sort({ version: -1 });
    
    const nextVersion = lastVersion ? lastVersion.version + 1 : 1;

    // 創建版本記錄
    const versionRecord = new DescriptionVersion({
      productId,
      content: description,
      version: nextVersion,
      autoSaved: isAutoSave
    });

    // 創建或更新產品筆記
    if (!productNote) {
      productNote = new ProductNote({
        productId,
        summary: summary || '',
        content: description || '',
        contentType: 'markdown',
        lastEditedBy: 'system'
      });
    } else {
      if (summary !== undefined) productNote.summary = summary;
      if (description !== undefined) productNote.content = description;
      productNote.lastEditedBy = 'system';
    }
    
    // 保存筆記和版本記錄
    await Promise.all([
      productNote.save(),
      versionRecord.save()
    ]);

    // 清理舊版本（保留最近20個版本）
    const versionsToDelete = await DescriptionVersion
      .find({ productId })
      .sort({ version: -1 })
      .skip(20);
    
    if (versionsToDelete.length > 0) {
      const idsToDelete = versionsToDelete.map(v => v._id);
      await DescriptionVersion.deleteMany({ _id: { $in: idsToDelete } });
    }

    res.json({
      success: true,
      message: isAutoSave ? '自動儲存成功' : '儲存成功',
      data: {
        summary: productNote.summary,
        description: productNote.content,
        version: nextVersion,
        timestamp: versionRecord.createdAt
      }
    });

  } catch (error) {
    console.error('更新產品描述失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

// 獲取產品描述版本歷史
router.get('/:productId/description-versions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { limit = 20, page = 1 } = req.query;

    // 驗證產品ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      res.status(400).json({
        success: false,
        message: '無效的產品ID'
      });
      return;
    }

    // 查詢版本歷史
    const versions = await DescriptionVersion
      .find({ productId })
      .sort({ version: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .select('content version autoSaved createdAt');

    // 格式化回應
    const formattedVersions = versions.map(version => ({
      id: version._id.toString(),
      content: version.content,
      version: version.version,
      autoSaved: version.autoSaved,
      timestamp: version.createdAt
    }));

    res.json({
      success: true,
      data: formattedVersions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: await DescriptionVersion.countDocuments({ productId })
      }
    });

  } catch (error) {
    console.error('獲取版本歷史失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

// 還原到指定版本
router.post('/:productId/description-versions/:versionId/restore', async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, versionId } = req.params;

    // 驗證ID
    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(versionId)) {
      res.status(400).json({
        success: false,
        message: '無效的ID'
      });
      return;
    }

    // 查找版本記錄
    const version = await DescriptionVersion.findOne({
      _id: versionId,
      productId
    });

    if (!version) {
      res.status(404).json({
        success: false,
        message: '版本記錄不存在'
      });
      return;
    }

    // 查找產品
    const product = await BaseProduct.findById(productId);
    if (!product) {
      res.status(404).json({
        success: false,
        message: '產品不存在'
      });
      return;
    }

    // 創建還原版本記錄
    const lastVersion = await DescriptionVersion
      .findOne({ productId })
      .sort({ version: -1 });
    
    const nextVersion = lastVersion ? lastVersion.version + 1 : 1;

    const restoreRecord = new DescriptionVersion({
      productId,
      content: version.content,
      version: nextVersion,
      autoSaved: false
    });

    // 更新產品描述
    product.description = version.content;

    // 保存
    await Promise.all([
      product.save(),
      restoreRecord.save()
    ]);

    res.json({
      success: true,
      message: `已還原到版本 ${version.version}`,
      data: {
        description: version.content,
        restoredFromVersion: version.version,
        newVersion: nextVersion
      }
    });

  } catch (error) {
    console.error('還原版本失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

export default router;