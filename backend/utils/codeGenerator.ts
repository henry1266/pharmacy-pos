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
      .sort({ code: -1 })
      .limit(1)
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
    
    // 取得最後一個商品編號並提取數字部分
    if (!products[0]) {
      throw new Error('無法獲取商品編號');
    }
    
    const lastCode = products[0].code;
    const numericPart = parseInt(lastCode.substring(1), 10);
    
    // 產生下一個編號
    const nextNumericPart = numericPart + 1;
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
      .sort({ code: -1 })
      .limit(1)
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
    
    // 取得最後一個藥品編號並提取數字部分
    if (!medicines[0]) {
      throw new Error('無法獲取藥品編號');
    }
    
    const lastCode = medicines[0].code;
    const numericPart = parseInt(lastCode.substring(1), 10);
    
    // 產生下一個編號
    const nextNumericPart = numericPart + 1;
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
    
    // 合併兩個結果並排序
    const allCodes = [...products, ...medicines]
      .map(item => (item as any).code)
      .filter(code => code && code.startsWith(prefix))
      .sort((a, b) => {
        const numA = parseInt(a.substring(1), 10);
        const numB = parseInt(b.substring(1), 10);
        return numB - numA; // 降序排列
      });
    
    // 如果沒有符合格式的產品，從 10001 開始
    if (allCodes.length === 0) {
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
    
    // 取得最後一個編號並提取數字部分
    const lastCode = allCodes[0];
    const numericPart = parseInt(lastCode.substring(1), 10);
    
    // 產生下一個編號
    const nextNumericPart = numericPart + 1;
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