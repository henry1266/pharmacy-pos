import mongoose from 'mongoose';
import config from 'config';
import AccountingCategoryModel from '../models/AccountingCategory';
import { AccountingCategory } from '@pharmacy-pos/shared/types';

// 連接資料庫
const db: string = config.get('mongoURI');

interface OrderedCategory {
  name: string;
  order: number;
}

const updateAccountingCategoriesOrder = async (): Promise<void> => {
  try {
    await mongoose.connect(db);
    
    console.log('MongoDB 已連接...');
    
    // 預設的會計名目類別及其順序
    const orderedCategories: OrderedCategory[] = [
      { name: '掛號費', order: 10 },
      { name: '部分負擔', order: 20 },
      { name: '其他自費', order: 30 },
      { name: '自費疫苗', order: 40 },
      { name: '自費健檢', order: 50 }
    ];
    
    // 更新現有類別的順序或創建新類別
    for (const category of orderedCategories) {
      const existingCategory: any = await AccountingCategoryModel.findOne({ name: category.name });
      
      if (existingCategory) {
        // 更新現有類別的順序
        existingCategory.order = category.order;
        await existingCategory.save();
        console.log(`已更新類別順序: ${category.name} (${category.order})`);
      } else {
        // 創建新類別
        const newCategory = new AccountingCategoryModel({
          name: category.name,
          description: `${category.name}費用`,
          order: category.order,
          isActive: true
        });
        await newCategory.save();
        console.log(`已新增類別: ${category.name} (${category.order})`);
      }
    }
    
    // 獲取所有類別並按順序顯示
    const allCategories: any[] = await AccountingCategoryModel.find().sort({ order: 1, name: 1 });
    console.log('\n當前類別順序:');
    allCategories.forEach(cat => {
      console.log(`${cat.name} (順序: ${cat.order})`);
    });
    
    console.log('\n更新會計名目類別順序完成');
    process.exit(0);
  } catch (err) {
    const error = err as Error;
    console.error('更新會計名目類別順序失敗:', error.message);
    process.exit(1);
  }
};

updateAccountingCategoriesOrder();