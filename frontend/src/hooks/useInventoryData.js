import { useState, useEffect } from 'react';
import axios from 'axios';

const useInventoryData = (productId) => {
  const [inventory, setInventory] = useState([]);
  const [productInventory, setProductInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 獲取庫存數據
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      
      const res = await axios.get('/api/inventory', config);
      setInventory(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('獲取庫存失敗');
      setLoading(false);
    }
  };

  // 獲取特定產品的庫存
  const fetchProductInventory = async (id) => {
    if (!id) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      
      const res = await axios.get(`/api/inventory/product/${id}`, config);
      
      // 合併相同進貨單號的記錄
      const mergedInventory = mergeInventoryByPurchaseOrder(res.data);
      setProductInventory(mergedInventory);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('獲取產品庫存失敗');
      setLoading(false);
    }
  };
  
  // 合併相同進貨單號的庫存記錄
  const mergeInventoryByPurchaseOrder = (inventoryData) => {
    // 使用Map來按進貨單號分組並加總數量
    const groupedByPO = new Map();
    
    // 第一步：按進貨單號分組並加總數量
    inventoryData.forEach(item => {
      const poNumber = item.purchaseOrderNumber || '未指定';
      
      if (groupedByPO.has(poNumber)) {
        // 如果已有該進貨單號的記錄，加總數量
        const existingItem = groupedByPO.get(poNumber);
        existingItem.quantity = (parseInt(existingItem.quantity) || 0) + (parseInt(item.quantity) || 0);
      } else {
        // 如果是新的進貨單號，創建新記錄
        groupedByPO.set(poNumber, { ...item });
      }
    });
    
    // 第二步：將Map轉換回數組
    const mergedInventory = Array.from(groupedByPO.values());
    
    // 第三步：按進貨單號排序
    mergedInventory.sort((a, b) => {
      const poA = a.purchaseOrderNumber || '';
      const poB = b.purchaseOrderNumber || '';
      return poA.localeCompare(poB);
    });
    
    // 第四步：重新計算累計庫存量
    let cumulativeQuantity = 0;
    mergedInventory.forEach(item => {
      cumulativeQuantity += parseInt(item.quantity) || 0;
      item.cumulativeQuantity = cumulativeQuantity;
    });
    
    return mergedInventory;
  };

  // 計算產品總庫存數量
  const getTotalInventory = (id) => {
    if (!id || loading) return '載入中...';
    
    // 直接查找與產品ID匹配的庫存記錄
    const productInv = inventory.filter(item => 
      item.product && (item.product._id === id || item.product === id)
    );
    
    if (productInv.length === 0) return '0';
    
    const total = productInv.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
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
  }, [productId]);

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
