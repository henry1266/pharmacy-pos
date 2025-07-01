import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  Breadcrumbs,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import {
  AccountBalance as AccountIcon,
  Category as CategoryIcon,
  Receipt as RecordIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { Account2FormData } from '@pharmacy-pos/shared/types/accounting2';
import { Organization } from '@pharmacy-pos/shared/types/organization';
import AccountList from '../components/accounting2/AccountList';
import AccountForm from '../components/accounting2/AccountForm';
import organizationService from '../services/organizationService';
import { accounting2Service } from '../services/accounting2Service';

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
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [refreshAccounts, setRefreshAccounts] = useState(0);

  // 載入機構列表
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const response = await organizationService.getOrganizations();
        if (response.success) {
          setOrganizations(response.data);
        }
      } catch (error) {
        console.error('載入機構列表失敗:', error);
      }
    };

    loadOrganizations();
  }, []);

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
    try {
      // 使用 AccountForm 傳來的 organizationId，不要覆蓋
      console.log('提交帳戶資料:', data);
      
      // 調用 accounting2Service 來儲存資料
      const response = await accounting2Service.accounts.create(data);
      
      if (response.success) {
        console.log('帳戶建立成功:', response.data);
        setAccountFormOpen(false);
        
        // 觸發 AccountList 重新載入
        setRefreshAccounts(prev => {
          const newValue = prev + 1;
          console.log('更新 refreshAccounts:', prev, '->', newValue);
          return newValue;
        });
      } else {
        console.error('建立帳戶失敗');
      }
      
    } catch (error) {
      console.error('建立帳戶失敗:', error);
      // 可以在這裡顯示錯誤訊息
    }
  };

  const handleOrganizationChange = (event: any) => {
    const value = event.target.value;
    setSelectedOrganizationId(value || null);
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
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          全新的記帳系統，支援多帳戶管理、自訂類別和詳細記錄追蹤
        </Typography>
        
        {/* 機構選擇器 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>選擇機構</InputLabel>
            <Select
              value={selectedOrganizationId || ''}
              onChange={handleOrganizationChange}
              label="選擇機構"
              startAdornment={<BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />}
            >
              <MenuItem value="">
                <em>個人帳務</em>
              </MenuItem>
              {organizations.map((org) => (
                <MenuItem key={org._id} value={org._id}>
                  {org.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {selectedOrganizationId && (
            <Chip
              label={organizations.find(org => org._id === selectedOrganizationId)?.name || ''}
              color="primary"
              variant="outlined"
              onDelete={() => setSelectedOrganizationId(null)}
            />
          )}
        </Box>
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
          <AccountList
            onAddAccount={handleAccountFormOpen}
            organizationId={selectedOrganizationId}
            refreshTrigger={refreshAccounts}
          />
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
        organizations={organizations}
        selectedOrganizationId={selectedOrganizationId}
      />
    </Container>
  );
};

export default Accounting2Page;