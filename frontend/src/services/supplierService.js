import apiService from "../utils/apiService";

const SUPPLIERS_API_PATH = "/api/suppliers";

// Mock data for test mode
const mockSupplierData = [
  { _id: "supplier_mock_id_1", id: "supplier_mock_id_1", name: "虛擬供應商 Alpha", contactPerson: "陳經理", phone: "02-1111-1111", email: "alpha@example.com", address: "虛擬市虛擬路一段1號" },
  { _id: "supplier_mock_id_2", id: "supplier_mock_id_2", name: "虛擬供應商 Beta", contactPerson: "林小姐", phone: "03-2222-2222", email: "beta@example.com", address: "虛擬市虛擬路二段2號" },
  { _id: "supplier_mock_id_3", id: "supplier_mock_id_3", name: "虛擬供應商 Gamma", contactPerson: "王先生", phone: "04-3333-3333", email: "gamma@example.com", address: "虛擬市虛擬路三段3號" },
];

// Helper to check if in test mode
const isTestMode = () => localStorage.getItem("isTestMode") === "true";

/**
 * Fetches all suppliers.
 * @returns {Promise<Array>} A promise that resolves to an array of supplier objects.
 */
export const getSuppliers = async () => {
  if (isTestMode()) {
    console.log("[Test Mode] Fetching virtual suppliers");
    return new Promise(resolve => {
      setTimeout(() => {
        // The page expects 'id' field, so ensure mock data has it or map it here.
        // The current mockSupplierData already includes 'id'.
        resolve(mockSupplierData);
      }, 200); // Simulate network delay
    });
  }

  try {
    const response = await apiService.get(SUPPLIERS_API_PATH);
    return response.data.map(supplier => ({
      ...supplier,
      id: supplier._id // Ensure 'id' field is present for consistency
    }));
  } catch (error) {
    console.error("Error fetching suppliers:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Creates a new supplier.
 * @param {object} supplierData - The data for the new supplier.
 * @returns {Promise<object>} A promise that resolves to the newly created supplier object.
 */
export const createSupplier = async (supplierData) => {
  if (isTestMode()) {
    console.log("[Test Mode] Creating virtual supplier:", supplierData);
    return new Promise(resolve => {
      setTimeout(() => {
        const newSupplier = { ...supplierData, _id: `mock_sup_${Date.now()}`, id: `mock_sup_${Date.now()}` };
        mockSupplierData.push(newSupplier);
        resolve(newSupplier);
      }, 200);
    });
  }

  try {
    const response = await apiService.post(SUPPLIERS_API_PATH, supplierData);
    return { ...response.data, id: response.data._id };
  } catch (error) {
    console.error("Error creating supplier:", error.response?.data || error.message);
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
  if (isTestMode()) {
    console.log(`[Test Mode] Updating virtual supplier with ID: ${id}`, supplierData);
    return new Promise(resolve => {
      setTimeout(() => {
        const index = mockSupplierData.findIndex(s => s.id === id || s._id === id);
        if (index !== -1) {
          mockSupplierData[index] = { ...mockSupplierData[index], ...supplierData };
          resolve(mockSupplierData[index]);
        } else {
          resolve({ error: "Supplier not found in mock data" });
        }
      }, 200);
    });
  }

  try {
    const response = await apiService.put(`${SUPPLIERS_API_PATH}/${id}`, supplierData);
    return { ...response.data, id: response.data._id };
  } catch (error) {
    console.error("Error updating supplier:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Deletes a supplier.
 * @param {string} id - The ID of the supplier to delete.
 * @returns {Promise<void>} A promise that resolves when the supplier is deleted.
 */
export const deleteSupplier = async (id) => {
  if (isTestMode()) {
    console.log(`[Test Mode] Deleting virtual supplier with ID: ${id}`);
    return new Promise(resolve => {
      setTimeout(() => {
        const index = mockSupplierData.findIndex(s => s.id === id || s._id === id);
        if (index !== -1) {
          mockSupplierData.splice(index, 1);
        }
        resolve({ message: "Virtual supplier deleted" });
      }, 200);
    });
  }

  try {
    await apiService.delete(`${SUPPLIERS_API_PATH}/${id}`);
  } catch (error) {
    console.error("Error deleting supplier:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Downloads the supplier import CSV template.
 * @returns {Promise<Blob>} A promise that resolves to the CSV template file blob.
 */
export const downloadSupplierTemplate = async () => {
  if (isTestMode()) {
    console.log("[Test Mode] Simulating download of supplier template CSV");
    return new Promise(resolve => {
      setTimeout(() => {
        const csvContent = "name,contactPerson,phone,email,address\n虛擬供應商丁,張三,02-1234-5678,delta@example.com,虛擬市測試路四段4號";
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        resolve(blob);
      }, 200);
    });
  }
  try {
    const response = await apiService.get(`${SUPPLIERS_API_PATH}/template/csv`, { responseType: "blob" });
    return response.data;
  } catch (error) {
    console.error("Error downloading supplier template:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Imports suppliers from a CSV file.
 * @param {File} file - The CSV file to import.
 * @returns {Promise<object>} A promise that resolves to the import result object.
 */
export const importSuppliersCsv = async (file) => {
  if (isTestMode()) {
    console.log("[Test Mode] Simulating import of suppliers CSV:", file.name);
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ total: 5, success: 4, failed: 1, duplicates: 0, errors: ["Row 3: Invalid email format"] });
      }, 200);
    });
  }
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiService.post(`${SUPPLIERS_API_PATH}/import-csv`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  } catch (error) {
    console.error("Error importing suppliers CSV:", error.response?.data || error.message);
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

