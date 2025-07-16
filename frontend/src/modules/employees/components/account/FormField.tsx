import React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  SelectChangeEvent
} from '@mui/material';

/**
 * 選項介面
 */
interface OptionType {
  value: string;
  label: string;
}

/**
 * 統一的表單字段組件
 * 重構自 EmployeeAccountManager 中重複的表單字段
 */
interface FormFieldProps {
  type?: 'text' | 'email' | 'password' | 'select';
  name: string;
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  options?: OptionType[];
  [key: string]: any; // 允許其他屬性
}

const FormField: React.FC<FormFieldProps> = ({
  type = 'text',
  name,
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  options = [],
  ...props
}) => {
  if (type === 'select') {
    return (
      <FormControl fullWidth margin="dense">
        <InputLabel id={`${name}-label`} error={!!error}>
          {label}
        </InputLabel>
        <Select
          labelId={`${name}-label`}
          name={name}
          value={value}
          onChange={onChange as (event: SelectChangeEvent) => void}
          label={label}
          error={!!error}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {error && (
          <Typography color="error" variant="caption">
            {helperText}
          </Typography>
        )}
      </FormControl>
    );
  }

  return (
    <TextField
      margin="dense"
      label={label}
      type={type}
      fullWidth
      name={name}
      value={value}
      onChange={onChange as (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void}
      error={!!error}
      helperText={helperText}
      required={required}
      sx={{ mb: 2 }}
      {...props}
    />
  );
};

export default FormField;