/**
 * 商品與藥品編號產生器測試
 */

const mongoose = require('mongoose');
const { BaseProduct, Product, Medicine } = require('../models/BaseProduct');
const { generateNextProductCode, generateNextMedicineCode } = require('../utils/codeGenerator');

// 連接到測試資料庫
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://192.168.68.73:27017/pharmacy_pos_test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB 連接成功');
  } catch (err) {
    console.error('MongoDB 連接失敗', err.message);
    process.exit(1);
  }
};

// 清空測試資料庫
const clearDatabase = async () => {
  try {
    await Product.deleteMany({});
    await Medicine.deleteMany({});
    console.log('資料庫已清空');
  } catch (err) {
    console.error('清空資料庫失敗', err.message);
  }
};

// 測試商品編號產生
const testProductCodeGeneration = async () => {
  try {
    console.log('開始測試商品編號產生');
    
    // 測試初始編號
    const initialCode = await generateNextProductCode();
    console.log('初始商品編號:', initialCode);
    if (initialCode !== 'P10001') {
      throw new Error(`初始商品編號應為 P10001，但得到 ${String(initialCode)}`);
    }
    
    // 建立第一個商品
    const product1 = new Product({
      code: initialCode,
      shortCode: 'TEST1',
      name: '測試商品1',
      productType: 'product'
    });
    await product1.save();
    
    // 測試第二個編號
    const secondCode = await generateNextProductCode();
    console.log('第二個商品編號:', secondCode);
    if (secondCode !== 'P10002') {
      throw new Error(`第二個商品編號應為 P10002，但得到 ${String(secondCode)}`);
    }
    
    // 建立第二個商品
    const product2 = new Product({
      code: secondCode,
      shortCode: 'TEST2',
      name: '測試商品2',
      productType: 'product'
    });
    await product2.save();
    
    // 測試第三個編號
    const thirdCode = await generateNextProductCode();
    console.log('第三個商品編號:', thirdCode);
    if (thirdCode !== 'P10003') {
      throw new Error(`第三個商品編號應為 P10003，但得到 ${String(thirdCode)}`);
    }
    
    console.log('商品編號產生測試通過');
  } catch (err) {
    console.error('商品編號產生測試失敗:', err.message);
  }
};

// 測試藥品編號產生
const testMedicineCodeGeneration = async () => {
  try {
    console.log('開始測試藥品編號產生');
    
    // 測試初始編號
    const initialCode = await generateNextMedicineCode();
    console.log('初始藥品編號:', initialCode);
    if (initialCode !== 'M10001') {
      throw new Error(`初始藥品編號應為 M10001，但得到 ${String(initialCode)}`);
    }
    
    // 建立第一個藥品
    const medicine1 = new Medicine({
      code: initialCode,
      shortCode: 'MED1',
      name: '測試藥品1',
      productType: 'medicine'
    });
    await medicine1.save();
    
    // 測試第二個編號
    const secondCode = await generateNextMedicineCode();
    console.log('第二個藥品編號:', secondCode);
    if (secondCode !== 'M10002') {
      throw new Error(`第二個藥品編號應為 M10002，但得到 ${String(secondCode)}`);
    }
    
    // 建立第二個藥品
    const medicine2 = new Medicine({
      code: secondCode,
      shortCode: 'MED2',
      name: '測試藥品2',
      productType: 'medicine'
    });
    await medicine2.save();
    
    // 測試第三個編號
    const thirdCode = await generateNextMedicineCode();
    console.log('第三個藥品編號:', thirdCode);
    if (thirdCode !== 'M10003') {
      throw new Error(`第三個藥品編號應為 M10003，但得到 ${String(thirdCode)}`);
    }
    
    console.log('藥品編號產生測試通過');
  } catch (err) {
    console.error('藥品編號產生測試失敗:', err.message);
  }
};

// 測試多併發產生編號
const testConcurrentCodeGeneration = async () => {
  try {
    console.log('開始測試多併發產生編號');
    
    // 清空資料庫
    await clearDatabase();
    
    // 同時產生多個商品編號
    const productPromises = [];
    for (let i = 0; i < 5; i++) {
      productPromises.push(generateNextProductCode().then(async (code) => {
        console.log(`併發商品編號 ${i+1}:`, code);
        const product = new Product({
          code,
          shortCode: `CONC${i+1}`,
          name: `併發測試商品${i+1}`,
          productType: 'product'
        });
        await product.save();
        return code;
      }));
    }
    
    // 同時產生多個藥品編號
    const medicinePromises = [];
    for (let i = 0; i < 5; i++) {
      medicinePromises.push(generateNextMedicineCode().then(async (code) => {
        console.log(`併發藥品編號 ${i+1}:`, code);
        const medicine = new Medicine({
          code,
          shortCode: `CONM${i+1}`,
          name: `併發測試藥品${i+1}`,
          productType: 'medicine'
        });
        await medicine.save();
        return code;
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
    console.error('多併發產生編號測試失敗:', err.message);
  }
};

// 執行測試
const runTests = async () => {
  try {
    await connectDB();
    await clearDatabase();
    
    await testProductCodeGeneration();
    await clearDatabase();
    
    await testMedicineCodeGeneration();
    await clearDatabase();
    
    await testConcurrentCodeGeneration();
    
    console.log('所有測試完成');
    mongoose.disconnect();
  } catch (err) {
    console.error('測試執行失敗:', err.message);
    mongoose.disconnect();
  }
};

// 執行測試
runTests();
