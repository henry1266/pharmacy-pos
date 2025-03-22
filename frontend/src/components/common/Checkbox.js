import React from 'react';
import { Checkbox as MuiCheckbox, FormControlLabel, FormControl, FormHelperText } from '@mui/material';

/**
 * 自定義核取方塊組件
 * @param {Object} props - 組件屬性
 * @param {string} props.label - 核取方塊標籤
 * @param {string} props.name - 核取方塊名稱
 * @param {boolean} props.checked - 是否選中
 * @param {function} props.onChange - 值變更事件處理函數
 * @param {boolean} props.disabled - 是否禁用
 * @param {string} props.error - 錯誤訊息
 * @returns {React.ReactElement} 核取方塊組件
 */
const Checkbox = ({
  label,
  name,
  checked,
  onChange,
  disabled = false,
  error = null,
  ...rest
}) => {
  return (
    <FormControl error={!!error}>
      <FormControlLabel
        control={
          <MuiCheckbox
            checked={checked}
            onChange={onChange}
            name={name}
            disabled={disabled}
            color="primary"
            {...rest}
          />
        }
        label={label}
      />
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
};

export default Checkbox;
