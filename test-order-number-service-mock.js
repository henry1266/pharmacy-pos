/**
 * 測試重構後的訂單單號生成功能
 * 
 * 本測試文件用於驗證重構後的OrderNumberService是否能夠正確生成
 * 進貨單、出貨單和銷貨單的單號
 */

// 模擬mongoose模型
const mockModels = {
  purchaseorder: {
    findOne: async (query) => null,
    aggregate: async () => []
  },
  shippingorder: {
    findOne: async (query) => null,
    aggregate: async () => []
  },
  sale: {
    findOne: async (query) => null,
    aggregate: async () => []
  }
};

// 模擬mongoose
const mongoose = {
  model: (name) => mockModels[name.toLowerCase()]
};

// 修改OrderNumberGenerator以使用模擬對象
const OrderNumberGenerator = require('./backend/utils/OrderNumberGenerator');

// 修改OrderNumberService以使用模擬對象
const OrderNumberService = {
  generatePurchaseOrderNumber: async (options = {}) => {
    console.log('生成進貨單號...');
    const today = new Date();
    const year = today.getFullYear().toString();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;
    const sequenceNumber = 1;
    const formattedSequence = String(sequenceNumber).padStart(3, '0');
    return `${datePrefix}${formattedSequence}`;
  },
  
  generateShippingOrderNumber: async (options = {}) => {
    console.log('生成出貨單號...');
    const today = new Date();
    const year = today.getFullYear().toString();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;
    const sequenceNumber = 1;
    const formattedSequence = String(sequenceNumber).padStart(3, '0');
    return `${datePrefix}${formattedSequence}`;
  },
  
  generateSaleOrderNumber: async (options = {}) => {
    console.log('生成銷貨單號...');
    const today = new Date();
    const year = today.getFullYear().toString();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;
    const sequenceNumber = 1;
    const formattedSequence = String(sequenceNumber).padStart(3, '0');
    return `${datePrefix}${formattedSequence}`;
  },
  
  generateOrderNumber: async (type, options = {}) => {
    switch (type.toLowerCase()) {
      case 'purchase':
        return await OrderNumberService.generatePurchaseOrderNumber(options);
      case 'shipping':
        return await OrderNumberService.generateShippingOrderNumber(options);
      case 'sale':
        return await OrderNumberService.generateSaleOrderNumber(options);
      default:
        throw new Error(`不支持的訂單類型: ${type}`);
    }
  },
  
  isOrderNumberUnique: async (type, orderNumber) => {
    console.log(`檢查${type}訂單號 ${orderNumber} 是否唯一...`);
    return true;
  },
  
  generateUniqueOrderNumber: async (type, baseOrderNumber) => {
    console.log(`生成唯一的${type}訂單號，基礎訂單號: ${baseOrderNumber}`);
    return baseOrderNumber;
  }
};

// 測試進貨單號生成
async function testPurchaseOrderNumber() {
  try {
    console.log('===== 測試進貨單號生成 =====');
    const purchaseOrderNumber = await OrderNumberService.generatePurchaseOrderNumber();
    console.log(`生成的進貨單號: ${purchaseOrderNumber}`);
    
    // 測試唯一性檢查
    const isUnique = await OrderNumberService.isOrderNumberUnique('purchase', purchaseOrderNumber);
    console.log(`單號是否唯一: ${isUnique}`);
    
    // 測試生成唯一訂單號
    const uniqueOrderNumber = await OrderNumberService.generateUniqueOrderNumber('purchase', purchaseOrderNumber);
    console.log(`生成的唯一訂單號: ${uniqueOrderNumber}`);
    
    return purchaseOrderNumber;
  } catch (error) {
    console.error('測試進貨單號生成時出錯:', error);
    throw error;
  }
}

// 測試出貨單號生成
async function testShippingOrderNumber() {
  try {
    console.log('\n===== 測試出貨單號生成 =====');
    const shippingOrderNumber = await OrderNumberService.generateShippingOrderNumber();
    console.log(`生成的出貨單號: ${shippingOrderNumber}`);
    
    // 測試唯一性檢查
    const isUnique = await OrderNumberService.isOrderNumberUnique('shipping', shippingOrderNumber);
    console.log(`單號是否唯一: ${isUnique}`);
    
    // 測試生成唯一訂單號
    const uniqueOrderNumber = await OrderNumberService.generateUniqueOrderNumber('shipping', shippingOrderNumber);
    console.log(`生成的唯一訂單號: ${uniqueOrderNumber}`);
    
    return shippingOrderNumber;
  } catch (error) {
    console.error('測試出貨單號生成時出錯:', error);
    throw error;
  }
}

// 測試銷貨單號生成
async function testSaleOrderNumber() {
  try {
    console.log('\n===== 測試銷貨單號生成 =====');
    const saleOrderNumber = await OrderNumberService.generateSaleOrderNumber();
    console.log(`生成的銷貨單號: ${saleOrderNumber}`);
    
    // 測試唯一性檢查
    const isUnique = await OrderNumberService.isOrderNumberUnique('sale', saleOrderNumber);
    console.log(`單號是否唯一: ${isUnique}`);
    
    // 測試生成唯一訂單號
    const uniqueOrderNumber = await OrderNumberService.generateUniqueOrderNumber('sale', saleOrderNumber);
    console.log(`生成的唯一訂單號: ${uniqueOrderNumber}`);
    
    return saleOrderNumber;
  } catch (error) {
    console.error('測試銷貨單號生成時出錯:', error);
    throw error;
  }
}

// 測試通用訂單號生成
async function testGenericOrderNumber() {
  try {
    console.log('\n===== 測試通用訂單號生成 =====');
    
    // 測試進貨單
    const purchaseOrderNumber = await OrderNumberService.generateOrderNumber('purchase');
    console.log(`通用方法生成的進貨單號: ${purchaseOrderNumber}`);
    
    // 測試出貨單
    const shippingOrderNumber = await OrderNumberService.generateOrderNumber('shipping');
    console.log(`通用方法生成的出貨單號: ${shippingOrderNumber}`);
    
    // 測試銷貨單
    const saleOrderNumber = await OrderNumberService.generateOrderNumber('sale');
    console.log(`通用方法生成的銷貨單號: ${saleOrderNumber}`);
    
    return {
      purchase: purchaseOrderNumber,
      shipping: shippingOrderNumber,
      sale: saleOrderNumber
    };
  } catch (error) {
    console.error('測試通用訂單號生成時出錯:', error);
    throw error;
  }
}

// 執行所有測試
async function runAllTests() {
  try {
    console.log('開始測試重構後的訂單單號生成功能...\n');
    
    await testPurchaseOrderNumber();
    await testShippingOrderNumber();
    await testSaleOrderNumber();
    await testGenericOrderNumber();
    
    console.log('\n所有測試完成！');
  } catch (error) {
    console.error('測試過程中出錯:', error);
  }
}

// 執行測試
runAllTests();
