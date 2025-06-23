import express, { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';

// 使用 ES6 import 導入模型
import Sale from '../models/Sale';
import BaseProduct, { Product } from '../models/BaseProduct';
import Inventory from '../models/Inventory';
import Supplier from '../models/Supplier';
import { ApiResponse, ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';

// 定義查詢參數介面
interface ReportQueryParams {
  startDate?: string;
  endDate?: string;
  groupBy?: string;
  productType?: string;
  category?: string;
  supplier?: string;
  productCode?: string;
  productName?: string;
}

// 定義產品介面
interface Product {
  _id: Types.ObjectId;
  code: string;
  name: string;
  category: string;
  productType: string;
  supplier?: {
    _id: Types.ObjectId;
    name: string;
  };
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  minStock: number;
}

// 定義銷售項目介面
interface SaleItem {
  product?: Types.ObjectId | Product;
  quantity: number;
  price: number;
  subtotal: number;
}

// 定義銷售記錄介面
interface SaleRecord {
  _id: Types.ObjectId;
  saleNumber?: string;
  date: Date;
  customer?: Types.ObjectId | {
    _id: Types.ObjectId;
    name: string;
  };
  totalAmount: number;
  discount: number;
  paymentMethod: string;
  paymentStatus: string;
  items: SaleItem[];
  cashier?: Types.ObjectId | {
    _id: Types.ObjectId;
    name: string;
  };
}

// 定義庫存記錄介面
interface InventoryRecord {
  _id: Types.ObjectId;
  product: Product;
  quantity: number;
  totalAmount?: number;
  batchNumber?: string;
  expiryDate?: Date;
  location?: string;
  lastUpdated: Date;
  purchaseOrderNumber?: string;
  shippingOrderNumber?: string;
  saleNumber?: string;
  type?: string;
}

// 定義分組銷售數據介面
interface GroupedSalesData {
  date?: string;
  month?: string;
  productId?: string;
  productCode?: string;
  productName?: string;
  customerId?: string;
  customerName?: string;
  totalAmount: number;
  orderCount: number;
  quantity?: number;
  revenue?: number;
  items?: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
}

// 定義銷售摘要介面
interface SalesSummary {
  totalSales: number;
  orderCount: number;
  averageOrderValue: number;
}

// 定義庫存數據介面
interface InventoryData {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  category: string;
  productType: string;
  supplier: {
    id: string;
    name: string;
  } | null;
  quantity: number;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  inventoryValue: number;
  potentialRevenue: number;
  potentialProfit: number;
  totalAmount: number;
  minStock: number;
  status: 'low' | 'normal';
  batchNumber: string;
  expiryDate: Date | undefined;
  location: string;
  lastUpdated: Date;
  purchaseOrderNumber: string;
  shippingOrderNumber: string;
  saleNumber: string;
  type: string;
}

// 定義庫存摘要介面
interface InventorySummary {
  totalItems: number;
  totalInventoryValue: number;
  totalPotentialRevenue: number;
  totalPotentialProfit: number;
  lowStockCount: number;
}

// 定義盈虧數據介面
interface ProfitLossData {
  purchaseOrderNumber: string;
  totalQuantity: number;
  totalCost: number;
  totalRevenue: number;
  profitLoss: number;
  items: Array<{
    productId: string;
    productCode: string;
    productName: string;
    quantity: number;
    purchasePrice: number;
    sellingPrice: number;
    cost: number;
    revenue: number;
    profit: number;
  }>;
}

// 定義盈虧摘要介面
interface ProfitLossSummary {
  totalPurchaseOrders: number;
  totalQuantity: number;
  totalCost: number;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
}

const router: express.Router = express.Router();

// 共用函數：構建產品查詢條件
function buildProductQuery(queryParams: ReportQueryParams): Record<string, any> {
  const { productType, category, supplier, productCode, productName } = queryParams;
  
  const productQuery: Record<string, any> = {};
  if (productType && (productType === 'product' || productType === 'medicine')) {
    productQuery.productType = productType.toString();
  }
  if (category) {
    productQuery.category = category.toString();
  }
  if (supplier) {
    productQuery.supplier = new mongoose.Types.ObjectId(supplier.toString());
  }
  if (productCode) {
    productQuery.code = { $regex: productCode.toString(), $options: 'i' };
  }
  if (productName) {
    productQuery.name = { $regex: productName.toString(), $options: 'i' };
  }
  
  return productQuery;
}

// 共用函數：安全地轉換為字串
function safeToString(value: any, defaultValue: string = ""): string {
  if (value === null || value === undefined) return defaultValue;
  return value.toString();
}

// 類型守衛函數
function isPopulatedProduct(product: any): product is Product {
  return product && typeof product === 'object' && 'name' in product && 'code' in product;
}

function isPopulatedCustomer(customer: any): customer is { _id: Types.ObjectId; name: string } {
  return customer && typeof customer === 'object' && 'name' in customer;
}

// 共用函數：處理日期範圍查詢
function buildDateRangeFilter(startDate?: string, endDate?: string): Record<string, Date> {
  const dateFilter: Record<string, Date> = {};
  if (startDate) {
    dateFilter.$gte = new Date(startDate);
  }
  if (endDate) {
    const endDateTime = new Date(endDate);
    // 設置結束日期為當天的最後一毫秒
    endDateTime.setHours(23, 59, 59, 999);
    dateFilter.$lte = endDateTime;
  }
  return dateFilter;
}

// 共用函數：從MongoDB格式的對象ID中提取值
function extractMongoId(mongoId: any): string {
  if (!mongoId) return '';
  
  if (typeof mongoId === 'object' && mongoId.$oid) {
    return mongoId.$oid;
  }
  
  if (typeof mongoId === 'object' && mongoId._id) {
    if (typeof mongoId._id === 'object' && mongoId._id.$oid) {
      return mongoId._id.$oid;
    }
    return mongoId._id.toString();
  }
  
  if (typeof mongoId === 'string') {
    return mongoId;
  }
  
  return '';
}

// @route   GET api/reports/sales
// @desc    Get sales report data
// @access  Public
router.get('/sales', async (req: Request, res: Response) => {
  try {
    // 獲取查詢參數
    const { startDate, endDate, groupBy } = req.query as ReportQueryParams;
    
    // 設置日期範圍
    const dateFilter = buildDateRangeFilter(startDate, endDate);
    
    // 構建查詢條件
    const query: Record<string, any> = {};
    if (Object.keys(dateFilter).length > 0) {
      query.date = dateFilter;
    }
    
    // 獲取銷售數據
    const sales: SaleRecord[] = await Sale.find(query)
      .populate('customer')
      .populate('items.product')
      .populate('cashier')
      .sort({ date: 1 });
    
    // 處理分組
    let groupedData: GroupedSalesData[] = [];
    
    if (groupBy === 'day') {
      groupedData = groupSalesByDay(sales);
    } else if (groupBy === 'month') {
      groupedData = groupSalesByMonth(sales);
    } else if (groupBy === 'product') {
      groupedData = groupSalesByProduct(sales);
    } else if (groupBy === 'customer') {
      groupedData = groupSalesByCustomer(sales);
    } else {
      // 不分組，返回所有銷售記錄
      groupedData = formatSalesData(sales);
    }
    
    // 計算總計
    const summary: SalesSummary = {
      totalSales: sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
      orderCount: sales.length,
      averageOrderValue: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.totalAmount, 0) / sales.length : 0
    };
    
    const response: ApiResponse<{
      data: GroupedSalesData[];
      summary: SalesSummary;
    }> = {
      success: true,
      message: '銷售報表數據獲取成功',
      data: {
        data: groupedData,
        summary
      },
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    console.error((err as Error).message);
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// 輔助函數：按日分組銷售數據
function groupSalesByDay(sales: SaleRecord[]): GroupedSalesData[] {
  const salesByDay: Record<string, GroupedSalesData> = {};
  
  sales.forEach(sale => {
    const dateStr = sale.date.toISOString().split('T')[0];
    if (dateStr && !salesByDay[dateStr]) {
      salesByDay[dateStr] = {
        date: dateStr,
        totalAmount: 0,
        orderCount: 0,
        items: []
      };
    }
    if (dateStr && salesByDay[dateStr]) {
      salesByDay[dateStr].totalAmount += sale.totalAmount;
      salesByDay[dateStr].orderCount += 1;
      
      sale.items.forEach(item => {
        if (salesByDay[dateStr].items) {
          salesByDay[dateStr].items.push({
            productId: safeToString(item.product?._id),
            productName: isPopulatedProduct(item.product) ? safeToString(item.product.name) : '',
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal
          });
        }
      });
    }
  });
  
  return Object.values(salesByDay);
}

// 輔助函數：按月分組銷售數據
function groupSalesByMonth(sales: SaleRecord[]): GroupedSalesData[] {
  const salesByMonth: Record<string, GroupedSalesData> = {};
  
  sales.forEach(sale => {
    const date = new Date(sale.date);
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!salesByMonth[monthStr]) {
      salesByMonth[monthStr] = {
        month: monthStr,
        totalAmount: 0,
        orderCount: 0,
        items: []
      };
    }
    salesByMonth[monthStr].totalAmount += sale.totalAmount;
    salesByMonth[monthStr].orderCount += 1;
    
    sale.items.forEach(item => {
      if (salesByMonth[monthStr].items) {
        salesByMonth[monthStr].items.push({
          productId: safeToString(item.product?._id),
          productName: isPopulatedProduct(item.product) ? safeToString(item.product.name) : '',
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal
        });
      }
    });
  });
  
  return Object.values(salesByMonth);
}

// 輔助函數：按產品分組銷售數據
function groupSalesByProduct(sales: SaleRecord[]): GroupedSalesData[] {
  const salesByProduct: Record<string, GroupedSalesData> = {};
  
  sales.forEach(sale => {
    sale.items.forEach(item => {
      const productId = safeToString(item.product?._id);
      if (!salesByProduct[productId]) {
        salesByProduct[productId] = {
          productId,
          productCode: isPopulatedProduct(item.product) ? item.product.code : '',
          productName: isPopulatedProduct(item.product) ? item.product.name : '',
          quantity: 0,
          revenue: 0,
          orderCount: 0,
          totalAmount: 0
        };
      }
      salesByProduct[productId].quantity! += item.quantity;
      salesByProduct[productId].revenue! += item.subtotal;
      salesByProduct[productId].orderCount += 1;
      salesByProduct[productId].totalAmount += item.subtotal;
    });
  });
  
  return Object.values(salesByProduct).sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0));
}

// 輔助函數：按客戶分組銷售數據
function groupSalesByCustomer(sales: SaleRecord[]): GroupedSalesData[] {
  const salesByCustomer: Record<string, GroupedSalesData> = {};
  
  sales.forEach(sale => {
    let customerId = 'anonymous';
    let customerName = '一般客戶';
    
    if (sale.customer) {
      customerId = safeToString(sale.customer._id);
      if (isPopulatedCustomer(sale.customer)) {
        customerName = safeToString(sale.customer.name);
      }
    }
    
    if (!salesByCustomer[customerId]) {
      salesByCustomer[customerId] = {
        customerId,
        customerName,
        totalAmount: 0,
        orderCount: 0
      };
    }
    
    const customerData = salesByCustomer[customerId];
    if (customerData) {
      customerData.totalAmount += sale.totalAmount;
      customerData.orderCount += 1;
    }
  });
  
  return Object.values(salesByCustomer).sort((a, b) => b.totalAmount - a.totalAmount);
}

// 輔助函數：格式化銷售數據
function formatSalesData(sales: SaleRecord[]): GroupedSalesData[] {
  return sales.map(sale => {
    let customerName = '一般客戶';
    if (sale.customer && isPopulatedCustomer(sale.customer)) {
      customerName = safeToString(sale.customer.name);
    }
    
    return {
      date: sale.date.toISOString(),
      customerId: safeToString(sale.customer?._id),
      customerName: customerName,
      totalAmount: sale.totalAmount,
      orderCount: 1,
      items: sale.items.map(item => ({
        productId: safeToString(item.product?._id),
        productName: isPopulatedProduct(item.product) ? safeToString(item.product.name) : '',
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      }))
    };
  });
}

// @route   GET api/reports/inventory
// @desc    Get inventory report data
// @access  Public
router.get('/inventory', async (req: Request, res: Response) => {
  try {
    // 構建產品查詢條件
    const productQuery = buildProductQuery(req.query as ReportQueryParams);
    
    // 獲取符合條件的產品
    const products: any[] = await BaseProduct.find(productQuery).populate('supplier');
    const productIds = products.map(product => safeToString(product._id));
    
    // 獲取這些產品的庫存數據
    const inventory: any[] = await Inventory.find({
      product: { $in: productIds }
    }).populate({
      path: 'product',
      populate: { path: 'supplier' }
    });
    
    // 處理數據
    const inventoryData = processInventoryData(inventory);
    
    // 計算總計
    const summary = calculateInventorySummary(inventoryData);
    
    // 按類別和產品類型分組
    const { categoryGroups, productTypeGroups } = groupInventoryData(inventoryData);
    
    // 獲取所有供應商和類別，用於前端篩選器
    const allSuppliers = await Supplier.find({}, 'name');
    const allCategories = [...new Set(products.map(product => product.category))].filter(Boolean);
    
    const response: ApiResponse<{
      data: InventoryData[];
      summary: InventorySummary;
      categoryGroups: any[];
      productTypeGroups: any[];
      filters: {
        suppliers: any[];
        categories: string[];
      };
    }> = {
      success: true,
      message: '庫存報表數據獲取成功',
      data: {
        data: inventoryData,
        summary,
        categoryGroups: Object.values(categoryGroups),
        productTypeGroups: Object.values(productTypeGroups),
        filters: {
          suppliers: allSuppliers,
          categories: allCategories
        }
      },
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    console.error((err as Error).message);
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// 輔助函數：處理庫存數據
function processInventoryData(inventory: InventoryRecord[]): InventoryData[] {
  return inventory.filter(item => item.product).map(item => ({
    id: safeToString(item._id),
    productId: safeToString(item.product._id),
    productCode: safeToString(item.product.code),
    productName: safeToString(item.product.name),
    category: safeToString(item.product.category),
    productType: safeToString(item.product.productType, 'product'),
    supplier: item.product.supplier ? {
      id: safeToString(item.product.supplier._id),
      name: safeToString(item.product.supplier.name)
    } : null,
    quantity: item.quantity,
    unit: safeToString(item.product.unit),
    purchasePrice: item.product.purchasePrice,
    sellingPrice: item.product.sellingPrice,
    inventoryValue: item.quantity * item.product.purchasePrice,
    potentialRevenue: item.quantity * item.product.sellingPrice,
    potentialProfit: item.quantity * (item.product.sellingPrice - item.product.purchasePrice),
    totalAmount: item.totalAmount ?? 0,
    minStock: item.product.minStock,
    status: item.quantity <= item.product.minStock ? 'low' : 'normal',
    batchNumber: safeToString(item.batchNumber),
    expiryDate: item.expiryDate,
    location: safeToString(item.location),
    lastUpdated: item.lastUpdated,
    purchaseOrderNumber: safeToString(item.purchaseOrderNumber),
    shippingOrderNumber: safeToString(item.shippingOrderNumber),
    saleNumber: safeToString(item.saleNumber),
    type: safeToString(item.type)
  }));
}

// 輔助函數：計算庫存摘要
function calculateInventorySummary(inventoryData: InventoryData[]): InventorySummary {
  const totalInventoryValue = inventoryData.reduce((sum, item) => sum + item.inventoryValue, 0);
  const totalPotentialRevenue = inventoryData.reduce((sum, item) => sum + item.potentialRevenue, 0);
  const totalPotentialProfit = inventoryData.reduce((sum, item) => sum + item.potentialProfit, 0);
  const lowStockCount = inventoryData.filter(item => item.status === 'low').length;
  
  return {
    totalItems: inventoryData.length,
    totalInventoryValue,
    totalPotentialRevenue,
    totalPotentialProfit,
    lowStockCount
  };
}

// 輔助函數：按類別和產品類型分組庫存數據
function groupInventoryData(inventoryData: InventoryData[]): {
  categoryGroups: Record<string, any>;
  productTypeGroups: Record<string, any>;
} {
  // 按類別分組
  const categoryGroups: Record<string, any> = {};
  
  // 按產品類型分組
  const productTypeGroups: Record<string, any> = {
    product: {
      type: 'product',
      label: '商品',
      itemCount: 0,
      totalQuantity: 0,
      inventoryValue: 0,
      potentialRevenue: 0,
      potentialProfit: 0
    },
    medicine: {
      type: 'medicine',
      label: '藥品',
      itemCount: 0,
      totalQuantity: 0,
      inventoryValue: 0,
      potentialRevenue: 0,
      potentialProfit: 0
    }
  };
  
  inventoryData.forEach(item => {
    // 按類別分組
    categoryGroups[item.category] ??= {
      category: item.category,
      itemCount: 0,
      totalQuantity: 0,
      inventoryValue: 0,
      potentialRevenue: 0,
      potentialProfit: 0
    };
    
    categoryGroups[item.category].itemCount += 1;
    categoryGroups[item.category].totalQuantity += item.quantity;
    categoryGroups[item.category].inventoryValue += item.inventoryValue;
    categoryGroups[item.category].potentialRevenue += item.potentialRevenue;
    categoryGroups[item.category].potentialProfit += item.potentialProfit;
    
    // 按產品類型分組
    const type = item.productType ?? 'product';
    if (productTypeGroups[type]) {
      productTypeGroups[type].itemCount += 1;
      productTypeGroups[type].totalQuantity += item.quantity;
      productTypeGroups[type].inventoryValue += item.inventoryValue;
      productTypeGroups[type].potentialRevenue += item.potentialRevenue;
      productTypeGroups[type].potentialProfit += item.potentialProfit;
    }
  });
  
  return { categoryGroups, productTypeGroups };
}

// @route   GET api/reports/inventory/profit-loss
// @desc    Get inventory profit-loss data by purchase order
// @access  Public
router.get('/inventory/profit-loss', async (req: Request, res: Response) => {
  try {
    // 構建產品查詢條件
    const productQuery = buildProductQuery(req.query as ReportQueryParams);
    
    // 獲取符合條件的產品
    const products: Product[] = await BaseProduct.find(productQuery);
    const productIds = products.map(product => safeToString(product._id));
    
    // 獲取這些產品的庫存數據
    const inventory: any[] = await Inventory.find({
      product: { $in: productIds },
      purchaseOrderNumber: { $exists: true, $ne: null }
    }).populate('product');
    
    // 處理按照貨單單號分組並計算盈虧
    const profitLossByPO = processProfitLossByPurchaseOrder(inventory);
    
    // 轉換為數組並排序
    const profitLossData = Object.values(profitLossByPO).sort((a, b) => {
      // 按照貨單單號排序
      return a.purchaseOrderNumber.localeCompare(b.purchaseOrderNumber);
    });
    
    // 計算總計
    const summary = calculateProfitLossSummary(profitLossData);
    
    const response: ApiResponse<{
      data: ProfitLossData[];
      summary: ProfitLossSummary;
    }> = {
      success: true,
      message: '盈虧報表數據獲取成功',
      data: {
        data: profitLossData,
        summary
      },
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    console.error((err as Error).message);
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// 輔助函數：處理按照貨單單號分組並計算盈虧
function processProfitLossByPurchaseOrder(inventory: InventoryRecord[]): Record<string, ProfitLossData> {
  const profitLossByPO: Record<string, ProfitLossData> = {};
  
  inventory.forEach(item => {
    if (!item.product) return;
    
    const poNumber = safeToString(item.purchaseOrderNumber);
    if (!poNumber) return;
    
    if (!profitLossByPO[poNumber]) {
      profitLossByPO[poNumber] = {
        purchaseOrderNumber: poNumber,
        totalQuantity: 0,
        totalCost: 0,
        totalRevenue: 0,
        profitLoss: 0,
        items: []
      };
    }
    
    const cost = item.quantity * item.product.purchasePrice;
    const revenue = item.quantity * item.product.sellingPrice;
    const profit = revenue - cost;
    
    profitLossByPO[poNumber].totalQuantity += item.quantity;
    profitLossByPO[poNumber].totalCost += cost;
    profitLossByPO[poNumber].totalRevenue += revenue;
    profitLossByPO[poNumber].profitLoss += profit;
    
    profitLossByPO[poNumber].items.push({
      productId: safeToString(item.product._id),
      productCode: safeToString(item.product.code),
      productName: safeToString(item.product.name),
      quantity: item.quantity,
      purchasePrice: item.product.purchasePrice,
      sellingPrice: item.product.sellingPrice,
      cost: cost,
      revenue: revenue,
      profit: profit
    });
  });
  
  return profitLossByPO;
}

// 輔助函數：計算盈虧摘要
function calculateProfitLossSummary(profitLossData: ProfitLossData[]): ProfitLossSummary {
  const totalQuantity = profitLossData.reduce((sum, item) => sum + item.totalQuantity, 0);
  const totalCost = profitLossData.reduce((sum, item) => sum + item.totalCost, 0);
  const totalRevenue = profitLossData.reduce((sum, item) => sum + item.totalRevenue, 0);
  const totalProfit = profitLossData.reduce((sum, item) => sum + item.profitLoss, 0);
  
  return {
    totalPurchaseOrders: profitLossData.length,
    totalQuantity,
    totalCost,
    totalRevenue,
    totalProfit,
    profitMargin: totalCost > 0 ? (totalProfit / totalCost) * 100 : 0
  };
}

export default router;