import React from 'react';
import { Select as MuiSelect, MenuItem, FormControl, InputLabel, FormHelperText, SelectChangeEvent } from '@mui/material';

/**
 * 選項介面
 */
interface SelectOption {
  value: string | number;
  label: string;
}

/**
 * 自定義下拉選擇框組件
 */
interface CustomSelectProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (event: SelectChangeEvent<string | number>) => void;
  options?: SelectOption[];
  fullWidth?: boolean;
  required?: boolean;
  error?: string | null;
  disabled?: boolean;
}

const Select: React.FC<CustomSelectProps> = ({
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

export default Select;