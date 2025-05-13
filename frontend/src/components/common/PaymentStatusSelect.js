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
      autoHighlight={true} // <--- 新增此行以自動高亮第一個選項
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

          // 優先處理 autoHighlight 選中的情況 (如果 Autocomplete 內部已處理)
          // 但我們的 onKeyDown 邏輯會覆蓋，所以需要確保我們的邏輯能正確選中
          if (paymentStatusShortcuts[upperInputValue]) {
            const fullStatus = paymentStatusShortcuts[upperInputValue];
            if (options.includes(fullStatus)) {
              selectedValue = fullStatus;
            }
          } else {
            const filtered = filterStatuses(options, inputValue);
            if (filtered.length > 0) {
              // 如果 autoHighlight 為 true，理論上第一個選項已經是高亮的
              // 直接按 Enter 時，Autocomplete 可能已經將高亮項作為其內部 "pending" 值
              // 但為確保我們的邏輯覆蓋且正確，我們仍以 filtered[0] 為準
              selectedValue = filtered[0];
            }
          }
          
          if (selectedValue) {
            if (typeof onChange === 'function') {
              // 確保傳遞的是 Autocomplete onChange 期望的 (event, value) 格式
              // event 參數在這裡可能不是最重要的，但 value (selectedValue) 是
              onChange(event, selectedValue); 
            } else {
              console.warn('PaymentStatusSelect: onChange 屬性應為函數，但收到的類型是:', typeof onChange);
            }
            event.preventDefault();
            
            setTimeout(() => {
              if (onEnterKeyDown) {
                onEnterKeyDown(inputValue); 
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

