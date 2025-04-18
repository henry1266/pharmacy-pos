import React from 'react';
import { 
  Autocomplete,
  TextField
} from '@mui/material';

/**
 * 通用供應商選擇組件
 * @param {Object} props - 組件屬性
 * @param {Array} props.suppliers - 供應商列表
 * @param {Object} props.selectedSupplier - 當前選中的供應商
 * @param {Function} props.onChange - 供應商變更處理函數
 * @param {string} props.label - 輸入框標籤
 * @param {boolean} props.required - 是否必填
 * @param {boolean} props.error - 是否顯示錯誤
 * @param {string} props.helperText - 幫助文本
 * @param {string} props.size - 輸入框大小
 * @param {Function} props.onEnterKeyDown - Enter鍵按下時的回調函數
 * @param {boolean} props.showCode - 是否在選項中顯示供應商代碼
 * @returns {React.ReactElement} 供應商選擇組件
 */
const SupplierSelect = ({
  suppliers = [],
  selectedSupplier,
  onChange,
  label = "供應商",
  required = false,
  error = false,
  helperText = "",
  size = "medium",
  onEnterKeyDown,
  showCode = false
}) => {
  // 供應商過濾函數
  const filterSuppliers = (options, inputValue) => {
    const filterValue = inputValue?.toLowerCase() || '';
    return options.filter(option =>
      option.name.toLowerCase().includes(filterValue) ||
      (option.code && option.code.toLowerCase().includes(filterValue)) ||
      (option.shortCode && option.shortCode.toLowerCase().includes(filterValue))
    );
  };

  return (
    <Autocomplete
      id="supplier-select"
      options={suppliers}
      getOptionLabel={(option) => option.name || ''}
      value={selectedSupplier}
      onChange={onChange}
      filterOptions={(options, state) => filterSuppliers(options, state.inputValue)}
      onKeyDown={(event) => {
        if (['Enter', 'Tab'].includes(event.key)) {
          const filtered = filterSuppliers(suppliers, event.target.value);
          if (filtered.length > 0) {
            onChange(event, filtered[0]);
            event.preventDefault();

            // 如果提供了Enter鍵回調函數，則調用它
            if (onEnterKeyDown) {
              onEnterKeyDown();
            }
          }
        }
      }}
      renderInput={(params) => (
        <TextField 
          {...params} 
          label={label} 
          fullWidth 
          required={required}
          error={error}
          helperText={helperText}
          size={size}
        />
      )}
      renderOption={showCode ? (props, option) => (
        <li {...props}>
          {option.name} {option.code && <span style={{color: 'gray', marginLeft: '8px'}}>({option.code})</span>}
        </li>
      ) : undefined}
    />
  );
};

export default SupplierSelect;
