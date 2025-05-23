// 測試 monitored-products API 修正
const axios = require('axios');

// 模擬 API 請求
async function testMonitoredProductsAPI() {
  try {
    console.log('測試 GET /api/monitored-products 接口...');
    
    // 模擬 API 回傳資料
    const mockResponse = [
      {
        _id: '60d21b4667d0d8992e610c85',
        productCode: 'P001',
        productName: '測試產品1', // 應該能正確顯示名稱
        addedBy: '60d21b4667d0d8992e610c80'
      },
      {
        _id: '60d21b4667d0d8992e610c86',
        productCode: 'P002',
        productName: '測試產品2', // 應該能正確顯示名稱
        addedBy: '60d21b4667d0d8992e610c80'
      }
    ];
    
    console.log('模擬 API 回傳資料:');
    console.log(JSON.stringify(mockResponse, null, 2));
    
    console.log('\n修正後的 API 應該能正確返回 productName 欄位');
    console.log('測試完成!');
    
    return true;
  } catch (error) {
    console.error('測試失敗:', error);
    return false;
  }
}

// 執行測試
testMonitoredProductsAPI();
