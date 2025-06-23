import axios from 'axios';
import { Supplier } from '@pharmacy-pos/shared/types/entities';

// Base API URL for suppliers
const SUPPLIERS_API_URL = '/api/suppliers';

// Helper function to get auth config
const getAuthConfig = (includeContentType = false): { headers: Record<string, string> } => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('Authentication token not found.');
    throw new Error('Authentication required.');
  }
  const headers: Record<string, string> = { 'x-auth-token': token };
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  return { headers };
};

/**
 * 獲取所有供應商
 * @returns {Promise<Array<Supplier & { id: string }>>} 包含供應商對象的Promise
 */
export const getSuppliers = async (): Promise<Array<Supplier & { id: string }>> => {
  try {
    const config = getAuthConfig();
    const response = await axios.get(SUPPLIERS_API_URL, config);
    // Extract data from ApiResponse structure
    const suppliers = (response.data as any)?.data ?? [];
    // Format data to match the structure expected by the page (with id)
    return suppliers.map((supplier: any) => ({
      ...supplier,
      id: supplier._id // Map _id to id
    }));
  } catch (error: any) {
    console.error('Error fetching suppliers:', error.response?.data ?? error.message);
    throw error;
  }
};

/**
 * 創建新供應商
 * @param {Partial<Supplier>} supplierData - 新供應商的數據
 * @returns {Promise<Supplier & { id: string }>} 包含新創建的供應商對象的Promise
 */
export const createSupplier = async (supplierData: Partial<Supplier>): Promise<Supplier & { id: string }> => {
  try {
    const config = getAuthConfig(true); // Include Content-Type
    const response = await axios.post(SUPPLIERS_API_URL, supplierData, config);
    const supplier = (response.data as any)?.data;
    return { ...supplier, id: supplier._id }; // Return formatted data
  } catch (error: any) {
    console.error('Error creating supplier:', error.response?.data ?? error.message);
    throw error;
  }
};

/**
 * 更新現有供應商
 * @param {string} id - 要更新的供應商ID
 * @param {Partial<Supplier>} supplierData - 供應商的更新數據
 * @returns {Promise<Supplier & { id: string }>} 包含更新後的供應商對象的Promise
 */
export const updateSupplier = async (id: string, supplierData: Partial<Supplier>): Promise<Supplier & { id: string }> => {
  try {
    const config = getAuthConfig(true); // Include Content-Type
    const response = await axios.put(`${SUPPLIERS_API_URL}/${id}`, supplierData, config);
    const supplier = (response.data as any)?.data;
    return { ...supplier, id: supplier._id }; // Return formatted data
  } catch (error: any) {
    console.error('Error updating supplier:', error.response?.data ?? error.message);
    throw error;
  }
};

/**
 * 刪除供應商
 * @param {string} id - 要刪除的供應商ID
 * @returns {Promise<void>} 供應商刪除後解析的Promise
 */
export const deleteSupplier = async (id: string): Promise<void> => {
  try {
    const config = getAuthConfig();
    await axios.delete(`${SUPPLIERS_API_URL}/${id}`, config);
  } catch (error: any) {
    console.error('Error deleting supplier:', error.response?.data ?? error.message);
    throw error;
  }
};

/**
 * 下載供應商導入CSV模板
 * @returns {Promise<Blob>} 包含CSV模板文件blob的Promise
 */
export const downloadSupplierTemplate = async (): Promise<Blob> => {
  try {
    const config = {
      ...getAuthConfig(),
      responseType: 'blob' as const
    };
    const response = await axios.get<Blob>(`${SUPPLIERS_API_URL}/template/csv`, config);
    return new Blob([response.data], { type: response.headers['content-type'] });
  } catch (error: any) {
    console.error('Error downloading supplier template:', error.response?.data ?? error.message);
    throw error;
  }
};

/**
 * 從CSV文件導入供應商
 * @param {File} file - 要導入的CSV文件
 * @returns {Promise<{ success: boolean; message: string; imported?: number; errors?: any[] }>} 包含導入結果對象的Promise
 */
export const importSuppliersCsv = async (file: File): Promise<{ success: boolean; message: string; imported?: number; errors?: any[] }> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication required.');
    
    const formData = new FormData();
    formData.append('file', file);
    
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-auth-token': token
      }
    };
    
    const response = await axios.post<{ success: boolean; message: string; imported?: number; errors?: any[] }>(
      `${SUPPLIERS_API_URL}/import-csv`, 
      formData, 
      config
    );
    return response.data;
  } catch (error: any) {
    console.error('Error importing suppliers CSV:', error.response?.data ?? error.message);
    throw error;
  }
};

/**
 * 供應商服務
 */
const supplierService = {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  downloadSupplierTemplate,
  importSuppliersCsv,
};

export default supplierService;