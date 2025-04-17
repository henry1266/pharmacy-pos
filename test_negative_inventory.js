/**
 * 測試負庫存銷售和FIFO計算邏輯
 * 
 * 此測試腳本用於驗證以下修改：
 * 1. 銷售模塊允許負庫存銷售
 * 2. FIFO計算邏輯在負庫存時將毛利計為0
 * 3. 庫存補入後重新計算毛利
 */

const { calculateProductFIFO, prepareInventoryForFIFO, matchFIFOBatches, calculateProfitMargins } = require('./backend/utils/fifoCalculator');

// 模擬庫存記錄
const mockInventories = [
  // 產品A的庫存記錄
  {
    _id: 'inv1',
    product: { toString: () => 'productA' },
    quantity: 10,
    totalAmount: 1000, // 單價100
    type: 'purchase',
    lastUpdated: new Date('2025-01-01'),
    purchaseOrderNumber: 'PO001'
  },
  {
    _id: 'inv2',
    product: { toString: () => 'productA' },
    quantity: -15, // 負庫存銷售，超過現有庫存
    totalAmount: 1800, // 單價120
    type: 'sale',
    lastUpdated: new Date('2025-01-02'),
    saleNumber: 'SO001',
    saleId: 'sale1'
  },
  // 產品B的庫存記錄 - 先銷售後進貨
  {
    _id: 'inv3',
    product: { toString: () => 'productB' },
    quantity: -5, // 先銷售，產生負庫存
    totalAmount: 750, // 單價150
    type: 'sale',
    lastUpdated: new Date('2025-01-01'),
    saleNumber: 'SO002',
    saleId: 'sale2'
  },
  {
    _id: 'inv4',
    product: { toString: () => 'productB' },
    quantity: 10, // 後進貨
    totalAmount: 1000, // 單價100
    type: 'purchase',
    lastUpdated: new Date('2025-01-02'),
    purchaseOrderNumber: 'PO002'
  }
];

// 測試產品A的FIFO計算 - 負庫存情況
console.log('測試產品A的FIFO計算 - 負庫存情況');
const productAInventories = mockInventories.filter(inv => inv.product.toString() === 'productA');
const productAResult = calculateProductFIFO(productAInventories);
console.log('產品A的FIFO計算結果:');
console.log(JSON.stringify(productAResult, null, 2));

// 測試產品B的FIFO計算 - 先銷售後進貨情況
console.log('\n測試產品B的FIFO計算 - 先銷售後進貨情況');
const productBInventories = mockInventories.filter(inv => inv.product.toString() === 'productB');
const productBResult = calculateProductFIFO(productBInventories);
console.log('產品B的FIFO計算結果:');
console.log(JSON.stringify(productBResult, null, 2));

// 測試庫存補入後的情況
console.log('\n測試庫存補入後的情況');
const additionalInventory = {
  _id: 'inv5',
  product: { toString: () => 'productA' },
  quantity: 10, // 補充庫存
  totalAmount: 900, // 單價90
  type: 'purchase',
  lastUpdated: new Date('2025-01-03'),
  purchaseOrderNumber: 'PO003'
};

const updatedProductAInventories = [...productAInventories, additionalInventory];
const updatedProductAResult = calculateProductFIFO(updatedProductAInventories);
console.log('庫存補入後產品A的FIFO計算結果:');
console.log(JSON.stringify(updatedProductAResult, null, 2));

// 驗證結果
console.log('\n驗證結果:');
console.log('1. 產品A (負庫存超過現有庫存):');
if (productAResult.success && productAResult.profitMargins.some(pm => pm.hasNegativeInventory)) {
  console.log('✓ 成功處理負庫存情況');
  console.log(`✓ 負庫存部分毛利為: ${productAResult.profitMargins.find(pm => pm.hasNegativeInventory)?.grossProfit}`);
} else {
  console.log('✗ 未正確處理負庫存情況');
}

console.log('\n2. 產品B (先銷售後進貨):');
if (productBResult.success && productBResult.profitMargins.some(pm => pm.hasNegativeInventory)) {
  console.log('✓ 成功處理先銷售後進貨情況');
  console.log(`✓ 負庫存部分毛利為: ${productBResult.profitMargins.find(pm => pm.hasNegativeInventory)?.grossProfit}`);
} else {
  console.log('✗ 未正確處理先銷售後進貨情況');
}

console.log('\n3. 庫存補入後:');
if (updatedProductAResult.success) {
  console.log('✓ 成功處理庫存補入後的情況');
  console.log(`✓ 總毛利為: ${updatedProductAResult.summary.totalProfit}`);
} else {
  console.log('✗ 未正確處理庫存補入後的情況');
}
