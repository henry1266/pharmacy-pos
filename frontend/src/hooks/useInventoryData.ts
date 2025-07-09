import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Inventory, Product } from '@pharmacy-pos/shared/types/entities';

/**
 * 擴展的產品介面，包含 excludeFromStock 屬性
 */
interface ExtendedProduct extends Product {
  excludeFromStock?: boolean;
}

/**
 * 庫存記錄介面（擴展）
 */
interface InventoryRecord extends Inventory {
  purchaseOrderNumber?: string;
  shippingOrderNumber?: string;
  cumulativeQuantity?: number;
}

/**
 * 庫存數據 Hook
 * @param productId - 產品 ID（可選）
 */
const useInventoryData = (productId?: string) => {
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [productInventory, setProductInventory] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 獲取庫存數據
  const fetchInventory = async (): Promise<void> => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      
      const res = await axios.get<{success: boolean, data: InventoryRecord[]}>('/api/inventory', config);
      setInventory(res.data.data ?? []);
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError('獲取庫存失敗');
      setLoading(false);
    }
  };

  // 獲取特定產品的庫存
  const fetchProductInventory = useCallback(async (id?: string): Promise<void> => {
    if (!id) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      
      const res = await axios.get<{success: boolean, data: InventoryRecord[]}>(`/api/inventory/product/${id}`, config);
      
      // 合併相同進貨單號的記錄
      const mergedInventory = mergeInventoryByPurchaseOrder(res.data.data ?? []);
      setProductInventory(mergedInventory);
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError('獲取產品庫存失敗');
      setLoading(false);
    }
  }, []);
  
  // 合併相同進貨單號的庫存記錄
  const mergeInventoryByPurchaseOrder = (inventoryData: InventoryRecord[]): InventoryRecord[] => {
    // 使用Map來按進貨單號分組並加總數量
    const groupedByPO = new Map<string, InventoryRecord>();
    
    // 第一步：按進貨單號分組並加總數量
    inventoryData.forEach(item => {
      const poNumber = item.purchaseOrderNumber ?? item.shippingOrderNumber ?? '未指定';
      
      if (groupedByPO.has(poNumber)) {
        // 如果已有該進貨單號的記錄，加總數量
        const existingItem = groupedByPO.get(poNumber);
        existingItem.quantity = (parseInt(existingItem.quantity.toString()) ?? 0) + (parseInt(item.quantity.toString()) ?? 0);
      } else {
        // 如果是新的進貨單號，創建新記錄
        groupedByPO.set(poNumber, { ...item });
      }
    });
    
    // 第二步：將Map轉換回數組
    const mergedInventory = Array.from(groupedByPO.values());
    
    // 第三步：按進貨單號排序
    mergedInventory.sort((a, b) => {
      const poA = a.purchaseOrderNumber ?? a.shippingOrderNumber ?? '';
      const poB = b.purchaseOrderNumber ?? b.shippingOrderNumber ?? '';
      return poA.localeCompare(poB);
    });
    
    // 第四步：重新計算累計庫存量
    let cumulativeQuantity = 0;
    mergedInventory.forEach(item => {
      cumulativeQuantity += parseInt(item.quantity.toString()) || 0;
      item.cumulativeQuantity = cumulativeQuantity;
    });
    
    return mergedInventory;
  };

  // 計算產品總庫存數量
  const getTotalInventory = (id?: string): string => {
    if (!id || loading) return '載入中...';
    
    // 直接查找與產品ID匹配的庫存記錄，包括ship類型
    const productInv = inventory.filter(item => {
      const productId = typeof item.product === 'string' ? item.product : (item.product as Product)._id;
      return productId === id;
    });
    
    if (productInv.length === 0) return '0';
    
    // 檢查是否為「不扣庫存」產品
    const firstRecord = productInv[0];
    const product = firstRecord?.product as ExtendedProduct;
    const isExcludeFromStock = product?.excludeFromStock;
    
    console.log(`[getTotalInventory] 產品 ${id} excludeFromStock:`, isExcludeFromStock);
    
    let total = 0;
    
    if (isExcludeFromStock) {
      // 「不扣庫存」產品：只計算進貨和出貨記錄，排除銷售記錄
      productInv.forEach(item => {
        const quantity = parseInt(item.quantity.toString()) || 0;
        console.log(`[getTotalInventory] 處理記錄 - 類型: ${item.type}, 數量: ${quantity}`);
        
        if (item.type === 'purchase' || item.type === 'ship') {
          total += quantity;
        } else if ((item.type as any) === 'sale-no-stock') {
          // 「不扣庫存」的銷售記錄不影響庫存
          console.log(`[getTotalInventory] 跳過 sale-no-stock 記錄，數量: ${quantity}`);
        } else if (item.type === 'sale') {
          // 一般銷售記錄也不影響「不扣庫存」產品的庫存
          console.log(`[getTotalInventory] 跳過一般 sale 記錄，數量: ${quantity}`);
        } else if (item.type === 'adjustment' || item.type === 'return') {
          // 調整和退貨記錄仍然影響庫存
          total += quantity;
        }
      });
    } else {
      // 一般產品：正常計算所有記錄
      total = productInv.reduce((sum, item) => sum + (parseInt(item.quantity.toString()) ?? 0), 0);
    }
    
    console.log(`[getTotalInventory] 產品 ${id} 最終庫存:`, total);
    return total.toString();
  };

  // 初始化獲取所有庫存
  useEffect(() => {
    fetchInventory();
  }, []);

  // 當產品ID變化時獲取特定產品庫存
  useEffect(() => {
    if (productId) {
      fetchProductInventory(productId);
    }
  }, [productId, fetchProductInventory]);

  return {
    inventory,
    productInventory,
    loading,
    error,
    getTotalInventory,
    fetchInventory,
    fetchProductInventory
  };
};

export default useInventoryData;