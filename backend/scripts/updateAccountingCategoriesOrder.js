const mongoose = require('mongoose');
const config = require('config');
const AccountingCategory = require('../models/AccountingCategory');

// 連接資料庫
const db = config.get('mongoURI');

const updateAccountingCategoriesOrder = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('MongoDB 已連接...');
    
    // 預設的會計名目類別及其順序
    const orderedCategories = [
      { name: '掛號費', order: 10 },
      { name: '部分負擔', order: 20 },
      { name: '其他自費', order: 30 },
      { name: '自費疫苗', order: 40 },
      { name: '自費健檢', order: 50 }
    ];
    
    // 更新現有類別的順序或創建新類別
    for (const [index, category] of orderedCategories.entries()) {
      const existingCategory = await AccountingCategory.findOne({ name: category.name });
      
      if (existingCategory) {
        // 更新現有類別的順序
        existingCategory.order = category.order;
        await existingCategory.save();
        console.log(`已更新類別順序: ${category.name} (${category.order})`);
      } else {
        // 創建新類別
        const newCategory = new AccountingCategory({
          name: category.name,
          description: `${category.name}費用`,
          order: category.order
        });
        await newCategory.save();
        console.log(`已新增類別: ${category.name} (${category.order})`);
      }
    }
    
    // 獲取所有類別並按順序顯示
    const allCategories = await AccountingCategory.find().sort({ order: 1, name: 1 });
    console.log('\n當前類別順序:');
    allCategories.forEach(cat => {
      console.log(`${cat.name} (順序: ${cat.order})`);
    });
    
    console.log('\n更新會計名目類別順序完成');
    process.exit(0);
  } catch (err) {
    console.error('更新會計名目類別順序失敗:', err.message);
    process.exit(1);
  }
};

updateAccountingCategoriesOrder();
