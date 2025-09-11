import React, { ChangeEvent } from 'react';
import { Grid } from '@mui/material';
import EmployeeFormField from './shared/EmployeeFormField';
import { EmployeeFormData, FormErrors } from './EmployeeForm';

// 定義元件 Props 介面
interface ContactInfoSectionProps {
  formData: EmployeeFormData;
  errors: FormErrors;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

/**
 * 聯絡資訊區塊
 * 包含住址、電話等聯絡資訊
 */
const ContactInfoSection: React.FC<ContactInfoSectionProps> = ({ formData, errors, onChange }) => {
  return (
    <Grid container spacing={2}>
      <EmployeeFormField
        name="address"
        label="住址"
        value={formData.address}
        onChange={onChange}
        error={!!errors.address}
        helperText={errors.address || ''}
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
        helperText={errors.phone || ''}
        gridSize={{ xs: 12, sm: 4 }}
      />
    </Grid>
  );
};

export default ContactInfoSection;