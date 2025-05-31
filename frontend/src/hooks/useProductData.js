import { useState, useEffect, useCallback } from 'react';
import productService from '../services/productService'; // Import the consolidated service
import { getProductCategories } from '../services/productCategoryService'; // Keep category service separate or integrate

const useProductData = () => {
  const [products, setProducts] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all products (using service)
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getProducts();

      // Separate products and medicines
      const productsList = [];
      const medicinesList = [];
      data.forEach(item => {
        const product = { ...item, id: item._id }; // Map _id to id
        if (item.productType === 'product') {
          productsList.push(product);
        } else if (item.productType === 'medicine') {
          medicinesList.push(product);
        }
      });

      setProducts(productsList);
      setMedicines(medicinesList);
    } catch (err) {
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
      const data = await productService.getSuppliers();
      setSuppliers(data);
    } catch (err) {
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
    } catch (err) {
      console.error('獲取產品分類失敗 (hook):', err);
      setError('獲取產品分類失敗');
    }
  }, []);

  // Handle deleting a product (using service)
  const handleDeleteProduct = useCallback(async (id) => {
    try {
      setLoading(true); // Indicate loading during delete
      setError(null);
      await productService.deleteProduct(id);

      // Update local state optimistically or refetch
      setProducts(prev => prev.filter(p => p.id !== id));
      setMedicines(prev => prev.filter(p => p.id !== id));

      return true; // Indicate success
    } catch (err) {
      console.error('刪除產品失敗 (hook):', err);
      setError(`刪除產品失敗: ${err.response?.data?.message || err.message}`);
      return false; // Indicate failure
    } finally {
      setLoading(false);
    }
  }, []); // Dependencies might be needed if state setters are used directly

  // Handle saving (add/update) a product (using service)
  const handleSaveProduct = useCallback(async (productData, editMode, productType) => {
    try {
      setLoading(true);
      setError(null);
      let savedProductData;

      if (editMode) {
        // Update product
        savedProductData = await productService.updateProduct(productData.id, productData);
      } else {
        // Add new product
        savedProductData = await productService.addProduct(productData, productType);
      }

      // Refetch products to ensure data consistency
      await fetchProducts();

      return { ...savedProductData, id: savedProductData._id }; // Return the saved product data with mapped id

    } catch (err) {
      console.error('保存產品失敗 (hook):', err);
      const errorMsg = `保存產品失敗: ${err.response?.data?.message || err.message}`;
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
