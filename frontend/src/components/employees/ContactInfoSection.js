import React from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@mui/material';
import EmployeeFormField from './shared/EmployeeFormField';

/**
 * 聯絡資訊區塊
 * 包含住址、電話等聯絡資訊
 */
const ContactInfoSection = ({ formData, errors, onChange }) => {
  return (
    <Grid container spacing={2}>
      <EmployeeFormField
        name="address"
        label="住址"
        value={formData.address}
        onChange={onChange}
        error={!!errors.address}
        helperText={errors.address}
        required
        gridSize={{ xs: 12, sm: 8 }}
      />
      
      <EmployeeFormField
        type="tel"
        name="phone"
        label="電話"
        value={formData.phone}
        onChange={onChange}
        error={!!errors.phone}
        helperText={errors.phone}
        gridSize={{ xs: 12, sm: 4 }}
      />
    </Grid>
  );
};

// 添加 PropTypes 驗證
ContactInfoSection.propTypes = {
  formData: PropTypes.shape({
    address: PropTypes.string,
    phone: PropTypes.string
  }).isRequired,
  errors: PropTypes.objectOf(PropTypes.string),
  onChange: PropTypes.func.isRequired
};

export default ContactInfoSection;
