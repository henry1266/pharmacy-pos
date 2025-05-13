import React from 'react';
import { 
  Autocomplete,
  TextField
} from '@mui/material';

/**
 * 通用付款狀態選擇組件
 * @param {Object} props - 組件屬性
 * @param {Array} props.options - 付款狀態選項列表 (e.g., ['未付款', '已付款', '已匯款'])
 * @param {string} props.selectedPaymentStatus - 當前選中的狀態值
 * @param {Function} props.onChange - 狀態變更處理函數
 * @param {string} props.label - 輸入框標籤
 * @param {boolean} props.required - 是否必填
 * @param {boolean} props.error - 是否顯示錯誤
 * @param {string} props.helperText - 幫助文本
 * @param {string} props.size - 輸入框大小
 * @param {Function} props.onEnterKeyDown - Enter鍵按下時的回調函數
 * @returns {React.ReactElement} 付款狀態選擇組件
 */

const paymentStatusShortcuts = {
  'JZ': '未付款',
  'UZ': '已付款',
  'UC': '已匯款',
};

const PaymentStatusSelect = ({
  options = [], // Expecting ['未付款', '已付款', '已匯款']
  selectedPaymentStatus,
  onChange,
  label = "付款狀態",
  required = true,
  error = false,
  helperText = "",
  size = "medium",
  onEnterKeyDown,
}) => {
  // 選項過濾函數，現在也處理簡碼
  const filterStatuses = (currentOptions, inputValue) => {
    const filterValue = inputValue?.toUpperCase() || ''; // Convert to uppercase for shortcut matching

    // 檢查是否為簡碼
    if (paymentStatusShortcuts[filterValue]) {
      // 如果是簡碼，且簡碼對應的完整狀態在選項中，則直接返回該選項
      const fullStatus = paymentStatusShortcuts[filterValue];
      if (currentOptions.includes(fullStatus)) {
        return [fullStatus];
      }
    }

    // 否則，執行原始的過濾邏輯 (轉小寫以進行部分匹配)
    const lowerCaseFilterValue = inputValue?.toLowerCase() || '';
    return currentOptions.filter(option =>
      option.toLowerCase().includes(lowerCaseFilterValue)
    );
  };

  return (
    <Autocomplete
      id="payment-status-select"
      options={options}
      autoHighlight={true}
      getOptionLabel={(option) => {
        return option;
      }}
      value={selectedPaymentStatus}
      onChange={onChange} // This is for Autocomplete's own change event
      filterOptions={(currentOptions, state) => filterStatuses(currentOptions, state.inputValue)}
      onKeyDown={(event) => {
        if (['Enter', 'Tab'].includes(event.key)) {
          const inputValue = event.target.value;
          const upperInputValue = inputValue?.toUpperCase();

          let selectedValue = null;

          if (!inputValue && options.length > 0) { // 新增條件：如果輸入框為空且有選項
            selectedValue = options[0];
          } else if (paymentStatusShortcuts[upperInputValue]) {
            const fullStatus = paymentStatusShortcuts[upperInputValue];
            if (options.includes(fullStatus)) {
              selectedValue = fullStatus;
            }
          } else {
            const filtered = filterStatuses(options, inputValue);
            if (filtered.length > 0) {
              selectedValue = filtered[0];
            }
          }
          
          if (selectedValue) {
            if (typeof onChange === 'function') {
              onChange(event, selectedValue); 
            } else {
              console.warn('PaymentStatusSelect: onChange 屬性應為函數，但收到的類型是:', typeof onChange);
            }
            event.preventDefault();
            
            setTimeout(() => {
              if (onEnterKeyDown) {
                // 保持與 SupplierSelect 一致，傳遞 inputValue 或 selectedValue
                // 根據之前與 SupplierSelect 同步的邏輯，此處應為 inputValue
                // 但若 inputValue 為空，則傳遞 selectedValue 可能更合理
                // 暫時維持傳遞 inputValue，若有問題再調整
                onEnterKeyDown(inputValue || selectedValue); 
              } else {
                const nextFocusableElement = document.getElementById('status-select'); 
                if (nextFocusableElement) {
                  nextFocusableElement.focus();
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
          helperText={helperText || "可輸入簡碼: JZ(未付款), UZ(已付款), UC(已匯款)"}
          size={size}
        />
      )}
    />
  );
};

export default PaymentStatusSelect;

