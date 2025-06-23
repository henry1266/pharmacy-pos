import axios from 'axios';
import { Customer } from '@pharmacy-pos/shared/types/entities';

// Base API URL for customers
const API_URL = '/api/customers';

// Helper function to get auth config
const getAuthConfig = (): { headers: { 'Content-Type': string; 'x-auth-token': string } } => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('Authentication token not found.');
    // Optionally redirect to login or throw a specific error
    throw new Error('Authentication required.');
  }
  return {
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token,
    },
  };
};

/**
 * 獲取所有客戶
 * @returns {Promise<Customer[]>} 包含客戶對象的Promise
 */
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const token = localStorage.getItem('token'); // Get token directly
    if (!token) throw new Error('Authentication required.');
    const config = { headers: { 'x-auth-token': token } }; // Config for GET
    const response = await axios.get(API_URL, config);
    return (response.data as any)?.data ?? [];
  } catch (error: any) {
    console.error('Error fetching customers:', error.response?.data ?? error.message);
    throw error; // Re-throw for handling in the hook/component
  }
};

/**
 * 根據ID獲取單個客戶
 * @param {string} id - 要獲取的客戶ID
 * @returns {Promise<Customer>} 包含客戶對象的Promise
 */
export const getCustomerById = async (id: string): Promise<Customer> => {
  try {
    const token = localStorage.getItem('token'); // Get token directly
    if (!token) throw new Error('Authentication required.');
    const config = { headers: { 'x-auth-token': token } }; // Config for GET
    const response = await axios.get(`${API_URL}/${id}`, config);
    return (response.data as any)?.data;
  } catch (error: any) {
    console.error(`Error fetching customer ${id}:`, error.response?.data ?? error.message);
    // Throw a more specific error message
    throw new Error(error.response?.data?.message ?? `獲取客戶 ${id} 詳情失敗`);
  }
};

/**
 * 添加新客戶
 * @param {Partial<Customer>} customerData - 新客戶的數據
 * @returns {Promise<Customer>} 包含新創建的客戶對象的Promise
 */
export const addCustomer = async (customerData: Partial<Customer>): Promise<Customer> => {
  try {
    const config = getAuthConfig(); // Get full config with Content-Type
    // Ensure empty strings are handled if needed by backend, or remove this logic if backend handles null/undefined
    const dataToSend = {
      ...customerData,
      email: customerData.email === '' ? ' ' : customerData.email, // Keep original logic for now
      address: customerData.address === '' ? ' ' : customerData.address, // Keep original logic for now
    };
    const response = await axios.post(API_URL, dataToSend, config);
    return (response.data as any)?.data;
  } catch (error: any) {
    console.error('Error adding customer:', error.response?.data ?? error.message);
    throw error;
  }
};

/**
 * 更新現有客戶
 * @param {string} id - 要更新的客戶ID
 * @param {Partial<Customer>} customerData - 客戶的更新數據
 * @returns {Promise<Customer>} 包含更新後的客戶對象的Promise
 */
export const updateCustomer = async (id: string, customerData: Partial<Customer>): Promise<Customer> => {
  try {
    const config = getAuthConfig(); // Get full config with Content-Type
    // Ensure empty strings are handled if needed by backend
    const dataToSend = {
      ...customerData,
      email: customerData.email === '' ? ' ' : customerData.email, // Keep original logic for now
      address: customerData.address === '' ? ' ' : customerData.address, // Keep original logic for now
    };
    const response = await axios.put(`${API_URL}/${id}`, dataToSend, config);
    return (response.data as any)?.data;
  } catch (error: any) {
    console.error('Error updating customer:', error.response?.data ?? error.message);
    throw error;
  }
};

/**
 * 刪除客戶
 * @param {string} id - 要刪除的客戶ID
 * @returns {Promise<void>} 客戶刪除後解析的Promise
 */
export const deleteCustomer = async (id: string): Promise<void> => {
  try {
    const token = localStorage.getItem('token'); // Get token directly
    if (!token) throw new Error('Authentication required.');
    // DELETE requests typically don't need Content-Type, just the auth token
    const config = { headers: { 'x-auth-token': token } };
    await axios.delete(`${API_URL}/${id}`, config);
  } catch (error: any) {
    console.error('Error deleting customer:', error.response?.data ?? error.message);
    throw error;
  }
};

/**
 * 客戶服務
 */
const customerService = {
  getCustomers,
  getCustomerById,
  addCustomer,
  updateCustomer,
  deleteCustomer,
};

export default customerService;