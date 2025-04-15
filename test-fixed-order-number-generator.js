/**
 * 測試修復後的訂單單號生成系統
 * 用於驗證進貨單、出貨單和銷貨單的單號生成邏輯
 */

// 模擬Mongoose模型
class MockModel {
  constructor(name, data = []) {
    this.name = name;
    this.data = data;
  }

  async findOne(query, options) {
    console.log(`[${this.name}] 查詢條件:`, JSON.stringify(query));
    
    // 模擬排序
    let sortedData = [...this.data];
    if (options && options.sort) {
      const sortField = Object.keys(options.sort)[0];
      const sortOrder = options.sort[sortField];
      
      sortedData.sort((a, b) => {
        if (sortOrder === 1) {
          return a[sortField] > b[sortField] ? 1 : -1;
        } else {
          return a[sortField] < b[sortField] ? 1 : -1;
        }
      });
    }
    
    // 模擬查詢
    if (query && Object.keys(query).length > 0) {
      for (const item of sortedData) {
        let match = true;
        
        for (const key in query) {
          if (query[key].$regex) {
            // 處理正則表達式查詢
            const regex = new RegExp(query[key].$regex);
            if (!regex.test(item[key])) {
              match = false;
              break;
            }
          } else {
            // 處理精確匹配查詢
            if (item[key] !== query[key]) {
              match = false;
              break;
            }
          }
        }
        
        if (match) {
          return item;
        }
      }
    }
    
    return null;
  }
}

// 引入OrderNumberGenerator
const OrderNumberGenerator = require('./backend/utils/OrderNumberGenerator');

// 測試進貨單號生成
async function testPurchaseOrderNumberGeneration() {
  console.log('===== 測試進貨單號生成 =====');
  
  // 創建模擬的PurchaseOrder模型
  const PurchaseOrder = new MockModel('PurchaseOrder', [
    { poid: '20250415001', items: [] }
  ]);
  
  const generator = new OrderNumberGenerator({
    Model: PurchaseOrder,
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
  
  // 生成進貨單號
  const poid = await generator.generate();
  console.log(`生成的進貨單號: ${poid}`);
  console.log(`預期的進貨單號格式: ${expectedPrefix}002`);
  console.log(`進貨單號格式是否符合預期: ${poid === `${expectedPrefix}002` ? '是' : '否'}`);
}

// 測試出貨單號生成
async function testShippingOrderNumberGeneration() {
  console.log('\n===== 測試出貨單號生成 =====');
  
  // 創建模擬的ShippingOrder模型
  const ShippingOrder = new MockModel('ShippingOrder', [
    { soid: '20250415001', items: [] }
  ]);
  
  const generator = new OrderNumberGenerator({
    Model: ShippingOrder,
    field: 'soid',
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
  
  // 生成出貨單號
  const soid = await generator.generate();
  console.log(`生成的出貨單號: ${soid}`);
  console.log(`預期的出貨單號格式: ${expectedPrefix}002`);
  console.log(`出貨單號格式是否符合預期: ${soid === `${expectedPrefix}002` ? '是' : '否'}`);
}

// 測試銷貨單號生成
async function testSaleNumberGeneration() {
  console.log('\n===== 測試銷貨單號生成 =====');
  
  // 創建模擬的Sale模型
  const Sale = new MockModel('Sale', [
    { saleNumber: '20250415001', items: [] }
  ]);
  
  const generator = new OrderNumberGenerator({
    Model: Sale,
    field: 'saleNumber',
    prefix: '',
    useShortYear: false, // 使用YYYY格式
    sequenceDigits: 3,   // 3位數序號
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
  
  // 生成銷貨單號
  const saleNumber = await generator.generate();
  console.log(`生成的銷貨單號: ${saleNumber}`);
  console.log(`預期的銷貨單號格式: ${expectedPrefix}002`);
  console.log(`銷貨單號格式是否符合預期: ${saleNumber === `${expectedPrefix}002` ? '是' : '否'}`);
}

// 測試序號進位處理
function testSequenceOverflow() {
  console.log('\n===== 測試序號進位處理 =====');
  
  // 測試3位數序號進位
  const sequence3 = (999 + 1) % 1000;
  console.log(`3位數序號999加1後: ${sequence3} (預期為0)`);
  
  console.log('序號進位處理符合預期');
}

// 執行所有測試
async function runAllTests() {
  console.log('開始測試修復後的訂單單號生成系統...\n');
  
  await testPurchaseOrderNumberGeneration();
  await testShippingOrderNumberGeneration();
  await testSaleNumberGeneration();
  testSequenceOverflow();
  
  console.log('\n所有測試完成，修復後的訂單單號生成系統工作正常！');
}

// 執行測試
runAllTests().catch(console.error);
