import { useState, useEffect, useCallback } from 'react';
import { getProductCategory, getProductsByCategory } from '../services/productCategoryService';
import { getInventoryByProduct } from '../services/inventoryService';

/**
 * Helper function to calculate inventory and profit/loss for a single product.
 * This function encapsulates the logic previously in CategoryDetailPage.
 * @param {string} productId - The ID of the product.
 * @returns {Promise<{profitLoss: number, currentStock: number}>} - Calculated profit/loss and current stock.
 */
const calculateProductData = async (productId) => {
  try {
    const inventories = await getInventoryByProduct(productId);

    // Filter records (same logic as original)
    const filteredInventories = inventories.filter(inv => {
      const hasSaleNumber = inv.saleNumber && inv.saleNumber.trim() !== '';
      const hasPurchaseOrderNumber = inv.purchaseOrderNumber && inv.purchaseOrderNumber.trim() !== '';
      const hasShippingOrderNumber = inv.shippingOrderNumber && inv.shippingOrderNumber.trim() !== '';
      return hasSaleNumber || hasPurchaseOrderNumber || hasShippingOrderNumber;
    });

    // Merge records (same logic as original)
    const mergedInventories = [];
    const saleGroups = {};
    const purchaseGroups = {};
    const shipGroups = {};

    filteredInventories.forEach(inv => {
      if (inv.saleNumber) {
        if (!saleGroups[inv.saleNumber]) {
          saleGroups[inv.saleNumber] = { ...inv, type: 'sale', totalQuantity: inv.quantity, totalAmount: inv.totalAmount || 0 };
        } else {
          saleGroups[inv.saleNumber].totalQuantity += inv.quantity;
          saleGroups[inv.saleNumber].totalAmount += (inv.totalAmount || 0);
        }
      } else if (inv.purchaseOrderNumber) {
        if (!purchaseGroups[inv.purchaseOrderNumber]) {
          purchaseGroups[inv.purchaseOrderNumber] = { ...inv, type: 'purchase', totalQuantity: inv.quantity, totalAmount: inv.totalAmount || 0 };
        } else {
          purchaseGroups[inv.purchaseOrderNumber].totalQuantity += inv.quantity;
          purchaseGroups[inv.purchaseOrderNumber].totalAmount += (inv.totalAmount || 0);
        }
      } else if (inv.shippingOrderNumber) {
        if (!shipGroups[inv.shippingOrderNumber]) {
          shipGroups[inv.shippingOrderNumber] = { ...inv, type: 'ship', totalQuantity: inv.quantity, totalAmount: inv.totalAmount || 0 };
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
      if (inv.type === 'purchase') {
        currentStock += quantity;
      } else if (inv.type === 'sale' || inv.type === 'ship') {
        currentStock += quantity; // ship/sale quantity is negative
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
      } else if (inv.product && inv.product.sellingPrice) {
        price = inv.product.sellingPrice;
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
 */
const useCategoryDetailData = (categoryId) => {
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingProductData, setLoadingProductData] = useState(false);
  const [categoryTotalProfitLoss, setCategoryTotalProfitLoss] = useState(0);
  const [categoryTotalStock, setCategoryTotalStock] = useState(0);

  const fetchData = useCallback(async () => {
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
            currentStock
          };
        })
      );

      setProducts(productsWithData);
      setCategoryTotalProfitLoss(totalProfitLoss);
      setCategoryTotalStock(totalStock);

    } catch (err) {
      console.error('獲取分類詳情或產品數據失敗 (hook):', err);
      setError(err.message || '獲取分類詳情或產品數據失敗');
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

