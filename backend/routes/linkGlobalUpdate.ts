import express, { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import ProductNote from '../models/ProductNote';
import LinkReference from '../models/LinkReference';

const router: Router = express.Router();

// 全域更新連結
router.post('/global-update/:linkId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { linkId } = req.params;
    const { oldDisplayText, newDisplayText, oldUrl, newUrl } = req.body;

    // 驗證連結ID
    if (!mongoose.Types.ObjectId.isValid(linkId)) {
      res.status(400).json({
        success: false,
        message: '無效的連結ID'
      });
      return;
    }

    // 驗證必填欄位
    if (!oldDisplayText || !newDisplayText || !oldUrl || !newUrl) {
      res.status(400).json({
        success: false,
        message: '缺少必要的更新資訊'
      });
      return;
    }

    // 建立舊連結和新連結的引用格式
    const oldLinkReference = `{{linkRef:${oldDisplayText}}}`;
    const newLinkReference = `{{linkRef:${newDisplayText}}}`;

    // 搜尋所有包含該連結引用的產品筆記
    const productNotes = await ProductNote.find({
      isActive: true,
      $or: [
        { summary: { $regex: escapeRegExp(oldLinkReference) } },
        { content: { $regex: escapeRegExp(oldLinkReference) } }
      ]
    });

    let updatedCount = 0;
    const updatePromises = [];

    // 批次更新所有包含該連結的筆記
    for (const note of productNotes) {
      let hasChanges = false;
      let newSummary = note.summary;
      let newContent = note.content;

      // 替換摘要中的連結引用
      if (note.summary && note.summary.includes(oldLinkReference)) {
        newSummary = note.summary.replace(new RegExp(escapeRegExp(oldLinkReference), 'g'), newLinkReference);
        hasChanges = true;
      }

      // 替換內容中的連結引用
      if (note.content && note.content.includes(oldLinkReference)) {
        newContent = note.content.replace(new RegExp(escapeRegExp(oldLinkReference), 'g'), newLinkReference);
        hasChanges = true;
      }

      // 如果有變更，更新筆記
      if (hasChanges) {
        const updatePromise = ProductNote.findByIdAndUpdate(
          note._id,
          {
            summary: newSummary,
            content: newContent,
            updatedAt: new Date()
          },
          { new: true }
        );
        updatePromises.push(updatePromise);
        updatedCount++;
      }
    }

    // 執行所有更新
    await Promise.all(updatePromises);

    // 更新連結參考本身
    await LinkReference.findByIdAndUpdate(linkId, {
      displayText: newDisplayText,
      url: newUrl,
      keyword: newDisplayText, // 使用 displayText 作為 keyword
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: `成功更新 ${updatedCount} 個產品筆記中的連結`,
      data: {
        updatedNotesCount: updatedCount,
        oldLink: oldLinkReference,
        newLink: newLinkReference
      }
    });

  } catch (error) {
    console.error('全域更新連結失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

// 搜尋使用特定連結的筆記
router.get('/search-usage/:linkId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { linkId } = req.params;

    // 驗證連結ID
    if (!mongoose.Types.ObjectId.isValid(linkId)) {
      res.status(400).json({
        success: false,
        message: '無效的連結ID'
      });
      return;
    }

    // 獲取連結資訊
    const link = await LinkReference.findById(linkId);
    if (!link) {
      res.status(404).json({
        success: false,
        message: '找不到該連結'
      });
      return;
    }

    const linkReference = `{{linkRef:${link.displayText}}}`;

    // 搜尋使用該連結引用的產品筆記
    const productNotes = await ProductNote.find({
      isActive: true,
      $or: [
        { summary: { $regex: escapeRegExp(linkReference) } },
        { content: { $regex: escapeRegExp(linkReference) } }
      ]
    }).populate('product', 'name code shortCode');

    // 統計使用情況
    const usageStats = productNotes.map(note => {
      const populatedNote = note as any; // 處理 populate 的類型問題
      return {
        noteId: note._id,
        productId: note.productId,
        productName: populatedNote.product?.name || '未知產品',
        productCode: populatedNote.product?.code || '',
        summaryUsage: (note.summary || '').split(linkReference).length - 1,
        contentUsage: (note.content || '').split(linkReference).length - 1,
        totalUsage: ((note.summary || '').split(linkReference).length - 1) +
                    ((note.content || '').split(linkReference).length - 1)
      };
    }).filter(stat => stat.totalUsage > 0);

    res.json({
      success: true,
      message: '連結使用情況查詢成功',
      data: {
        link: {
          id: link._id,
          displayText: link.displayText,
          url: link.url,
          linkReference
        },
        usage: usageStats,
        totalNotes: usageStats.length,
        totalUsages: usageStats.reduce((sum, stat) => sum + stat.totalUsage, 0)
      }
    });

  } catch (error) {
    console.error('查詢連結使用情況失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

// 輔助函數：轉義正則表達式特殊字符
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default router;