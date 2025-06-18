import { parse, format } from 'date-fns';
import { Sale, Product } from '../types/entities';

/**
 * 銷售記錄介面 - 使用 Sale 型別但允許更靈活的 items 型別
 */
interface SaleRecord {
  saleNumber: string;
  totalAmount: number;
  items?: SaleItem[];
  [key: string]: any;
}

/**
 * 銷售項目介面 - 為了資料轉換的靈活性
 */
interface SaleItem {
  product?: string | Product | {
    category?: string;
    [key: string]: any;
  };
  quantity?: number;
  sellingPrice?: number; // 向後相容的屬性名稱
  price?: number; // 標準屬性名稱
  [key: string]: any;
}

/**
 * 銷售趨勢數據項目介面
 */
interface SalesTrendItem {
  date: string;
  totalSales: number;
}

/**
 * 分類銷售數據項目介面
 */
interface CategorySalesItem {
  category: string;
  totalSales: number;
}

/**
 * Extracts the date string (YYYYMMDD) from a saleNumber.
 * Assumes saleNumber starts with YYYYMMDD.
 * @param {string} saleNumber - The sale number (e.g., '20240504001').
 * @returns {string|null} The date string 'YYYYMMDD' or null if invalid.
 */
const getDateFromSaleNumber = (saleNumber: string): string | null => {
  if (typeof saleNumber === 'string' && saleNumber.length >= 8) {
    const datePart = saleNumber.substring(0, 8);
    // Basic validation: Check if it looks like a date
    if (/^\d{8}$/.test(datePart)) {
      return datePart;
    }
  }
  return null;
};

/**
 * Transforms raw sales data into a format suitable for the sales trend chart.
 * Aggregates total sales amount by date.
 * @param {SaleRecord[]} salesData - Array of raw sales records.
 * @returns {SalesTrendItem[]} - Aggregated sales data by date.
 */
export const transformSalesForTrend = (salesData: SaleRecord[]): SalesTrendItem[] => {
  if (!Array.isArray(salesData)) {
    console.error('transformSalesForTrend: Input salesData is not an array.');
    return [];
  }

  const salesByDate: Record<string, number> = salesData.reduce((acc: Record<string, number>, sale: SaleRecord) => {
    const dateStrYYYYMMDD = getDateFromSaleNumber(sale.saleNumber);
    if (dateStrYYYYMMDD) {
      try {
        // Parse YYYYMMDD and format to YYYY-MM-DD for consistency
        const dateObj = parse(dateStrYYYYMMDD, 'yyyyMMdd', new Date());
        const formattedDate = format(dateObj, 'yyyy-MM-dd');
        
        const amount = typeof sale.totalAmount === 'number' ? sale.totalAmount : 0;
        
        if (!acc[formattedDate]) {
          acc[formattedDate] = 0;
        }
        acc[formattedDate] += amount;
      } catch (e) {
        console.warn(`Could not parse date from saleNumber: ${sale.saleNumber}`, e);
      }
    }
    return acc;
  }, {});

  // Convert the aggregated object into an array and sort by date
  return Object.entries(salesByDate)
    .map(([date, totalSales]): SalesTrendItem => ({ date, totalSales }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Transforms raw sales data into a format suitable for the category sales chart.
 * Aggregates total sales amount by product category.
 * @param {SaleRecord[]} salesData - Array of raw sales records.
 * @returns {CategorySalesItem[]} - Aggregated sales data by category.
 */
export const transformSalesForCategory = (salesData: SaleRecord[]): CategorySalesItem[] => {
  if (!Array.isArray(salesData)) {
    console.error('transformSalesForCategory: Input salesData is not an array.');
    return [];
  }

  const salesByCategory: Record<string, number> = salesData.reduce((acc: Record<string, number>, sale: SaleRecord) => {
    if (Array.isArray(sale.items)) {
      sale.items.forEach(item => {
        // 安全地取得分類資訊
        let category = '未分類'; // 預設分類
        
        if (item.product) {
          if (typeof item.product === 'string') {
            // 如果 product 是字串 ID，無法取得分類資訊
            category = '未分類';
          } else if (typeof item.product === 'object' && item.product !== null) {
            // 如果 product 是物件，嘗試取得 category
            category = (item.product as any).category || '未分類';
          }
        }
        
        // 計算項目總額，優先使用 sellingPrice，其次使用 price
        const price = item.sellingPrice || item.price || 0;
        const quantity = item.quantity || 0;
        const itemTotal = (typeof quantity === 'number' && typeof price === 'number')
                         ? quantity * price
                         : 0;

        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += itemTotal;
      });
    }
    return acc;
  }, {});

  // Convert the aggregated object into an array
  return Object.entries(salesByCategory).map(([category, totalSales]): CategorySalesItem => ({ category, totalSales }));
};