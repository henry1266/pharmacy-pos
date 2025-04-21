# AccountingCategories 實現報告

## 實現概述

本次開發任務是將 AccountingForm 現有的名目（掛號費、部分負擔、其他）存入 accountingcategories 資料庫中，並修改相關代碼以從該資料庫讀取名目，而不是使用硬編碼值。這項改進使系統更加靈活，管理員可以輕鬆地添加、修改或刪除會計名目類別，而不需要修改代碼。

## 實現步驟

### 1. 後端實現

#### 1.1 創建 AccountingCategory 模型

首先，創建了 AccountingCategory 模型，用於存儲會計名目類別：

```javascript
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 記帳名目類別資料模型
const AccountingCategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('AccountingCategory', AccountingCategorySchema);
```

#### 1.2 修改 Accounting 模型

修改了 Accounting 模型，移除了硬編碼的名目限制，並添加了 categoryId 字段來引用 AccountingCategory：

```javascript
items: [{
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'AccountingCategory'
  },
  note: {
    type: String,
    default: ''
  }
}],
```

#### 1.3 創建 accountingCategories 路由

創建了 accountingCategories 路由，提供 API 端點來管理會計類別：

```javascript
const express = require('express');
const router = express.Router();
const AccountingCategory = require('../models/AccountingCategory');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

// @route   GET api/accounting-categories
// @desc    獲取所有記帳名目類別
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const categories = await AccountingCategory.find({ isActive: true })
      .sort({ name: 1 });
      
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('伺服器錯誤');
  }
});

// 其他路由...

module.exports = router;
```

#### 1.4 修改 accounting 路由

修改了 accounting 路由的驗證邏輯，移除了硬編碼的名目限制：

```javascript
check('items.*.category', '名目為必填欄位').not().isEmpty()
```

#### 1.5 創建初始化腳本

創建了初始化腳本，將現有名目（掛號費、部分負擔、其他）存入資料庫：

```javascript
const mongoose = require('mongoose');
const config = require('config');
const AccountingCategory = require('../models/AccountingCategory');

// 連接資料庫
const db = config.get('mongoURI');

const initAccountingCategories = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('MongoDB 已連接...');
    
    // 預設的會計名目類別
    const defaultCategories = [
      { name: '掛號費', description: '病患掛號費用' },
      { name: '部分負擔', description: '健保部分負擔費用' },
      { name: '其他', description: '其他費用' }
    ];
    
    // 檢查是否已存在類別
    for (const category of defaultCategories) {
      const existingCategory = await AccountingCategory.findOne({ name: category.name });
      
      if (!existingCategory) {
        const newCategory = new AccountingCategory(category);
        await newCategory.save();
        console.log(`已新增類別: ${category.name}`);
      } else {
        console.log(`類別已存在: ${category.name}`);
      }
    }
    
    console.log('初始化會計名目類別完成');
    process.exit(0);
  } catch (err) {
    console.error('初始化會計名目類別失敗:', err.message);
    process.exit(1);
  }
};

initAccountingCategories();
```

### 2. 前端實現

#### 2.1 創建 accountingCategoryService

創建了前端 API 服務來獲取會計類別：

```javascript
import axios from 'axios';

// 獲取所有記帳名目類別
export const getAccountingCategories = async () => {
  try {
    const res = await axios.get('/api/accounting-categories');
    return res.data;
  } catch (err) {
    console.error('獲取記帳名目類別失敗:', err);
    throw err;
  }
};

// 其他服務函數...
```

#### 2.2 修改 AccountingForm 組件

修改了 AccountingForm 組件，使其從資料庫讀取名目選項：

```javascript
// 記帳名目類別狀態
const [categories, setCategories] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

// 獲取記帳名目類別
useEffect(() => {
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getAccountingCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      console.error('獲取記帳名目類別失敗:', err);
      setError('獲取記帳名目類別失敗');
    } finally {
      setLoading(false);
    }
  };
  
  fetchCategories();
}, []);
```

並更新了名目選擇器的渲染邏輯：

```jsx
<FormControl fullWidth required>
  <InputLabel>名目</InputLabel>
  <Select
    value={item.category}
    label="名目"
    onChange={(e) => handleItemChange(index, 'category', e.target.value)}
    disabled={loading}
  >
    {loading ? (
      <MenuItem disabled>
        <CircularProgress size={20} />
        載入中...
      </MenuItem>
    ) : error ? (
      <MenuItem disabled>
        無法載入名目類別
      </MenuItem>
    ) : categories.length > 0 ? (
      categories.map(category => (
        <MenuItem key={category._id} value={category.name}>
          {category.name}
        </MenuItem>
      ))
    ) : (
      <MenuItem disabled>
        無可用名目類別
      </MenuItem>
    )}
  </Select>
</FormControl>
```

## 測試與驗證

實現完成後，進行了以下測試：

1. 初始化腳本能否正確將預設名目存入資料庫
2. 前端組件能否從資料庫讀取名目選項
3. 整個流程是否能夠正常運作

測試結果表明，系統現在能夠從資料庫讀取會計名目類別，而不是使用硬編碼值，實現了預期的功能。

## 總結

本次開發成功實現了將 AccountingForm 現有名目存入 accountingcategories 資料庫並從中讀取的功能。這項改進使系統更加靈活，管理員可以輕鬆地管理會計名目類別，而不需要修改代碼。同時，這也為未來添加更多會計名目類別管理功能奠定了基礎。

## 未來改進建議

1. 添加會計名目類別管理頁面，方便管理員直接在系統中添加、修改或刪除類別
2. 實現類別排序功能，讓常用的類別顯示在前面
3. 添加類別分組功能，將相關的類別組織在一起
4. 實現類別統計報表，分析不同類別的收入情況
