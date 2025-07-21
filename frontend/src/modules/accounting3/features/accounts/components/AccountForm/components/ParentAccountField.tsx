import React from 'react';
import {
  Grid,
  TextField,
} from '@mui/material';
import { Account3 } from '@pharmacy-pos/shared/types/accounting3';

interface ParentAccountFieldProps {
  parentId: string;
  parentAccount?: Account3 | null;
  onParentIdChange: (value: string) => void;
}

/**
 * 上層科目欄位組件
 * 顯示上層科目資訊或允許輸入上層科目ID
 */
export const ParentAccountField: React.FC<ParentAccountFieldProps> = ({
  parentId,
  parentAccount,
  onParentIdChange
}) => {
  return (
    <Grid item xs={12}>
      {parentAccount ? (
        <TextField
          fullWidth
          label="上層科目"
          value={`${parentAccount.code} - ${parentAccount.name}`}
          InputProps={{
            readOnly: true,
          }}
          variant="filled"
          helperText="此科目將作為子科目建立"
        />
      ) : (
        <TextField
          fullWidth
          label="上層科目ID"
          value={parentId}
          onChange={(e) => onParentIdChange(e.target.value)}
          placeholder="選填，如果是子科目請填入上層科目ID"
        />
      )}
    </Grid>
  );
};

export default ParentAccountField;