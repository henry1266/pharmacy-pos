import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';

interface ShippingOrderResponse {
  shippingOrder: {
    soid: string;
    status: string;
    paymentStatus: string;
    itemCount: number;
    [key: string]: any;
  };
  [key: string]: any;
}

// 測試民國年日期轉換功能
async function testRocDateConversion(): Promise<void> {
  try {
    console.log('開始測試民國年日期轉換功能...');
    
    // 準備表單數據
    const formData = new FormData();
    const filePath = path.join(__dirname, 'test/csv/medicine_sample_rocdate.csv');
    
    formData.append('file', fs.createReadStream(filePath));
    
    // 發送請求
    console.log('發送CSV匯入請求，CSV包含民國年日期格式...');
    const response = await axios.post<ShippingOrderResponse>(
      'http://localhost:5000/api/shipping-orders/import/medicine', 
      formData, 
      {
        headers: {
          ...formData.getHeaders()
        }
      }
    );
    
    // 輸出結果
    console.log('API回應狀態:', response.status);
    console.log('API回應數據:', JSON.stringify(response.data, null, 2));
    
    // 檢查是否成功
    if (response.status === 200 && response.data.shippingOrder) {
      console.log('測試成功! 民國年日期已正確轉換並生成訂單');
      console.log('訂單號:', response.data.shippingOrder.soid);
      console.log('訂單狀態:', response.data.shippingOrder.status);
      console.log('付款狀態:', response.data.shippingOrder.paymentStatus);
      console.log('項目數量:', response.data.shippingOrder.itemCount);
    } else {
      console.error('測試失敗!');
    }
    
  } catch (error) {
    const err = error as Error & { response?: { data: any } };
    console.error('測試過程中出錯:', err.message);
    if (err.response) {
      console.error('API回應錯誤:', err.response.data);
    }
  }
}

// 執行測試
testRocDateConversion().catch((error: Error) => {
  console.error('未處理的錯誤:', error);
  process.exit(1);
});