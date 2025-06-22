import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';

// 測試配置
const API_BASE_URL = 'http://localhost:5000/api';
const CSV_FILE_PATH = path.join(__dirname, '../test/csv/medicine_sample.csv');

// API 回應型別定義
interface OrderNumberResponse {
  success: boolean;
  orderNumber: string;
  message?: string;
}

interface SupplierInfo {
  _id: string;
  name: string;
  shortCode: string;
}

interface ImportResponse {
  success: boolean;
  shippingOrder?: any;
  summary?: {
    successCount: number;
    errorCount: number;
    totalCount: number;
  };
  errors?: string[];
  message?: string;
}

// 測試出貨單號生成API
async function testGenerateOrderNumber(): Promise<string> {
  try {
    console.log('測試出貨單號生成API...');
    const response = await axios.get<OrderNumberResponse>(`${API_BASE_URL}/shipping-orders/generate-number`);
    console.log('成功生成出貨單號:', response.data);
    
    if (!response.data.success || !response.data.orderNumber) {
      throw new Error('出貨單號生成失敗或回應格式錯誤');
    }
    
    return response.data.orderNumber;
  } catch (error) {
    const err = error as any;
    console.error('出貨單號生成失敗:', err.message);
    if (err.response) {
      console.error('錯誤詳情:', err.response.data);
    }
    throw error;
  }
}

// 測試藥品CSV匯入API
async function testMedicineCsvImport(orderNumber: string): Promise<ImportResponse> {
  try {
    console.log('測試藥品CSV匯入API...');
    
    // 檢查CSV文件是否存在
    if (!fs.existsSync(CSV_FILE_PATH)) {
      throw new Error(`CSV文件不存在: ${CSV_FILE_PATH}`);
    }
    
    // 準備表單數據
    const formData = new FormData();
    formData.append('file', fs.createReadStream(CSV_FILE_PATH));
    formData.append('orderNumber', orderNumber || '');
    
    // 添加預設供應商信息
    const defaultSupplier: SupplierInfo = {
      _id: "test_supplier_id",
      name: "測試供應商",
      shortCode: "TEST"
    };
    formData.append('defaultSupplier', JSON.stringify(defaultSupplier));
    
    // 發送請求
    const response = await axios.post<ImportResponse>(
      `${API_BASE_URL}/shipping-orders/import/medicine`,
      formData,
      {
        headers: {
          ...formData.getHeaders()
        }
      }
    );
    
    console.log('CSV匯入成功:', response.data);
    
    if (!response.data.success) {
      throw new Error(`CSV匯入失敗: ${response.data.message || '未知錯誤'}`);
    }
    
    return response.data;
  } catch (error) {
    const err = error as any;
    console.error('CSV匯入失敗:', err.message);
    if (err.response) {
      console.error('錯誤詳情:', err.response.data);
    }
    throw error;
  }
}

// 執行測試
async function runTests(): Promise<void> {
  try {
    console.log('開始API測試...');
    
    // 測試出貨單號生成
    const orderNumber = await testGenerateOrderNumber();
    console.log(`✅ 出貨單號生成測試通過: ${orderNumber}`);
    
    // 測試藥品CSV匯入
    const importResult = await testMedicineCsvImport(orderNumber);
    console.log(`✅ CSV匯入測試通過: 成功匯入 ${importResult.summary?.successCount || 0} 筆資料`);
    
    console.log('\n🎉 所有測試完成!');
    console.log('📊 測試結果摘要:');
    console.log(`- 出貨單號: ${orderNumber}`);
    console.log(`- 匯入成功數量: ${importResult.summary?.successCount || 0}`);
    console.log(`- 匯入錯誤數量: ${importResult.summary?.errorCount || 0}`);
    console.log(`- 總計處理數量: ${importResult.summary?.totalCount || 0}`);
    
  } catch (error) {
    const err = error as Error;
    console.error('\n❌ 測試過程中發生錯誤:', err.message);
    console.error('\n🔧 請檢查:');
    console.error('1. 後端服務是否正在運行 (http://localhost:5000)');
    console.error('2. CSV 測試檔案是否存在');
    console.error('3. API 端點是否正確');
    console.error('4. 網路連接是否正常');
    
    process.exit(1);
  }
}

// 執行測試
runTests();