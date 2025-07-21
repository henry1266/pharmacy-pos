import React from 'react';
import {
  Grid,
  TextField,
  FormControlLabel,
  Switch,
} from '@mui/material';

interface FormStatusAndDescriptionProps {
  isActive: boolean;
  description: string;
  onIsActiveChange: (value: boolean) => void;
  onDescriptionChange: (value: string) => void;
}

/**
 * 表單狀態和描述組件
 * 包含啟用狀態開關和描述欄位
 */
export const FormStatusAndDescription: React.FC<FormStatusAndDescriptionProps> = ({
  isActive,
  description,
  onIsActiveChange,
  onDescriptionChange
}) => {
  return (
    <>
      {/* 狀態開關 */}
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={isActive}
              onChange={(e) => onIsActiveChange(e.target.checked)}
              color="primary"
            />
          }
          label="啟用此科目"
        />
      </Grid>

      {/* 描述 */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="描述"
          multiline
          rows={3}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="科目的詳細說明（選填）"
        />
      </Grid>
    </>
  );
};

export default FormStatusAndDescription;