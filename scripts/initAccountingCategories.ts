import mongoose from 'mongoose';
import config from 'config';
import AccountingCategory from '../models/AccountingCategory';

// 連接資料庫
const db: string = config.get('mongoURI');

interface DefaultCategory {
  name: string;
  description: string;
}

const initAccountingCategories = async (): Promise<void> => {
  try {
    await mongoose.connect(db);
    
    console.log('MongoDB 已連接...');
    
    // 預設的會計名目類別
    const defaultCategories: DefaultCategory[] = [
      { name: '掛號費', description: '病患掛號費用' },
      { name: '部分負擔', description: '健保部分負擔費用' },
      { name: '其他', description: '其他費用' }
    ];
    
    // 檢查是否已存在類別
    for (const category of defaultCategories) {
      const existingCategory = await AccountingCategory.findOne({ name: category.name });
      
      if (!existingCategory) {
        const newCategory = new AccountingCategory({
          ...category,
          order: 0,
          isActive: true
        });
        await newCategory.save();
        console.log(`已新增類別: ${category.name}`);
      } else {
        console.log(`類別已存在: ${category.name}`);
      }
    }
    
    console.log('初始化會計名目類別完成');
    process.exit(0);
  } catch (err) {
    const error = err as Error;
    console.error('初始化會計名目類別失敗:', error.message);
    process.exit(1);
  }
};

initAccountingCategories();