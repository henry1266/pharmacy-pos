import React from 'react';
import { 
  Autocomplete,
  TextField
} from '@mui/material';

/**
 * 供應商介面
 */
interface Supplier {
  _id?: string;
  name?: string;
  code?: string;
  shortCode?: string;
  [key: string]: any;
}

/**
 * 通用供應商選擇組件
 */
interface SupplierSelectProps {
  suppliers?: Supplier[];
  selectedSupplier?: Supplier | null;
  onChange: (event: React.SyntheticEvent, value: Supplier | null) => void;
  label?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  size?: 'small' | 'medium';
  onEnterKeyDown?: (inputValue: string) => void;
  showCode?: boolean;
  autoFocus?: boolean;
}

const SupplierSelect: React.FC<SupplierSelectProps> = ({
  suppliers = [],
  selectedSupplier,
  onChange,
  label = "供應商",
  required = false,
  error = false,
  helperText = "",
  size = "medium",
  onEnterKeyDown,
  showCode = false,
  autoFocus = false
}) => {
  // 供應商過濾函數
  const filterSuppliers = (options: Supplier[], inputValue: string): Supplier[] => {
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
          const target = event.target as HTMLInputElement;
          const inputValue = target.value;
          
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
          autoFocus={autoFocus}
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