/**
 * 產品編號產生器
 * 用於自動產生商品和藥品的唯一編號
 * 商品編號格式: P10001, P10002, ...
 * 藥品編號格式: M10001, M10002, ...
 */

import { Product, Medicine } from '../models/BaseProduct';
import { CodeGenerationResult } from '@pharmacy-pos/shared/types/utils';

/**
 * 產生下一個可用的商品編號
 * @returns {Promise<CodeGenerationResult>} 包含格式為 P10001 的商品編號的結果物件
 */
export async function generateNextProductCode(): Promise<CodeGenerationResult> {
  try {
    // 查詢所有以 P 開頭的商品編號
    const products = await Product.find({ code: /^P\d+$/ })
      .select('code')
      .lean() as unknown as Array<{ code: string }>;
    
    // 如果沒有符合格式的商品，從 P10001 開始
    if (products.length === 0) {
      return {
        success: true,
        code: 'P10001',
        metadata: {
          length: 6,
          charset: 'P + digits',
          generatedAt: new Date()
        }
      };
    }
    
    // 提取所有數字部分並找到最大值，過濾掉負數和無效數字
    const numericParts = products
      .map(product => parseInt(product.code.substring(1), 10))
      .filter(num => !isNaN(num) && num > 0);
    
    if (numericParts.length === 0) {
      return {
        success: true,
        code: 'P10001',
        metadata: {
          length: 6,
          charset: 'P + digits',
          generatedAt: new Date()
        }
      };
    }
    
    // 找到最大的數字部分
    const maxNumericPart = Math.max(...numericParts);
    
    // 產生下一個編號
    const nextNumericPart = maxNumericPart + 1;
    const code = `P${nextNumericPart}`;
    
    return {
      success: true,
      code,
      metadata: {
        length: code.length,
        charset: 'P + digits',
        generatedAt: new Date()
      }
    };
  } catch (error) {
    console.error('產生商品編號時發生錯誤:', error instanceof Error ? error.message : error);
    
    // 發生錯誤時返回一個基於時間戳的備用編號
    const fallbackCode = `P${Date.now()}`;
    
    return {
      success: false,
      code: fallbackCode,
      error: error instanceof Error ? error.message : '未知錯誤',
      metadata: {
        length: fallbackCode.length,
        charset: 'P + timestamp',
        generatedAt: new Date()
      }
    };
  }
}

/**
 * 產生下一個可用的藥品編號
 * @returns {Promise<CodeGenerationResult>} 包含格式為 M10001 的藥品編號的結果物件
 */
export async function generateNextMedicineCode(): Promise<CodeGenerationResult> {
  try {
    // 查詢所有以 M 開頭的藥品編號
    const medicines = await Medicine.find({ code: /^M\d+$/ })
      .select('code')
      .lean() as unknown as Array<{ code: string }>;
    
    // 如果沒有符合格式的藥品，從 M10001 開始
    if (medicines.length === 0) {
      return {
        success: true,
        code: 'M10001',
        metadata: {
          length: 6,
          charset: 'M + digits',
          generatedAt: new Date()
        }
      };
    }
    
    // 提取所有數字部分並找到最大值，過濾掉負數和無效數字
    const numericParts = medicines
      .map(medicine => parseInt(medicine.code.substring(1), 10))
      .filter(num => !isNaN(num) && num > 0);
    
    if (numericParts.length === 0) {
      return {
        success: true,
        code: 'M10001',
        metadata: {
          length: 6,
          charset: 'M + digits',
          generatedAt: new Date()
        }
      };
    }
    
    // 找到最大的數字部分
    const maxNumericPart = Math.max(...numericParts);
    
    // 產生下一個編號
    const nextNumericPart = maxNumericPart + 1;
    const code = `M${nextNumericPart}`;
    
    return {
      success: true,
      code,
      metadata: {
        length: code.length,
        charset: 'M + digits',
        generatedAt: new Date()
      }
    };
  } catch (error) {
    console.error('產生藥品編號時發生錯誤:', error instanceof Error ? error.message : error);
    
    // 發生錯誤時返回一個基於時間戳的備用編號
    const fallbackCode = `M${Date.now()}`;
    
    return {
      success: false,
      code: fallbackCode,
      error: error instanceof Error ? error.message : '未知錯誤',
      metadata: {
        length: fallbackCode.length,
        charset: 'M + timestamp',
        generatedAt: new Date()
      }
    };
  }
}

/**
 * 根據是否有健保代碼產生產品編號
 * @param {boolean} hasHealthInsuranceCode - 是否有健保代碼
 * @returns {Promise<CodeGenerationResult>} 包含格式為 M10001 或 P10001 的產品編號的結果物件
 */
export async function generateProductCodeByHealthInsurance(hasHealthInsuranceCode: boolean): Promise<CodeGenerationResult> {
  try {
    const prefix = hasHealthInsuranceCode ? 'M' : 'P';
    
    // 查詢所有以指定前綴開頭的產品編號（從兩個集合中查詢）
    const productQuery = Product.find({ code: new RegExp(`^${prefix}\\d+$`) })
      .select('code')
      .lean();
    
    const medicineQuery = Medicine.find({ code: new RegExp(`^${prefix}\\d+$`) })
      .select('code')
      .lean();
    
    const [products, medicines] = await Promise.all([productQuery, medicineQuery]);
    
    // 合併兩個結果並提取數字部分，過濾掉負數和無效數字
    const allNumericParts = [...products, ...medicines]
      .map(item => (item as any).code)
      .filter(code => code && code.startsWith(prefix))
      .map(code => parseInt(code.substring(1), 10))
      .filter(num => !isNaN(num) && num > 0);
    
    // 如果沒有符合格式的產品，從 10001 開始
    if (allNumericParts.length === 0) {
      const code = `${prefix}10001`;
      return {
        success: true,
        code,
        metadata: {
          length: code.length,
          charset: `${prefix} + digits`,
          generatedAt: new Date()
        }
      };
    }
    
    // 找到最大的數字部分
    const maxNumericPart = Math.max(...allNumericParts);
    
    // 產生下一個編號
    const nextNumericPart = maxNumericPart + 1;
    const code = `${prefix}${nextNumericPart}`;
    
    return {
      success: true,
      code,
      metadata: {
        length: code.length,
        charset: `${prefix} + digits`,
        generatedAt: new Date()
      }
    };
  } catch (error) {
    console.error('產生產品編號時發生錯誤:', error instanceof Error ? error.message : error);
    
    // 發生錯誤時返回一個基於時間戳的備用編號
    const prefix = hasHealthInsuranceCode ? 'M' : 'P';
    const fallbackCode = `${prefix}${Date.now()}`;
    
    return {
      success: false,
      code: fallbackCode,
      error: error instanceof Error ? error.message : '未知錯誤',
      metadata: {
        length: fallbackCode.length,
        charset: `${prefix} + timestamp`,
        generatedAt: new Date()
      }
    };
  }
}

export default {
  generateNextProductCode,
  generateNextMedicineCode,
  generateProductCodeByHealthInsurance
};