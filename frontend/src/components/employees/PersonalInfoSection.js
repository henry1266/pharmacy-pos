import React from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@mui/material';
import EmployeeFormField from './shared/EmployeeFormField';

/**
 * 個人基本資料區塊
 * 包含姓名、性別、出生年月日、身分證號碼、教育程度、籍貫等欄位
 */
const PersonalInfoSection = ({ formData, errors, onChange }) => {
  return (
    <Grid container spacing={2}>
      <EmployeeFormField
        name="name"
        label="姓名"
        value={formData.name}
        onChange={onChange}
        error={!!errors.name}
        helperText={errors.name}
        required
      />
      
      <EmployeeFormField
        type="radio"
        name="gender"
        label="性別"
        value={formData.gender}
        onChange={onChange}
        error={!!errors.gender}
        helperText={errors.gender}
        required
        options={[
          { value: 'male', label: '男' },
          { value: 'female', label: '女' }
        ]}
      />
      
      <EmployeeFormField
        type="date"
        name="birthDate"
        label="出生年月日"
        value={formData.birthDate}
        onChange={onChange}
        error={!!errors.birthDate}
        helperText={errors.birthDate}
        required
      />
      
      <EmployeeFormField
        name="idNumber"
        label="身分證統一號碼"
        value={formData.idNumber}
        onChange={onChange}
        error={!!errors.idNumber}
        helperText={errors.idNumber}
        required
      />
      
      <EmployeeFormField
        name="education"
        label="教育程度"
        value={formData.education}
        onChange={onChange}
        error={!!errors.education}
        helperText={errors.education}
      />
      
      <EmployeeFormField
        name="nativePlace"
        label="籍貫"
        value={formData.nativePlace}
        onChange={onChange}
        error={!!errors.nativePlace}
        helperText={errors.nativePlace}
      />
    </Grid>
  );
};

// 新增缺少的 props validation
PersonalInfoSection.propTypes = {
  formData: PropTypes.shape({
    name: PropTypes.string,
    gender: PropTypes.string,
    birthDate: PropTypes.string,
    idNumber: PropTypes.string,
    education: PropTypes.string,
    nativePlace: PropTypes.string
  }).isRequired,
  errors: PropTypes.shape({
    name: PropTypes.string,
    gender: PropTypes.string,
    birthDate: PropTypes.string,
    idNumber: PropTypes.string,
    education: PropTypes.string,
    nativePlace: PropTypes.string
  }).isRequired,
  onChange: PropTypes.func.isRequired
};

export default PersonalInfoSection;
