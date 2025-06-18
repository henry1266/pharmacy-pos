import React from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText
} from '@mui/material';

/**
 * 員工表單統一字段組件
 * 重構自各個表單區塊中重複的字段結構
 */
const EmployeeFormField = ({
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

EmployeeFormField.propTypes = {
  type: PropTypes.oneOf(['text', 'email', 'tel', 'number', 'date', 'radio']),
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  gridSize: PropTypes.object,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  }))
};

export default EmployeeFormField;