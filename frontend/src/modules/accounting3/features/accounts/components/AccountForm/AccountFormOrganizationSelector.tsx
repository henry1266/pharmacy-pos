import React from 'react';
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import { Organization } from '@pharmacy-pos/shared/types/organization';
import { Account3 } from '@pharmacy-pos/shared/types/accounting3';

interface AccountFormOrganizationSelectorProps {
  organizationId: string;
  organizations: Organization[];
  selectedOrganizationId?: string | null;
  parentAccount?: Account3 | null;
}

/**
 * 機構選擇器組件
 * 顯示所屬機構選擇器
 */
export const AccountFormOrganizationSelector: React.FC<AccountFormOrganizationSelectorProps> = ({
  organizationId,
  organizations,
  selectedOrganizationId,
  parentAccount
}) => {
  return (
    <Grid item xs={12}>
      <FormControl fullWidth>
        <InputLabel>所屬機構</InputLabel>
        <Select
          value={organizationId || selectedOrganizationId || ''}
          label="所屬機構"
          disabled={true} // 在新增科目時機構應該已經選定
        >
          {organizations.map((org) => (
            <MenuItem key={org._id} value={org._id}>
              {org.name}
            </MenuItem>
          ))}
        </Select>
        {parentAccount && (
          <Box sx={{ mt: 1, fontSize: '0.875rem', color: 'text.secondary' }}>
            機構資訊已從父科目繼承
          </Box>
        )}
      </FormControl>
    </Grid>
  );
};

export default AccountFormOrganizationSelector;