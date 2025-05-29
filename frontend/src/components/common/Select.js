import React from 'react';
import { Select as MuiSelect, MenuItem, FormControl, InputLabel, FormHelperText } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * 自定義下拉選擇框組件
 * @param {Object} props - 組件屬性
 * @param {string} props.label - 選擇框標籤
 * @param {string} props.name - 選擇框名稱
 * @param {string|number} props.value - 選擇框值
 * @param {function} props.onChange - 值變更事件處理函數
 * @param {Array} props.options - 選項數組，格式為 [{value: 'value1', label: 'Label 1'}, ...]
 * @param {boolean} props.fullWidth - 是否佔滿整行寬度
 * @param {boolean} props.required - 是否必填
 * @param {string} props.error - 錯誤訊息
 * @param {boolean} props.disabled - 是否禁用
 * @returns {React.ReactElement} 下拉選擇框組件
 */
const Select = ({
  label,
  name,
  value,
  onChange,
  options = [],
  fullWidth = true,
  required = false,
  error = null,
  disabled = false,
  ...rest
}) => {
  return (
    <FormControl 
      fullWidth={fullWidth} 
      variant="outlined" 
      margin="normal"
      required={required}
      error={!!error}
      disabled={disabled}
    >
      <InputLabel id={`${name}-label`}>{label}</InputLabel>
      <MuiSelect
        labelId={`${name}-label`}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        label={label}
        {...rest}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </MuiSelect>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
};

// 添加 Props 驗證
Select.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  fullWidth: PropTypes.bool,
  required: PropTypes.bool,
  error: PropTypes.string,
  disabled: PropTypes.bool
};

// 預設值
Select.defaultProps = {
  options: [],
  fullWidth: true,
  required: false,
  error: null,
  disabled: false
};

export default Select;
