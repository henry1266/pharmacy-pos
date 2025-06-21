/**
 * 庫存報表模組共用工具函數
 */

import { Transaction, TransactionItem, GroupedProduct } from './types';

/**
 * 格式化金額
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0
  }).format(amount);
};

/**
 * 計算單筆交易的損益
 */
export const calculateTransactionProfitLoss = (transaction: Transaction): number => {
  if (transaction.type === '進貨') {
    // 進貨為負數
    return -(transaction.quantity * transaction.price);
  } else if (transaction.type === '銷售' || transaction.type === '出貨') {
    // 銷售為正數
    return transaction.quantity * transaction.price;
  }
  return 0;
};

/**
 * 根據交易類型獲取對應的單號
 */
export const getOrderNumber = (transaction: Transaction): string => {
  if (transaction.type === '進貨') {
    return transaction.purchaseOrderNumber || '-';
  } else if (transaction.type === '出貨') {
    return transaction.shippingOrderNumber || '-';
  } else if (transaction.type === '銷售') {
    return transaction.saleNumber || '-';
  }
  return '-';
};

/**
 * 獲取交易類型對應的顏色
 */
export const getTypeColor = (type: string): string => {
  switch (type) {
    case '進貨':
      return 'var(--primary-color)';
    case '出貨':
      return 'var(--warning-color)';
    case '銷售':
      return 'var(--danger-color)';
    default:
      return 'var(--text-secondary)';
  }
};

/**
 * 獲取交易類型對應的背景色
 */
export const getTypeBgColor = (type: string): string => {
  switch (type) {
    case '進貨':
      return 'rgba(98, 75, 255, 0.1)';
    case '出貨':
      return 'rgba(245, 166, 35, 0.1)';
    case '銷售':
      return 'rgba(229, 63, 60, 0.1)';
    default:
      return 'rgba(0, 0, 0, 0.05)';
  }
};

/**
 * 獲取盈虧顏色
 */
export const getProfitLossColor = (value: number): string => {
  return value >= 0 ? 'success.main' : 'error.main';
};

/**
 * 確定交易類型
 */
export const determineTransactionType = (itemType: string): string => {
  if (itemType === 'purchase') {
    return '進貨';
  } else if (itemType === 'ship') {
    return '出貨';
  } else if (itemType === 'sale') {
    return '銷售';
  }
  return '其他';
};

/**
 * 計算交易價格
 */
export const calculateItemPrice = (item: TransactionItem): number => {
  if (item.totalAmount && item.quantity) {
    return Math.abs(item.totalAmount / item.quantity);
  } else if (item.type === 'purchase') {
    return item.price || item.purchasePrice || 0;
  } else {
    return item.price || item.sellingPrice || 0;
  }
};

/**
 * 按貨單號排序交易記錄（由小到大）
 */
export const sortTransactionsByOrderNumber = (transactions: Transaction[], ascending = true): Transaction[] => {
  return [...transactions].sort((a, b) => {
    const aOrderNumber = getOrderNumber(a);
    const bOrderNumber = getOrderNumber(b);
    return ascending 
      ? aOrderNumber.localeCompare(bOrderNumber)
      : bOrderNumber.localeCompare(aOrderNumber);
  });
};

/**
 * 計算累積庫存和損益總和
 */
export const calculateCumulativeValues = (transactions: Transaction[]): Transaction[] => {
  const sortedTransactions = sortTransactionsByOrderNumber(transactions, true);
  let cumulativeStock = 0;
  let cumulativeProfitLoss = 0;
  
  return sortedTransactions.map(transaction => {
    // 計算庫存變化
    cumulativeStock += transaction.quantity;
    
    // 計算損益變化
    if (transaction.type === '進貨') {
      cumulativeProfitLoss += calculateTransactionProfitLoss(transaction);
    } else if (transaction.type === '銷售' || transaction.type === '出貨') {
      cumulativeProfitLoss -= calculateTransactionProfitLoss(transaction);
    }
    
    return {
      ...transaction,
      cumulativeStock,
      cumulativeProfitLoss
    };
  });
};

/**
 * 計算累積損益的輔助函數
 */
export const calculateCumulativeProfitLoss = (
  transactions: Transaction[], 
  endIndex: number, 
  profitLossCalculator: (transaction: Transaction) => number
): number => {
  let result = 0;
  for (let i = 0; i <= endIndex; i++) {
    const transaction = transactions[i];
    if (transaction.type === '進貨') {
      result += profitLossCalculator(transaction);
    } else if (transaction.type === '銷售' || transaction.type === '出貨') {
      result -= profitLossCalculator(transaction);
    }
  }
  return result;
};

/**
 * 處理庫存數據分組
 */
export const processInventoryData = (data: TransactionItem[]): {
  groupedData: GroupedProduct[];
  totalQuantity: number;
  profitLossSum: number;
  incomeSum: number;
  costSum: number;
} => {
  // 按產品ID分組
  const groupedByProduct: Record<string, GroupedProduct> = {};
  let totalQuantity = 0;
  let profitLossSum = 0;
  let incomeSum = 0; // 總收入（出貨和銷售的總和）
  let costSum = 0; // 總成本（進貨的總和）
  
  data.forEach(item => {
    const productId = item.productId;
    
    if (!groupedByProduct[productId]) {
      groupedByProduct[productId] = {
        productId: productId,
        productCode: item.productCode,
        productName: item.productName,
        category: item.category,
        supplier: typeof item.supplier === 'string' ? { name: item.supplier } : item.supplier as any,
        unit: item.unit,
        price: item.price || (item.type === 'purchase' ? item.purchasePrice : item.sellingPrice) || 0,
        status: item.status,
        totalQuantity: 0,
        totalInventoryValue: 0,
        totalPotentialRevenue: 0,
        totalPotentialProfit: 0,
        transactions: []
      };
    }
    
    // 計算總數量和價值
    groupedByProduct[productId].totalQuantity += item.quantity;
    groupedByProduct[productId].totalInventoryValue += item.inventoryValue;
    groupedByProduct[productId].totalPotentialRevenue += item.potentialRevenue;
    groupedByProduct[productId].totalPotentialProfit += item.potentialProfit;
    
    // 確定交易類型
    const transactionType = determineTransactionType(item.type);
    
    // 計算交易價格
    const itemPrice = calculateItemPrice(item);
    
    // 添加交易記錄
    const transaction: Transaction = {
      purchaseOrderNumber: item.purchaseOrderNumber || '-',
      shippingOrderNumber: item.shippingOrderNumber || '-',
      saleNumber: item.saleNumber || '-',
      type: transactionType,
      quantity: item.quantity,
      currentStock: item.currentStock || 0,
      price: itemPrice,
      date: item.date || item.lastUpdated || new Date(),
      orderNumber: item.orderNumber || ''
    };
    
    groupedByProduct[productId].transactions.push(transaction);
    
    // 更新總計
    totalQuantity += item.quantity;
  });
  
  // 轉換為數組
  const groupedArray = Object.values(groupedByProduct);
  
  // 計算每個商品的損益總和
  groupedArray.forEach(product => {
    if (product.transactions.length > 0) {
      // 按貨單號排序交易記錄（由小到大）
      const sortedTransactions = sortTransactionsByOrderNumber(product.transactions, true);
      
      // 計算累積損益
      let cumulativeProfitLoss = 0;
      sortedTransactions.forEach(transaction => {
        if (transaction.type === '進貨') {
          cumulativeProfitLoss += calculateTransactionProfitLoss(transaction);
          // 計算進貨總成本
          costSum += transaction.quantity * transaction.price;
        } else if (transaction.type === '銷售' || transaction.type === '出貨') {
          cumulativeProfitLoss -= calculateTransactionProfitLoss(transaction);
          // 計算出貨和銷售總收入
          incomeSum += transaction.quantity * transaction.price;
        }
      });
      
      // 按貨單號排序（由大到小）
      const sortedByDescending = sortTransactionsByOrderNumber(product.transactions, false);
      
      // 計算貨單號最大的那筆交易的累積損益
      if (sortedByDescending.length > 0) {
        // 找到貨單號最大的交易
        const latestTransaction = sortedByDescending[0];
        
        // 找到該交易在原始排序中的位置
        const index = sortedTransactions.findIndex(t => 
          getOrderNumber(t) === getOrderNumber(latestTransaction));
        
        if (index !== -1) {
          // 計算到該交易為止的累積損益
          const latestCumulativeProfitLoss = calculateCumulativeProfitLoss(
            sortedTransactions, 
            index, 
            calculateTransactionProfitLoss
          );
          
          // 將貨單號最大的交易的累積損益加入總損益
          profitLossSum += latestCumulativeProfitLoss;
        }
      }
    }
  });
  
  // 按總數量排序
  groupedArray.sort((a, b) => b.totalQuantity - a.totalQuantity);
  
  return {
    groupedData: groupedArray,
    totalQuantity,
    profitLossSum,
    incomeSum,
    costSum
  };
};

/**
 * 構建查詢參數
 */
export const buildQueryParams = (filters: any): URLSearchParams => {
  const params = new URLSearchParams();
  if (filters?.supplier) params.append('supplier', filters.supplier);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.productCode) params.append('productCode', filters.productCode);
  if (filters?.productName) params.append('productName', filters.productName);
  if (filters?.productType) params.append('productType', filters.productType);
  
  // 添加參數以獲取完整的交易歷史記錄
  params.append('includeTransactionHistory', 'true');
  params.append('useSequentialProfitLoss', 'true');
  
  return params;
};