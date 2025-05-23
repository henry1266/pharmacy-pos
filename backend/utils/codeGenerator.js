/**
 * 產品編號產生器
 * 用於自動產生商品和藥品的唯一編號
 * 商品編號格式: P10001, P10002, ...
 * 藥品編號格式: M10001, M10002, ...
 */

const { BaseProduct, Product, Medicine } = require('../models/BaseProduct');

/**
 * 產生下一個可用的商品編號
 * @returns {Promise<string>} 格式為 P10001 的商品編號
 */
async function generateNextProductCode() {
  try {
    // 查詢所有以 P 開頭的商品編號
    const products = await Product.find({ code: /^P\d+$/ }).sort({ code: -1 }).limit(1);
    
    // 如果沒有符合格式的商品，從 P10001 開始
    if (products.length === 0) {
      return 'P10001';
    }
    
    // 取得最後一個商品編號並提取數字部分
    const lastCode = products[0].code;
    const numericPart = parseInt(lastCode.substring(1), 10);
    
    // 產生下一個編號
    const nextNumericPart = numericPart + 1;
    return `P${nextNumericPart}`;
  } catch (error) {
    console.error('產生商品編號時發生錯誤:', error);
    // 發生錯誤時返回一個基於時間戳的備用編號
    return `P${Date.now()}`;
  }
}

/**
 * 產生下一個可用的藥品編號
 * @returns {Promise<string>} 格式為 M10001 的藥品編號
 */
async function generateNextMedicineCode() {
  try {
    // 查詢所有以 M 開頭的藥品編號
    const medicines = await Medicine.find({ code: /^M\d+$/ }).sort({ code: -1 }).limit(1);
    
    // 如果沒有符合格式的藥品，從 M10001 開始
    if (medicines.length === 0) {
      return 'M10001';
    }
    
    // 取得最後一個藥品編號並提取數字部分
    const lastCode = medicines[0].code;
    const numericPart = parseInt(lastCode.substring(1), 10);
    
    // 產生下一個編號
    const nextNumericPart = numericPart + 1;
    return `M${nextNumericPart}`;
  } catch (error) {
    console.error('產生藥品編號時發生錯誤:', error);
    // 發生錯誤時返回一個基於時間戳的備用編號
    return `M${Date.now()}`;
  }
}

module.exports = {
  generateNextProductCode,
  generateNextMedicineCode
};
