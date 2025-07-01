import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  AccountBalance as AccountIcon,
  Category as CategoryIcon,
  Receipt as RecordIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { Account2FormData } from '@pharmacy-pos/shared/types/accounting2';
import AccountList from '../components/accounting2/AccountList';
import AccountForm from '../components/accounting2/AccountForm';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`accounting2-tabpanel-${index}`}
      aria-labelledby={`accounting2-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `accounting2-tab-${index}`,
    'aria-controls': `accounting2-tabpanel-${index}`,
  };
}

const Accounting2Page: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [accountFormOpen, setAccountFormOpen] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAccountFormOpen = () => {
    setAccountFormOpen(true);
  };

  const handleAccountFormClose = () => {
    setAccountFormOpen(false);
  };

  const handleAccountFormSubmit = async (data: Account2FormData) => {
    // 這裡可以處理表單提交邏輯
    console.log('Account form submitted:', data);
    setAccountFormOpen(false);
  };

  return (
    <Container maxWidth="xl">
      {/* 麵包屑導航 */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            component={RouterLink}
            to="/dashboard"
            color="inherit"
            underline="hover"
          >
            儀表板
          </Link>
          <Typography color="text.primary">記帳系統 v2</Typography>
        </Breadcrumbs>
      </Box>

      {/* 頁面標題 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          記帳系統 v2
        </Typography>
        <Typography variant="body1" color="text.secondary">
          全新的記帳系統，支援多帳戶管理、自訂類別和詳細記錄追蹤
        </Typography>
      </Box>

      {/* 主要內容區域 */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="accounting2 tabs"
            variant="fullWidth"
          >
            <Tab 
              icon={<AccountIcon />} 
              label="帳戶管理" 
              {...a11yProps(0)} 
            />
            <Tab 
              icon={<CategoryIcon />} 
              label="類別管理" 
              {...a11yProps(1)} 
            />
            <Tab 
              icon={<RecordIcon />} 
              label="記帳記錄" 
              {...a11yProps(2)} 
            />
          </Tabs>
        </Box>

        {/* 帳戶管理頁籤 */}
        <TabPanel value={tabValue} index={0}>
          <AccountList onAddAccount={handleAccountFormOpen} />
        </TabPanel>

        {/* 類別管理頁籤 */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CategoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              類別管理功能開發中...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              即將支援收入和支出類別的自訂管理
            </Typography>
          </Box>
        </TabPanel>

        {/* 記帳記錄頁籤 */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <RecordIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              記帳記錄功能開發中...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              即將支援詳細的收支記錄管理和報表分析
            </Typography>
          </Box>
        </TabPanel>
      </Paper>

      {/* 帳戶表單對話框 */}
      <AccountForm
        open={accountFormOpen}
        onClose={handleAccountFormClose}
        onSubmit={handleAccountFormSubmit}
      />
    </Container>
  );
};

export default Accounting2Page;