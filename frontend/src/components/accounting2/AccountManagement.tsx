import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Search as SearchIcon,
  AccountTree as AccountTreeIcon,
  Category as CategoryIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { RootState } from '../../redux/reducers';
import {
  fetchAccounts2,
  createAccount2,
  updateAccount2,
  deleteAccount2,
  searchAccounts2,
  createStandardChart,
  fetchAccountsHierarchy,
  fetchAccountsByType
} from '../../redux/actions';
import organizationService, { Organization } from '../../services/organizationService';

// 型別定義
interface Account {
  _id: string;
  code: string;
  name: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  type: 'cash' | 'bank' | 'credit' | 'investment' | 'other';
  parentId?: string;
  level: number;
  isActive: boolean;
  normalBalance: 'debit' | 'credit';
  balance: number;
  initialBalance: number;
  currency: string;
  description?: string;
  organizationId?: string;
  children?: Account[];
  createdAt: string;
  updatedAt: string;
}

interface AccountFormData {
  code: string;
  name: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  type: 'cash' | 'bank' | 'credit' | 'investment' | 'other';
  parentId?: string;
  initialBalance: number;
  currency: string;
  description?: string;
  organizationId?: string;
}

const AccountManagement: React.FC = () => {
  // Redux 狀態管理
  const dispatch = useDispatch();
  const { accounts, loading, error } = useSelector((state: RootState) => state.account2);
  
  // 本地狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccountType, setSelectedAccountType] = useState<string>('');
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('');
  
  // 機構相關狀態
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  
  // 對話框狀態
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [openStandardDialog, setOpenStandardDialog] = useState(false);
  
  // 表單狀態
  const [formData, setFormData] = useState<AccountFormData>({
    code: '',
    name: '',
    accountType: 'asset',
    type: 'other',
    initialBalance: 0,
    currency: 'TWD',
    description: '',
    organizationId: ''
  });
  
  // 通知狀態
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // 會計科目類型選項
  const accountTypeOptions = [
    { value: 'asset', label: '資產', color: '#4caf50' },
    { value: 'liability', label: '負債', color: '#f44336' },
    { value: 'equity', label: '權益', color: '#2196f3' },
    { value: 'revenue', label: '收入', color: '#ff9800' },
    { value: 'expense', label: '費用', color: '#9c27b0' }
  ];

  const typeOptions = [
    { value: 'cash', label: '現金' },
    { value: 'bank', label: '銀行' },
    { value: 'credit', label: '信用' },
    { value: 'investment', label: '投資' },
    { value: 'other', label: '其他' }
  ];

  // 載入機構列表
  const loadOrganizations = async () => {
    try {
      setOrganizationsLoading(true);
      console.log('🏢 開始載入機構列表...');
      const response = await organizationService.getOrganizations({ limit: 100 });
      console.log('🏢 機構列表載入成功:', response.data);
      setOrganizations(response.data);
    } catch (error) {
      console.error('❌ 載入機構列表失敗:', error);
      showNotification('載入機構列表失敗', 'error');
    } finally {
      setOrganizationsLoading(false);
    }
  };

  // 載入會計科目
  const loadAccounts = () => {
    console.log('📊 載入會計科目，機構ID:', selectedOrganizationId);
    dispatch(fetchAccounts2(selectedOrganizationId) as any);
  };

  // 載入科目樹狀結構
  const loadAccountTree = () => {
    console.log('🌳 載入科目樹狀結構，機構ID:', selectedOrganizationId);
    dispatch(fetchAccountsHierarchy(selectedOrganizationId) as any);
  };

  // 搜尋會計科目
  const searchAccounts = (searchTerm: string, accountType?: string) => {
    if (!searchTerm.trim()) {
      loadAccounts();
      return;
    }

    if (accountType) {
      dispatch(fetchAccountsByType(accountType) as any);
    } else {
      dispatch(searchAccounts2(searchTerm) as any);
    }
  };

  // 建立標準會計科目表
  const handleCreateStandardChart = () => {
    dispatch(createStandardChart() as any);
    setOpenStandardDialog(false);
    showNotification('標準會計科目表建立成功', 'success');
  };

  // 儲存會計科目
  const saveAccount = () => {
    // 建立提交資料，排除 code 欄位讓後端自動生成
    const submitData = {
      name: formData.name,
      type: formData.type,
      accountType: formData.accountType,
      initialBalance: formData.initialBalance,
      currency: formData.currency,
      description: formData.description,
      organizationId: formData.organizationId
    };

    console.log('📤 提交會計科目資料:', submitData);

    if (editingAccount) {
      dispatch(updateAccount2(editingAccount._id, submitData) as any);
    } else {
      dispatch(createAccount2(submitData) as any);
    }
    handleCloseDialog();
    showNotification('會計科目儲存成功', 'success');
  };

  // 刪除會計科目
  const handleDeleteAccount = (accountId: string) => {
    if (!window.confirm('確定要刪除此會計科目嗎？')) {
      return;
    }

    dispatch(deleteAccount2(accountId, selectedOrganizationId) as any);
    showNotification('會計科目刪除成功', 'success');
  };

  // 處理對話框
  const handleOpenDialog = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        code: account.code,
        name: account.name,
        accountType: account.accountType,
        type: account.type,
        parentId: account.parentId,
        initialBalance: account.initialBalance,
        currency: account.currency,
        description: account.description || '',
        organizationId: account.organizationId || ''
      });
    } else {
      setEditingAccount(null);
      setFormData({
        code: '',
        name: '',
        accountType: 'asset',
        type: 'other',
        initialBalance: 0,
        currency: 'TWD',
        description: '',
        organizationId: selectedOrganizationId || ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAccount(null);
  };

  // 顯示通知
  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  // 機構樹狀結構
  interface OrganizationNode {
    id: string;
    name: string;
    type: 'organization' | 'accountType' | 'account';
    accountType?: string;
    account?: Account;
    children: OrganizationNode[];
  }

  // 建立機構階層樹狀結構
  const buildOrganizationTree = (): OrganizationNode[] => {
    const tree: OrganizationNode[] = [];
    
    // 按機構分組
    const accountsByOrg = accounts.reduce((acc, account) => {
      const orgId = account.organizationId || 'personal';
      if (!acc[orgId]) acc[orgId] = [];
      acc[orgId].push(account);
      return acc;
    }, {} as Record<string, Account[]>);

    // 為每個機構建立樹狀結構
    Object.entries(accountsByOrg).forEach(([orgId, orgAccounts]) => {
      const organization = organizations.find(org => org._id === orgId);
      const orgName = organization?.name || '個人帳戶';
      
      // 按會計科目類型分組
      const accountsByType = (orgAccounts as Account[]).reduce((acc, account) => {
        if (!acc[account.accountType]) acc[account.accountType] = [];
        acc[account.accountType].push(account);
        return acc;
      }, {} as Record<string, Account[]>);

      // 建立機構節點
      const orgNode: OrganizationNode = {
        id: orgId,
        name: orgName,
        type: 'organization',
        children: []
      };

      // 為每個會計科目類型建立節點
      accountTypeOptions.forEach(typeOption => {
        const typeAccounts = accountsByType[typeOption.value] || [];
        if (typeAccounts.length > 0) {
          const typeNode: OrganizationNode = {
            id: `${orgId}-${typeOption.value}`,
            name: `${typeOption.label} (${typeAccounts.length})`,
            type: 'accountType',
            accountType: typeOption.value,
            children: typeAccounts.map(account => ({
              id: account._id,
              name: `${account.code} - ${account.name}`,
              type: 'account' as const,
              account,
              children: []
            }))
          };
          orgNode.children.push(typeNode);
        }
      });

      tree.push(orgNode);
    });

    return tree;
  };

  // 樹狀結構項目組件
  const TreeItemComponent: React.FC<{ node: OrganizationNode; level?: number }> = ({ node, level = 0 }) => {
    const [expanded, setExpanded] = useState(level === 0); // 機構層級預設展開
    const hasChildren = node.children && node.children.length > 0;

    const getNodeIcon = () => {
      switch (node.type) {
        case 'organization':
          return <BusinessIcon sx={{ color: '#1976d2' }} />;
        case 'accountType':
          const typeOption = accountTypeOptions.find(opt => opt.value === node.accountType);
          return <CategoryIcon sx={{ color: typeOption?.color || '#666' }} />;
        case 'account':
          return <Box sx={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: '#4caf50' }} />;
        default:
          return null;
      }
    };

    const getNodeContent = () => {
      switch (node.type) {
        case 'organization':
          return (
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              {node.name}
            </Typography>
          );
        case 'accountType':
          const typeOption = accountTypeOptions.find(opt => opt.value === node.accountType);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {node.name}
              </Typography>
              <Chip
                size="small"
                label={typeOption?.label}
                sx={{
                  backgroundColor: typeOption?.color,
                  color: 'white',
                  fontSize: '0.7rem'
                }}
              />
            </Box>
          );
        case 'account':
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <Typography variant="body2">
                {node.name}
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Typography variant="caption" color="text.secondary">
                ${node.account?.balance.toLocaleString() || 0}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="編輯">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (node.account) handleOpenDialog(node.account);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="刪除">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (node.account) handleDeleteAccount(node.account._id);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          );
        default:
          return null;
      }
    };

    return (
      <React.Fragment>
        <ListItem
          sx={{
            pl: level * 2 + 1,
            cursor: hasChildren ? 'pointer' : 'default',
            '&:hover': { backgroundColor: 'action.hover' },
            py: node.type === 'organization' ? 1 : 0.5
          }}
          onClick={() => hasChildren && setExpanded(!expanded)}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            {hasChildren ? (
              expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />
            ) : (
              <Box sx={{ width: 24 }} />
            )}
          </ListItemIcon>
          <ListItemIcon sx={{ minWidth: 32 }}>
            {getNodeIcon()}
          </ListItemIcon>
          <ListItemText
            primary={getNodeContent()}
            sx={{
              '& .MuiListItemText-primary': {
                display: 'flex',
                alignItems: 'center',
                width: '100%'
              }
            }}
          />
        </ListItem>
        {hasChildren && (
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {node.children.map(child => (
                <TreeItemComponent key={child.id} node={child} level={level + 1} />
              ))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  // 初始化載入
  useEffect(() => {
    loadOrganizations();
    loadAccounts();
    loadAccountTree();
  }, []);

  // 機構選擇變更時重新載入資料
  useEffect(() => {
    console.log('🔄 機構選擇變更，selectedOrganizationId:', selectedOrganizationId);
    // 只有在機構列表載入完成後才執行
    if (organizations.length > 0) {
      loadAccounts();
      loadAccountTree();
    }
  }, [selectedOrganizationId, organizations.length]);

  // 搜尋效果
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchAccounts(searchTerm, selectedAccountType);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedAccountType]);

  // 監聽 Redux 錯誤狀態
  useEffect(() => {
    if (error) {
      showNotification(error, 'error');
    }
  }, [error]);


  return (
    <Box sx={{ p: 3 }}>
      {/* 標題與操作按鈕 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
          <AccountTreeIcon sx={{ mr: 1 }} />
          會計科目管理
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setOpenStandardDialog(true)}
          >
            建立標準科目表
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            新增科目
          </Button>
        </Box>
      </Box>

      {/* 機構選擇器 */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BusinessIcon color="primary" />
          <Typography variant="h6">機構選擇</Typography>
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel id="organization-select-label">選擇機構</InputLabel>
            <Select
              labelId="organization-select-label"
              value={selectedOrganizationId}
              label="選擇機構"
              onChange={(e) => {
                const newOrgId = e.target.value;
                console.log('🏢 機構選擇變更:', { from: selectedOrganizationId, to: newOrgId });
                setSelectedOrganizationId(newOrgId);
              }}
              disabled={organizationsLoading}
            >
              <MenuItem value="">
                <em>所有機構</em>
              </MenuItem>
              {organizations.map((org) => (
                <MenuItem key={org._id} value={org._id}>
                  {org.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {organizationsLoading && (
            <CircularProgress size={20} />
          )}
        </Box>
      </Paper>

      {/* 搜尋與篩選 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="搜尋科目代碼或名稱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>科目類型</InputLabel>
              <Select
                value={selectedAccountType}
                label="科目類型"
                onChange={(e) => setSelectedAccountType(e.target.value)}
              >
                <MenuItem value="">全部</MenuItem>
                {accountTypeOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setSelectedAccountType('');
                setSelectedOrganizationId('');
                loadAccounts();
              }}
            >
              清除篩選
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* 科目樹狀結構 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '600px', overflow: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <AccountTreeIcon sx={{ mr: 1 }} />
              科目階層結構
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <CircularProgress />
              </Box>
            ) : (
              <List sx={{ width: '100%' }}>
                {buildOrganizationTree().map(node => (
                  <TreeItemComponent key={node.id} node={node} />
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* 科目列表 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '600px', overflow: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <CategoryIcon sx={{ mr: 1 }} />
              科目列表 ({accounts.length})
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {accounts.map((account) => (
                <Card key={account._id} variant="outlined">
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {account.code} - {account.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <Chip
                            size="small"
                            label={accountTypeOptions.find(opt => opt.value === account.accountType)?.label}
                            sx={{ 
                              backgroundColor: accountTypeOptions.find(opt => opt.value === account.accountType)?.color,
                              color: 'white'
                            }}
                          />
                          <Chip
                            size="small"
                            label={account.normalBalance === 'debit' ? '借方' : '貸方'}
                            variant="outlined"
                          />
                          <Typography variant="caption" color="text.secondary">
                            層級 {account.level}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          餘額: ${account.balance.toLocaleString()} {account.currency}
                        </Typography>
                        {account.description && (
                          <Typography variant="caption" color="text.secondary">
                            {account.description}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ pt: 0 }}>
                    <Tooltip title="編輯">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(account)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="刪除">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteAccount(account._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* 新增/編輯科目對話框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAccount ? '編輯會計科目' : '新增會計科目'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>所屬機構</InputLabel>
                <Select
                  value={formData.organizationId || ''}
                  label="所屬機構"
                  onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                  disabled={organizationsLoading}
                >
                  <MenuItem value="">
                    <em>請選擇機構</em>
                  </MenuItem>
                  {organizations.map((org) => (
                    <MenuItem key={org._id} value={org._id}>
                      {org.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="科目代碼"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                disabled
                helperText="系統將自動生成科目代碼"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="科目名稱"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>會計科目類型</InputLabel>
                <Select
                  value={formData.accountType}
                  label="會計科目類型"
                  onChange={(e) => {
                    const newAccountType = e.target.value as 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
                    console.log('🔄 會計科目類型變更:', { from: formData.accountType, to: newAccountType });
                    setFormData({ ...formData, accountType: newAccountType });
                  }}
                >
                  {accountTypeOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>科目類型</InputLabel>
                <Select
                  value={formData.type}
                  label="科目類型"
                  onChange={(e) => {
                    const newType = e.target.value as 'cash' | 'bank' | 'credit' | 'investment' | 'other';
                    console.log('🔄 科目類型變更:', { from: formData.type, to: newType });
                    setFormData({ ...formData, type: newType });
                  }}
                >
                  {typeOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="初始餘額"
                type="number"
                value={formData.initialBalance}
                onChange={(e) => setFormData({ ...formData, initialBalance: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="幣別"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="描述"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button onClick={saveAccount} variant="contained">
            {editingAccount ? '更新' : '建立'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 建立標準科目表確認對話框 */}
      <Dialog open={openStandardDialog} onClose={() => setOpenStandardDialog(false)}>
        <DialogTitle>建立標準會計科目表</DialogTitle>
        <DialogContent>
          <Typography>
            這將建立台灣會計準則的標準會計科目表，包含資產、負債、權益、收入、費用等基本科目。
          </Typography>
          <Typography sx={{ mt: 2, color: 'warning.main' }}>
            注意：已存在的科目不會被覆蓋。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStandardDialog(false)}>取消</Button>
          <Button onClick={handleCreateStandardChart} variant="contained" disabled={loading}>
            確認建立
          </Button>
        </DialogActions>
      </Dialog>

      {/* 通知 */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AccountManagement;