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
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip
} from '@mui/material';
import {
  AccountBalance as AccountIcon,
  Category as CategoryIcon,
  Receipt as RecordIcon,
  Business as BusinessIcon,
  ViewList as TreeViewIcon,
  TableChart as DataGridIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { Account2FormData, Category2, Account2, AccountingRecord2 } from '@pharmacy-pos/shared/types/accounting2';
import { Organization } from '@pharmacy-pos/shared/types/organization';
import AccountList from '../components/accounting2/AccountList';
import AccountForm from '../components/accounting2/AccountForm';
import CategoryList from '../components/accounting2/CategoryList';
import CategoryForm from '../components/accounting2/CategoryForm';
import RecordList from '../components/accounting2/RecordList';
import RecordForm from '../components/accounting2/RecordForm';
import AccountingTreeView from '../components/accounting2/AccountingTreeView';
import AccountingDataGrid from '../components/accounting2/AccountingDataGrid';
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
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [recordFormOpen, setRecordFormOpen] = useState(false);
  const [categoryType, setCategoryType] = useState<'income' | 'expense'>('income');
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [categories, setCategories] = useState<Category2[]>([]);
  const [accounts, setAccounts] = useState<Account2[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [refreshAccounts, setRefreshAccounts] = useState(0);
  const [refreshCategories, setRefreshCategories] = useState(0);
  const [refreshRecords, setRefreshRecords] = useState(0);
  
  // 快速記帳的預設值
  const [quickRecordDefaults, setQuickRecordDefaults] = useState<{
    type?: 'income' | 'expense';
    categoryId?: string;
    organizationId?: string | null;
  }>({});

  // 視圖模式切換
  const [viewMode, setViewMode] = useState<'tree' | 'datagrid'>('datagrid');

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

  // 載入類別列表
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await accounting2Service.categories.getAll({
          organizationId: selectedOrganizationId
        });
        if (response.success) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('載入類別列表失敗:', error);
      }
    };

    loadCategories();
  }, [selectedOrganizationId, refreshCategories]);

  // 載入帳戶列表
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const response = await accounting2Service.accounts.getAll(selectedOrganizationId);
        if (response.success) {
          setAccounts(response.data);
        }
      } catch (error) {
        console.error('載入帳戶列表失敗:', error);
      }
    };

    loadAccounts();
  }, [selectedOrganizationId, refreshAccounts]);

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

  // 處理類別表單
  const handleCategoryFormOpen = (type: 'income' | 'expense', parentId?: string, organizationId?: string | null) => {
    console.log('handleCategoryFormOpen 被調用:', { type, parentId, organizationId, selectedOrganizationId });
    setCategoryType(type);
    setParentCategoryId(parentId || null);
    
    // 如果有傳入機構ID，更新當前選擇的機構ID
    if (organizationId && organizationId !== selectedOrganizationId) {
      console.log('更新機構ID:', selectedOrganizationId, '->', organizationId);
      setSelectedOrganizationId(organizationId);
    }
    
    setCategoryFormOpen(true);
    setTabValue(1); // 切換到類別頁籤
  };

  const handleCategoryFormClose = () => {
    setCategoryFormOpen(false);
    setParentCategoryId(null);
  };

  const handleCategoryFormSubmit = async (data: Partial<Category2>) => {
    try {
      console.log('提交類別資料:', data);
      
      const response = await accounting2Service.categories.create(data as any);
      
      if (response.success) {
        console.log('類別建立成功:', response.data);
        setCategoryFormOpen(false);
        
        // 觸發重新載入
        setRefreshCategories(prev => prev + 1);
      } else {
        console.error('建立類別失敗');
      }
      
    } catch (error) {
      console.error('建立類別失敗:', error);
    }
  };

  // 處理記錄表單
  const handleRecordFormOpen = () => {
    setTabValue(2); // 切換到記錄頁籤
  };

  // 處理快速記帳
  const handleQuickRecord = (type: 'income' | 'expense', categoryId: string, organizationId?: string | null) => {
    console.log('handleQuickRecord 被調用:', { type, categoryId, organizationId });
    
    setQuickRecordDefaults({
      type,
      categoryId,
      organizationId: organizationId || selectedOrganizationId
    });
    
    setRecordFormOpen(true);
    setTabValue(2); // 切換到記錄頁籤
  };

  const handleRecordFormClose = () => {
    setRecordFormOpen(false);
    setQuickRecordDefaults({});
  };

  const handleRecordFormSubmit = async (data: Partial<AccountingRecord2>) => {
    try {
      console.log('提交記錄資料:', data);
      
      const response = await accounting2Service.records.create(data as any);
      
      if (response.success) {
        console.log('記錄建立成功:', response.data);
        setRecordFormOpen(false);
        setQuickRecordDefaults({});
        
        // 觸發重新載入
        setRefreshRecords(prev => prev + 1);
        setRefreshAccounts(prev => prev + 1); // 更新帳戶餘額
      } else {
        console.error('建立記錄失敗');
      }
      
    } catch (error) {
      console.error('建立記錄失敗:', error);
    }
  };

  const handleOrganizationChange = (event: any) => {
    const value = event.target.value;
    setSelectedOrganizationId(value || null);
  };

  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newViewMode: 'tree' | 'datagrid'
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
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
        
        {/* 機構選擇器和視圖切換 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>選擇機構</InputLabel>
            <Select
              value={selectedOrganizationId || ''}
              onChange={handleOrganizationChange}
              label="選擇機構"
              startAdornment={<BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />}
            >
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
          
          {/* 視圖模式切換 */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            aria-label="視圖模式"
            size="small"
          >
            <ToggleButton value="datagrid" aria-label="表格視圖">
              <Tooltip title="專業表格視圖 (TanStack Table)">
                <DataGridIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="tree" aria-label="樹狀視圖">
              <Tooltip title="原始樹狀視圖">
                <TreeViewIcon />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* 主要內容區域 */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
        gap: 3,
        gridTemplateRows: { xs: 'auto auto', lg: '1fr' }
      }}>
        {/* 左側：財務總覽 - 動態視圖 */}
        <Paper sx={{ p: 0, overflow: 'hidden' }}>
          {viewMode === 'datagrid' ? (
            <AccountingDataGrid
              selectedOrganizationId={selectedOrganizationId}
              organizations={organizations}
              onAddAccount={handleAccountFormOpen}
              onAddCategory={handleCategoryFormOpen}
              onAddRecord={handleRecordFormOpen}
              onQuickRecord={handleQuickRecord}
            />
          ) : (
            <>
              <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                <Typography variant="h6" component="h2">
                  財務總覽
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  GUNCASH 風格的帳務結構檢視
                </Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                <AccountingTreeView
                  selectedOrganizationId={selectedOrganizationId}
                  organizations={organizations}
                  onAddAccount={handleAccountFormOpen}
                  onAddCategory={handleCategoryFormOpen}
                  onAddRecord={handleRecordFormOpen}
                  onQuickRecord={handleQuickRecord}
                />
              </Box>
            </>
          )}
        </Paper>

        {/* 右側：管理功能頁籤 */}
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="accounting2 management tabs"
              variant="fullWidth"
              orientation="horizontal"
            >
              <Tab
                icon={<AccountIcon />}
                label="帳戶"
                {...a11yProps(0)}
              />
              <Tab
                icon={<CategoryIcon />}
                label="類別"
                {...a11yProps(1)}
              />
              <Tab
                icon={<RecordIcon />}
                label="記錄"
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
            <CategoryList
              selectedOrganizationId={selectedOrganizationId}
            />
          </TabPanel>

          {/* 記帳記錄頁籤 */}
          <TabPanel value={tabValue} index={2}>
            <RecordList
              selectedOrganizationId={selectedOrganizationId}
              refreshTrigger={refreshRecords}
            />
          </TabPanel>
        </Paper>
      </Box>

      {/* 帳戶表單對話框 */}
      <AccountForm
        open={accountFormOpen}
        onClose={handleAccountFormClose}
        onSubmit={handleAccountFormSubmit}
        organizations={organizations}
        selectedOrganizationId={selectedOrganizationId}
      />

      {/* 類別表單對話框 */}
      <CategoryForm
        open={categoryFormOpen}
        onClose={handleCategoryFormClose}
        onSubmit={handleCategoryFormSubmit}
        category={null}
        organizations={organizations}
        selectedOrganizationId={selectedOrganizationId}
        categories={categories}
        defaultType={categoryType}
        defaultParentId={parentCategoryId}
      />

      {/* 記錄表單對話框 */}
      <RecordForm
        open={recordFormOpen}
        onClose={handleRecordFormClose}
        onSubmit={handleRecordFormSubmit}
        organizations={organizations}
        selectedOrganizationId={selectedOrganizationId}
        accounts={accounts}
        categories={categories}
        defaultType={quickRecordDefaults.type}
        defaultCategoryId={quickRecordDefaults.categoryId}
        defaultOrganizationId={quickRecordDefaults.organizationId}
      />
    </Container>
  );
};

export default Accounting2Page;