import axios from 'axios';

// Base API URL for suppliers
const SUPPLIERS_API_URL = '/api/suppliers';

// Helper function to get auth config (assuming similar pattern)
const getAuthConfig = (includeContentType = false) => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('Authentication token not found.');
    throw new Error('Authentication required.');
  }
  const headers = { 'x-auth-token': token };
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  return { headers };
};

/**
 * Fetches all suppliers.
 * @returns {Promise<Array>} A promise that resolves to an array of supplier objects.
 */
export const getSuppliers = async () => {
  try {
    const config = getAuthConfig();
    const response = await axios.get(SUPPLIERS_API_URL, config);
    // Format data to match the structure expected by the page (with id)
    return response.data.map(supplier => ({
      ...supplier,
      id: supplier._id // Map _id to id
    }));
  } catch (error) {
    console.error('Error fetching suppliers:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Creates a new supplier.
 * @param {object} supplierData - The data for the new supplier.
 * @returns {Promise<object>} A promise that resolves to the newly created supplier object.
 */
export const createSupplier = async (supplierData) => {
  try {
    const config = getAuthConfig(true); // Include Content-Type
    const response = await axios.post(SUPPLIERS_API_URL, supplierData, config);
    return { ...response.data, id: response.data._id }; // Return formatted data
  } catch (error) {
    console.error('Error creating supplier:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Updates an existing supplier.
 * @param {string} id - The ID of the supplier to update.
 * @param {object} supplierData - The updated data for the supplier.
 * @returns {Promise<object>} A promise that resolves to the updated supplier object.
 */
export const updateSupplier = async (id, supplierData) => {
  try {
    const config = getAuthConfig(true); // Include Content-Type
    const response = await axios.put(`${SUPPLIERS_API_URL}/${id}`, supplierData, config);
    return { ...response.data, id: response.data._id }; // Return formatted data
  } catch (error) {
    console.error('Error updating supplier:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Deletes a supplier.
 * @param {string} id - The ID of the supplier to delete.
 * @returns {Promise<void>} A promise that resolves when the supplier is deleted.
 */
export const deleteSupplier = async (id) => {
  try {
    const config = getAuthConfig();
    await axios.delete(`${SUPPLIERS_API_URL}/${id}`, config);
  } catch (error) {
    console.error('Error deleting supplier:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Downloads the supplier import CSV template.
 * @returns {Promise<Blob>} A promise that resolves to the CSV template file blob.
 */
export const downloadSupplierTemplate = async () => {
  try {
    const config = { ...getAuthConfig(), responseType: 'blob' };
    const response = await axios.get(`${SUPPLIERS_API_URL}/template/csv`, config);
    return response.data;
  } catch (error) {
    console.error('Error downloading supplier template:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Imports suppliers from a CSV file.
 * @param {File} file - The CSV file to import.
 * @returns {Promise<object>} A promise that resolves to the import result object.
 */
export const importSuppliersCsv = async (file) => {
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
    
    const response = await axios.post(`${SUPPLIERS_API_URL}/import-csv`, formData, config);
    return response.data;
  } catch (error) {
    console.error('Error importing suppliers CSV:', error.response?.data || error.message);
    throw error;
  }
};


const supplierService = {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  downloadSupplierTemplate,
  importSuppliersCsv,
};

export default supplierService;

