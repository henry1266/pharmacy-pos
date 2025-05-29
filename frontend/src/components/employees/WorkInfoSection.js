import React from 'react';
import PropTypes from 'prop-types';
import { 
  Grid, 
  TextField
} from '@mui/material';

/**
 * 工作資訊區塊
 * 包含職務、部門、到職日期、薪資、勞保投保日期等欄位
 */
const WorkInfoSection = ({ formData, errors, onChange }) => {
  return (
    <Grid container spacing={2}>
      {/* 任職職務 */}
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          required
          fullWidth
          id="position"
          name="position"
          label="任職職務"
          value={formData.position}
          onChange={onChange}
          error={!!errors.position}
          helperText={errors.position}
          margin="normal"
        />
      </Grid>
      
      {/* 所屬部門 */}
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          required
          fullWidth
          id="department"
          name="department"
          label="所屬部門"
          value={formData.department}
          onChange={onChange}
          error={!!errors.department}
          helperText={errors.department}
          margin="normal"
        />
      </Grid>
      
      {/* 到職年月日 */}
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          required
          fullWidth
          id="hireDate"
          name="hireDate"
          label="到職年月日"
          type="date"
          value={formData.hireDate}
          onChange={onChange}
          error={!!errors.hireDate}
          helperText={errors.hireDate}
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
      </Grid>
      
      {/* 約定工資 */}
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          fullWidth
          id="salary"
          name="salary"
          label="約定工資"
          type="number"
          value={formData.salary}
          onChange={onChange}
          error={!!errors.salary}
          helperText={errors.salary}
          margin="normal"
          InputProps={{
            startAdornment: <span style={{ marginRight: 8 }}>NT$</span>,
          }}
        />
      </Grid>
      
      {/* 勞保投保日期 */}
      <Grid item xs={12} sm={6} md={4}>
        <TextField
          fullWidth
          id="insuranceDate"
          name="insuranceDate"
          label="勞保投保日期"
          type="date"
          value={formData.insuranceDate}
          onChange={onChange}
          error={!!errors.insuranceDate}
          helperText={errors.insuranceDate}
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
      </Grid>
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
