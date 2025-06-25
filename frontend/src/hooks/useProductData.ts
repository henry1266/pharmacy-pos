import { useState, useEffect, useCallback } from 'react';
import { productServiceV2 } from '../services/productServiceV2';
import { getAllSuppliers } from '../services/supplierServiceV2';
import { getProductCategories } from '../services/productCategoryService'; // Keep category service separate or integrate
import { Product, Supplier, Category } from '@pharmacy-pos/shared/types/entities';

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
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all products (using service)
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productServiceV2.getAllProducts();

      // Separate products and medicines
      const productsList: ProductWithId[] = [];
      const medicinesList: ProductWithId[] = [];
      
      data.forEach(item => {
        // 將 item 轉換為 ExtendedProduct 型別
        const extendedItem = item as ExtendedProduct;
        const product = { ...extendedItem, id: item._id ?? (item as any).id }; // Map _id to id
        
        if (extendedItem.productType === 'product') {
          productsList.push(product);
        } else if (extendedItem.productType === 'medicine') {
          medicinesList.push(product);
        } else {
          // 如果沒有 productType，根據其他欄位判斷或預設為 product
          console.warn('Product without productType:', extendedItem);
          // 檢查是否有藥品特有的欄位
          if ((extendedItem as any).healthInsuranceCode || (extendedItem as any).healthInsurancePrice) {
            medicinesList.push({ ...product, productType: 'medicine' });
          } else {
            productsList.push({ ...product, productType: 'product' });
          }
        }
      });

      setProducts(productsList);
      setMedicines(medicinesList);
    } catch (err: any) {
      console.error('獲取產品失敗 (hook):', err);
      setError('獲取產品失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all suppliers (using service)
  const fetchSuppliers = useCallback(async () => {
    try {
      setError(null);
      const data = await getAllSuppliers();
      setSuppliers(data);
    } catch (err: any) {
      console.error('獲取供應商失敗 (hook):', err);
      setError('獲取供應商失敗');
    }
  }, []);

  // Fetch all product categories (using service)
  const fetchCategories = useCallback(async () => {
    try {
      setError(null);
      const data = await getProductCategories(); // Using dedicated category service
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
      const errorMsg = `保存產品失敗: ${err.response?.data?.message ?? err.message}`;
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
    suppliers,
    categories,
    loading, // Primarily reflects product loading state now
    error,
    fetchProducts, // Expose if manual refresh is needed
    handleDeleteProduct,
    handleSaveProduct
  };
};

export default useProductData;