import React from 'react';
import { 
  Autocomplete,
  TextField,
  Box
} from '@mui/material';

/**
 * 供應商選擇組件
 * @param {Object} props - 組件屬性
 * @param {Array} props.suppliers - 供應商列表
 * @param {Object} props.selectedSupplier - 當前選中的供應商
 * @param {Function} props.onChange - 供應商變更處理函數
 * @returns {React.ReactElement} 供應商選擇組件
 */
const SupplierSelect = ({
  suppliers,
  selectedSupplier,
  onChange
}) => {
  // 供應商過濾函數
  const filterSuppliers = (options, inputValue) => {
    const filterValue = inputValue?.toLowerCase() || '';
    return options.filter(option =>
      option.name.toLowerCase().includes(filterValue) ||
      (option.shortCode && option.shortCode.toLowerCase().includes(filterValue))
    );
  };

  return (
    <Autocomplete
      id="supplier-select"
      options={suppliers}
      getOptionLabel={(option) => option.name}
      value={selectedSupplier}
      onChange={onChange}
      filterOptions={(options, state) => filterSuppliers(options, state.inputValue)}
      onKeyDown={(event) => {
        if (['Enter', 'Tab'].includes(event.key)) {
          const filtered = filterSuppliers(suppliers, event.target.value);
          if (filtered.length > 0) {
            onChange(event, filtered[0]);
            event.preventDefault();

            // 直接模擬點擊付款狀態下拉框
            setTimeout(() => {
              try {
                // 嘗試直接點擊付款狀態標籤
                const paymentStatusLabel = document.querySelector('#payment-status-label');
                if (paymentStatusLabel) {
                  paymentStatusLabel.click();
                  return;
                }
                
                // 備用方案1：嘗試找到付款狀態下拉框並點擊
                const selectElement = document.querySelector('[name="paymentStatus"]');
                if (selectElement) {
                  selectElement.click();
                  return;
                }
                
                // 備用方案2：嘗試找到付款狀態FormControl並點擊
                const formControl = document.querySelector('label[id="payment-status-label"]').closest('.MuiFormControl-root');
                if (formControl) {
                  formControl.click();
                }
              } catch (error) {
                console.error('無法自動聚焦到付款狀態:', error);
              }
            }, 100); // 增加延遲時間確保DOM已更新
          }
        }
      }}
      renderInput={(params) => (
        <TextField {...params} required label="供應商" fullWidth />
      )}
    />
  );
};

export default SupplierSelect;
