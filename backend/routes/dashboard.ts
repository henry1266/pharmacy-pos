import express, { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';

// 使用 ES6 import 導入模型
import BaseProduct, { Product, Medicine } from '../models/BaseProduct';
import Sale from '../models/Sale';
import Customer from '../models/Customer';
import Inventory from '../models/Inventory';
import Supplier from '../models/Supplier';

// 定義庫存警告介面
interface LowStockWarning {
  productId: Types.ObjectId;
  productCode: string;
  productName: string;
  currentStock: number;
  minStock: number;
}

// 定義產品銷售統計介面
interface ProductSalesStats {
  quantity: number;
  revenue: number;
}

// 定義熱銷產品介面
interface TopProduct {
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  revenue: number;
}

// 定義最近銷售記錄介面
interface RecentSale {
  id: Types.ObjectId;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  date: Date;
  paymentStatus: string;
}

// 定義銷售摘要介面
interface SalesSummary {
  total: number;
  today: number;
  month: number;
}

// 定義統計數量介面
interface Counts {
  products: number;
  customers: number;
  suppliers: number;
  orders: number;
}

// 定義儀表板摘要回應介面
interface DashboardSummaryResponse {
  salesSummary: SalesSummary;
  counts: Counts;
  lowStockWarnings: LowStockWarning[];
  topProducts: TopProduct[];
  recentSales: RecentSale[];
}

// 定義銷售趨勢資料介面
interface SalesTrendData {
  date: string;
  amount: number;
  count: number;
}

// 定義類別銷售資料介面
interface CategorySales {
  category: string;
  amount: number;
}

// 定義銷售趨勢回應介面
interface SalesTrendResponse {
  salesTrend: SalesTrendData[];
  categorySales: CategorySales[];
}

// 定義銷售項目介面
interface SaleItem {
  product: Types.ObjectId;
  quantity: number;
  subtotal: number;
}

// 定義銷售記錄介面
interface SaleRecord {
  _id: Types.ObjectId;
  invoiceNumber: string;
  customer?: {
    name: string;
  };
  totalAmount: number;
  date: Date;
  paymentStatus: string;
  items: SaleItem[];
}

// 定義產品介面
interface Product {
  _id: Types.ObjectId;
  code: string;
  name: string;
  category: string;
  minStock?: number;
}

// 定義庫存記錄介面
interface InventoryRecord {
  product: Types.ObjectId;
  quantity: number;
  type?: string;
}

const router = express.Router();

// @route   GET api/dashboard/summary
// @desc    Get dashboard summary data
// @access  Public
router.get('/summary', async (req: Request, res: Response) => {
  try {
    // 獲取總銷售額
    const sales: SaleRecord[] = await Sale.find();
    const totalSales = sales.reduce((total, sale) => total + sale.totalAmount, 0);
    
    // 獲取今日銷售額
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySales: SaleRecord[] = await Sale.find({ date: { $gte: today } });
    const todaySalesAmount = todaySales.reduce((total, sale) => total + sale.totalAmount, 0);
    
    // 獲取本月銷售額
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthSales: SaleRecord[] = await Sale.find({ date: { $gte: firstDayOfMonth } });
    const monthSalesAmount = monthSales.reduce((total, sale) => total + sale.totalAmount, 0);
    
    // 獲取庫存警告（低於最低庫存量的產品）
    // 獲取所有產品
    const products: Product[] = await BaseProduct.find();
    
    // 計算每個產品的實際庫存
    const lowStockWarnings: LowStockWarning[] = [];
    
    for (const product of products) {
      if (!product.minStock) continue;
      
      // 獲取產品的所有庫存記錄
      const inventoryRecords: InventoryRecord[] = await Inventory.find({ product: product._id });
      
      // 計算實際庫存（進貨減去銷售）
      let currentStock = 0;
      inventoryRecords.forEach(record => {
        if (record.type === 'purchase' || !record.type) {
          currentStock += (parseInt(record.quantity.toString()) || 0);
        } else if (record.type === 'sale') {
          currentStock -= (parseInt(record.quantity.toString()) || 0);
        }
      });
      
      // 檢查是否低於最低庫存
      if (currentStock < product.minStock) {
        lowStockWarnings.push({
          productId: product._id,
          productCode: product.code,
          productName: product.name,
          currentStock: currentStock,
          minStock: product.minStock
        });
      }
    }
    
    // 獲取各種統計數據
    const productCount = await BaseProduct.countDocuments();
    const customerCount = await Customer.countDocuments();
    const supplierCount = await Supplier.countDocuments();
    const orderCount = sales.length;
    
    // 獲取最暢銷產品
    const productSales: Record<string, ProductSalesStats> = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const productId = item.product.toString();
        if (!productSales[productId]) {
          productSales[productId] = {
            quantity: 0,
            revenue: 0
          };
        }
        productSales[productId].quantity += item.quantity;
        productSales[productId].revenue += item.subtotal;
      });
    });
    
    const topProductsPromises = Object.keys(productSales)
      .sort((a, b) => (productSales[b]?.quantity || 0) - (productSales[a]?.quantity || 0))
      .slice(0, 5)
      .map(async (productId): Promise<TopProduct> => {
        const product: Product | null = await BaseProduct.findById(productId);
        const salesData = productSales[productId];
        return {
          productId,
          productCode: product ? product.code : 'Unknown',
          productName: product ? product.name : 'Unknown',
          quantity: salesData?.quantity || 0,
          revenue: salesData?.revenue || 0
        };
      });
    
    const topProducts = await Promise.all(topProductsPromises);
    
    // 獲取最近的銷售記錄
    const recentSales: SaleRecord[] = await Sale.find()
      .populate('customer')
      .sort({ date: -1 })
      .limit(5)
      .select('invoiceNumber customer totalAmount date paymentStatus');
    
    const formattedRecentSales: RecentSale[] = recentSales.map(sale => ({
      id: sale._id,
      invoiceNumber: sale.invoiceNumber,
      customerName: sale.customer ? sale.customer.name : '一般客戶',
      totalAmount: sale.totalAmount,
      date: sale.date,
      paymentStatus: sale.paymentStatus
    }));
    
    // 返回儀表板數據
    const response: DashboardSummaryResponse = {
      salesSummary: {
        total: totalSales,
        today: todaySalesAmount,
        month: monthSalesAmount
      },
      counts: {
        products: productCount,
        customers: customerCount,
        suppliers: supplierCount,
        orders: orderCount
      },
      lowStockWarnings,
      topProducts,
      recentSales: formattedRecentSales
    };
    
    res.json(response);
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/dashboard/sales-trend
// @desc    Get sales trend data for charts
// @access  Public
router.get('/sales-trend', async (req: Request, res: Response) => {
  try {
    // 獲取過去30天的銷售數據
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sales: SaleRecord[] = await Sale.find({
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 });
    
    // 按日期分組
    const salesByDate: Record<string, { amount: number; count: number }> = {};
    sales.forEach(sale => {
      const dateStr = sale.date.toISOString().split('T')[0];
      if (dateStr && !salesByDate[dateStr]) {
        salesByDate[dateStr] = {
          amount: 0,
          count: 0
        };
      }
      if (dateStr && salesByDate[dateStr]) {
        salesByDate[dateStr].amount += sale.totalAmount;
        salesByDate[dateStr].count += 1;
      }
    });
    
    // 填充缺失的日期
    const salesTrend: SalesTrendData[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      if (dateStr) {
        salesTrend.unshift({
          date: dateStr,
          amount: salesByDate[dateStr]?.amount || 0,
          count: salesByDate[dateStr]?.count || 0
        });
      }
    }
    
    // 獲取按產品類別分組的銷售數據
    const productIds = [...new Set(sales.flatMap(sale => sale.items.map(item => item.product.toString())))];
    const products: Product[] = await BaseProduct.find({ _id: { $in: productIds } });
    
    const salesByCategory: Record<string, number> = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const product = products.find(p => p._id.toString() === item.product.toString());
        if (product) {
          const category = product.category;
          if (!salesByCategory[category]) {
            salesByCategory[category] = 0;
          }
          salesByCategory[category] += item.subtotal;
        }
      });
    });
    
    const categorySales: CategorySales[] = Object.keys(salesByCategory).map(category => ({
      category,
      amount: salesByCategory[category] || 0
    })).sort((a, b) => b.amount - a.amount);
    
    const response: SalesTrendResponse = {
      salesTrend,
      categorySales
    };
    
    res.json(response);
  } catch (err) {
    console.error((err as Error).message);
    res.status(500).send('Server Error');
  }
});

export default router;