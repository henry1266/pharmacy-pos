import { useState, useEffect, useCallback } from 'react';
import { getSuppliers } from '../services/supplierService';
import { getProducts, getProductByCode } from '../services/productService';
import { getPurchaseOrderById } from '../services/purchaseOrdersService';

const usePurchaseOrderData = (isEditMode, orderId, showSnackbar) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [productDetails, setProductDetails] = useState({});
  const [productDetailsLoading, setProductDetailsLoading] = useState(false);
  const [orderData, setOrderData] = useState(null); // To store fetched purchase order data
  const [orderDataLoaded, setOrderDataLoaded] = useState(!isEditMode);
  const [suppliersLoaded, setSuppliersLoaded] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);

  const fetchSuppliersData = useCallback(async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
      setSuppliersLoaded(true);
      return data;
    } catch (err) {
      setError('獲取供應商數據失敗');
      showSnackbar('獲取供應商數據失敗: ' + (err.response?.data?.msg ?? err.message), 'error');
      throw err;
    }
  }, [showSnackbar]);

  const fetchProductsData = useCallback(async () => {
    try {
      const data = await getProducts();
      setProducts(data);
      setProductsLoaded(true);
      return data;
    } catch (err) {
      setError('獲取產品數據失敗');
      showSnackbar('獲取產品數據失敗: ' + (err.response?.data?.msg ?? err.message), 'error');
      throw err;
    }
  }, [showSnackbar]);

  const fetchPurchaseOrderData = useCallback(async (currentOrderId) => {
    if (!currentOrderId) return null;
    try {
      const data = await getPurchaseOrderById(currentOrderId);
      setOrderData(data);
      setOrderDataLoaded(true);
      return data;
    } catch (err) {
      setError('獲取進貨單數據失敗');
      showSnackbar('獲取進貨單數據失敗: ' + (err.response?.data?.msg ?? err.message), 'error');
      throw err;
    }
  }, [showSnackbar]);

  const fetchProductDetailsForItems = useCallback(async (items) => {
    if (!items || items.length === 0) {
      setProductDetails({});
      return;
    }
    setProductDetailsLoading(true);
    try {
      const detailsMap = {};
      const promises = items.map(item =>
        getProductByCode(item.did)
          .then(productData => {
            if (productData) {
              detailsMap[item.did] = productData;
            }
          })
          .catch(err => {
            console.error(`獲取產品 ${item.did} 詳細資料失敗:`, err);
          })
      );
      await Promise.all(promises);
      setProductDetails(detailsMap);
    } catch (err) {
      console.error('批次獲取產品詳細資料失敗:', err);
      showSnackbar('獲取部分藥品詳細資料失敗', 'warning');
    } finally {
      setProductDetailsLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const promises = [fetchSuppliersData(), fetchProductsData()];
        if (isEditMode && orderId) {
          promises.push(fetchPurchaseOrderData(orderId));
        }
        const results = await Promise.all(promises);

        if (isEditMode && results[2] && results[2].items) {
          await fetchProductDetailsForItems(results[2].items);
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
    setProductDetails, // Expose setter if items can be added/edited outside this hook's direct control initially
    productDetailsLoading,
    orderData,
    orderDataLoaded,
    suppliersLoaded,
    productsLoaded,
    fetchProductDetailsForItems // Expose if needed for re-fetching on item changes
  };
};

export default usePurchaseOrderData;
