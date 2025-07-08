import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Divider,
  Grid,
  Paper
} from '@mui/material';
import { Account2 } from '@pharmacy-pos/shared/types/accounting2';
import { formatCurrency, formatDate } from '@utils/formatters';

// 詳細面板 Props 介面
interface AccountDetailsPanelProps {
  account: Account2 | null;
  loading?: boolean;
}

/**
 * 科目詳細資訊面板組件
 * 
 * 職責：
 * - 顯示選中科目的詳細資訊
 * - 格式化科目屬性顯示
 * - 提供科目狀態視覺化
 */
export const AccountDetailsPanel: React.FC<AccountDetailsPanelProps> = ({
  account,
  loading = false
}) => {
  if (loading) {
    return (
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="body2" color="text.secondary">
          載入中...
        </Typography>
      </Paper>
    );
  }

  if (!account) {
    return (
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="body2" color="text.secondary">
          請選擇科目以查看詳細資訊
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          科目詳細資訊
        </Typography>
        <Divider />
      </Box>

      <Grid container spacing={2}>
        {/* 基本資訊 */}
        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              基本資訊
            </Typography>
            <Box sx={{ pl: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>科目代號：</strong>{account.code}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>科目名稱：</strong>{account.name}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>科目類型：</strong>
                <Chip 
                  label={account.type} 
                  size="small" 
                  color="primary" 
                  sx={{ ml: 1 }}
                />
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>狀態：</strong>
                <Chip 
                  label={account.isActive ? '啟用' : '停用'} 
                  size="small" 
                  color={account.isActive ? 'success' : 'default'}
                  sx={{ ml: 1 }}
                />
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* 層級資訊 */}
        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              層級資訊
            </Typography>
            <Box sx={{ pl: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>層級：</strong>{account.level}
              </Typography>
              {account.parentId && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>上層科目：</strong>{account.parentId}
                </Typography>
              )}
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>是否有子科目：</strong>
                <Chip
                  label={account.children && account.children.length > 0 ? '是' : '否'}
                  size="small"
                  color={account.children && account.children.length > 0 ? 'info' : 'default'}
                  sx={{ ml: 1 }}
                />
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* 餘額資訊 */}
        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              餘額資訊
            </Typography>
            <Box sx={{ pl: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>期初餘額：</strong>
                <span style={{ color: account.initialBalance >= 0 ? '#2e7d32' : '#d32f2f' }}>
                  {formatCurrency(account.initialBalance)}
                </span>
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>當前餘額：</strong>
                <span style={{ color: account.balance >= 0 ? '#2e7d32' : '#d32f2f' }}>
                  {formatCurrency(account.balance)}
                </span>
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* 時間資訊 */}
        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              時間資訊
            </Typography>
            <Box sx={{ pl: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>建立時間：</strong>{formatDate(account.createdAt)}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>更新時間：</strong>{formatDate(account.updatedAt)}
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* 描述 */}
        {account.description && (
          <Grid item xs={12}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                描述
              </Typography>
              <Typography variant="body2" sx={{ pl: 1, fontStyle: 'italic' }}>
                {account.description}
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default AccountDetailsPanel;