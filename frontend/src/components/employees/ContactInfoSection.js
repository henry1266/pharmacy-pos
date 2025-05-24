import React from 'react';
import { 
  Grid, 
  TextField,
  FormHelperText
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

export default ContactInfoSection;
