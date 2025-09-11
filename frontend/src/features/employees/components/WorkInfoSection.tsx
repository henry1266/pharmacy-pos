import React, { ChangeEvent } from 'react';
import { Grid } from '@mui/material';
import EmployeeFormField from './shared/EmployeeFormField';
import { EmployeeFormData, FormErrors } from './EmployeeForm';

// 定義元件 Props 介面
interface WorkInfoSectionProps {
  formData: EmployeeFormData;
  errors: FormErrors;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

/**
 * 工作資訊區塊
 * 包含職務、部門、到職日期、薪資、勞保投保日期等欄位
 */
const WorkInfoSection: React.FC<WorkInfoSectionProps> = ({ formData, errors, onChange }) => {
  return (
    <Grid container spacing={2}>
      <EmployeeFormField
        name="position"
        label="任職職務"
        value={formData.position}
        onChange={onChange}
        error={!!errors.position}
        helperText={errors.position || ''}
        required
      />
      
      <EmployeeFormField
        type="select"
        name="department"
        label="所屬部門"
        value={formData.department}
        onChange={onChange}
        error={!!errors.department}
        helperText={errors.department || ''}
        required
        options={[
          { value: '主管', label: '主管' },
          { value: '員工', label: '員工' }
        ]}
      />
      
      <EmployeeFormField
        type="date"
        name="hireDate"
        label="到職年月日"
        value={formData.hireDate}
        onChange={onChange}
        error={!!errors.hireDate}
        helperText={errors.hireDate || ''}
        required
      />
      
      <EmployeeFormField
        type="number"
        name="salary"
        label="約定工資"
        value={formData.salary}
        onChange={onChange}
        error={!!errors.salary}
        helperText={errors.salary || ''}
        InputProps={{
          startAdornment: <span style={{ marginRight: 8 }}>NT$</span>,
        }}
      />
      
      <EmployeeFormField
        type="date"
        name="insuranceDate"
        label="勞保投保日期"
        value={formData.insuranceDate}
        onChange={onChange}
        error={!!errors.insuranceDate}
        helperText={errors.insuranceDate || ''}
      />
    </Grid>
  );
};

export default WorkInfoSection;