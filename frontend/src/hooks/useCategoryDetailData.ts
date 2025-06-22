import { useState, useEffect, useCallback } from 'react';
import { getProductCategory, getProductsByCategory } from '../services/productCategoryService';
import { getInventoryByProduct } from '../services/inventoryService';
import { Category, Product, Inventory } from '../../../shared/types/entities';

// 擴展 Inventory 類型以包含我們在代碼中使用的額外屬性
interface ExtendedInventory extends Omit<Inventory, 'type'> {
  saleNumber?: string;
  purchaseOrderNumber?: string;
  shippingOrderNumber?: string;
  totalAmount?: number;
  totalQuantity?: number;
  type: 'purchase' | 'sale' | 'ship' | 'adjustment' | 'return';
  currentStock?: number;
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

    // Filter records (same logic as original)
    const filteredInventories = inventories.filter(inv => {
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

    Object.values(saleGroups).forEach(group => mergedInventories.push(group));
    Object.values(purchaseGroups).forEach(group => mergedInventories.push(group));
    Object.values(shipGroups).forEach(group => mergedInventories.push(group));

    // Calculate current stock (same logic as original)
    let currentStock = 0;
    const processedInventories = [...mergedInventories].reverse().map(inv => {
      const quantity = inv.totalQuantity;
      if (inv.type === 'purchase' || inv.type === 'sale' || inv.type === 'ship') {
        currentStock += quantity; // ship/sale quantity is negative for sale/ship
      }
      return {
        ...inv,
        currentStock: currentStock
      };
    });
    processedInventories.reverse(); // Restore original order if needed

    // Calculate profit/loss (same logic as original)
    let totalProfitLoss = 0;
    processedInventories.forEach(inv => {
      let price = 0;
      if ((inv.type === 'purchase' || inv.type === 'ship' || inv.type === 'sale') && inv.totalAmount && inv.totalQuantity) {
        const unitPrice = inv.totalAmount / Math.abs(inv.totalQuantity);
        price = unitPrice;
      } else if (typeof inv.product !== 'string' && inv.product?.price) {
        price = inv.product.price;
      }

      const recordCost = price * Math.abs(inv.totalQuantity);

      if (inv.type === 'sale') {
        totalProfitLoss += recordCost;
      } else if (inv.type === 'purchase') {
        totalProfitLoss -= recordCost;
      } else if (inv.type === 'ship') {
        totalProfitLoss += recordCost; // Assuming ship cost adds to profit (or reduces loss)
      }
    });

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
            stock: product.stock || currentStock || 0  // 確保 stock 欄位存在
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