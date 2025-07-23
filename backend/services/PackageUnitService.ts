import ProductPackageUnit from '../models/ProductPackageUnit';
import {
  ProductPackageUnit as IProductPackageUnit,
  PackageDisplayResult,
  PackageBreakdownItem,
  PackageUnitValidationResult,
  PackageInputParseResult,
  PackageUnitErrorCodes
} from '@pharmacy-pos/shared/types/package';

/**
 * 包裝單位服務
 * 提供包裝單位的驗證、轉換和管理功能
 */
export class PackageUnitService {
  
  /**
   * 驗證包裝單位配置的合理性
   * @param units 包裝單位配置陣列
   * @returns 驗證結果
   */
  static validatePackageUnits(units: Omit<IProductPackageUnit, '_id' | 'productId' | 'createdAt' | 'updatedAt'>[]): PackageUnitValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!Array.isArray(units) || units.length === 0) {
      errors.push('包裝單位配置不能為空');
      return { isValid: false, errors, warnings };
    }
    
    // 1. 檢查單位名稱唯一性
    const unitNames = units.map(u => u.unitName);
    const duplicateNames = unitNames.filter((name, index) => unitNames.indexOf(name) !== index);
    if (duplicateNames.length > 0) {
      errors.push(`單位名稱重複: ${[...new Set(duplicateNames)].join(', ')}`);
    }
    
    // 2. 檢查 unitValue 唯一性
    const unitValues = units.map(u => u.unitValue);
    const duplicateValues = unitValues.filter((value, index) => unitValues.indexOf(value) !== index);
    if (duplicateValues.length > 0) {
      errors.push(`包裝數量重複: ${[...new Set(duplicateValues)].join(', ')}`);
    }
    
    // 3. 檢查數值合理性
    for (const unit of units) {
      if (!Number.isInteger(unit.unitValue) || unit.unitValue <= 0) {
        errors.push(`單位 "${unit.unitName}" 的數值必須為正整數`);
      }
    }
    
    // 4. 檢查整除關係（警告）
    if (errors.length === 0) {
      const sortedUnits = [...units].sort((a, b) => b.unitValue - a.unitValue);
      for (let i = 0; i < sortedUnits.length - 1; i++) {
        const current = sortedUnits[i];
        const next = sortedUnits[i + 1];
        if (current.unitValue % next.unitValue !== 0) {
          warnings.push(`${current.unitName}(${current.unitValue}) 無法被 ${next.unitName}(${next.unitValue}) 整除，可能導致顯示不準確`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * 將基礎單位數量轉換為包裝單位顯示
   * @param baseQuantity 基礎單位數量
   * @param packageUnits 包裝單位配置
   * @returns 包裝顯示結果
   */
  static convertToPackageDisplay(
    baseQuantity: number,
    packageUnits: IProductPackageUnit[]
  ): PackageDisplayResult {
    
    if (!Number.isInteger(baseQuantity) || baseQuantity < 0) {
      return {
        baseQuantity: 0,
        packageBreakdown: [],
        displayText: '0',
        configUsed: packageUnits
      };
    }
    
    // 過濾啟用的包裝單位並按 unitValue 降序排序（數量越大優先級越高）
    const activeUnits = packageUnits
      .filter(unit => unit.isActive)
      .sort((a, b) => b.unitValue - a.unitValue);
    
    if (activeUnits.length === 0) {
      return {
        baseQuantity,
        packageBreakdown: [],
        displayText: baseQuantity.toString(),
        configUsed: packageUnits
      };
    }
    
    let remainingQuantity = baseQuantity;
    const breakdown: PackageBreakdownItem[] = [];
    
    // 從最大包裝開始分解
    for (const unit of activeUnits) {
      if (remainingQuantity >= unit.unitValue) {
        const quantity = Math.floor(remainingQuantity / unit.unitValue);
        remainingQuantity = remainingQuantity % unit.unitValue;
        
        breakdown.push({
          unitName: unit.unitName,
          quantity: quantity,
          unitValue: unit.unitValue
        });
      }
    }
    
    // 生成顯示文字
    const displayText = breakdown.length > 0 
      ? breakdown.map(item => `${item.quantity}${item.unitName}`).join(' ')
      : baseQuantity.toString();
    
    return {
      baseQuantity,
      packageBreakdown: breakdown,
      displayText,
      configUsed: packageUnits
    };
  }
  
  /**
   * 將包裝單位輸入轉換為基礎單位
   * @param input 用戶輸入字串
   * @param packageUnits 包裝單位配置
   * @returns 轉換結果
   */
  static convertToBaseUnit(
    input: string,
    packageUnits: IProductPackageUnit[]
  ): PackageInputParseResult {
    
    const result: PackageInputParseResult = {
      baseQuantity: 0,
      parsedInput: [],
      displayText: '',
      errors: []
    };
    
    if (!input || typeof input !== 'string') {
      result.errors = ['輸入不能為空'];
      return result;
    }
    
    const trimmedInput = input.trim();
    
    // 純數字輸入，視為基礎單位
    if (/^\d+$/.test(trimmedInput)) {
      const quantity = parseInt(trimmedInput);
      result.baseQuantity = quantity;
      result.displayText = `${quantity}`;
      return result;
    }
    
    // 建立單位名稱到數值的映射
    const unitMap = new Map<string, number>();
    const activeUnits = packageUnits.filter(u => u.isActive);
    
    for (const unit of activeUnits) {
      unitMap.set(unit.unitName, unit.unitValue);
    }
    
    let totalBaseQuantity = 0;
    const parsedItems: { unitName: string; quantity: number }[] = [];
    
    // 解析 "數字+單位" 格式，支援中文單位
    const regex = /(\d+)([^\d\s]+)/g;
    let match;
    let hasValidMatch = false;
    
    while ((match = regex.exec(trimmedInput)) !== null) {
      const quantity = parseInt(match[1]);
      const unitName = match[2];
      
      if (unitMap.has(unitName)) {
        const unitValue = unitMap.get(unitName)!;
        totalBaseQuantity += quantity * unitValue;
        parsedItems.push({ unitName, quantity });
        hasValidMatch = true;
      } else {
        result.errors?.push(`未知的單位名稱: "${unitName}"`);
      }
    }
    
    if (!hasValidMatch && result.errors?.length === 0) {
      result.errors?.push('無法解析輸入格式，請使用如 "1盒 5排 3粒" 的格式');
    }
    
    result.baseQuantity = totalBaseQuantity;
    result.parsedInput = parsedItems;
    result.displayText = parsedItems
      .map(item => `${item.quantity}${item.unitName}`)
      .join(' ');
    
    return result;
  }
  
  /**
   * 根據產品ID獲取包裝單位配置
   * @param productId 產品ID
   * @returns 包裝單位配置陣列
   */
  static async getProductPackageUnits(productId: string): Promise<IProductPackageUnit[]> {
    try {
      const units = await ProductPackageUnit.findActiveByProductId(productId);
      return units.map(unit => unit.toObject());
    } catch (error) {
      console.error('獲取產品包裝單位失敗:', error);
      return [];
    }
  }
  
  /**
   * 根據產品ID和指定日期獲取包裝單位配置（支援歷史配置）
   * @param productId 產品ID
   * @param date 指定日期
   * @returns 包裝單位配置陣列
   */
  static async getProductPackageUnitsAtDate(
    productId: string, 
    date: Date
  ): Promise<IProductPackageUnit[]> {
    try {
      const units = await ProductPackageUnit.findByProductIdAtDate(productId, date);
      return units.map(unit => unit.toObject());
    } catch (error) {
      console.error('獲取歷史包裝單位配置失敗:', error);
      return [];
    }
  }
  
  /**
   * 創建或更新產品的包裝單位配置
   * @param productId 產品ID
   * @param units 包裝單位配置
   * @returns 創建結果
   */
  static async createOrUpdatePackageUnits(
    productId: string,
    units: Omit<IProductPackageUnit, '_id' | 'productId' | 'createdAt' | 'updatedAt'>[]
  ): Promise<{ success: boolean; data?: IProductPackageUnit[]; error?: string }> {
    
    // 驗證配置
    const validation = this.validatePackageUnits(units);
    if (!validation.isValid) {
      return {
        success: false,
        error: `配置驗證失敗: ${validation.errors.join(', ')}`
      };
    }
    
    try {
      // 停用現有配置
      await ProductPackageUnit.updateMany(
        { productId, isActive: true },
        { 
          isActive: false, 
          effectiveTo: new Date() 
        }
      );
      
      // 創建新配置，移除前端的臨時 ID
      const newUnits = units.map(unit => {
        const { _id, createdAt, updatedAt, ...unitData } = unit as any;
        return {
          ...unitData,
          productId,
          effectiveFrom: new Date(),
          version: 1
        };
      });
      
      const createdUnits = await ProductPackageUnit.insertMany(newUnits);
      
      // 重新查詢以獲取完整的文檔（包含 timestamps）
      const fullUnits = await ProductPackageUnit.findActiveByProductId(productId);
      
      return {
        success: true,
        data: fullUnits.map(unit => unit.toObject() as IProductPackageUnit)
      };
      
    } catch (error) {
      console.error('創建包裝單位配置失敗:', error);
      return {
        success: false,
        error: '數據庫操作失敗'
      };
    }
  }
  
  /**
   * 刪除產品的包裝單位配置
   * @param productId 產品ID
   * @returns 刪除結果
   */
  static async deletePackageUnits(productId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await ProductPackageUnit.updateMany(
        { productId, isActive: true },
        { 
          isActive: false, 
          effectiveTo: new Date() 
        }
      );
      
      return { success: true };
    } catch (error) {
      console.error('刪除包裝單位配置失敗:', error);
      return {
        success: false,
        error: '數據庫操作失敗'
      };
    }
  }
}

export default PackageUnitService;