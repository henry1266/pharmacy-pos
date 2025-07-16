/**
 * 員工模組組件統一入口
 * Employee Module Components Entry Point
 */

// 功能組件 (Feature Components)
// 這些組件將在後續實現中逐步添加

// 基礎 UI 組件 (Base UI Components)
// 這些組件將在後續實現中逐步添加

// 組件類型定義
export interface EmployeeComponentProps {
  className?: string;
  style?: React.CSSProperties;
}

// 組件配置
export const EMPLOYEE_COMPONENT_CONFIG = {
  // 表格配置
  table: {
    defaultPageSize: 20,
    maxPageSize: 100,
    sortable: true,
    filterable: true
  },
  
  // 表單配置
  form: {
    validateOnChange: true,
    validateOnBlur: true,
    showErrorMessages: true
  },
  
  // 模態框配置
  modal: {
    closable: true,
    maskClosable: false,
    keyboard: true
  }
};

// 組件主題配置
export const EMPLOYEE_COMPONENT_THEME = {
  colors: {
    primary: '#1890ff',
    success: '#52c41a',
    warning: '#faad14',
    error: '#f5222d',
    info: '#1890ff'
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  
  borderRadius: {
    sm: '2px',
    md: '4px',
    lg: '8px'
  }
};

// 組件工具函數
export const componentUtils = {
  /**
   * 生成組件 CSS 類名
   * @param base 基礎類名
   * @param modifiers 修飾符
   * @returns 完整類名
   */
  generateClassName: (base: string, modifiers: string[] = []): string => {
    const baseClass = `employee-${base}`;
    const modifierClasses = modifiers.map(mod => `${baseClass}--${mod}`);
    return [baseClass, ...modifierClasses].join(' ');
  },

  /**
   * 合併組件樣式
   * @param defaultStyle 預設樣式
   * @param customStyle 自定義樣式
   * @returns 合併後的樣式
   */
  mergeStyles: (
    defaultStyle: React.CSSProperties,
    customStyle?: React.CSSProperties
  ): React.CSSProperties => {
    return { ...defaultStyle, ...customStyle };
  }
};

// 導出說明：
// 當組件實現完成後，將在此處導出所有組件
// 例如：
// export { EmployeeList } from './features/EmployeeList';
// export { EmployeeForm } from './features/EmployeeForm';
// export { EmployeeCard } from './ui/EmployeeCard';
// export { EmployeeTable } from './ui/EmployeeTable';

export default {
  config: EMPLOYEE_COMPONENT_CONFIG,
  theme: EMPLOYEE_COMPONENT_THEME,
  utils: componentUtils
};