/**
 * 產品 API 客戶端使用範例
 * 展示修復後的 API 客戶端功能
 */

import { createProductApiClient } from '../services/productApiClient';
import { ProductType } from '../enums';

// 模擬 HTTP 客戶端（實際使用時會是 axios 實例）
const mockHttpClient = {
  get: async <T>(url: string, params?: any): Promise<{ data: T }> => {
    console.log(`GET ${url}`, params);
    
    // 模擬產品列表回應
    if (url === '/api/products') {
      return {
        data: [
          {
            _id: '1',
            code: 'P00001',
            name: '阿斯匹靈',
            unit: '盒',
            price: 100,
            stock: 5,
            minStock: 10,
            productType: ProductType.PRODUCT,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            _id: '2',
            code: 'M00001',
            shortCode: 'VIT',
            name: '維他命C',
            unit: '瓶',
            price: 200,
            stock: 20,
            minStock: 5,
            productType: ProductType.MEDICINE,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            _id: '3',
            code: 'P00002',
            name: '感冒糖漿',
            description: '治療感冒症狀',
            unit: '瓶',
            price: 150,
            stock: 0,
            minStock: 0,
            productType: ProductType.PRODUCT,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ] as T
      };
    }
    
    return { data: null as T };
  },
  
  post: async <T>(url: string, data: any): Promise<{ data: T }> => {
    console.log(`POST ${url}`, data);
    
    // 模擬創建產品回應
    if (url === '/api/products/product') {
      return {
        data: {
          _id: 'new-product-id',
          code: 'P00003',
          ...data,
          productType: ProductType.PRODUCT,
          createdAt: new Date(),
          updatedAt: new Date()
        } as T
      };
    }
    
    if (url === '/api/products/medicine') {
      return {
        data: {
          _id: 'new-medicine-id',
          code: 'M00002',
          ...data,
          productType: ProductType.MEDICINE,
          createdAt: new Date(),
          updatedAt: new Date()
        } as T
      };
    }
    
    return { data: null as T };
  },
  
  put: async <T>(url: string, data: any): Promise<{ data: T }> => {
    console.log(`PUT ${url}`, data);
    
    // 模擬更新產品回應
    return {
      data: {
        _id: url.split('/').pop(),
        code: 'P00001',
        name: '更新的產品',
        unit: '個',
        price: 100,
        ...data,
        updatedAt: new Date()
      } as T
    };
  },
  
  delete: async <T>(url: string): Promise<{ data: T }> => {
    console.log(`DELETE ${url}`);
    return { data: { success: true, message: '產品刪除成功' } as T };
  }
};

/**
 * 測試產品 API 客戶端功能
 */
async function testProductApiClient() {
  console.log('=== 產品 API 客戶端測試開始 ===\n');
  
  const productApiClient = createProductApiClient(mockHttpClient);
  
  try {
    // 1. 測試獲取所有產品
    console.log('1. 測試獲取所有產品:');
    const allProducts = await productApiClient.getAllProducts();
    console.log(`獲取到 ${allProducts.length} 個產品`);
    console.log('產品列表:', allProducts.map(p => `${p.code} - ${p.name}`));
    console.log('');
    
    // 2. 測試創建商品
    console.log('2. 測試創建商品:');
    const newProduct = await productApiClient.createProduct({
      name: '新商品',
      unit: '個',
      price: 50,
      productType: ProductType.PRODUCT
    });
    console.log('創建的商品:', `${newProduct.code} - ${newProduct.name}`);
    console.log('使用的端點: /api/products/product');
    console.log('');
    
    // 3. 測試創建藥品
    console.log('3. 測試創建藥品:');
    const newMedicine = await productApiClient.createProduct({
      name: '新藥品',
      unit: '盒',
      price: 300,
      productType: ProductType.MEDICINE
    });
    console.log('創建的藥品:', `${newMedicine.code} - ${newMedicine.name}`);
    console.log('使用的端點: /api/products/medicine');
    console.log('');
    
    // 4. 測試搜尋功能
    console.log('4. 測試搜尋功能:');
    const searchResults = await productApiClient.searchProducts('阿斯匹靈');
    console.log(`搜尋 "阿斯匹靈" 結果: ${searchResults.length} 個產品`);
    searchResults.forEach(p => console.log(`  - ${p.code}: ${p.name}`));
    console.log('');
    
    // 5. 測試按代碼搜尋
    console.log('5. 測試按代碼搜尋:');
    const codeSearchResults = await productApiClient.searchProducts('M00001');
    console.log(`搜尋代碼 "M00001" 結果: ${codeSearchResults.length} 個產品`);
    codeSearchResults.forEach(p => console.log(`  - ${p.code}: ${p.name}`));
    console.log('');
    
    // 6. 測試按簡碼搜尋
    console.log('6. 測試按簡碼搜尋:');
    const shortCodeSearchResults = await productApiClient.searchProducts('VIT');
    console.log(`搜尋簡碼 "VIT" 結果: ${shortCodeSearchResults.length} 個產品`);
    shortCodeSearchResults.forEach(p => console.log(`  - ${p.code}: ${p.name} (簡碼: ${p.shortCode})`));
    console.log('');
    
    // 7. 測試獲取低庫存產品
    console.log('7. 測試獲取低庫存產品:');
    const lowStockProducts = await productApiClient.getLowStockProducts();
    console.log(`低庫存產品: ${lowStockProducts.length} 個`);
    lowStockProducts.forEach(p => 
      console.log(`  - ${p.code}: ${p.name} (庫存: ${p.stock}, 最低庫存: ${p.minStock})`)
    );
    console.log('');
    
    // 8. 測試批量更新庫存
    console.log('8. 測試批量更新庫存:');
    const stockUpdates = [
      { id: '1', quantity: 50 },
      { id: '2', quantity: 30 }
    ];
    const updatedProducts = await productApiClient.updateProductStock(stockUpdates);
    console.log(`成功更新 ${updatedProducts.length} 個產品的庫存`);
    updatedProducts.forEach(p => 
      console.log(`  - ${p.code}: ${p.name} (新庫存: ${p.stock})`)
    );
    console.log('');
    
    console.log('=== 所有測試完成 ===');
    
  } catch (error) {
    console.error('測試過程中發生錯誤:', error);
  }
}

/**
 * 展示修復前後的差異
 */
function showFixComparison() {
  console.log('=== 修復前後對比 ===\n');
  
  console.log('修復前的問題:');
  console.log('❌ createProduct() 調用 POST /api/products (404 錯誤)');
  console.log('❌ searchProducts() 調用 GET /api/products/search (不存在)');
  console.log('❌ getLowStockProducts() 調用 GET /api/products/low-stock (不存在)');
  console.log('❌ updateProductStock() 調用 POST /api/products/batch-update-stock (不存在)');
  console.log('');
  
  console.log('修復後的改進:');
  console.log('✅ createProduct() 根據產品類型調用正確端點:');
  console.log('   - 商品: POST /api/products/product');
  console.log('   - 藥品: POST /api/products/medicine');
  console.log('✅ searchProducts() 使用 getAllProducts() + 客戶端過濾');
  console.log('✅ getLowStockProducts() 使用 getAllProducts() + 客戶端過濾');
  console.log('✅ updateProductStock() 使用 updateProduct() 逐一更新');
  console.log('✅ 支援最低庫存為 0 的情況');
  console.log('');
}

// 如果直接執行此文件，則運行測試
if (require.main === module) {
  showFixComparison();
  testProductApiClient();
}

export { testProductApiClient, showFixComparison };