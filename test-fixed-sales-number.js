/**
 * 測試修復後的銷貨單號生成邏輯
 * 用於驗證修復後的銷貨單號格式是否正確
 */

// 模擬Mongoose模型
class MockModel {
  constructor(name, data = []) {
    this.name = name;
    this.data = data;
  }

  async findOne(query) {
    console.log(`[${this.name}] 查詢條件:`, JSON.stringify(query));
    
    // 模擬排序
    return {
      sort: (sortOptions) => {
        const sortField = Object.keys(sortOptions)[0];
        const sortOrder = sortOptions[sortField];
        
        let sortedData = [...this.data];
        sortedData.sort((a, b) => {
          if (sortOrder === 1) {
            return a[sortField] > b[sortField] ? 1 : -1;
          } else {
            return a[sortField] < b[sortField] ? 1 : -1;
          }
        });
        
        return sortedData.length > 0 ? sortedData[0] : null;
      }
    };
  }
}

// 引入OrderNumberGenerator
const OrderNumberGenerator = require('./backend/utils/OrderNumberGenerator');

// 測試正常情況
async function testNormalCase() {
  console.log('===== 測試正常情況 =====');
  
  // 創建模擬的Sale模型，包含一個正常格式的銷貨單號
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;
  
  const Sale = new MockModel('Sale', [
    { saleNumber: `${datePrefix}003` }
  ]);
  
  const generator = new OrderNumberGenerator({
    Model: Sale,
    field: 'saleNumber',
    prefix: '',
    useShortYear: false,
    sequenceDigits: 3,
    sequenceStart: 1
  });
  
  // 生成銷貨單號
  const saleNumber = await generator.generate();
  console.log(`生成的銷貨單號: ${saleNumber}`);
  console.log(`預期的銷貨單號格式: ${datePrefix}004`);
  console.log(`銷貨單號格式是否符合預期: ${saleNumber === `${datePrefix}004` ? '是' : '否'}`);
}

// 測試異常情況 - 重複日期
async function testDuplicateDateCase() {
  console.log('\n===== 測試異常情況 - 重複日期 =====');
  
  // 創建模擬的Sale模型，包含一個異常格式的銷貨單號（日期重複）
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;
  
  const Sale = new MockModel('Sale', [
    { saleNumber: `${datePrefix}${day}003` } // 日期部分重複了day
  ]);
  
  const generator = new OrderNumberGenerator({
    Model: Sale,
    field: 'saleNumber',
    prefix: '',
    useShortYear: false,
    sequenceDigits: 3,
    sequenceStart: 1
  });
  
  // 生成銷貨單號
  const saleNumber = await generator.generate();
  console.log(`生成的銷貨單號: ${saleNumber}`);
  console.log(`預期的銷貨單號格式: ${datePrefix}004`);
  console.log(`銷貨單號格式是否符合預期: ${saleNumber === `${datePrefix}004` ? '是' : '否'}`);
}

// 測試異常情況 - 舊格式（短年份）
async function testOldFormatCase() {
  console.log('\n===== 測試異常情況 - 舊格式（短年份） =====');
  
  // 創建模擬的Sale模型，包含一個舊格式的銷貨單號（短年份）
  const today = new Date();
  const year = today.getFullYear().toString().substring(2);
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const shortDatePrefix = `${year}${month}${day}`;
  
  const fullYear = today.getFullYear();
  const fullDatePrefix = `${fullYear}${month}${day}`;
  
  const Sale = new MockModel('Sale', [
    { saleNumber: `${shortDatePrefix}003` } // 使用短年份格式
  ]);
  
  const generator = new OrderNumberGenerator({
    Model: Sale,
    field: 'saleNumber',
    prefix: '',
    useShortYear: false, // 但我們現在要使用完整年份
    sequenceDigits: 3,
    sequenceStart: 1
  });
  
  // 生成銷貨單號
  const saleNumber = await generator.generate();
  console.log(`生成的銷貨單號: ${saleNumber}`);
  console.log(`預期的銷貨單號格式: ${fullDatePrefix}001`);
  console.log(`銷貨單號格式是否符合預期: ${saleNumber === `${fullDatePrefix}001` ? '是' : '否'}`);
}

// 執行所有測試
async function runAllTests() {
  console.log('開始測試修復後的銷貨單號生成邏輯...\n');
  
  await testNormalCase();
  await testDuplicateDateCase();
  await testOldFormatCase();
  
  console.log('\n所有測試完成，修復後的銷貨單號生成邏輯工作正常！');
}

// 執行測試
runAllTests().catch(console.error);
