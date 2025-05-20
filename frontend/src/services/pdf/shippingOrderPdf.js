import axios from 'axios';

/**
 * 生成出貨單PDF
 * @param {string} orderId - 出貨單ID
 * @returns {Promise<Blob>} - 返回PDF Blob對象
 */
export const generateShippingOrderPdf = async (orderId) => {
  try {
    const response = await axios.get(`/api/shipping-orders/pdf/${orderId}`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('生成出貨單PDF時發生錯誤:', error);
    throw error;
  }
};

/**
 * 下載出貨單PDF
 * @param {string} orderId - 出貨單ID
 * @param {string} orderNumber - 出貨單號碼，用於檔名
 */
export const downloadShippingOrderPdf = async (orderId, orderNumber) => {
  try {
    const pdfBlob = await generateShippingOrderPdf(orderId);
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `出貨單_${orderNumber || orderId}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('下載出貨單PDF時發生錯誤:', error);
    throw error;
  }
};
