/**
 * 商品與藥品編號產生器測試
 */

import mongoose from 'mongoose';
import { Product, Medicine } from '../models/BaseProduct';
import { generateNextProductCode, generateNextMedicineCode } from '../utils/codeGenerator';
import { CodeGenerationResult } from '../src/types/utils';

// 連接到測試資料庫
const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect('mongodb://localhost:27017/pharmacy_pos_test');
    console.log('MongoDB 連接成功');
  } catch (err) {
    const error = err as Error;
    console.error('MongoDB 連接失敗', error.message);
    process.exit(1);
  }
};

// 清空測試資料庫
const clearDatabase = async (): Promise<void> => {
  try {
    await Product.deleteMany({});
    await Medicine.deleteMany({});
    console.log('資料庫已清空');
  } catch (err) {
    const error = err as Error;
    console.error('清空資料庫失敗', error.message);
  }
};

// 測試商品編號產生
const testProductCodeGeneration = async (): Promise<void> => {
  try {
    console.log('開始測試商品編號產生');
    
    // 測試初始編號
    const initialResult = await generateNextProductCode();
    console.log('初始商品編號:', initialResult);
    if (!initialResult.success || initialResult.code !== 'P10001') {
      throw new Error(`初始商品編號應為 P10001，但得到 ${initialResult.code}`);
    }
    
    // 建立第一個商品
    const product1 = new Product({
      productCode: initialResult.code!,
      productName: '測試商品1',
      category: new mongoose.Types.ObjectId(),
      unit: '個',
      isActive: true,
      costPrice: 100,
      sellingPrice: 150
    });
    await product1.save();
    
    // 測試第二個編號
    const secondResult = await generateNextProductCode();
    console.log('第二個商品編號:', secondResult);
    if (!secondResult.success || secondResult.code !== 'P10002') {
      throw new Error(`第二個商品編號應為 P10002，但得到 ${secondResult.code}`);
    }
    
    // 建立第二個商品
    const product2 = new Product({
      productCode: secondResult.code!,
      productName: '測試商品2',
      category: new mongoose.Types.ObjectId(),
      unit: '個',
      isActive: true,
      costPrice: 200,
      sellingPrice: 250
    });
    await product2.save();
    
    // 測試第三個編號
    const thirdResult = await generateNextProductCode();
    console.log('第三個商品編號:', thirdResult);
    if (!thirdResult.success || thirdResult.code !== 'P10003') {
      throw new Error(`第三個商品編號應為 P10003，但得到 ${thirdResult.code}`);
    }
    
    console.log('商品編號產生測試通過');
  } catch (err) {
    const error = err as Error;
    console.error('商品編號產生測試失敗:', error.message);
  }
};

// 測試藥品編號產生
const testMedicineCodeGeneration = async (): Promise<void> => {
  try {
    console.log('開始測試藥品編號產生');
    
    // 測試初始編號
    const initialResult = await generateNextMedicineCode();
    console.log('初始藥品編號:', initialResult);
    if (!initialResult.success || initialResult.code !== 'M10001') {
      throw new Error(`初始藥品編號應為 M10001，但得到 ${initialResult.code}`);
    }
    
    // 建立第一個藥品
    const medicine1 = new Medicine({
      productCode: initialResult.code!,
      productName: '測試藥品1',
      category: new mongoose.Types.ObjectId(),
      unit: '盒',
      isActive: true,
      prescriptionRequired: false
    });
    await medicine1.save();
    
    // 測試第二個編號
    const secondResult = await generateNextMedicineCode();
    console.log('第二個藥品編號:', secondResult);
    if (!secondResult.success || secondResult.code !== 'M10002') {
      throw new Error(`第二個藥品編號應為 M10002，但得到 ${secondResult.code}`);
    }
    
    // 建立第二個藥品
    const medicine2 = new Medicine({
      productCode: secondResult.code!,
      productName: '測試藥品2',
      category: new mongoose.Types.ObjectId(),
      unit: '盒',
      isActive: true,
      prescriptionRequired: true
    });
    await medicine2.save();
    
    // 測試第三個編號
    const thirdResult = await generateNextMedicineCode();
    console.log('第三個藥品編號:', thirdResult);
    if (!thirdResult.success || thirdResult.code !== 'M10003') {
      throw new Error(`第三個藥品編號應為 M10003，但得到 ${thirdResult.code}`);
    }
    
    console.log('藥品編號產生測試通過');
  } catch (err) {
    const error = err as Error;
    console.error('藥品編號產生測試失敗:', error.message);
  }
};

// 測試多併發產生編號
const testConcurrentCodeGeneration = async (): Promise<void> => {
  try {
    console.log('開始測試多併發產生編號');
    
    // 清空資料庫
    await clearDatabase();
    
    // 同時產生多個商品編號
    const productPromises: Promise<string>[] = [];
    for (let i = 0; i < 5; i++) {
      productPromises.push(generateNextProductCode().then(async (result: CodeGenerationResult) => {
        console.log(`併發商品編號 ${i+1}:`, result);
        if (!result.success || !result.code) {
          throw new Error(`商品編號生成失敗: ${result.error}`);
        }
        const product = new Product({
          productCode: result.code,
          productName: `併發測試商品${i+1}`,
          category: new mongoose.Types.ObjectId(),
          unit: '個',
          isActive: true,
          costPrice: 100 * (i + 1),
          sellingPrice: 150 * (i + 1)
        });
        await product.save();
        return result.code;
      }));
    }
    
    // 同時產生多個藥品編號
    const medicinePromises: Promise<string>[] = [];
    for (let i = 0; i < 5; i++) {
      medicinePromises.push(generateNextMedicineCode().then(async (result: CodeGenerationResult) => {
        console.log(`併發藥品編號 ${i+1}:`, result);
        if (!result.success || !result.code) {
          throw new Error(`藥品編號生成失敗: ${result.error}`);
        }
        const medicine = new Medicine({
          productCode: result.code,
          productName: `併發測試藥品${i+1}`,
          category: new mongoose.Types.ObjectId(),
          unit: '盒',
          isActive: true,
          prescriptionRequired: i % 2 === 0
        });
        await medicine.save();
        return result.code;
      }));
    }
    
    // 等待所有編號產生完成
    const productCodes = await Promise.all(productPromises);
    const medicineCodes = await Promise.all(medicinePromises);
    
    // 檢查商品編號是否唯一
    const uniqueProductCodes = new Set(productCodes);
    if (uniqueProductCodes.size !== productCodes.length) {
      throw new Error('商品編號有重複');
    }
    
    // 檢查藥品編號是否唯一
    const uniqueMedicineCodes = new Set(medicineCodes);
    if (uniqueMedicineCodes.size !== medicineCodes.length) {
      throw new Error('藥品編號有重複');
    }
    
    console.log('多併發產生編號測試通過');
  } catch (err) {
    const error = err as Error;
    console.error('多併發產生編號測試失敗:', error.message);
  }
};

// 執行測試
const runTests = async (): Promise<void> => {
  try {
    await connectDB();
    await clearDatabase();
    
    await testProductCodeGeneration();
    await clearDatabase();
    
    await testMedicineCodeGeneration();
    await clearDatabase();
    
    await testConcurrentCodeGeneration();
    
    console.log('所有測試完成');
    await mongoose.disconnect();
  } catch (err) {
    const error = err as Error;
    console.error('測試執行失敗:', error.message);
    await mongoose.disconnect();
  }
};

// 執行測試
runTests();