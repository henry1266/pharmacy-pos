import { ProductPackageUnit } from '@pharmacy-pos/shared/types/package';
import { PackageDisplayResult, PackageInputResult, ValidationError } from './types';

/**
 * 將基礎單位數量轉換為包裝顯示格式
 */
export const convertToPackageDisplay = (
  baseQuantity: number,
  packageUnits: ProductPackageUnit[],
  baseUnitName?: string
): PackageDisplayResult => {
  const defaultBaseUnit = baseUnitName || '個';
  
  if (!packageUnits.length || baseQuantity <= 0) {
    return {
      baseQuantity,
      packageBreakdown: [],
      displayText: `${baseQuantity} ${defaultBaseUnit}`
    };
  }

  // 按照 unitValue 從大到小排序（數量越大優先級越高）
  const sortedUnits = [...packageUnits].sort((a, b) => b.unitValue - a.unitValue);
  
  let remainingQuantity = baseQuantity;
  const breakdown: Array<{ unitName: string; quantity: number }> = [];

  for (const unit of sortedUnits) {
    if (remainingQuantity >= unit.unitValue) {
      const quantity = Math.floor(remainingQuantity / unit.unitValue);
      breakdown.push({
        unitName: unit.unitName,
        quantity
      });
      remainingQuantity -= quantity * unit.unitValue;
    }
  }

  // 如果還有剩餘，使用基礎單位
  if (remainingQuantity > 0) {
    breakdown.push({
      unitName: baseUnitName || '個',
      quantity: remainingQuantity
    });
  }

  const displayText = breakdown
    .filter(item => item.quantity > 0)
    .map(item => `${item.quantity}${item.unitName}`)
    .join(' ');

  return {
    baseQuantity,
    packageBreakdown: breakdown,
    displayText: displayText || `0 ${defaultBaseUnit}`
  };
};

/**
 * 將包裝輸入轉換為基礎單位數量
 */
export const convertToBaseUnit = (
  input: string,
  packageUnits: ProductPackageUnit[]
): PackageInputResult => {
  const errors: string[] = [];
  const parsedInput: Array<{ unitName: string; quantity: number }> = [];
  
  if (!input.trim()) {
    return {
      baseQuantity: 0,
      parsedInput: [],
      displayText: '',
      errors: ['輸入不能為空']
    };
  }

  // 如果是純數字，使用最小單位
  if (/^\d+$/.test(input.trim())) {
    const quantity = parseInt(input.trim());
    const smallestUnit = packageUnits.find(u => u.unitValue === Math.min(...packageUnits.map(p => p.unitValue)));
    
    if (smallestUnit) {
      parsedInput.push({
        unitName: smallestUnit.unitName,
        quantity
      });
      
      return {
        baseQuantity: quantity * smallestUnit.unitValue,
        parsedInput,
        displayText: `${quantity}${smallestUnit.unitName}`,
        errors: []
      };
    }
  }

  // 解析包裝輸入格式：如 "2盒 3排 5粒"
  const regex = /(\d+)([^\d\s]+)/g;
  let match;
  let totalBaseQuantity = 0;

  while ((match = regex.exec(input)) !== null) {
    const quantity = parseInt(match[1] || '0');
    const unitName = match[2] || '';
    
    const unit = packageUnits.find(u => u.unitName === unitName);
    
    if (unit && unitName) {
      parsedInput.push({
        unitName,
        quantity
      });
      totalBaseQuantity += quantity * unit.unitValue;
    } else {
      errors.push(`未知的包裝單位: ${unitName}`);
    }
  }

  const displayText = parsedInput
    .map(item => `${item.quantity}${item.unitName}`)
    .join(' ');

  return {
    baseQuantity: totalBaseQuantity,
    parsedInput,
    displayText,
    errors
  };
};

/**
 * 驗證包裝單位配置
 */
export const validatePackageUnits = (packageUnits: ProductPackageUnit[]): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (packageUnits.length === 0) {
    return errors;
  }

  // 檢查是否有重複的單位名稱
  const unitNames = packageUnits.map(u => u.unitName);
  const duplicateNames = unitNames.filter((name, index) => unitNames.indexOf(name) !== index);
  
  if (duplicateNames.length > 0) {
    errors.push({
      field: 'unitName',
      message: `重複的單位名稱: ${duplicateNames.join(', ')}`
    });
  }

  // 檢查是否有重複的 unitValue
  const unitValues = packageUnits.map(u => u.unitValue);
  const duplicateValues = unitValues.filter((value, index) => unitValues.indexOf(value) !== index);
  
  if (duplicateValues.length > 0) {
    errors.push({
      field: 'unitValue',
      message: `重複的包裝數量: ${duplicateValues.join(', ')}`
    });
  }

  // 檢查每個單位的有效性
  packageUnits.forEach((unit, index) => {
    if (!unit.unitName.trim()) {
      errors.push({
        field: `units[${index}].unitName`,
        message: '單位名稱不能為空'
      });
    }

    if (unit.unitValue <= 0) {
      errors.push({
        field: `units[${index}].unitValue`,
        message: '包裝數量必須大於0'
      });
    }
  });

  return errors;
};

/**
 * 驗證包裝輸入格式
 */
export const validatePackageInput = (
  input: string,
  packageUnits: ProductPackageUnit[]
): string[] => {
  const errors: string[] = [];

  if (!input.trim()) {
    return ['輸入不能為空'];
  }

  // 檢查是否為純數字（允許）
  if (/^\d+$/.test(input.trim())) {
    return [];
  }

  // 檢查格式是否正確
  const formatRegex = /^(\d+[^\d\s]*\s*)+$/;
  if (!formatRegex.test(input.trim())) {
    errors.push('格式錯誤，請使用如：1盒 5排 3粒 或純數字');
  }

  // 檢查單位是否存在
  const unitNames = packageUnits.map(u => u.unitName);
  const unitRegex = /\d+([^\d\s]+)/g;
  let match;
  
  while ((match = unitRegex.exec(input)) !== null) {
    const unitName = match[1];
    if (unitName && !unitNames.includes(unitName)) {
      errors.push(`未知的包裝單位: ${unitName}`);
    }
  }

  return errors;
};

/**
 * 生成快捷輸入選項
 */
export const generateQuickInputOptions = (packageUnits: ProductPackageUnit[]) => {
  if (!packageUnits.length) return [];

  // 按 unitValue 排序
  const sortedUnits = [...packageUnits].sort((a, b) => b.unitValue - a.unitValue);
  
  const options: Array<{
    label: string;
    value: string;
    baseQuantity: number;
  }> = [];

  // 為每個包裝單位生成快捷選項
  sortedUnits.forEach(unit => {
    if (unit.unitValue > 1) {
      options.push({
        label: `1${unit.unitName}`,
        value: `1${unit.unitName}`,
        baseQuantity: unit.unitValue
      });
    }
  });

  // 添加一些常用數量的最小單位
  const smallestUnit = sortedUnits[sortedUnits.length - 1];
  if (smallestUnit) {
    [5, 10, 20, 50].forEach(qty => {
      options.push({
        label: `${qty}${smallestUnit.unitName}`,
        value: `${qty}${smallestUnit.unitName}`,
        baseQuantity: qty * smallestUnit.unitValue
      });
    });
  }

  return options;
};

/**
 * 格式化包裝單位顯示
 */
export const formatPackageDisplay = (
  quantity: number,
  packageUnits: ProductPackageUnit[],
  options: {
    showBreakdown?: boolean;
    showBaseUnit?: boolean;
    compact?: boolean;
  } = {}
) => {
  const { showBaseUnit = false, compact = false } = options;
  
  const result = convertToPackageDisplay(quantity, packageUnits);
  
  if (compact) {
    return result.displayText;
  }

  let display = result.displayText;
  
  if (showBaseUnit && packageUnits.length > 0) {
    const baseUnit = packageUnits.find(u => u.unitValue === Math.min(...packageUnits.map(p => p.unitValue)));
    display += ` (${quantity} ${baseUnit?.unitName || '個'})`;
  }

  return display;
};