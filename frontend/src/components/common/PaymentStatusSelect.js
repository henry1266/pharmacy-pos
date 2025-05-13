import React, { useState, useEffect } from 'react';
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
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    // Sync inputValue with selectedPaymentStatus when it changes externally
    // or when a value is selected.
    if (selectedPaymentStatus) {
      setInputValue(selectedPaymentStatus);
    } else {
      // If selectedPaymentStatus is cleared, clear inputValue as well
      // This handles cases where the parent form resets the value.
      setInputValue('');
    }
  }, [selectedPaymentStatus]);

  const filterStatuses = (currentOptions, stateInputValue) => {
    const filterVal = stateInputValue?.toUpperCase() || '';
    if (paymentStatusShortcuts[filterVal]) {
      const fullStatus = paymentStatusShortcuts[filterVal];
      if (currentOptions.includes(fullStatus)) {
        return [fullStatus];
      }
    }
    const lowerCaseFilterValue = stateInputValue?.toLowerCase() || '';
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
      onClose={(event, reason) => {
        setOpen(false);
        // When closing, if there's a selected value, ensure inputValue reflects it.
        // If no value is selected (e.g., user clears input and blurs), inputValue might be empty.
        // This helps prevent inputValue from being cleared if a value is actually selected.
        if (reason === 'blur' || reason === 'escape') {
            if (selectedPaymentStatus) {
                setInputValue(selectedPaymentStatus);
            }
            // If the input was cleared by the user and blurred, 
            // and there's no selectedPaymentStatus, inputValue should remain as it is (likely empty)
            // or be explicitly cleared if that's the desired behavior on blur of empty input.
            // The useEffect above handles setting inputValue to '' if selectedPaymentStatus becomes null/undefined.
        }
      }}
      options={options}
      autoHighlight={true}
      getOptionLabel={(option) => option || ''} // Handle null/undefined options if they can occur
      value={selectedPaymentStatus || null} // Ensure value is controlled and defaults to null if undefined
      onChange={(event, newValue) => {
        // Autocomplete's onChange provides the new selected value directly.
        // The BasicInfoForm's handleSelectChange expects (eventOrValue)
        // We need to call the passed onChange (which is handleSelectChange in BasicInfoForm)
        // with the new value.
        if (typeof onChange === 'function') {
          onChange(event, newValue); // Pass both event and newValue as Autocomplete does
        }
        if (newValue) {
          setInputValue(newValue);
        }
        // No need to setInputValue to '' if newValue is null here, 
        // as the useEffect will handle it if selectedPaymentStatus becomes null.
      }}
      inputValue={inputValue} // Control inputValue
      onInputChange={(event, newInputValue, reason) => {
        // Only update inputValue state if the change is due to user input
        if (reason === 'input') {
          setInputValue(newInputValue);
        }
        // If reason is 'reset', it means a value was selected, and Autocomplete is trying to update
        // inputValue. We let our useEffect handle syncing inputValue with selectedPaymentStatus.
      }}
      filterOptions={(currentOptions, state) => filterStatuses(currentOptions, state.inputValue)}
      onKeyDown={(event) => {
        if (event.key === 'Tab') {
          event.preventDefault();
          event.stopPropagation();
        }

        if (event.key === 'Enter' || event.key === 'Tab') {
          const currentInputVal = event.target.value; // This is the TextField's value, which is our inputValue state
          const upperInputVal = currentInputVal?.toUpperCase();
          let matchedValue = null;

          if (!currentInputVal && options.length > 0 && event.key === 'Enter') {
            // If Enter on empty input, select first option (original behavior)
            // For Tab, we might not want to auto-select.
            // matchedValue = options[0]; 
            // This behavior might be better handled by Autocomplete's default if desired.
            // For now, let's stick to explicit matches or shortcut matches.
          } else if (paymentStatusShortcuts[upperInputVal]) {
            const fullStatus = paymentStatusShortcuts[upperInputVal];
            if (options.includes(fullStatus)) {
              matchedValue = fullStatus;
            }
          } else {
            const filtered = filterStatuses(options, currentInputVal);
            if (filtered.length > 0) {
              matchedValue = filtered[0];
            }
          }
          
          if (matchedValue) {
            if (typeof onChange === 'function') {
              // Simulate the structure Autocomplete's onChange provides to the parent
              onChange(event, matchedValue);
            }
            setInputValue(matchedValue); // Ensure inputValue is also set
            setOpen(false); 
            
            if (event.key === 'Enter') {
                event.preventDefault();
            }

            setTimeout(() => {
              if (onEnterKeyDown) {
                onEnterKeyDown(currentInputVal ? currentInputVal : matchedValue);
              } else {
                const nextFocusableElement = document.getElementById('status-select'); 
                if (nextFocusableElement) {
                  nextFocusableElement.focus();
                }
              }
            }, 50);
          } else if (event.key === 'Enter' && !matchedValue && currentInputVal === '' && selectedPaymentStatus) {
            // If Enter is pressed, input is empty, but a value was previously selected,
            // do not clear the selection. Let blur handle it or keep the value.
            // This case might be where the user clears input and presses Enter to confirm clearing.
            // The parent's onChange would receive null if Autocomplete is configured for freeSolo and clearOnBlur.
            // For non-freeSolo, Enter on empty usually doesn't change the value unless it's a clear action.
          } else if (event.key === 'Enter' && !matchedValue && currentInputVal !== '') {
            // User typed something that doesn't match and pressed Enter.
            // Revert inputValue to the selectedPaymentStatus if available, or clear it.
            if (selectedPaymentStatus) {
                setInputValue(selectedPaymentStatus);
            } else {
                setInputValue('');
            }
            setOpen(false);
            event.preventDefault(); // Prevent form submission
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
          onFocus={() => setOpen(true)} 
          // onBlur is handled by Autocomplete's onClose with reason 'blur'
        />
      )}
    />
  );
};

export default PaymentStatusSelect;

