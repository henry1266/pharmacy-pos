import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { check, validationResult } from 'express-validator';

// 使用 TypeScript import 語法導入模型和中介軟體
import AccountingCategory from '../models/AccountingCategory';
import { IAccountingCategoryDocument } from '../src/types/models';
const auth = require('../middleware/auth');

// 定義會計類別介面
interface IAccountingCategory {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  isActive: boolean;
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}

// 定義請求介面
interface AccountingCategoryRequest {
  name: string;
  description?: string;
  isActive?: boolean;
  order?: number;
}

// 擴展 Request 介面以包含用戶資訊
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

const router = express.Router();

// @route   GET api/accounting-categories
// @desc    獲取所有記帳名目類別
// @access  Private
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const categories = await AccountingCategory.find({ isActive: true })
      .sort({ order: 1, name: 1 });
      
    res.json(categories);
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   GET api/accounting-categories/:id
// @desc    獲取單筆記帳名目類別
// @access  Private
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: '無效的類別 ID 格式' });
    }
    
    const category = await AccountingCategory.findById(id);
      
    if (!category) {
      return res.status(404).json({ msg: '找不到記帳名目類別' });
    }
    
    res.json(category);
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   POST api/accounting-categories
// @desc    新增記帳名目類別
// @access  Private
router.post('/', [
  auth,
  [
    check('name', '名稱為必填欄位').not().isEmpty(),
  ]
], async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { name, description }: AccountingCategoryRequest = req.body;
    
    // 檢查是否已存在相同名稱的類別
    const existingCategory = await AccountingCategory.findOne({ name: name.toString() });
    
    if (existingCategory) {
      return res.status(400).json({ msg: '該名目類別已存在' });
    }
    
    const newCategory = new AccountingCategory({
      name,
      description: description || ''
    });
    
    const category = await newCategory.save();
    res.json(category);
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   PUT api/accounting-categories/:id
// @desc    更新記帳名目類別
// @access  Private
router.put('/:id', [
  auth,
  [
    check('name', '名稱為必填欄位').not().isEmpty(),
  ]
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { id } = req.params;
    const { name, description, isActive, order }: AccountingCategoryRequest = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: '無效的類別 ID 格式' });
    }
    
    // 檢查是否存在相同名稱的其他類別
    const existingCategory = await AccountingCategory.findOne({
      name: name.toString(),
      _id: { $ne: new mongoose.Types.ObjectId(id) }
    });
    
    if (existingCategory) {
      return res.status(400).json({ msg: '該名目類別已存在' });
    }
    
    let category = await AccountingCategory.findById(id);
    
    if (!category) {
      return res.status(404).json({ msg: '找不到記帳名目類別' });
    }
    
    // 更新類別
    category.name = name.toString();
    category.description = description ? description.toString() : '';
    if (isActive !== undefined) {
      category.isActive = isActive;
    }
    if (order !== undefined) {
      category.order = order;
    }
    
    category = await category.save();
    res.json(category);
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send('伺服器錯誤');
  }
});

// @route   DELETE api/accounting-categories/:id
// @desc    刪除記帳名目類別
// @access  Private
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: '無效的類別 ID 格式' });
    }
    
    const category = await AccountingCategory.findById(id);
    
    if (!category) {
      return res.status(404).json({ msg: '找不到記帳名目類別' });
    }
    
    // 軟刪除 - 將isActive設為false
    category.isActive = false;
    await category.save();
    
    res.json({ msg: '記帳名目類別已停用' });
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send('伺服器錯誤');
  }
});

export default router;