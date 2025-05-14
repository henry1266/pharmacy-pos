import apiService from '../utils/apiService'; // Use the centralized apiService

const PRODUCTS_API_PATH = '/api/products';

// Mock data for test mode
const mockProductData = [
  { _id: "product_mock_id_A", name: "虛擬藥品 X (10mg)", code: "VMEDX10", category: "止痛藥", purchasePrice: 12.50, sellingPrice: 20.00, stock: 150, unit: "盒", supplier: "supplier_mock_id_1", productType: "medicine", healthInsuranceCode: "AB12345", description: "測試用虛擬止痛藥品X" },
  { _id: "product_mock_id_B", name: "虛擬藥品 Y (250ml)", code: "VMEDY250", category: "維他命", purchasePrice: 25.00, sellingPrice: 40.00, stock: 80, unit: "瓶", supplier: "supplier_mock_id_2", productType: "medicine", healthInsuranceCode: "CD67890", description: "測試用虛擬維他命Y" },
  { _id: "product_mock_id_C", name: "虛擬保健品 Z", code: "VHLTHZ", category: "保健食品", purchasePrice: 50.00, sellingPrice: 85.00, stock: 200, unit: "罐", supplier: "supplier_mock_id_1", productType: "product", barcode: "9876543210123", description: "測試用虛擬保健品Z" },
  { _id: "product_mock_id_D", name: "虛擬醫療器材 W", code: "VDEVW", category: "醫療器材", purchasePrice: 150.00, sellingPrice: 250.00, stock: 30, unit: "個", supplier: "supplier_mock_id_3", productType: "product", barcode: "1230123456789", description: "測試用虛擬醫療器材W" },
];

// Helper to check if in test mode
const isTestMode = () => localStorage.getItem('isTestMode') === 'true';

/**
 * Fetches all products (both regular and medicines).
 * @returns {Promise<Array>} A promise that resolves to an array of product objects.
 */
export const getProducts = async () => {
  if (isTestMode()) {
    console.log("[Test Mode] Fetching virtual products");
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(mockProductData);
      }, 200); // Simulate network delay
    });
  }

  try {
    const response = await apiService.get(PRODUCTS_API_PATH);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Adds a new product (product or medicine).
 * @param {object} productData - The data for the new product.
 * @param {string} productType - 'product' or 'medicine'.
 * @returns {Promise<object>} A promise that resolves to the newly created product object.
 */
export const addProduct = async (productData, productType) => {
  if (isTestMode()) {
    console.log(`[Test Mode] Adding virtual ${productType}:`, productData);
    return new Promise(resolve => {
      setTimeout(() => {
        const newProduct = { ...productData, _id: `mock_prod_${Date.now()}`, productType };
        mockProductData.push(newProduct); // Add to mock data array for session persistence
        resolve(newProduct);
      }, 200);
    });
  }

  try {
    const endpoint = productType === 'medicine'
        ? `${PRODUCTS_API_PATH}/medicine`
        : `${PRODUCTS_API_PATH}/product`;
    const response = await apiService.post(endpoint, { ...productData, productType });
    return response.data;
  } catch (error) {
    console.error(`Error adding ${productType}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Updates an existing product.
 * @param {string} id - The ID of the product to update.
 * @param {object} productData - The updated data for the product.
 * @returns {Promise<object>} A promise that resolves to the updated product object.
 */
export const updateProduct = async (id, productData) => {
  if (isTestMode()) {
    console.log(`[Test Mode] Updating virtual product with ID: ${id}`, productData);
    return new Promise(resolve => {
      setTimeout(() => {
        const index = mockProductData.findIndex(p => p._id === id);
        if (index !== -1) {
          mockProductData[index] = { ...mockProductData[index], ...productData };
          resolve(mockProductData[index]);
        } else {
          resolve({ error: "Product not found in mock data" }); // Or throw error
        }
      }, 200);
    });
  }

  try {
    const response = await apiService.put(`${PRODUCTS_API_PATH}/${id}`, productData);
    return response.data;
  } catch (error) {
    console.error('Error updating product:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Deletes a product.
 * @param {string} id - The ID of the product to delete.
 * @returns {Promise<void>} A promise that resolves when the product is deleted.
 */
export const deleteProduct = async (id) => {
  if (isTestMode()) {
    console.log(`[Test Mode] Deleting virtual product with ID: ${id}`);
    return new Promise(resolve => {
      setTimeout(() => {
        const index = mockProductData.findIndex(p => p._id === id);
        if (index !== -1) {
          mockProductData.splice(index, 1);
        }
        resolve({ message: "Virtual product deleted" });
      }, 200);
    });
  }

  try {
    await apiService.delete(`${PRODUCTS_API_PATH}/${id}`);
  } catch (error) {
    console.error('Error deleting product:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Fetches a single product by its code.
 * @param {string} code - The code of the product to fetch.
 * @returns {Promise<object>} A promise that resolves to the product object.
 */
export const getProductByCode = async (code) => {
  if (isTestMode()) {
    console.log(`[Test Mode] Fetching virtual product by code: ${code}`);
    return new Promise(resolve => {
      setTimeout(() => {
        const product = mockProductData.find(p => p.code === code);
        resolve(product || null);
      }, 200);
    });
  }

  try {
    const response = await apiService.get(`${PRODUCTS_API_PATH}/code/${code}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching product with code ${code}:`, error.response?.data || error.message);
    throw error;
  }
};

// Note: getSuppliers was incorrectly in this file, it should be in supplierService.js
// We will modify supplierService.js separately.

const productService = {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getProductByCode,
};

export default productService;

