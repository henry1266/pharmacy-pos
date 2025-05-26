import React from 'react';
import PropTypes from 'prop-types';
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
      option?.name?.toLowerCase().includes(filterValue) ||
      (option?.code?.toLowerCase().includes(filterValue)) ||
      (option?.shortCode?.toLowerCase().includes(filterValue))
    );
  };

  return (
    <Autocomplete
      id="supplier-select"
      options={suppliers}
      getOptionLabel={(option) => option?.name || ''}
      value={selectedSupplier}
      onChange={onChange}
      filterOptions={(options, state) => filterSuppliers(options, state.inputValue)}
      onKeyDown={(event) => {
        if (['Enter', 'Tab'].includes(event.key)) {
          const inputValue = event.target.value;
          
          // 獲取過濾後的供應商列表
          const filtered = filterSuppliers(suppliers, inputValue);
          
          // 如果有過濾結果，自動選擇第一個選項
          if (filtered.length > 0) {
            // 選擇第一個選項
            onChange(event, filtered[0]);
            event.preventDefault();
            
            // 延遲執行，確保選擇已完成
            setTimeout(() => {
              // 如果提供了Enter鍵回調函數，則調用它
              if (onEnterKeyDown) {
                onEnterKeyDown(inputValue);
              } else {
                // 如果沒有提供回調函數，則嘗試將焦點移至付款狀態欄位
                const paymentStatusSelect = document.getElementById('payment-status-select');
                if (paymentStatusSelect) {
                  paymentStatusSelect.focus();
                }
              }
            }, 50);
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

// Props 驗證
SupplierSelect.propTypes = {
  suppliers: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string,
      code: PropTypes.string,
      shortCode: PropTypes.string
    })
  ),
  selectedSupplier: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    code: PropTypes.string,
    shortCode: PropTypes.string
  }),
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  size: PropTypes.string,
  onEnterKeyDown: PropTypes.func,
  showCode: PropTypes.bool
};

// 預設值
SupplierSelect.defaultProps = {
  suppliers: [],
  label: "供應商",
  required: false,
  error: false,
  helperText: "",
  size: "medium",
  showCode: false
};

export default SupplierSelect;
