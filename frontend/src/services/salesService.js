import axios from 'axios';

const API_URL = '/api/sales';

export const getLatestSaleNumber = async (datePrefix) => {
  try {
    const response = await axios.get(`${API_URL}/latest-number/${datePrefix}`);
    return response.data.latestNumber;
  } catch (error) {
    console.error('Error fetching latest sale number:', error);
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
};

export const createSale = async (saleData) => {
  try {
    const response = await axios.post(API_URL, saleData);
    return response.data;
  } catch (error) {
    console.error('Error creating sale:', error);
    throw error;
  }
};

export const getAllSales = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching all sales:', error);
    throw error;
  }
};

// Added missing function based on error report
export const getSaleById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data; // Assuming the API returns the sale data directly
  } catch (error) {
    console.error(`Error fetching sale with ID ${id}:`, error);
    throw error;
  }
};

// Added missing function based on error report
export const updateSale = async (id, saleData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, saleData);
    return response.data; // Assuming the API returns the updated sale data
  } catch (error) {
    console.error(`Error updating sale with ID ${id}:`, error);
    throw error;
  }
};

