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

const StatusShortcuts = {
  'JZ': '未付款',
  'UZ': '已付款',
  'UC': '已匯款',
};


const StatusSelect = ({
  options = [], 
  selectedStatus,
  onChange,
  label = "狀態",
  required = true,
  error = false,
  helperText = "",
  size = "medium",
  onEnterKeyDown,
}) => {
  const [open, setOpen] = useState(false);

  const filterStatuses = (currentOptions, inputValue) => {
    const filterValue = inputValue?.toUpperCase() || '';
    if (StatusShortcuts[filterValue]) {
      const fullStatus = StatusShortcuts[filterValue];
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
      id="status-select"
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
      value={selectedStatus}
      onChange={onChange} // This is Autocomplete's own change event
      filterOptions={(currentOptions, state) => filterStatuses(currentOptions, state.inputValue)}
      onKeyDown={(event) => {
        // For Tab key, always prevent its default behavior (jumping focus) and stop propagation.
        if (event.key === 'Tab') {
          event.preventDefault();
          event.stopPropagation();
        }

        if (event.key === 'Enter' || event.key === 'Tab') {
          const inputValue = event.target.value;
          const upperInputValue = inputValue?.toUpperCase();
          let selectedValue = null;

          if (!inputValue && options.length > 0) {
            selectedValue = options[0];
          } else if (StatusShortcuts[upperInputValue]) {
            const fullStatus = StatusShortcuts[upperInputValue];
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
              console.warn('StatusSelect: onChange 屬性應為函數，但收到的類型是:', typeof onChange);
            }
            // If Enter key made a selection, prevent its default (e.g. form submission)
            // Tab's default was already prevented at the top.
            if (event.key === 'Enter') {
                event.preventDefault();
            }
            setOpen(false); 
            
            setTimeout(() => {
              if (onEnterKeyDown) {
                onEnterKeyDown(inputValue ? inputValue : selectedValue);
              } else {
                const nextFocusableElement = document.getElementById('product-select'); 
                if (nextFocusableElement) {
                  nextFocusableElement.focus();
                }
              }
            }, 50);
          }
          // If no selectedValue is found:
          // - Tab: Will do nothing further as its default and propagation are stopped.
          // - Enter: Its default behavior (e.g., form submission) will proceed if not prevented by other means.
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
          onFocus={() => setOpen(true)} 
        />
      )}
    />
  );
};

export default StatusSelect;

