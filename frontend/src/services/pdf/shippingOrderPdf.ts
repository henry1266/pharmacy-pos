import axios from 'axios';
import { PDFGenerationOptions } from '@pharmacy-pos/shared/types/utils';

/**
 * PDF 生成結果介面
 */
interface PdfDownloadResult {
  success: boolean;
  blob?: Blob;
  filename: string;
  error?: string;
}

/**
 * 生成出貨單PDF
 * @param orderId - 出貨單ID
 * @param options - PDF生成選項
 * @returns 返回PDF Blob對象
 */
export const generateShippingOrderPdf = async (
  orderId: string,
  options?: PDFGenerationOptions
): Promise<Blob> => {
  try {
    const response = await axios.get(`/api/shipping-orders/pdf/${orderId}`, {
      responseType: 'blob',
      params: options ? {
        format: options.format,
        orientation: options.orientation,
        includeHeader: options.includeHeader,
        includeFooter: options.includeFooter,
        compression: options.compression
      } : undefined
    });
    return response.data;
  } catch (error) {
    console.error('生成出貨單PDF時發生錯誤:', error);
    throw error;
  }
};

/**
 * 下載出貨單PDF
 * @param orderId - 出貨單ID
 * @param orderNumber - 出貨單號碼，用於檔名
 * @param options - PDF生成選項
 * @returns 下載結果
 */
export const downloadShippingOrderPdf = async (
  orderId: string,
  orderNumber?: string,
  options?: PDFGenerationOptions
): Promise<PdfDownloadResult> => {
  try {
    const pdfBlob = await generateShippingOrderPdf(orderId, options);
    const filename = `出貨單_${orderNumber || orderId}.pdf`;
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return {
      success: true,
      blob: pdfBlob,
      filename,
    };
  } catch (error: any) {
    console.error('下載出貨單PDF時發生錯誤:', error);
    return {
      success: false,
      filename: `出貨單_${orderNumber || orderId}.pdf`,
      error: error.message ?? '下載PDF時發生未知錯誤'
    };
  }
};

/**
 * 生成出貨單PDF - 第二種排版（無健保代碼）
 * @param orderId - 出貨單ID
 * @param options - PDF生成選項
 * @returns 返回PDF Blob對象
 */
export const generateShippingOrderPdfV2 = async (
  orderId: string,
  options?: PDFGenerationOptions
): Promise<Blob> => {
  try {
    const response = await axios.get(`/api/shipping-orders/pdf-v2/${orderId}`, {
      responseType: 'blob',
      params: options ? {
        format: options.format,
        orientation: options.orientation,
        includeHeader: options.includeHeader,
        includeFooter: options.includeFooter,
        compression: options.compression
      } : undefined
    });
    return response.data;
  } catch (error) {
    console.error('生成出貨單PDF第二版時發生錯誤:', error);
    throw error;
  }
};

/**
 * 下載出貨單PDF - 第二種排版（無健保代碼）
 * @param orderId - 出貨單ID
 * @param orderNumber - 出貨單號碼，用於檔名
 * @param options - PDF生成選項
 * @returns 下載結果
 */
export const downloadShippingOrderPdfV2 = async (
  orderId: string,
  orderNumber?: string,
  options?: PDFGenerationOptions
): Promise<PdfDownloadResult> => {
  try {
    const pdfBlob = await generateShippingOrderPdfV2(orderId, options);
    const filename = `出貨單_簡化版_${orderNumber || orderId}.pdf`;
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return {
      success: true,
      blob: pdfBlob,
      filename,
    };
  } catch (error: any) {
    console.error('下載出貨單PDF第二版時發生錯誤:', error);
    return {
      success: false,
      filename: `出貨單_簡化版_${orderNumber || orderId}.pdf`,
      error: error.message ?? '下載PDF時發生未知錯誤'
    };
  }
};

/**
 * 批量下載出貨單PDF
 * @param orders - 出貨單列表
 * @param options - PDF生成選項
 * @returns 批量下載結果
 */
export const batchDownloadShippingOrderPdfs = async (
  orders: Array<{ id: string; orderNumber?: string }>,
  options?: PDFGenerationOptions
): Promise<Array<PdfDownloadResult>> => {
  const results: PdfDownloadResult[] = [];
  
  for (const order of orders) {
    try {
      const result = await downloadShippingOrderPdf(order.id, order.orderNumber, options);
      results.push(result);
      
      // 添加延遲避免過於頻繁的請求
      if (orders.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error: any) {
      results.push({
        success: false,
        filename: `出貨單_${order.orderNumber || order.id}.pdf`,
        error: error.message ?? '批量下載時發生錯誤'
      });
    }
  }
  
  return results;
};