import axios from 'axios';
import { API_BASE_URL } from '../redux/actions'; // Assuming API_BASE_URL is exported

const SERVICE_URL = `${API_BASE_URL}/shipping-orders`.replace('/api/api', '/api');

/**
 * Fetches a single shipping order by its ID.
 * Used for preview functionality.
 * @param {string} id - The ID of the shipping order.
 * @returns {Promise<object>} The shipping order data.
 */
export const getShippingOrderById = async (id) => {
  try {
    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };
    const response = await axios.get(`${SERVICE_URL}/${id}`, config);
    return response.data;
  } catch (error) {
    console.error(`Error fetching shipping order with ID ${id}:`, error);
    throw error; // Re-throw to be handled by the caller (e.g., the hook)
  }
};

/**
 * Imports shipping orders (basic info) from a CSV file.
 * @param {File} file - The CSV file.
 * @returns {Promise<object>} The response from the server.
 */
export const importShippingOrdersBasic = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'basic'); // Explicitly set type

    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'multipart/form-data'
      }
    };

    const response = await axios.post(`${SERVICE_URL}/import/basic`, formData, config);
    return response.data;
  } catch (error) {
    console.error('Error importing basic shipping orders CSV:', error);
    throw error; // Re-throw to be handled by the caller
  }
};

/**
 * Imports shipping order items from a CSV file.
 * @param {File} file - The CSV file.
 * @returns {Promise<object>} The response from the server.
 */
export const importShippingOrdersItems = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'items'); // Explicitly set type

    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'multipart/form-data'
      }
    };

    const response = await axios.post(`${SERVICE_URL}/import/items`, formData, config);
    return response.data;
  } catch (error) {
    console.error('Error importing shipping order items CSV:', error);
    throw error; // Re-throw to be handled by the caller
  }
};

// Note: Functions like fetchShippingOrders, deleteShippingOrder, searchShippingOrders 
// are currently handled via Redux actions (actions.js). 
// For consistency, they could also be moved here and Redux actions could call these service functions.
// However, based on the current task scope, we only move the direct axios calls found in the component/hook.

