import express, { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import BaseProduct from '../../models/BaseProduct';
import ProductNote from '../../models/ProductNote';

const router: Router = express.Router();


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
    
    // 保存筆記
    await productNote.save();

    res.json({
      success: true,
      message: isAutoSave ? '自動儲存成功' : '儲存成功',
      data: {
        summary: productNote.summary,
        description: productNote.content
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



export default router;