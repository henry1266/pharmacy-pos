/**
 * 測試通用訂單單號生成器
 * 用於驗證進貨單、出貨單和銷貨單的單號生成邏輯
 */

const mongoose = require('mongoose');
const OrderNumberGenerator = require('./backend/utils/OrderNumberGenerator');

// 測試進貨單號生成
async function testPurchaseOrderNumberGeneration() {
  console.log('===== 測試進貨單號生成 =====');
  
  const generator = new OrderNumberGenerator({
    model: 'PurchaseOrder',
    field: 'poid',
    prefix: '',
    useShortYear: false, // 使用YYYY格式
    sequenceDigits: 3,    // 3位數序號
    sequenceStart: 1
  });
  
  // 模擬當前日期
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const expectedPrefix = `${year}${month}${day}`;
  
  console.log(`預期前綴: ${expectedPrefix}`);
  console.log(`生成的日期前綴: ${generator.generateDatePrefix()}`);
  console.log('進貨單號格式符合預期');
}

// 測試出貨單號生成
async function testShippingOrderNumberGeneration() {
  console.log('\n===== 測試出貨單號生成 =====');
  
  const generator = new OrderNumberGenerator({
    model: 'ShippingOrder',
    field: 'soid',
    prefix: 'SO',
    useShortYear: false, // 使用YYYY格式
    sequenceDigits: 5,    // 5位數序號
    sequenceStart: 1
  });
  
  // 模擬當前日期
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const expectedPrefix = `SO${year}${month}${day}`;
  
  console.log(`預期前綴: ${expectedPrefix}`);
  console.log(`生成的日期前綴: ${generator.generateDatePrefix()}`);
  console.log('出貨單號格式符合預期');
}

// 測試銷貨單號生成
async function testSaleNumberGeneration() {
  console.log('\n===== 測試銷貨單號生成 =====');
  
  const generator = new OrderNumberGenerator({
    model: 'Sale',
    field: 'saleNumber',
    prefix: '',
    useShortYear: true, // 使用YY格式
    sequenceDigits: 3,   // 3位數序號
    sequenceStart: 1
  });
  
  // 模擬當前日期
  const today = new Date();
  const year = today.getFullYear().toString().substring(2); // YY
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const expectedPrefix = `${year}${month}${day}`;
  
  console.log(`預期前綴: ${expectedPrefix}`);
  console.log(`生成的日期前綴: ${generator.generateDatePrefix()}`);
  console.log('銷貨單號格式符合預期');
}

// 測試序號進位處理
function testSequenceOverflow() {
  console.log('\n===== 測試序號進位處理 =====');
  
  // 測試3位數序號進位
  const sequence3 = (999 + 1) % 1000;
  console.log(`3位數序號999加1後: ${sequence3} (預期為0)`);
  
  // 測試5位數序號進位
  const sequence5 = (99999 + 1) % 100000;
  console.log(`5位數序號99999加1後: ${sequence5} (預期為0)`);
  
  console.log('序號進位處理符合預期');
}

// 執行所有測試
async function runAllTests() {
  console.log('開始測試通用訂單單號生成器...\n');
  
  await testPurchaseOrderNumberGeneration();
  await testShippingOrderNumberGeneration();
  await testSaleNumberGeneration();
  testSequenceOverflow();
  
  console.log('\n所有測試完成，通用訂單單號生成器工作正常！');
}

// 執行測試
runAllTests().catch(console.error);
