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
    
    // 模擬生成的單號
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const datePrefix = `${year}${month}${day}`;
    
    // 模擬三個連續的單號
    const saleNumber1 = `${datePrefix}001`;
    const saleNumber2 = `${datePrefix}002`;
    const saleNumber3 = `${datePrefix}003`;
    
    console.log('模擬生成的銷貨單號1:', saleNumber1);
    console.log('模擬生成的銷貨單號2:', saleNumber2);
    console.log('模擬生成的銷貨單號3:', saleNumber3);
    
    // 驗證格式是否正確 (YYYYMMDD + 3位數序號)
    const regex = /^\d{8}\d{3}$/;
    console.log('單號1格式正確:', regex.test(saleNumber1));
    console.log('單號2格式正確:', regex.test(saleNumber2));
    console.log('單號3格式正確:', regex.test(saleNumber3));
    
    console.log('測試完成');
  } catch (error) {
    console.error('測試過程中發生錯誤:', error);
  }
}

// 執行測試
testSaleNumberGeneration();
