import { parse, format } from 'date-fns';

/**
 * 銷售記錄介面
 */
interface SaleRecord {
  saleNumber: string;
  totalAmount: number;
  items?: SaleItem[];
  [key: string]: any;
}

/**
 * 銷售項目介面
 */
interface SaleItem {
  product?: {
    category?: string;
    [key: string]: any;
  };
  quantity?: number;
  sellingPrice?: number;
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
        // Ensure item and product details exist
        const category = item.product?.category || '未分類'; // Default category if missing
        const itemTotal = (typeof item.quantity === 'number' && typeof item.sellingPrice === 'number') 
                         ? item.quantity * item.sellingPrice 
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