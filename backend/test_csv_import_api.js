const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

// 測試配置
const API_URL = 'http://localhost:5000/api/csv-import/shipping-orders';
const TEST_CSV_PATH = path.join(__dirname, '../test/csv/medicine_sample_rocdate.csv');

/**
 * 測試CSV匯入REST API
 */
async function testCsvImportApi() {
  try {
    console.log('開始測試CSV匯入REST API...');
    console.log(`API端點: ${API_URL}`);
    console.log(`測試CSV檔案: ${TEST_CSV_PATH}`);
    
    // 檢查測試CSV檔案是否存在
    if (!fs.existsSync(TEST_CSV_PATH)) {
      console.error('錯誤: 測試CSV檔案不存在!');
      return;
    }
    
    // 創建FormData實例
    const formData = new FormData();
    formData.append('file', fs.createReadStream(TEST_CSV_PATH));
    
    // 發送POST請求
    console.log('發送POST請求到CSV匯入API...');
    const response = await axios.post(API_URL, formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
    
    // 輸出API回應
    console.log('\n=== API回應 ===');
    console.log('狀態碼:', response.status);
    console.log('回應資料:', JSON.stringify(response.data, null, 2));
    
    // 驗證回應格式
    if (response.data.success && response.data.shippingOrder && response.data.summary) {
      console.log('\n✅ 測試成功: API回應格式正確');
      console.log(`✅ 訂單號: ${response.data.shippingOrder.soid}`);
      console.log(`✅ 成功匯入項目數: ${response.data.summary.successCount}`);
    } else {
      console.log('\n❌ 測試失敗: API回應格式不符合預期');
    }
    
  } catch (error) {
    console.error('\n❌ 測試失敗: API請求出錯');
    if (error.response) {
      // 伺服器回應了錯誤狀態碼
      console.error('狀態碼:', error.response.status);
      console.error('回應資料:', error.response.data);
    } else if (error.request) {
      // 請求已發送但沒有收到回應
      console.error('未收到回應，請確認伺服器是否運行中');
    } else {
      // 請求設置時發生錯誤
      console.error('錯誤訊息:', error.message);
    }
  }
}

// 執行測試
testCsvImportApi();
