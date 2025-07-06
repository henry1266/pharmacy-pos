import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  Alert
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { DoubleEntryFormWithEntries } from '../DoubleEntryFormWithEntries';
import { EmbeddedAccountingEntryFormData } from '@pharmacy-pos/shared';

// 型別定義
interface Permissions {
  canEdit: boolean;
}

export interface DoubleEntrySectionProps {
  // 分錄資料
  entries: EmbeddedAccountingEntryFormData[];
  onEntriesChange: (entries: EmbeddedAccountingEntryFormData[]) => void;
  
  // 表單設定
  organizationId?: string;
  isCopyMode?: boolean;
  
  // 模式和權限
  mode: 'create' | 'edit' | 'view';
  permissions: Permissions;
  
  // 錯誤處理
  errors: Record<string, string>;
  balanceError: string;
  
  // 對話框控制
  onOpenTemplateDialog: () => void;
  onOpenQuickStartDialog: () => void;
}

export const DoubleEntrySection: React.FC<DoubleEntrySectionProps> = ({
  entries,
  onEntriesChange,
  organizationId,
  isCopyMode = false,
  mode,
  permissions,
  errors,
  balanceError,
  onOpenTemplateDialog,
  onOpenQuickStartDialog
}) => {
  return (
    <Card sx={{ mb: 3, boxShadow: 2 }}>
      <CardHeader
        title="借貸分錄"
        action={
          mode !== 'view' && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<SpeedIcon />}
                onClick={onOpenTemplateDialog}
                sx={{
                  color: 'primary.contrastText',
                  borderColor: 'primary.contrastText',
                  '&:hover': {
                    borderColor: 'primary.contrastText',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                快速範本
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<HelpIcon />}
                onClick={onOpenQuickStartDialog}
                sx={{
                  color: 'primary.contrastText',
                  borderColor: 'primary.contrastText',
                  '&:hover': {
                    borderColor: 'primary.contrastText',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                快速入門
              </Button>
            </Box>
          )
        }
        sx={{
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          '& .MuiCardHeader-subheader': {
            color: 'primary.contrastText',
            opacity: 0.8
          }
        }}
      />
      <CardContent sx={{ pt: 3 }}>
        {/* 分錄錯誤訊息 */}
        {errors.entries && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.entries}
          </Alert>
        )}
        
        {/* 借貸平衡錯誤訊息 */}
        {balanceError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {balanceError}
          </Alert>
        )}

        {/* 借貸分錄表單 */}
        <DoubleEntryFormWithEntries
          entries={entries}
          onChange={onEntriesChange}
          organizationId={organizationId}
          isCopyMode={isCopyMode}
          disabled={!permissions.canEdit}
        />
      </CardContent>
    </Card>
  );
};

export default DoubleEntrySection;