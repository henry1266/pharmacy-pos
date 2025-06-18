import React from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography
} from '@mui/material';

/**
 * 統一的表單字段組件
 * 重構自 EmployeeAccountManager 中重複的表單字段
 */
const FormField = ({
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
      <FormControl fullWidth margin="dense" {...props}>
        <InputLabel id={`${name}-label`} error={!!error}>
          {label}
        </InputLabel>
        <Select
          labelId={`${name}-label`}
          name={name}
          value={value}
          onChange={onChange}
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
      onChange={onChange}
      error={!!error}
      helperText={helperText}
      required={required}
      sx={{ mb: 2 }}
      {...props}
    />
  );
};

FormField.propTypes = {
  type: PropTypes.oneOf(['text', 'email', 'password', 'select']),
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  }))
};

export default FormField;