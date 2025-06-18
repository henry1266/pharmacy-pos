import React from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@mui/material';
import EmployeeFormField from './shared/EmployeeFormField';

/**
 * 工作資訊區塊
 * 包含職務、部門、到職日期、薪資、勞保投保日期等欄位
 */
const WorkInfoSection = ({ formData, errors, onChange }) => {
  return (
    <Grid container spacing={2}>
      <EmployeeFormField
        name="position"
        label="任職職務"
        value={formData.position}
        onChange={onChange}
        error={!!errors.position}
        helperText={errors.position}
        required
      />
      
      <EmployeeFormField
        name="department"
        label="所屬部門"
        value={formData.department}
        onChange={onChange}
        error={!!errors.department}
        helperText={errors.department}
        required
      />
      
      <EmployeeFormField
        type="date"
        name="hireDate"
        label="到職年月日"
        value={formData.hireDate}
        onChange={onChange}
        error={!!errors.hireDate}
        helperText={errors.hireDate}
        required
      />
      
      <EmployeeFormField
        type="number"
        name="salary"
        label="約定工資"
        value={formData.salary}
        onChange={onChange}
        error={!!errors.salary}
        helperText={errors.salary}
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
        helperText={errors.insuranceDate}
      />
    </Grid>
  );
};

// 新增 PropTypes 驗證
WorkInfoSection.propTypes = {
  formData: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

export default WorkInfoSection;
