import express, { Request, Response } from 'express';
import MonitoredProduct from '../models/MonitoredProduct';
import BaseProduct from '../models/BaseProduct';
import auth from '../middleware/auth';
import { check, validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../src/types/express';

const router = express.Router();

// 定義介面
interface MonitoredProductRequest {
  productCode: string;
}

interface MonitoredProductResponse {
  _id: string;
  productCode: string;
  productName: string;
  addedBy: string;
}

// @route   GET api/monitored-products
// @desc    獲取所有監測產品編號（增強版：包含商品名稱）
// @access  Private
router.get('/', auth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // 獲取所有監測產品
    const monitoredProducts = await MonitoredProduct.find().sort({ productCode: 1 }); // 按照產品編號排序
    
    // 使用 Promise.all 並行查詢每個監測產品的詳細資訊
    const productsWithDetails: MonitoredProductResponse[] = await Promise.all(
      monitoredProducts.map(async (product: any): Promise<MonitoredProductResponse> => {
        // 將 productCode 轉換為字串，確保類型一致性
        const productCodeStr = String(product.productCode);
        
        // 查詢對應的基礎產品以獲取名稱 - 修正查詢條件，同時檢查 code 和 shortCode
        // 使用 $regex 和 $options 進行不區分大小寫的精確匹配
        const baseProduct = await BaseProduct.findOne({ 
          $or: [
            { code: { $regex: `^${productCodeStr}$`, $options: 'i' } },
            { shortCode: { $regex: `^${productCodeStr}$`, $options: 'i' } }
          ] 
        });
        
        // 記錄查詢結果，幫助調試
        console.log(`查詢產品: ${productCodeStr}, 結果:`, baseProduct ? 
          `找到產品 - 名稱: ${(baseProduct as any).name}, code: ${(baseProduct as any).code}, shortCode: ${(baseProduct as any).shortCode}` : 
          '未找到產品');
        
        // 返回合併後的資料，不包含 addedAt
        // 確保 productName 欄位一定有值，並記錄最終回傳的資料
        const result: MonitoredProductResponse = {
          _id: product._id.toString(),
          productCode: product.productCode,
          productName: baseProduct ? (baseProduct as any).name : '未知產品',
          addedBy: product.addedBy
        };
        
        console.log(`最終回傳資料: ${JSON.stringify(result)}`);
        return result;
      })
    );
    
    res.json(productsWithDetails);
  } catch (err: any) {
    console.error('獲取監測產品失敗:', err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   POST api/monitored-products
// @desc    新增監測產品編號
// @access  Private
router.post(
  '/',
  [
    auth,
    check('productCode', '產品編號為必填欄位').not().isEmpty().trim(),
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    
    const { productCode } = req.body;
    try {
      // 1. 檢查產品編號是否存在於 BaseProduct 中
      // 修正查詢條件，同時檢查 code 和 shortCode，並確保類型一致性
      const productCodeStr = String(productCode);
      const productExists = await BaseProduct.findOne({ 
        $or: [
          { code: { $regex: `^${productCodeStr}$`, $options: 'i' } },
          { shortCode: { $regex: `^${productCodeStr}$`, $options: 'i' } }
        ] 
      });
      
      // 記錄查詢結果，幫助調試
      console.log(`新增監測產品: ${productCodeStr}, 查詢結果:`, productExists ? 
        `找到產品 - 名稱: ${(productExists as any).name}, code: ${(productExists as any).code}, shortCode: ${(productExists as any).shortCode}` : 
        '未找到產品');
        
      if (!productExists) {
        res.status(404).json({ msg: `找不到產品編號為 ${productCode} 的產品，無法加入監測` });
        return;
      }
      
      // 2. 檢查是否已存在相同的監測產品編號
      // 修正：將 productCode 轉換為字串
      let monitoredProduct = await MonitoredProduct.findOne({ productCode: productCodeStr });
      if (monitoredProduct) {
        res.status(400).json({ msg: '該產品編號已在監測列表中' });
        return;
      }
      
      // 3. 新增監測產品
      monitoredProduct = new MonitoredProduct({
        productCode: productCodeStr,
        addedBy: req.user!.id, // 記錄添加者
      });
      await monitoredProduct.save();
      
      // 4. 返回包含產品名稱的完整資訊，不包含 addedAt
      const responseData: MonitoredProductResponse = {
        _id: (monitoredProduct as any)._id.toString(),
        productCode: (monitoredProduct as any).productCode,
        productName: (productExists as any).name,
        addedBy: (monitoredProduct as any).addedBy
      };
      
      res.json(responseData);
    } catch (err: any) {
      console.error('新增監測產品失敗:', err.message);
      // Handle potential duplicate key error during save, although findOne should catch it first
      if (err.code === 11000) {
         res.status(400).json({ msg: '該產品編號已在監測列表中' });
         return;
      }
      res.status(500).send('伺服器錯誤');
    }
  }
);

// @route   DELETE api/monitored-products/:id
// @desc    刪除監測產品編號
// @access  Private
router.delete('/:id', auth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // 修正：使用 findOne 替代 findById，並將 id 轉換為字串
    const monitoredProduct = await MonitoredProduct.findOne({ _id: req.params.id.toString() });
    if (!monitoredProduct) {
      res.status(404).json({ msg: '找不到要刪除的監測產品記錄' });
      return;
    }
    
    // 可選：權限檢查，例如只允許添加者刪除
    // if (monitoredProduct.addedBy.toString() !== req.user.id) {
    //   return res.status(401).json({ msg: "權限不足" });
    // }
    
    // 修正：使用 findOneAndDelete 替代 findByIdAndDelete，並將 id 轉換為字串
    await MonitoredProduct.findOneAndDelete({ _id: req.params.id.toString() });
    
    res.json({ msg: '監測產品已刪除' });
  } catch (err: any) {
    console.error('刪除監測產品失敗:', err.message);
    if (err.kind === 'ObjectId') {
      res.status(404).json({ msg: '找不到要刪除的監測產品記錄' });
      return;
    }
    res.status(500).send('伺服器錯誤');
  }
});

export default router;