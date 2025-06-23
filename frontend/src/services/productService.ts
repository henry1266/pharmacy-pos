import axios from 'axios';
import { ApiResponse } from '@pharmacy-pos/shared/types/api';
import { Product, Supplier } from '@pharmacy-pos/shared/types/entities';

// Base API URLs
const PRODUCTS_API_URL = '/api/products';
const SUPPLIERS_API_URL = '/api/suppliers';

/**
 * 認證配置介面
 */
interface AuthConfig {
  headers: {
    'x-auth-token': string;
    'Content-Type'?: string;
  };
}

/**
 * Helper function to get auth config
 * @param {boolean} includeContentType - Whether to include Content-Type header
 * @returns {AuthConfig} Auth configuration object
 */
const getAuthConfig = (includeContentType = true): AuthConfig => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('Authentication token not found.');
    throw new Error('Authentication required.');
  }
  const headers: { 'x-auth-token': string; 'Content-Type'?: string } = { 'x-auth-token': token };
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  return { headers };
};

/**
 * Fetches all products (both regular and medicines).
 * @returns {Promise<Product[]>} A promise that resolves to an array of product objects.
 */
export const getProducts = async (): Promise<Product[]> => {
  try {
    const config = getAuthConfig(false); // GET request doesn't need Content-Type
    const response = await axios.get(PRODUCTS_API_URL, config);
    // 後端返回的是 ApiResponse 格式，需要取 data 屬性
    return (response.data as ApiResponse<Product[]>)?.data || [];
  } catch (error: any) {
    console.error('Error fetching products:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Fetches all suppliers.
 * @returns {Promise<Supplier[]>} A promise that resolves to an array of supplier objects.
 */
export const getSuppliers = async (): Promise<Supplier[]> => {
  try {
    const config = getAuthConfig(false);
    const response = await axios.get(SUPPLIERS_API_URL, config);
    return (response.data as any)?.data || [];
  } catch (error: any) {
    console.error('Error fetching suppliers:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * 產品類型
 */
type ProductType = 'product' | 'medicine';

/**
 * Adds a new product (product or medicine).
 * @param {Partial<Product>} productData - The data for the new product.
 * @param {ProductType} productType - 'product' or 'medicine'.
 * @returns {Promise<Product>} A promise that resolves to the newly created product object.
 */
export const addProduct = async (productData: Partial<Product>, productType: ProductType): Promise<Product> => {
  try {
    const config = getAuthConfig();
    // Backend might have specific endpoints or handle type via data
    // Assuming backend uses productType field or separate endpoints as in the original hook
    const endpoint = productType === 'medicine'
        ? `${PRODUCTS_API_URL}/medicine`
        : `${PRODUCTS_API_URL}/product`;
    const response = await axios.post(endpoint, { ...productData, productType }, config);
    // 後端返回的是 ApiResponse 格式，需要取 data 屬性
    return (response.data as ApiResponse<Product>)?.data;
  } catch (error: any) {
    console.error(`Error adding ${productType}:`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Updates an existing product.
 * @param {string} id - The ID of the product to update.
 * @param {Partial<Product>} productData - The updated data for the product.
 * @returns {Promise<Product>} A promise that resolves to the updated product object.
 */
export const updateProduct = async (id: string, productData: Partial<Product>): Promise<Product> => {
  try {
    const config = getAuthConfig();
    const response = await axios.put(`${PRODUCTS_API_URL}/${id}`, productData, config);
    // 後端返回的是 ApiResponse 格式，需要取 data 屬性
    return (response.data as ApiResponse<Product>)?.data;
  } catch (error: any) {
    console.error('Error updating product:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Deletes a product.
 * @param {string} id - The ID of the product to delete.
 * @returns {Promise<void>} A promise that resolves when the product is deleted.
 */
export const deleteProduct = async (id: string): Promise<void> => {
  try {
    const config = getAuthConfig(false); // DELETE doesn't need Content-Type
    await axios.delete(`${PRODUCTS_API_URL}/${id}`, config);
  } catch (error: any) {
    console.error('Error deleting product:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Fetches a single product by its code.
 * @param {string} code - The code of the product to fetch.
 * @returns {Promise<Product>} A promise that resolves to the product object.
 */
export const getProductByCode = async (code: string): Promise<Product> => {
  try {
    const config = getAuthConfig(false);
    // Assuming the API endpoint is /api/products/code/:code
    const response = await axios.get(`${PRODUCTS_API_URL}/code/${code}`, config);
    // 後端返回的是 ApiResponse 格式，需要取 data 屬性
    return (response.data as ApiResponse<Product>)?.data;
  } catch (error: any) {
    console.error(`Error fetching product with code ${code}:`, error.response?.data || error.message);
    throw error;
  }
};

// Combine all service functions into one object for default export
const productService = {
  getProducts,
  getSuppliers,
  // getProductCategories is imported separately, keep it that way or integrate if preferred
  addProduct,
  updateProduct,
  deleteProduct,
  getProductByCode, // Include the new function
};

export default productService;