import React from 'react';
import {
  Grid,
  TextField,
} from '@mui/material';

interface AccountFormBasicInfoFieldsProps {
  code: string;
  name: string;
  onCodeChange: (value: string) => void;
  onNameChange: (value: string) => void;
  errors: Record<string, string>;
}

/**
 * 基本資訊欄位組件
 * 包含科目代號和科目名稱欄位
 */
export const AccountFormBasicInfoFields: React.FC<AccountFormBasicInfoFieldsProps> = ({
  code,
  name,
  onCodeChange,
  onNameChange,
  errors
}) => {
  return (
    <>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="科目代號"
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          error={!!errors.code}
          helperText={errors.code}
          placeholder="例如：1101"
          required
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="科目名稱"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          error={!!errors.name}
          helperText={errors.name}
          placeholder="例如：現金"
          required
        />
      </Grid>
    </>
  );
};

export default AccountFormBasicInfoFields;