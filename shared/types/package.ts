/**
 * 包裝單位相關型別定義
 * 用於商品大包裝模式功能
 */

/**
 * 產品包裝單位配置
 */
export interface ProductPackageUnit {
  _id: string;
  productId: string;           // 關聯的產品ID
  unitName: string;            // 包裝單位名稱 (如: "盒", "排", "粒")
  unitValue: number;           // 包裝單位數值 (如: 1000, 10, 1)
  priority: number;            // 優先級 (數字越大優先級越高，從大包裝開始計算)
  isBaseUnit: boolean;         // 是否為基礎單位 (最小單位，如"粒")
  isActive: boolean;           // 是否啟用
  effectiveFrom?: Date;        // 生效時間（支援歷史配置）
  effectiveTo?: Date;          // 失效時間（支援歷史配置）
  version?: number;            // 配置版本號
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 包裝分解項目
 */
export interface PackageBreakdownItem {
  unitName: string;            // 單位名稱
  quantity: number;            // 該單位的數量
  unitValue: number;           // 該單位的數值
}

/**
 * 庫存包裝顯示結果
 */
export interface PackageDisplayResult {
  baseQuantity: number;                    // 總數量 (基礎單位)
  packageBreakdown: PackageBreakdownItem[]; // 包裝分解
  displayText: string;                     // 顯示文字 "1盒 63排 5粒"
  configUsed?: ProductPackageUnit[];       // 使用的配置（用於調試）
}

/**
 * 庫存包裝顯示模型（向後兼容）
 */
export interface InventoryPackageDisplay extends PackageDisplayResult {}

/**
 * 包裝單位驗證結果
 */
export interface PackageUnitValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 包裝輸入解析結果
 */
export interface PackageInputParseResult {
  baseQuantity: number;
  parsedInput: {
    unitName: string;
    quantity: number;
  }[];
  displayText: string;
  errors?: string[];
}

/**
 * 擴展的 BaseProduct 介面（包含包裝單位配置）
 */
export interface BaseProductWithPackageUnits {
  packageUnits?: ProductPackageUnit[];     // 包裝單位配置
  defaultDisplayUnit?: string;             // 預設顯示單位
  enablePackageMode?: boolean;             // 是否啟用包裝模式
}

/**
 * 包裝模式系統設定
 */
export interface PackageModeSettings {
  enablePackageMode: boolean;              // 全域啟用包裝模式
  defaultPackageUnits: {                   // 預設包裝單位模板
    [category: string]: Omit<ProductPackageUnit, '_id' | 'productId' | 'createdAt' | 'updatedAt'>[];
  };
  displaySettings: {
    showBreakdownInList: boolean;          // 列表中顯示分解
    showBaseUnitInDisplay: boolean;        // 顯示中包含基礎單位
    defaultInputMode: 'package' | 'base'; // 預設輸入模式
  };
}

/**
 * 包裝單位錯誤碼
 */
export enum PackageUnitErrorCodes {
  INVALID_PACKAGE_UNITS = 'INVALID_PACKAGE_UNITS',
  MISSING_BASE_UNIT = 'MISSING_BASE_UNIT',
  MULTIPLE_BASE_UNITS = 'MULTIPLE_BASE_UNITS',
  INVALID_UNIT_VALUE = 'INVALID_UNIT_VALUE',
  DUPLICATE_UNIT_NAME = 'DUPLICATE_UNIT_NAME',
  DUPLICATE_PRIORITY = 'DUPLICATE_PRIORITY',
  INVALID_PACKAGE_INPUT = 'INVALID_PACKAGE_INPUT',
  UNKNOWN_UNIT_NAME = 'UNKNOWN_UNIT_NAME',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  INVALID_DIVISIBILITY = 'INVALID_DIVISIBILITY'
}