import React from 'react';
import { Checkbox as MuiCheckbox, FormControlLabel, FormControl, FormHelperText, CheckboxProps as MuiCheckboxProps } from '@mui/material';

/**
 * 自定義核取方塊組件
 */
interface CustomCheckboxProps extends Omit<MuiCheckboxProps, 'onChange'> {
  label?: string;
  name?: string;
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
  disabled?: boolean;
  error?: string;
}

const Checkbox: React.FC<CustomCheckboxProps> = ({
  label,
  name,
  checked,
  onChange,
  disabled = false,
  error,
  ...rest
}) => {
  return (
    <FormControl error={!!error}>
      <FormControlLabel
        control={
          <MuiCheckbox
            checked={checked || false}
            {...(onChange && { onChange })}
            {...(name && { name })}
            disabled={disabled}
            color="primary"
            {...rest}
          />
        }
        label={label || ''}
      />
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
};

export default Checkbox;