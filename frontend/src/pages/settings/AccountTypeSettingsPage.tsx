import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Breadcrumbs,
  Link
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import AccountTypeManagement from '../../modules/accounting2/components/features/accountTypes/AccountTypeManagement';

const AccountTypeSettingsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* 麵包屑導航 */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link
          component={RouterLink}
          to="/dashboard"
          underline="hover"
          color="inherit"
        >
          首頁
        </Link>
        <Link
          component={RouterLink}
          to="/settings"
          underline="hover"
          color="inherit"
        >
          設定
        </Link>
        <Typography color="text.primary">帳戶類型管理</Typography>
      </Breadcrumbs>

      {/* 頁面標題 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          帳戶類型設定
        </Typography>
        <Typography variant="body1" color="text.secondary">
          管理會計科目的類型分類，包括資產、負債、權益、收入、費用等類型的設定123
        </Typography>
      </Box>

      {/* 主要內容 */}
      <Paper elevation={1} sx={{ overflow: 'hidden' }}>
        <AccountTypeManagement />
      </Paper>
    </Container>
  );
};

export default AccountTypeSettingsPage;