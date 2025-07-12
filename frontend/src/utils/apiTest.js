// API 配置測試腳本
// 在瀏覽器控制台中執行此腳本來測試 API 連接

console.log('🔧 開始 API 配置測試...');

// 測試環境變數
console.log('📋 環境變數檢查:');
console.log('REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);

// 測試 apiConfig
import { getApiBaseUrl } from './apiConfig';
try {
  const apiBaseUrl = getApiBaseUrl();
  console.log('✅ API Base URL:', apiBaseUrl);
} catch (error) {
  console.error('❌ API Base URL 錯誤:', error.message);
}

// 測試 API 端點
const testEndpoints = [
  '/accounts2',
  '/accounting2/accounts/tree/hierarchy',
  '/organizations'
];

console.log('🌐 測試 API 端點連接:');

testEndpoints.forEach(async (endpoint) => {
  try {
    const fullUrl = `${getApiBaseUrl()}${endpoint}`;
    console.log(`📡 測試: ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token') || ''
      }
    });
    
    console.log(`✅ ${endpoint}: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`📊 ${endpoint} 回應:`, {
        success: data.success,
        dataLength: Array.isArray(data.data) ? data.data.length : 'N/A',
        dataType: typeof data.data
      });
    }
  } catch (error) {
    console.error(`❌ ${endpoint} 錯誤:`, error.message);
  }
});

console.log('🔧 API 配置測試完成');