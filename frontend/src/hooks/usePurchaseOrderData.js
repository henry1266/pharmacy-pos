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
      showSnackbar('獲取供應商數據失敗: ' + (err.response?.data?.msg || err.message), 'error');
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
      showSnackbar('獲取產品數據失敗: ' + (err.response?.data?.msg || err.message), 'error');
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
      showSnackbar('獲取進貨單數據失敗: ' + (err.response?.data?.msg || err.message), 'error');
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
      const isTestModeActive = localStorage.getItem("token") === "test-mode-token";
      const virtualOrderId = "64b2f8e3cd68fbdbcea9427f";

      if (isEditMode && isTestModeActive && orderId === virtualOrderId) {
        console.log("[usePurchaseOrderData] Test mode: Mocking virtual order data for ID:", orderId);
        const mockSupplierForVirtualOrder = { id: "mockSup1", _id: "mockSup1", name: "模擬供應商X (測試)" };
        const mockOtherSupplier = { id: "mockSup2", _id: "mockSup2", name: "模擬供應商Y (測試)" };
        const mockSuppliersList = [mockSupplierForVirtualOrder, mockOtherSupplier];

        const mockProduct1 = { id: "mockProd1", _id: "mockProd1", name: "模擬產品A (測試)", unit: "瓶", purchasePrice: 50, stock: 100, did: "T001", dname: "模擬產品A (測試)", category: { name: "測試分類" }, supplier: { name: mockSupplierForVirtualOrder.name } };
        const mockProduct2 = { id: "mockProd2", _id: "mockProd2", name: "模擬產品B (測試)", unit: "盒", purchasePrice: 120, stock: 50, did: "T002", dname: "模擬產品B (測試)", category: { name: "測試分類" }, supplier: { name: mockOtherSupplier.name } };
        const mockProductsList = [mockProduct1, mockProduct2];

        const virtualOrderData = {
          _id: virtualOrderId,
          poid: "VIRTUAL-PO-001",
          pobill: "V-BILL-001",
          pobilldate: new Date().toISOString(),
          posupplier: mockSupplierForVirtualOrder.name, // Consistent name
          supplier: mockSupplierForVirtualOrder.id,    // Consistent ID
          totalAmount: 1234.50,
          status: "處理中",
          paymentStatus: "未付款",
          items: [
            { product: mockProduct1._id, did: mockProduct1.did, dname: mockProduct1.dname, dquantity: 10, dtotalCost: 1000, unitPrice: 100 },
            { product: mockProduct2._id, did: mockProduct2.did, dname: mockProduct2.dname, dquantity: 5, dtotalCost: 234.50, unitPrice: 46.9 }
          ],
          notes: "這是一張測試模式下的虛擬進貨單 (來自 Hook)。",
          isVirtual: true
        };
        setOrderData(virtualOrderData);
        setOrderDataLoaded(true);

        if (!suppliersLoaded) {
            setSuppliers(mockSuppliersList);
            setSuppliersLoaded(true);
        }
        if (!productsLoaded) {
            setProducts(mockProductsList);
            setProductsLoaded(true);
        }
        // Ensure productDetails are also mocked or fetched for these virtual items if needed by the form
        // For simplicity, if ProductItemForm relies on productDetails from this hook for unitPrice etc., ensure they are available.
        // The current fetchProductDetailsForItems might attempt API calls. We might need to mock its result too for virtual items.
        // However, the virtualOrderData.items already include unitPrice, dname etc. so direct productDetails might not be strictly needed for rendering the table.
        // Let's assume items have enough info for now. If not, productDetails mocking would be next.
        setProductDetailsLoading(false); // Assuming details are implicitly handled or not needed for display of virtual items

        setLoading(false);
        setError(null);
        return; // Skip API calls for real data
      }

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
        console.error("加載初始數據時出錯:", err);
        // Error already handled by individual fetch functions via showSnackbar
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [isEditMode, orderId, fetchSuppliersData, fetchProductsData, fetchPurchaseOrderData, fetchProductDetailsForItems, suppliersLoaded, productsLoaded]); // Added suppliersLoaded and productsLoaded to dependency array

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

