import React, { useState } from 'react';
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
  options = [], 
  selectedPaymentStatus,
  onChange,
  label = "付款狀態",
  required = true,
  error = false,
  helperText = "",
  size = "medium",
  onEnterKeyDown,
}) => {
  const [open, setOpen] = useState(false);

  const filterStatuses = (currentOptions, inputValue) => {
    const filterValue = inputValue?.toUpperCase() || '';
    if (paymentStatusShortcuts[filterValue]) {
      const fullStatus = paymentStatusShortcuts[filterValue];
      if (currentOptions.includes(fullStatus)) {
        return [fullStatus];
      }
    }
    const lowerCaseFilterValue = inputValue?.toLowerCase() || '';
    return currentOptions.filter(option =>
      option.toLowerCase().includes(lowerCaseFilterValue)
    );
  };

  return (
    <Autocomplete
      id="payment-status-select"
      open={open}
      onOpen={() => {
        setOpen(true);
      }}
      onClose={() => {
        setOpen(false);
      }}
      options={options}
      autoHighlight={true}
      getOptionLabel={(option) => option}
      value={selectedPaymentStatus}
      onChange={onChange}
      filterOptions={(currentOptions, state) => filterStatuses(currentOptions, state.inputValue)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === 'Tab') {
          const inputValue = event.target.value;
          const upperInputValue = inputValue?.toUpperCase();
          let selectedValue = null;

          if (!inputValue && options.length > 0) {
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
            setOpen(false); 
            
            setTimeout(() => {
              if (onEnterKeyDown) {
                onEnterKeyDown(inputValue ? inputValue : selectedValue);
              } else {
                const nextFocusableElement = document.getElementById('status-select'); 
                if (nextFocusableElement) {
                  nextFocusableElement.focus();
                }
              }
            }, 50);
          } else {
            // 如果沒有確定選中的值 (例如輸入無效內容)
            // 為了讓 Tab 的行為與 Enter 一致 (Enter 在此情況下通常不做任何事，或執行表單的預設提交行為)
            // 我們需要阻止 Tab 鍵的預設跳轉行為。
            if (event.key === 'Tab') {
              event.preventDefault();
            }
            // Enter 鍵在此情況下會執行其預設行為 (如果未在上層被阻止)。
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
          onFocus={() => setOpen(true)} 
        />
      )}
    />
  );
};

export default PaymentStatusSelect;

