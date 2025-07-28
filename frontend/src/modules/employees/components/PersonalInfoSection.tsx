import React, { ChangeEvent } from 'react';
import { Grid } from '@mui/material';
import EmployeeFormField from './shared/EmployeeFormField';
import { EmployeeFormData, FormErrors } from './EmployeeForm';

// 定義元件 Props 介面
interface PersonalInfoSectionProps {
  formData: EmployeeFormData;
  errors: FormErrors;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

/**
 * 個人基本資料區塊
 * 包含姓名、性別、出生年月日、身分證號碼、教育程度、籍貫等欄位
 */
const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({ formData, errors, onChange }) => {
  return (
    <Grid container spacing={2}>
      <EmployeeFormField
        name="name"
        label="姓名"
        value={formData.name}
        onChange={onChange}
        error={!!errors.name}
        helperText={errors.name || ''}
        required
      />
      
      <EmployeeFormField
        type="radio"
        name="gender"
        label="性別"
        value={formData.gender}
        onChange={onChange}
        error={!!errors.gender}
        helperText={errors.gender || ''}
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
        helperText={errors.birthDate || ''}
        required
      />
      
      <EmployeeFormField
        name="idNumber"
        label="身分證統一號碼"
        value={formData.idNumber}
        onChange={onChange}
        error={!!errors.idNumber}
        helperText={errors.idNumber || ''}
        required
      />
      
      <EmployeeFormField
        name="education"
        label="教育程度"
        value={formData.education}
        onChange={onChange}
        error={!!errors.education}
        helperText={errors.education || ''}
      />
      
      <EmployeeFormField
        name="nativePlace"
        label="籍貫"
        value={formData.nativePlace}
        onChange={onChange}
        error={!!errors.nativePlace}
        helperText={errors.nativePlace || ''}
      />
    </Grid>
  );
};

export default PersonalInfoSection;