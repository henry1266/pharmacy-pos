import { useState, useEffect, useCallback } from 'react';
import { getProductCategory, getProductsByCategory } from '../services/productCategoryService';
import { getInventoryByProduct } from '../services/inventoryServiceV2';
import { Category, Product, Inventory } from '@pharmacy-pos/shared/types/entities';

// 擴展 Inventory 類型以包含我們在代碼中使用的額外屬性
interface ExtendedInventory extends Omit<Inventory, 'type'> {
  saleNumber?: string;
  purchaseOrderNumber?: string;
  shippingOrderNumber?: string;
  totalAmount?: number;
  totalQuantity?: number;
  type: 'purchase' | 'sale' | 'ship' | 'adjustment' | 'return' | 'sale-no-stock';
  currentStock?: number;
}

// 擴展的產品介面，包含 excludeFromStock 屬性
interface ExtendedProduct extends Product {
  excludeFromStock?: boolean;
}

// 定義合併後的庫存記錄類型
interface MergedInventory extends ExtendedInventory {
  totalQuantity: number;
  totalAmount: number;
  currentStock?: number;
}

// 定義產品數據計算結果的類型
interface ProductCalculationResult {
  profitLoss: number;
  currentStock: number;
}

// 定義擴展的產品類型，包含計算的利潤和庫存
interface ProductWithData extends Product {
  id: string;
  profitLoss: number;
  currentStock: number;
  stock: number; // 確保 stock 是必需的
}

// 定義 hook 返回值的類型
interface CategoryDetailData {
  category: Category | null;
  products: ProductWithData[];
  loading: boolean;
  error: string | null;
  loadingProductData: boolean;
  categoryTotalProfitLoss: number;
  categoryTotalStock: number;
  refetchData: () => Promise<void>;
}

/**
 * Helper function to calculate inventory and profit/loss for a single product.
 * This function encapsulates the logic previously in CategoryDetailPage.
 * @param {string} productId - The ID of the product.
 * @returns {Promise<ProductCalculationResult>} - Calculated profit/loss and current stock.
 */
const calculateProductData = async (productId: string): Promise<ProductCalculationResult> => {
  try {
    const inventories = await getInventoryByProduct(productId);

    // 檢查是否為「不扣庫存」產品
    const firstRecord = inventories[0];
    const product = firstRecord?.product as ExtendedProduct;
    const isExcludeFromStock = product?.excludeFromStock;
    
    console.log(`[calculateProductData] 產品 ${productId} excludeFromStock:`, isExcludeFromStock);

    // Filter records (same logic as original)
    const filteredInventories = inventories.filter((inv: any) => {
      const hasSaleNumber = (inv as ExtendedInventory).saleNumber && (inv as ExtendedInventory).saleNumber.trim() !== '';
      const hasPurchaseOrderNumber = (inv as ExtendedInventory).purchaseOrderNumber && (inv as ExtendedInventory).purchaseOrderNumber.trim() !== '';
      const hasShippingOrderNumber = (inv as ExtendedInventory).shippingOrderNumber && (inv as ExtendedInventory).shippingOrderNumber.trim() !== '';
      return hasSaleNumber || hasPurchaseOrderNumber || hasShippingOrderNumber;
    }) as ExtendedInventory[];

    // Merge records (same logic as original)
    const mergedInventories: MergedInventory[] = [];
    const saleGroups: Record<string, MergedInventory> = {};
    const purchaseGroups: Record<string, MergedInventory> = {};
    const shipGroups: Record<string, MergedInventory> = {};

    filteredInventories.forEach(inv => {
      if (inv.saleNumber) {
        if (!saleGroups[inv.saleNumber]) {
          saleGroups[inv.saleNumber] = { 
            ...inv, 
            type: 'sale', 
            totalQuantity: inv.quantity, 
            totalAmount: inv.totalAmount || 0 
          };
        } else {
          saleGroups[inv.saleNumber].totalQuantity += inv.quantity;
          saleGroups[inv.saleNumber].totalAmount += (inv.totalAmount || 0);
        }
      } else if (inv.purchaseOrderNumber) {
        if (!purchaseGroups[inv.purchaseOrderNumber]) {
          purchaseGroups[inv.purchaseOrderNumber] = { 
            ...inv, 
            type: 'purchase', 
            totalQuantity: inv.quantity, 
            totalAmount: inv.totalAmount || 0 
          };
        } else {
          purchaseGroups[inv.purchaseOrderNumber].totalQuantity += inv.quantity;
          purchaseGroups[inv.purchaseOrderNumber].totalAmount += (inv.totalAmount || 0);
        }
      } else if (inv.shippingOrderNumber) {
        if (!shipGroups[inv.shippingOrderNumber]) {
          shipGroups[inv.shippingOrderNumber] = { 
            ...inv, 
            type: 'ship', 
            totalQuantity: inv.quantity, 
            totalAmount: inv.totalAmount || 0 
          };
        } else {
          shipGroups[inv.shippingOrderNumber].totalQuantity += inv.quantity;
          shipGroups[inv.shippingOrderNumber].totalAmount += (inv.totalAmount || 0);
        }
      }
    });

    // 使用相容性更好的方式遍歷物件值
    for (const key in saleGroups) {
      if (saleGroups.hasOwnProperty(key)) {
        mergedInventories.push(saleGroups[key]);
      }
    }
    for (const key in purchaseGroups) {
      if (purchaseGroups.hasOwnProperty(key)) {
        mergedInventories.push(purchaseGroups[key]);
      }
    }
    for (const key in shipGroups) {
      if (shipGroups.hasOwnProperty(key)) {
        mergedInventories.push(shipGroups[key]);
      }
    }

    // Calculate current stock (修正庫存計算邏輯)
    let currentStock = 0;
    const processedInventories = [...mergedInventories].reverse().map(inv => {
      const quantity = inv.totalQuantity;
      
      // 庫存計算邏輯：
      // - 進貨 (purchase): 增加庫存 (+)
      // - 銷售 (sale): 減少庫存 (-)
      // - 出貨 (ship): 減少庫存 (-)
      if (inv.type === 'purchase') {
        currentStock += Math.abs(quantity); // 進貨增加庫存
      } else if (inv.type === 'sale') {
        // 對於「不扣庫存」產品，銷售不影響庫存數量
        if (!isExcludeFromStock) {
          currentStock -= Math.abs(quantity); // 銷售減少庫存
        }
      } else if (inv.type === 'sale-no-stock') {
        // 「不扣庫存」產品的銷售記錄，不影響庫存
        console.log(`[calculateProductData] 處理 sale-no-stock 記錄: 數量=${quantity}, 不影響庫存`);
      } else if (inv.type === 'ship') {
        currentStock -= Math.abs(quantity); // 出貨減少庫存
      }
      
      return {
        ...inv,
        currentStock: currentStock
      };
    });
    processedInventories.reverse(); // Restore original order if needed

    // Calculate profit/loss (修正損益計算邏輯)
    let totalProfitLoss = 0;
    
    if (isExcludeFromStock) {
      // 「不扣庫存」產品：使用 數量 × (實際售價 - 設定進價) 計算
      console.log(`[calculateProductData] 「不扣庫存」產品使用 數量×(實際售價-設定進價) 計算`);
      
      // 獲取產品設定的進價
      const product = processedInventories[0]?.product as ExtendedProduct;
      const setCostPrice = product?.cost || product?.purchasePrice || 0;
      
      console.log(`[calculateProductData] 產品設定進價: ${setCostPrice}`);
      
      // 處理銷售記錄
      const salesRecords = processedInventories.filter(inv => inv.type === 'sale' || inv.type === 'sale-no-stock');
      salesRecords.forEach(inv => {
        const quantity = Math.abs(inv.totalQuantity);
        
        // 計算實際售價
        let actualSalePrice = 0;
        if (inv.totalAmount && inv.totalQuantity && inv.totalQuantity !== 0) {
          actualSalePrice = Math.abs(inv.totalAmount) / Math.abs(inv.totalQuantity);
        }
        
        // 計算毛利：數量 × (實際售價 - 設定進價)
        const profit = quantity * (actualSalePrice - setCostPrice);
        totalProfitLoss += profit;
        
        console.log(`[calculateProductData] 銷售毛利計算:`);
        console.log(`  - 數量: ${quantity}`);
        console.log(`  - 實際售價: ${actualSalePrice}`);
        console.log(`  - 設定進價: ${setCostPrice}`);
        console.log(`  - 毛利: ${quantity} × (${actualSalePrice} - ${setCostPrice}) = ${profit}`);
      });
      
      // 處理出貨記錄
      const shipRecords = processedInventories.filter(inv => inv.type === 'ship');
      shipRecords.forEach(inv => {
        const quantity = Math.abs(inv.totalQuantity);
        
        // 計算實際出貨價
        let actualShipPrice = 0;
        if (inv.totalAmount && inv.totalQuantity && inv.totalQuantity !== 0) {
          actualShipPrice = Math.abs(inv.totalAmount) / Math.abs(inv.totalQuantity);
        }
        
        // 計算出貨毛利：數量 × (實際出貨價 - 設定進價)
        const shipProfit = quantity * (actualShipPrice - setCostPrice);
        totalProfitLoss += shipProfit;
        
        console.log(`[calculateProductData] 出貨毛利計算:`);
        console.log(`  - 數量: ${quantity}`);
        console.log(`  - 實際出貨價: ${actualShipPrice}`);
        console.log(`  - 設定進價: ${setCostPrice}`);
        console.log(`  - 毛利: ${quantity} × (${actualShipPrice} - ${setCostPrice}) = ${shipProfit}`);
      });
    } else {
      // 一般產品：使用原本的計算方式
      processedInventories.forEach(inv => {
        let unitPrice = 0;
        
        // 優先使用交易記錄中的實際金額計算單價
        if (inv.totalAmount && inv.totalQuantity && inv.totalQuantity !== 0) {
          unitPrice = Math.abs(inv.totalAmount) / Math.abs(inv.totalQuantity);
        } else if (typeof inv.product !== 'string' && inv.product?.price) {
          // 備用：使用產品設定的價格
          unitPrice = inv.product.price;
        }

        const recordAmount = unitPrice * Math.abs(inv.totalQuantity);

        // 損益計算邏輯：
        // - 銷售 (sale): 正向收入，增加利潤
        // - 進貨 (purchase): 負向成本，減少利潤
        // - 出貨 (ship): 正向收入，增加利潤（出貨是銷售給客戶）
        if (inv.type === 'sale') {
          totalProfitLoss += recordAmount; // 銷售收入
          console.log(`[calculateProductData] 一般產品 sale 損益: 金額=${recordAmount}`);
        } else if (inv.type === 'purchase') {
          totalProfitLoss -= recordAmount; // 進貨成本
          console.log(`[calculateProductData] 一般產品 purchase 損益: 金額=-${recordAmount}`);
        } else if (inv.type === 'ship') {
          totalProfitLoss += recordAmount; // 出貨收入
          console.log(`[calculateProductData] 一般產品 ship 損益: 金額=${recordAmount}`);
        }
      });
    }

    console.log(`[calculateProductData] 產品 ${productId} 最終結果: 庫存=${currentStock}, 損益=${totalProfitLoss}`);

    return {
      profitLoss: totalProfitLoss,
      currentStock: currentStock
    };
  } catch (err) {
    console.error(`計算產品 ${productId} 的數據失敗 (hook helper):`, err);
    return {
      profitLoss: 0,
      currentStock: 0
    }; // Return defaults on error
  }
};

/**
 * Custom hook for managing category detail page data.
 * @param {string} categoryId - The ID of the category.
 * @returns {CategoryDetailData} - Category detail data and functions.
 */
const useCategoryDetailData = (categoryId: string): CategoryDetailData => {
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<ProductWithData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProductData, setLoadingProductData] = useState<boolean>(false);
  const [categoryTotalProfitLoss, setCategoryTotalProfitLoss] = useState<number>(0);
  const [categoryTotalStock, setCategoryTotalStock] = useState<number>(0);

  const fetchData = useCallback(async (): Promise<void> => {
    if (!categoryId) {
      setLoading(false);
      setError('未提供分類 ID');
      return;
    }

    try {
      setLoading(true);
      setLoadingProductData(true);
      setError(null);

      // Fetch category details
      const categoryData = await getProductCategory(categoryId);
      setCategory(categoryData);

      // Fetch products in the category
      const productsData = await getProductsByCategory(categoryId);

      // Fetch inventory and profit/loss for each product
      let totalProfitLoss = 0;
      let totalStock = 0;

      const productsWithData = await Promise.all(
        productsData.map(async (product) => {
          const { profitLoss, currentStock } = await calculateProductData(product._id);
          totalProfitLoss += profitLoss;
          totalStock += currentStock;
          return {
            ...product,
            id: product._id,
            profitLoss,
            currentStock,
            stock: product.stock ?? currentStock ?? 0  // 確保 stock 欄位存在
          };
        })
      );

      setProducts(productsWithData);
      setCategoryTotalProfitLoss(totalProfitLoss);
      setCategoryTotalStock(totalStock);

    } catch (err: any) {
      console.error('獲取分類詳情或產品數據失敗 (hook):', err);
      setError(err.message ?? '獲取分類詳情或產品數據失敗');
      setCategory(null);
      setProducts([]);
      setCategoryTotalProfitLoss(0);
      setCategoryTotalStock(0);
    } finally {
      setLoading(false);
      setLoadingProductData(false);
    }
  }, [categoryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    category,
    products,
    loading,
    error,
    loadingProductData,
    categoryTotalProfitLoss,
    categoryTotalStock,
    refetchData: fetchData // Expose refetch function if needed
  };
};

export default useCategoryDetailData;