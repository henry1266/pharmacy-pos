// 測試銷貨單號生成
const Sale = require('./backend/models/Sale');
const OrderNumberGenerator = require('./backend/utils/OrderNumberGenerator');

// 模擬generateDateBasedOrderNumber函數
async function generateDateBasedOrderNumber() {
  // 創建銷貨單號生成器實例
  const generator = new OrderNumberGenerator({
    Model: Sale,
    field: 'saleNumber',
    prefix: '',
    useShortYear: false, // 使用YYYY格式
    sequenceDigits: 3,    // 3位數序號
    sequenceStart: 1
  });
  
  // 生成銷貨單號
  return await generator.generate();
}

// 測試生成銷貨單號
async function testSaleNumberGeneration() {
  try {
    console.log('測試銷貨單號生成...');
    
    // 測試案例1: 正常情況
    const saleNumber1 = await generateDateBasedOrderNumber();
    console.log('生成的銷貨單號1:', saleNumber1);
    
    // 測試案例2: 再次生成
    const saleNumber2 = await generateDateBasedOrderNumber();
    console.log('生成的銷貨單號2:', saleNumber2);
    
    // 驗證格式是否正確 (YYYYMMDD + 3位數序號)
    const regex = /^\d{8}\d{3}$/;
    console.log('單號1格式正確:', regex.test(saleNumber1));
    console.log('單號2格式正確:', regex.test(saleNumber2));
    
    console.log('測試完成');
  } catch (error) {
    console.error('測試過程中發生錯誤:', error);
  }
}

// 執行測試
testSaleNumberGeneration();
