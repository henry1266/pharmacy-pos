import React from 'react';
import {
  Grid as MuiGrid,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
  TextFieldProps
} from '@mui/material';

// 直接使用 MuiGrid
const Grid = MuiGrid;

/**
 * 選項介面
 */
interface OptionType {
  value: string;
  label: string;
}

/**
 * 網格尺寸介面
 */
interface GridSizeType {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

/**
 * 員工表單統一字段組件
 * 重構自各個表單區塊中重複的字段結構
 */
interface EmployeeFormFieldProps extends Omit<TextFieldProps, 'error'> {
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'radio';
  name: string;
  label: string;
  value?: string | number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  gridSize?: GridSizeType;
  options?: OptionType[];
}

const EmployeeFormField: React.FC<EmployeeFormFieldProps> = ({
  type = 'text',
  name,
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  gridSize = { xs: 12, sm: 6, md: 4 },
  options = [],
  ...props
}) => {
  const renderField = () => {
    if (type === 'radio') {
      return (
        <FormControl
          required={required}
          error={!!error}
          component="fieldset"
          margin="normal"
          fullWidth
        >
          <FormLabel component="legend">{label}</FormLabel>
          <RadioGroup
            row
            name={name}
            value={value}
            onChange={onChange}
          >
            {options.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={option.label}
              />
            ))}
          </RadioGroup>
          {error && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
      );
    }

    return (
      <TextField
        required={required}
        fullWidth
        id={name}
        name={name}
        label={label}
        type={type}
        value={value}
        onChange={onChange}
        error={!!error}
        helperText={helperText}
        margin="normal"
        InputLabelProps={type === 'date' ? { shrink: true } : undefined}
        {...props}
      />
    );
  };

  return (
    <Grid item {...gridSize}>
      {renderField()}
    </Grid>
  );
};

export default EmployeeFormField;