import React from 'react';
import PropTypes from 'prop-types';
import { 
  Grid, 
  TextField
} from '@mui/material';

/**
 * 聯絡資訊區塊
 * 包含住址、電話等聯絡資訊
 */
const ContactInfoSection = ({ formData, errors, onChange }) => {
  return (
    <Grid container spacing={2}>
      {/* 住址 */}
      <Grid item xs={12} sm={8}>
        <TextField
          required
          fullWidth
          id="address"
          name="address"
          label="住址"
          value={formData.address}
          onChange={onChange}
          error={!!errors.address}
          helperText={errors.address}
          margin="normal"
        />
      </Grid>
      
      {/* 電話 */}
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          id="phone"
          name="phone"
          label="電話"
          value={formData.phone}
          onChange={onChange}
          error={!!errors.phone}
          helperText={errors.phone}
          margin="normal"
        />
      </Grid>
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
