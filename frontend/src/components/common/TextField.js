import React from 'react';
import { TextField as MuiTextField } from '@mui/material';

/**
 * 自定義文本輸入框組件
 * @param {Object} props - 組件屬性
 * @param {string} props.label - 輸入框標籤
 * @param {string} props.name - 輸入框名稱
 * @param {string} props.value - 輸入框值
 * @param {function} props.onChange - 值變更事件處理函數
 * @param {string} props.type - 輸入框類型 (text, password, number, email等)
 * @param {boolean} props.fullWidth - 是否佔滿整行寬度
 * @param {boolean} props.required - 是否必填
 * @param {string} props.error - 錯誤訊息
 * @param {boolean} props.disabled - 是否禁用
 * @returns {React.ReactElement} 文本輸入框組件
 */
const TextField = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  fullWidth = true,
  required = false,
  error = null,
  disabled = false,
  ...rest
}) => {
  return (
    <MuiTextField
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      type={type}
      fullWidth={fullWidth}
      required={required}
      error={!!error}
      helperText={error}
      disabled={disabled}
      variant="outlined"
      margin="normal"
      {...rest}
    />
  );
};

export default TextField;
