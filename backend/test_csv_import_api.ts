import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';

// 測試配置
const API_URL = 'http://localhost:5000/api/csv-import/shipping-orders';
const TEST_CSV_PATH = path.join(__dirname, '../test/csv/medicine_sample_rocdate.csv');

// API 回應型別定義
interface CsvImportResponse {
  success: boolean;
  shippingOrder?: {
    soid: string;
    [key: string]: any;
  };
  summary?: {
    successCount: number;
    errorCount: number;
    totalCount: number;
  };
  errors?: string[];
  message?: string;
}

/**
 * 測試CSV匯入REST API
 */
async function testCsvImportApi(): Promise<void> {
  try {
    console.log('開始測試CSV匯入REST API...');
    console.log(`API端點: ${API_URL}`);
    console.log(`測試CSV檔案: ${TEST_CSV_PATH}`);
    
    // 檢查測試CSV檔案是否存在
    if (!fs.existsSync(TEST_CSV_PATH)) {
      console.error('❌ 錯誤: 測試CSV檔案不存在!');
      console.error(`檔案路徑: ${TEST_CSV_PATH}`);
      return;
    }
    
    // 檢查檔案大小
    const fileStats = fs.statSync(TEST_CSV_PATH);
    console.log(`📁 檔案大小: ${fileStats.size} bytes`);
    
    // 創建FormData實例
    const formData = new FormData();
    formData.append('file', fs.createReadStream(TEST_CSV_PATH));
    
    // 發送POST請求
    console.log('📤 發送POST請求到CSV匯入API...');
    const startTime = Date.now();
    
    const response = await axios.post<CsvImportResponse>(API_URL, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 30000 // 30秒超時
    });
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    // 輸出API回應
    console.log('\n=== API回應 ===');
    console.log('✅ 狀態碼:', response.status);
    console.log('⏱️  處理時間:', `${processingTime}ms`);
    console.log('📊 回應資料:', JSON.stringify(response.data, null, 2));
    
    // 驗證回應格式
    if (response.data.success && response.data.shippingOrder && response.data.summary) {
      console.log('\n🎉 測試成功: API回應格式正確');
      console.log(`📋 訂單號: ${response.data.shippingOrder.soid}`);
      console.log(`✅ 成功匯入項目數: ${response.data.summary.successCount}`);
      console.log(`❌ 失敗項目數: ${response.data.summary.errorCount}`);
      console.log(`📈 總計處理項目數: ${response.data.summary.totalCount}`);
      
      // 計算成功率
      const successRate = response.data.summary.totalCount > 0 
        ? ((response.data.summary.successCount / response.data.summary.totalCount) * 100).toFixed(2)
        : '0';
      console.log(`📊 成功率: ${successRate}%`);
      
      // 如果有錯誤，顯示錯誤詳情
      if (response.data.errors && response.data.errors.length > 0) {
        console.log('\n⚠️  錯誤詳情:');
        response.data.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }
      
    } else {
      console.log('\n❌ 測試失敗: API回應格式不符合預期');
      console.log('預期回應應包含: success, shippingOrder, summary 欄位');
      
      if (!response.data.success) {
        console.log(`錯誤訊息: ${response.data.message || '未提供錯誤訊息'}`);
      }
    }
    
  } catch (error: any) {
    console.error('\n❌ 測試失敗: API請求出錯');
    
    if (error.response) {
      // 伺服器回應了錯誤狀態碼
      console.error('🔴 HTTP錯誤狀態碼:', error.response.status);
      console.error('📄 錯誤回應內容:', error.response.data);
      
      if (error.response.status === 404) {
        console.error('💡 提示: API端點可能不存在，請檢查路由設定');
      } else if (error.response.status === 500) {
        console.error('💡 提示: 伺服器內部錯誤，請檢查後端日誌');
      }
      
    } else if (error.request) {
      // 請求已發送但沒有收到回應
      console.error('🔌 網路錯誤: 未收到回應');
      console.error('💡 提示: 請確認伺服器是否運行中 (http://localhost:5000)');
      
    } else if (error.code === 'ENOENT') {
      // 檔案不存在錯誤
      console.error('📁 檔案錯誤: 無法讀取CSV檔案');
      console.error(`檔案路徑: ${TEST_CSV_PATH}`);
      
    } else if (error.code === 'ECONNREFUSED') {
      // 連接被拒絕
      console.error('🚫 連接錯誤: 無法連接到伺服器');
      console.error('💡 提示: 請確認後端服務是否啟動');
      
    } else {
      // 請求設置時發生錯誤
      console.error('⚙️  設定錯誤:', error.message);
    }
    
    console.error('\n🔧 故障排除建議:');
    console.error('1. 確認後端服務正在運行');
    console.error('2. 檢查API端點URL是否正確');
    console.error('3. 確認CSV測試檔案存在且可讀取');
    console.error('4. 檢查網路連接');
    console.error('5. 查看後端服務日誌以獲取更多資訊');
  }
}

// 執行測試
console.log('🚀 啟動CSV匯入API測試...');
testCsvImportApi();