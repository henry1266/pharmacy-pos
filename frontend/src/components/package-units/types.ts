import { ProductPackageUnit } from '@pharmacy-pos/shared/types/package';

export interface PackageDisplayResult {
  baseQuantity: number;
  packageBreakdown: Array<{
    unitName: string;
    quantity: number;
  }>;
  displayText: string;
}

export interface PackageInputResult {
  baseQuantity: number;
  parsedInput: Array<{
    unitName: string;
    quantity: number;
  }>;
  displayText: string;
  errors?: string[];
}

export interface PackageUnitsConfigProps {
  productId?: string;
  packageUnits: ProductPackageUnit[];
  onPackageUnitsChange: (units: ProductPackageUnit[]) => void;
  disabled?: boolean;
  baseUnitName?: string; // 產品的基礎單位名稱
}

export interface PackageInventoryDisplayProps {
  totalQuantity: number;
  packageUnits: ProductPackageUnit[];
  baseUnitName?: string; // 產品的基礎單位名稱
  showBreakdown?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export interface PackageInputItem {
  unitName: string;
  quantity: number;
  unitValue: number;
}

export interface PackageQuantityChangeData {
  baseQuantity: number;
  packageBreakdown: Array<{
    unitName: string;
    quantity: number;
    unitValue: number;
  }>;
}

export interface PackageQuantityInputProps {
  value: number;
  onChange: (baseQuantity: number, packageData?: PackageQuantityChangeData) => void;
  packageUnits: ProductPackageUnit[];
  baseUnitName?: string; // 產品的基礎單位名稱
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  showQuickInput?: boolean;
  showCalculator?: boolean;
  allowNegative?: boolean;
  maxValue?: number;
  variant?: 'outlined' | 'filled' | 'standard';
}

export interface PackageUnitRowProps {
  unit: ProductPackageUnit;
  onUpdate: (unit: ProductPackageUnit) => void;
  onDelete: () => void;
  canDelete: boolean;
  disabled?: boolean;
}

export interface QuickInputButtonsProps {
  packageUnits: ProductPackageUnit[];
  onQuickInput: (input: string) => void;
  disabled?: boolean;
}

export type InputMode = 'package' | 'base';

export interface ValidationError {
  field: string;
  message: string;
}