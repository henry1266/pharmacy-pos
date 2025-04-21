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
