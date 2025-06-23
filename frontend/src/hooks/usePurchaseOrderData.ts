import { useState, useEffect, useCallback } from 'react';
import { getSuppliers } from '../services/supplierService';
import { getProducts, getProductByCode } from '../services/productService';
import { getPurchaseOrderById } from '../services/purchaseOrdersService';
import { Supplier, Product, PurchaseOrder } from '@pharmacy-pos/shared/types/entities';

/**
 * 採購訂單項目介面 (用於處理前端特定的項目格式)
 */
interface OrderItem {
  did: string; // 產品代碼
  [key: string]: any; // 允許其他屬性
}

/**
 * 產品詳情映射介面
 */
interface ProductDetailsMap {
  [productCode: string]: Product & { stock: number }; // 確保 stock 是必需的
}

/**
 * 採購訂單數據 Hook
 * @param isEditMode - 是否處於編輯模式
 * @param orderId - 採購訂單ID (編輯模式時需要)
 * @param showSnackbar - 顯示通知的回調函數
 * @returns 包含採購訂單相關數據和狀態的對象
 */
const usePurchaseOrderData = (
  isEditMode: boolean,
  orderId: string | null,
  showSnackbar: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void
) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productDetails, setProductDetails] = useState<ProductDetailsMap>({});
  const [productDetailsLoading, setProductDetailsLoading] = useState<boolean>(false);
  const [orderData, setOrderData] = useState<PurchaseOrder | null>(null); // 存儲獲取的採購訂單數據
  const [orderDataLoaded, setOrderDataLoaded] = useState<boolean>(!isEditMode);
  const [suppliersLoaded, setSuppliersLoaded] = useState<boolean>(false);
  const [productsLoaded, setProductsLoaded] = useState<boolean>(false);

  /**
   * 獲取供應商數據
   */
  const fetchSuppliersData = useCallback(async (): Promise<Supplier[]> => {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
      setSuppliersLoaded(true);
      return data;
    } catch (err: any) {
      setError('獲取供應商數據失敗');
      showSnackbar('獲取供應商數據失敗: ' + (err.response?.data?.msg ?? err.message), 'error');
      throw err;
    }
  }, [showSnackbar]);

  /**
   * 獲取產品數據
   */
  const fetchProductsData = useCallback(async (): Promise<Product[]> => {
    try {
      const data = await getProducts();
      setProducts(data);
      setProductsLoaded(true);
      return data;
    } catch (err: any) {
      setError('獲取產品數據失敗');
      showSnackbar('獲取產品數據失敗: ' + (err.response?.data?.msg ?? err.message), 'error');
      throw err;
    }
  }, [showSnackbar]);

  /**
   * 獲取採購訂單數據
   */
  const fetchPurchaseOrderData = useCallback(async (currentOrderId: string): Promise<PurchaseOrder | null> => {
    if (!currentOrderId) return null;
    try {
      const data = await getPurchaseOrderById(currentOrderId);
      setOrderData(data);
      setOrderDataLoaded(true);
      return data;
    } catch (err: any) {
      setError('獲取進貨單數據失敗');
      showSnackbar('獲取進貨單數據失敗: ' + (err.response?.data?.msg ?? err.message), 'error');
      throw err;
    }
  }, [showSnackbar]);

  /**
   * 獲取項目的產品詳情
   */
  const fetchProductDetailsForItems = useCallback(async (items: OrderItem[]): Promise<void> => {
    if (!items || items.length === 0) {
      setProductDetails({});
      return;
    }
    setProductDetailsLoading(true);
    try {
      const detailsMap: ProductDetailsMap = {};
      const promises = items.map(item =>
        getProductByCode(item.did)
          .then(productData => {
            if (productData) {
              detailsMap[item.did] = {
                ...productData,
                stock: productData.stock || 0  // 確保 stock 欄位存在且為 number
              };
            }
          })
          .catch(err => {
            console.error(`獲取產品 ${item.did} 詳細資料失敗:`, err);
          })
      );
      await Promise.all(promises);
      setProductDetails(detailsMap);
    } catch (err: any) {
      console.error('批次獲取產品詳細資料失敗:', err);
      showSnackbar('獲取部分藥品詳細資料失敗', 'warning');
    } finally {
      setProductDetailsLoading(false);
    }
  }, [showSnackbar]);

  // 加載初始數據
  useEffect(() => {
    const loadInitialData = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        // 分別處理不同類型的 Promise，避免類型混合問題
        await Promise.all([
          fetchSuppliersData(),
          fetchProductsData()
        ]);
        
        // 如果是編輯模式且有訂單ID，則獲取訂單數據
        let orderDataResult: PurchaseOrder | null = null;
        if (isEditMode && orderId) {
          orderDataResult = await fetchPurchaseOrderData(orderId);
        }

        // 如果獲取到訂單數據且有項目，則獲取產品詳情
        if (isEditMode && orderDataResult?.items) {
          // 假設 items 中有 did 屬性，這裡需要進行類型轉換
          await fetchProductDetailsForItems(orderDataResult.items as unknown as OrderItem[]);
        }
      } catch (err) {
        console.error('加載初始數據時出錯:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [isEditMode, orderId, fetchSuppliersData, fetchProductsData, fetchPurchaseOrderData, fetchProductDetailsForItems]);

  return {
    loading,
    error,
    suppliers,
    products,
    productDetails,
    setProductDetails, // 暴露 setter，以便在 hook 外部控制初始項目時使用
    productDetailsLoading,
    orderData,
    orderDataLoaded,
    suppliersLoaded,
    productsLoaded,
    fetchProductDetailsForItems // 暴露函數，以便在項目變更時重新獲取
  };
};

export default usePurchaseOrderData;