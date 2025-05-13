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
        if (['Enter', 'Tab'].includes(event.key)) {
          const inputValue = event.target.value;
          const upperInputValue = inputValue?.toUpperCase();
          let selectedValue = null;

          // 當輸入框為空且按下 Enter 或 Tab，且選項列表不為空時，自動選取第一個項目
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
          
          // 如果成功確定了要選中的值 (包括空白時選第一個的情況)
          if (selectedValue) {
            if (typeof onChange === 'function') {
              onChange(event, selectedValue);
            } else {
              console.warn('PaymentStatusSelect: onChange 屬性應為函數，但收到的類型是:', typeof onChange);
            }
            // 對於 Enter 和 Tab，都阻止預設行為（如表單提交或跳轉到下一個元素）
            // 以便我們的自訂焦點邏輯生效
            event.preventDefault(); 
            setOpen(false); // 選中後關閉選單
            
            setTimeout(() => {
              if (onEnterKeyDown) {
                // 如果 inputValue 為空（例如在空白時按 Enter/Tab），則傳遞 selectedValue
                // 否則傳遞 inputValue (例如在簡碼輸入後按 Enter/Tab)
                onEnterKeyDown(inputValue ? inputValue : selectedValue);
              } else {
                const nextFocusableElement = document.getElementById('status-select'); 
                if (nextFocusableElement) {
                  nextFocusableElement.focus();
                }
              }
            }, 50);
          }
          // 如果沒有 selectedValue (例如輸入無效內容按 Enter/Tab)，則不阻止預設行為
          // Enter 可能無操作，Tab 會正常跳轉 (除非 Autocomplete 內部有其他處理)
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
          onFocus={() => setOpen(true)} // Tab 聚焦時開啟選單
        />
      )}
    />
  );
};

export default PaymentStatusSelect;

