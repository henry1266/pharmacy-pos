import express, { Request, Response, Router } from 'express';
import mongoose from 'mongoose';
import LinkReference from '../models/LinkReference';

const router: Router = express.Router();

// 獲取所有超連結（支援搜尋和分頁）
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search = '',
      sortBy = 'relevance',
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // 使用模型的靜態方法進行搜尋
    const links = await LinkReference.searchLinks(search as string, {
      sortBy: sortBy as string,
      limit: limitNum,
      skip
    });

    // 獲取總數（用於分頁）
    let searchQuery: any = { isActive: true };
    if (search && (search as string).trim()) {
      searchQuery.$text = { $search: (search as string).trim() };
    }

    const total = await LinkReference.countDocuments(searchQuery);

    res.json({
      success: true,
      message: '超連結獲取成功',
      data: {
        links,
        pagination: {
          current: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    console.error('獲取超連結失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});


// 獲取熱門超連結
router.get('/popular', async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const popularLinks = await LinkReference.getPopularLinks(limitNum);
    
    res.json({
      success: true,
      message: '熱門超連結獲取成功',
      data: popularLinks
    });

  } catch (error) {
    console.error('獲取熱門超連結失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

// 根據關鍵字獲取超連結
router.get('/keyword/:keyword', async (req: Request, res: Response): Promise<void> => {
  try {
    const { keyword } = req.params;

    const link = await LinkReference.findByKeyword(keyword);
    
    if (!link) {
      res.status(404).json({
        success: false,
        message: '找不到該關鍵字的超連結'
      });
      return;
    }

    res.json({
      success: true,
      message: '超連結獲取成功',
      data: link
    });

  } catch (error) {
    console.error('根據關鍵字獲取超連結失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

// 創建新的超連結
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      keyword,
      displayText,
      url
    } = req.body;

    // 驗證必填欄位
    if (!keyword || !displayText || !url) {
      res.status(400).json({
        success: false,
        message: '關鍵字、顯示文字和 URL 為必填欄位'
      });
      return;
    }

    // 檢查關鍵字是否已存在
    const existingLink = await LinkReference.findOne({ 
      keyword: keyword.trim(), 
      isActive: true 
    });

    if (existingLink) {
      res.status(409).json({
        success: false,
        message: '該關鍵字已存在'
      });
      return;
    }

    // 創建新的超連結
    const newLink = new LinkReference({
      keyword: keyword.trim(),
      displayText: displayText.trim(),
      url: url.trim(),
      category: '一般', // 設定預設分類
      createdBy: 'system' // 可以從認證中獲取使用者ID
    });

    await newLink.save();

    res.status(201).json({
      success: true,
      message: '超連結創建成功',
      data: newLink
    });

  } catch (error) {
    console.error('創建超連結失敗:', error);
    
    // 處理驗證錯誤
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        success: false,
        message: '資料驗證失敗',
        error: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

// 更新超連結
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      keyword,
      displayText,
      url
    } = req.body;

    // 驗證ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: '無效的超連結ID'
      });
      return;
    }

    // 查找超連結
    const link = await LinkReference.findById(id);
    if (!link) {
      res.status(404).json({
        success: false,
        message: '找不到該超連結'
      });
      return;
    }

    // 如果更新關鍵字，檢查是否與其他記錄衝突
    if (keyword && keyword.trim() !== link.keyword) {
      const existingLink = await LinkReference.findOne({ 
        keyword: keyword.trim(), 
        isActive: true,
        _id: { $ne: id }
      });

      if (existingLink) {
        res.status(409).json({
          success: false,
          message: '該關鍵字已被其他超連結使用'
        });
        return;
      }
    }

    // 更新欄位
    if (keyword !== undefined) link.keyword = keyword.trim();
    if (displayText !== undefined) link.displayText = displayText.trim();
    if (url !== undefined) link.url = url.trim();

    await link.save();

    res.json({
      success: true,
      message: '超連結更新成功',
      data: link
    });

  } catch (error) {
    console.error('更新超連結失敗:', error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({
        success: false,
        message: '資料驗證失敗',
        error: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

// 刪除超連結（軟刪除）
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 驗證ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: '無效的超連結ID'
      });
      return;
    }

    // 查找並軟刪除
    const link = await LinkReference.findById(id);
    if (!link) {
      res.status(404).json({
        success: false,
        message: '找不到該超連結'
      });
      return;
    }

    link.isActive = false;
    await link.save();

    res.json({
      success: true,
      message: '超連結刪除成功'
    });

  } catch (error) {
    console.error('刪除超連結失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

// 增加使用次數
router.post('/:id/usage', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 驗證ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: '無效的超連結ID'
      });
      return;
    }

    // 查找超連結
    const link = await LinkReference.findById(id);
    if (!link || !link.isActive) {
      res.status(404).json({
        success: false,
        message: '找不到該超連結'
      });
      return;
    }

    // 增加使用次數
    await link.incrementUsage();

    res.json({
      success: true,
      message: '使用次數更新成功',
      data: {
        usageCount: link.usageCount,
        lastUsedAt: link.lastUsedAt
      }
    });

  } catch (error) {
    console.error('更新使用次數失敗:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
      error: error instanceof Error ? error.message : '未知錯誤'
    });
  }
});

export default router;