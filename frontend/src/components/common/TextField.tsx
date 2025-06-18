import React from 'react';
import { TextField as MuiTextField, TextFieldProps as MuiTextFieldProps } from '@mui/material';

/**
 * 自定義文本輸入框組件
 */
interface TextFieldProps extends Omit<MuiTextFieldProps, 'error'> {
  label: string;
  name: string;
  value?: string | number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  fullWidth?: boolean;
  required?: boolean;
  error?: string | null;
  disabled?: boolean;
}

const TextField: React.FC<TextFieldProps> = ({
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