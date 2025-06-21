/**
 * 產品編號產生器
 * 用於自動產生商品和藥品的唯一編號
 * 商品編號格式: P10001, P10002, ...
 * 藥品編號格式: M10001, M10002, ...
 */

import BaseProduct from '../models/BaseProduct';
import { CodeGenerationResult } from '../src/types/utils';

/**
 * 產生下一個可用的商品編號
 * @returns {Promise<string>} 格式為 P10001 的商品編號
 */
export async function generateNextProductCode(): Promise<string> {
  try {
    // 查詢所有以 P 開頭的商品編號，且 __t 為 'Product'
    const products = await BaseProduct.find({ 
      productCode: /^P\d+$/, 
      __t: 'Product' 
    }).sort({ productCode: -1 }).limit(1);
    
    // 如果沒有符合格式的商品，從 P10001 開始
    if (products.length === 0) {
      return 'P10001';
    }
    
    // 取得最後一個商品編號並提取數字部分
    const lastCode = products[0]?.productCode;
    if (!lastCode) {
      return 'P10001';
    }
    const numericPart = parseInt(lastCode.substring(1), 10);
    
    // 產生下一個編號
    const nextNumericPart = numericPart + 1;
    return `P${nextNumericPart}`;
  } catch (error: any) {
    console.error('產生商品編號時發生錯誤:', error);
    // 發生錯誤時返回一個基於時間戳的備用編號
    return `P${Date.now()}`;
  }
}

/**
 * 產生下一個可用的藥品編號
 * @returns {Promise<string>} 格式為 M10001 的藥品編號
 */
export async function generateNextMedicineCode(): Promise<string> {
  try {
    // 查詢所有以 M 開頭的藥品編號，且 __t 為 'Medicine'
    const medicines = await BaseProduct.find({ 
      productCode: /^M\d+$/, 
      __t: 'Medicine' 
    }).sort({ productCode: -1 }).limit(1);
    
    // 如果沒有符合格式的藥品，從 M10001 開始
    if (medicines.length === 0) {
      return 'M10001';
    }
    
    // 取得最後一個藥品編號並提取數字部分
    const lastCode = medicines[0]?.productCode;
    if (!lastCode) {
      return 'M10001';
    }
    const numericPart = parseInt(lastCode.substring(1), 10);
    
    // 產生下一個編號
    const nextNumericPart = numericPart + 1;
    return `M${nextNumericPart}`;
  } catch (error: any) {
    console.error('產生藥品編號時發生錯誤:', error);
    // 發生錯誤時返回一個基於時間戳的備用編號
    return `M${Date.now()}`;
  }
}

/**
 * 產生下一個可用的產品編號（通用）
 * @param type 產品類型 ('Product' | 'Medicine')
 * @returns {Promise<CodeGenerationResult>} 包含成功狀態和生成的編號
 */
export async function generateNextCode(type: 'Product' | 'Medicine'): Promise<CodeGenerationResult> {
  try {
    let code: string;
    
    if (type === 'Product') {
      code = await generateNextProductCode();
    } else {
      code = await generateNextMedicineCode();
    }
    
    return {
      success: true,
      code,
      metadata: {
        length: code.length,
        charset: type === 'Product' ? 'P + numbers' : 'M + numbers',
        generatedAt: new Date()
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: `生成${type === 'Product' ? '商品' : '藥品'}編號失敗: ${error.message}`
    };
  }
}

/**
 * 驗證產品編號格式
 * @param code 產品編號
 * @param type 產品類型
 * @returns {boolean} 是否符合格式
 */
export function validateProductCode(code: string, type: 'Product' | 'Medicine'): boolean {
  const prefix = type === 'Product' ? 'P' : 'M';
  const pattern = new RegExp(`^${prefix}\\d{5,}$`);
  return pattern.test(code);
}

/**
 * 檢查產品編號是否已存在
 * @param code 產品編號
 * @returns {Promise<boolean>} 是否已存在
 */
export async function checkCodeExists(code: string): Promise<boolean> {
  try {
    const existingProduct = await BaseProduct.findOne({ productCode: code });
    return !!existingProduct;
  } catch (error: any) {
    console.error('檢查產品編號時發生錯誤:', error);
    return false;
  }
}

/**
 * 批量生成產品編號
 * @param type 產品類型
 * @param count 生成數量
 * @returns {Promise<string[]>} 生成的編號陣列
 */
export async function generateBatchCodes(type: 'Product' | 'Medicine', count: number): Promise<string[]> {
  const codes: string[] = [];
  
  try {
    for (let i = 0; i < count; i++) {
      const code = type === 'Product' 
        ? await generateNextProductCode() 
        : await generateNextMedicineCode();
      codes.push(code);
    }
    
    return codes;
  } catch (error: any) {
    console.error('批量生成產品編號時發生錯誤:', error);
    return codes; // 返回已生成的部分編號
  }
}

export default {
  generateNextProductCode,
  generateNextMedicineCode,
  generateNextCode,
  validateProductCode,
  checkCodeExists,
  generateBatchCodes
};