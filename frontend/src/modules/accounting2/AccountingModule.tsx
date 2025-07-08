/**
 * 會計模組主要包裝器
 * 整合錯誤邊界、通知系統和核心功能
 */

import React from 'react';
import { Box } from '@mui/material';
import { 
  AccountingErrorBoundary, 
  NotificationProvider 
} from './core';
import AccountList from './components/features/accounts/AccountList';

interface AccountingModuleProps {
  organizationId?: string | null;
  refreshTrigger?: number;
}

/**
 * 會計模組主組件
 * 提供完整的錯誤處理和通知功能
 */
const AccountingModule: React.FC<AccountingModuleProps> = ({ 
  organizationId, 
  refreshTrigger 
}) => {
  return (
    <NotificationProvider maxNotifications={3} defaultDuration={5000}>
      <AccountingErrorBoundary module="Accounting">
        <Box sx={{ p: 2 }}>
          <AccountList 
            organizationId={organizationId}
            refreshTrigger={refreshTrigger}
          />
        </Box>
      </AccountingErrorBoundary>
    </NotificationProvider>
  );
};

export default React.memo(AccountingModule);