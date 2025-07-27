import { useState, useEffect, useCallback } from 'react';
import { productServiceV2, ProductFilters } from '../services/productServiceV2';
import { getAllSuppliers } from '../services/supplierServiceV2';
import { getProductCategories } from '../services/productCategoryService'; // Keep category service separate or integrate
import { Product, Supplier, Category } from '@pharmacy-pos/shared/types/entities';
import TestModeConfig from '../testMode/config/TestModeConfig';
import testModeDataService from '../testMode/services/TestModeDataService';

/**
 * 產品類型
 */
type ProductType = 'product' | 'medicine';

/**
 * 擴展產品介面，包含前端特定屬性
 */
interface ExtendedProduct extends Product {
  productType?: ProductType;
}

/**
 * 產品資料 Hook
 */
interface ProductWithId extends ExtendedProduct {
  id: string; // 額外的 id 屬性，映射自 _id
}

const useProductData = () => {
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [medicines, setMedicines] = useState<ProductWithId[]>([]);
  const [allProducts, setAllProducts] = useState<ProductWithId[]>([]); // 統一的產品列表
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all products (using service)
  const fetchProducts = useCallback(async (filters?: ProductFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      // 使用測試數據服務來決定是否使用測試數據
      let data;
      try {
        // 如果有篩選條件，使用新的篩選 API
        if (filters && Object.keys(filters).length > 0) {
          const response = await productServiceV2.getFilteredProducts(filters);
          data = testModeDataService.getProducts(response.data, null);
        } else {
          const actualData = await productServiceV2.getAllProducts();
          data = testModeDataService.getProducts(actualData, null);
        }
      } catch (actualError) {
        const errorMessage = actualError instanceof Error ? actualError.message : String(actualError);
        data = testModeDataService.getProducts(null, errorMessage);
      }

      // Separate products and medicines
      const productsList: ProductWithId[] = [];
      const medicinesList: ProductWithId[] = [];
      const unifiedList: ProductWithId[] = [];
      
      data.forEach(item => {
        // 將 item 轉換為 ExtendedProduct 型別
        const extendedItem = item;
        const product = { ...extendedItem, id: item._id || (item as any).id }; // Map _id to id
        
        // 添加到統一列表
        unifiedList.push(product);
        
        if (extendedItem.productType === 'product') {
          productsList.push(product);
        } else if (extendedItem.productType === 'medicine') {
          medicinesList.push(product);
        } else {
          // 如果沒有 productType，根據其他欄位判斷或預設為 product
          console.warn('Product without productType:', extendedItem);
          // 檢查是否有藥品特有的欄位
          if ((extendedItem as any).healthInsuranceCode || (extendedItem as any).healthInsurancePrice) {
            const medicineProduct = { ...product, productType: 'medicine' as const };
            medicinesList.push(medicineProduct);
            unifiedList[unifiedList.length - 1] = medicineProduct;
          } else {
            const regularProduct = { ...product, productType: 'product' as const };
            productsList.push(regularProduct);
            unifiedList[unifiedList.length - 1] = regularProduct;
          }
        }
      });

      setProducts(productsList);
      setMedicines(medicinesList);
      setAllProducts(unifiedList);
    } catch (err: any) {
      console.error('獲取產品失敗 (hook):', err);
      setError('獲取產品失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  // 新增：篩選產品的方法
  const fetchFilteredProducts = useCallback(async (filters: ProductFilters) => {
    return fetchProducts(filters);
  }, [fetchProducts]);

  // Fetch all suppliers (using service)
  const fetchSuppliers = useCallback(async () => {
    try {
      setError(null);
      
      // 使用測試數據服務來決定是否使用測試數據
      let data;
      try {
        const actualData = await getAllSuppliers();
        data = testModeDataService.getSuppliers(actualData as any, null);
      } catch (actualError) {
        const errorMessage = actualError instanceof Error ? actualError.message : String(actualError);
        data = testModeDataService.getSuppliers(null, errorMessage);
      }
      
      setSuppliers(data as unknown as Supplier[]);
    } catch (err: any) {
      console.error('獲取供應商失敗 (hook):', err);
      setError('獲取供應商失敗');
    }
  }, []);

  // Fetch all product categories (using service)
  const fetchCategories = useCallback(async () => {
    try {
      setError(null);
      
      // 使用測試數據服務來決定是否使用測試數據
      let data;
      try {
        const actualData = await getProductCategories(); // Using dedicated category service
        data = testModeDataService.getCategories(actualData, null);
      } catch (actualError) {
        const errorMessage = actualError instanceof Error ? actualError.message : String(actualError);
        data = testModeDataService.getCategories(null, errorMessage);
      }
      
      setCategories(data);
    } catch (err: any) {
      console.error('獲取產品分類失敗 (hook):', err);
      setError('獲取產品分類失敗');
    }
  }, []);

  // Handle deleting a product (using service)
  const handleDeleteProduct = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true); // Indicate loading during delete
      setError(null);
      
      // 測試模式下模擬刪除操作
      if (TestModeConfig.isEnabled()) {
        console.log('測試模式：模擬刪除產品操作');
        await testModeDataService.simulateApiSuccess('刪除產品');
        
        // Update local state optimistically
        setProducts(prev => prev.filter(p => p.id !== id));
        setMedicines(prev => prev.filter(p => p.id !== id));
        
        return true;
      }
      
      await productServiceV2.deleteProduct(id);

      // Update local state optimistically or refetch
      setProducts(prev => prev.filter(p => p.id !== id));
      setMedicines(prev => prev.filter(p => p.id !== id));

      return true; // Indicate success
    } catch (err: any) {
      console.error('刪除產品失敗 (hook):', err);
      setError(`刪除產品失敗: ${err.response?.data?.message ?? err.message}`);
      return false; // Indicate failure
    } finally {
      setLoading(false);
    }
  }, []); // Dependencies might be needed if state setters are used directly

  // Handle saving (add/update) a product (using service)
  const handleSaveProduct = useCallback(async (
    productData: any,
    editMode: boolean,
    productType?: ProductType
  ): Promise<ProductWithId> => {
    try {
      setLoading(true);
      setError(null);
      let savedProductData;

      // 測試模式下模擬保存操作
      if (TestModeConfig.isEnabled()) {
        console.log('測試模式：模擬保存產品操作');
        await testModeDataService.simulateApiSuccess(editMode ? '更新產品' : '新增產品');
        
        // 創建模擬的保存結果
        savedProductData = {
          ...productData,
          _id: productData.id || `mock_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Refetch products to ensure data consistency
        await fetchProducts();
        
        return { ...savedProductData, id: savedProductData._id };
      }

      if (editMode) {
        // Update product
        savedProductData = await productServiceV2.updateProduct(productData.id, productData);
      } else {
        // Add new product
        savedProductData = await productServiceV2.createProduct(productData);
      }

      // Refetch products to ensure data consistency
      await fetchProducts();

      return { ...savedProductData, id: savedProductData._id }; // Return the saved product data with mapped id

    } catch (err: any) {
      console.error('保存產品失敗 (hook):', err);
      
      // 提取詳細錯誤訊息
      let errorMsg = '保存產品失敗';
      
      if (err.response?.data) {
        const { data } = err.response;
        if (data.message) {
          errorMsg = `保存產品失敗: ${data.message}`;
        } else if (data.details && Array.isArray(data.details)) {
          const validationErrors = data.details.map((detail: any) =>
            detail.msg || detail.message || detail.param
          ).join(', ');
          errorMsg = `保存產品失敗 - 驗證錯誤: ${validationErrors}`;
        }
      } else if (err.message) {
        errorMsg = `保存產品失敗: ${err.message}`;
      }
      
      setError(errorMsg);
      // Re-throw the error for the component to handle (e.g., show alert, keep dialog open)
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [fetchProducts]); // Add fetchProducts as dependency

  // Initial data fetch
  useEffect(() => {
    // Use Promise.all to fetch concurrently, but manage loading state carefully
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchProducts(), fetchSuppliers(), fetchCategories()]);
      } catch (err) {
        // Errors are already handled within individual fetch functions and state is set
        console.error("Error loading initial product data:", err)
      }
    };
    loadInitialData();
  }, [fetchProducts, fetchSuppliers, fetchCategories]); // Include all fetch functions

  return {
    products,
    medicines,
    allProducts, // 新增：統一的產品列表
    suppliers,
    categories,
    loading, // Primarily reflects product loading state now
    error,
    fetchProducts, // Expose if manual refresh is needed
    fetchFilteredProducts, // 新增：篩選產品的方法
    handleDeleteProduct,
    handleSaveProduct
  };
};

export default useProductData;