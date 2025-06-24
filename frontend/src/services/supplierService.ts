import axios from 'axios';
import { ApiResponse } from '@pharmacy-pos/shared/types/api';
import { Supplier } from '@pharmacy-pos/shared/types/entities';
import { FileProcessingOptions, FileValidationResult, FileUploadResult } from '@pharmacy-pos/shared/types/utils';

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
    const suppliers = (response.data as ApiResponse<unknown[]>)?.data ?? [];
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
 * 驗證CSV檔案
 * @param file - 要驗證的檔案
 * @param options - 檔案處理選項
 * @returns 驗證結果
 */
export const validateCsvFile = (file: File, options?: FileProcessingOptions): FileValidationResult => {
  const defaultOptions: FileProcessingOptions = {
    allowedExtensions: ['.csv'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1
  };
  
  const processingOptions = { ...defaultOptions, ...options };
  const errors: string[] = [];
  
  // 檢查檔案擴展名
  if (processingOptions.allowedExtensions) {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!processingOptions.allowedExtensions.includes(fileExtension)) {
      errors.push(`不支援的檔案格式，僅支援: ${processingOptions.allowedExtensions.join(', ')}`);
    }
  }
  
  // 檢查檔案大小
  if (processingOptions.maxFileSize && file.size > processingOptions.maxFileSize) {
    const maxSizeMB = processingOptions.maxFileSize / 1024 / 1024;
    errors.push(`檔案大小超過限制 (${maxSizeMB}MB)`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    fileInfo: {
      originalName: file.name,
      size: file.size,
      mimetype: file.type,
      extension: '.' + file.name.split('.').pop()?.toLowerCase() || ''
    }
  };
};

/**
 * 從CSV文件導入供應商
 * @param file - 要導入的CSV文件
 * @param options - 檔案處理選項
 * @returns 包含導入結果對象的Promise
 */
export const importSuppliersCsv = async (
  file: File,
  options?: FileProcessingOptions
): Promise<FileUploadResult & { imported?: number }> => {
  try {
    // 驗證檔案
    const validation = validateCsvFile(file, options);
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors
      };
    }
    
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
    
    return {
      success: response.data.success,
      files: validation.fileInfo ? [{
        originalName: validation.fileInfo.originalName,
        filename: validation.fileInfo.originalName,
        path: '',
        size: validation.fileInfo.size,
        mimetype: validation.fileInfo.mimetype
      }] : undefined,
      errors: response.data.errors,
      imported: response.data.imported
    };
  } catch (error: any) {
    console.error('Error importing suppliers CSV:', error.response?.data ?? error.message);
    return {
      success: false,
      errors: [error.response?.data?.message || error.message || '導入失敗']
    };
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