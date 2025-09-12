import React, { useState, useEffect } from 'react';
import { keyframes } from '@emotion/react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  List,
  ListItem,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import CommonListPageLayout from '@/components/common/CommonListPageLayout';
import TitleWithCount from '@/components/common/TitleWithCount';
import { Organization } from '@pharmacy-pos/shared/types/organization';
import organizationService from '../services/organizationService';

// 定義箭頭動畫
const arrowBounce = keyframes`
  0%, 100% {
    transform: translateX(-5px);
  }
  50% {
    transform: translateX(-15px);
  }
`;

// 定義圖標縮放動畫
const iconPulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
`;

/**
 * 組織管理頁面
 *
 * 功能：
 * - 顯示組織列表
 * - 搜尋和過濾組織
 * - 新增、編輯、刪除組織
 * - 組織狀態管理
 */
const OrganizationPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 狀態管理
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [organizationToDelete, setOrganizationToDelete] = useState<Organization | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState<boolean>(false);
  
  // 通知狀態
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // 載入組織資料
  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const response = await organizationService.getOrganizations();
      if (response.success) {
        setOrganizations(response.data);
      } else {
        showSnackbar('載入組織資料失敗', 'error');
        setError(true);
      }
    } catch (error) {
      console.error('載入組織資料失敗:', error);
      showSnackbar('載入組織資料失敗', 'error');
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // 初始載入
  useEffect(() => {
    loadOrganizations();
  }, []);

  // 顯示通知
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // 關閉通知
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // 過濾組織
  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 處理新增組織
  const handleAddOrganization = () => {
    navigate('/accounting3/organizations/new');
  };

  // 處理編輯組織
  const handleEditOrganization = (organization: Organization) => {
    navigate(`/accounting3/organizations/${organization._id}/edit`);
  };

  // 選擇組織函數 - 用於點擊表格行時
  const selectOrganization = (organization: Organization) => {
    setSelectedOrganization(organization);
    setShowDetailPanel(true);
  };

  // 處理刪除組織 - 開啟確認對話框
  const handleDeleteOrganization = (organization: Organization) => {
    setOrganizationToDelete(organization);
    setDeleteDialogOpen(true);
  };

  // 確認刪除組織
  const confirmDeleteOrganization = async () => {
    if (!organizationToDelete) return;

    try {
      const response = await organizationService.deleteOrganization(organizationToDelete._id);
      if (response.success) {
        showSnackbar('組織已成功刪除', 'success');
        loadOrganizations(); // 重新載入列表
      } else {
        showSnackbar(response.message || '刪除組織失敗', 'error');
      }
    } catch (error) {
      console.error('刪除組織失敗:', error);
      showSnackbar('刪除組織失敗', 'error');
    } finally {
      setDeleteDialogOpen(false);
      setOrganizationToDelete(null);
    }
  };

  // 取消刪除
  const cancelDeleteOrganization = () => {
    setDeleteDialogOpen(false);
    setOrganizationToDelete(null);
  };

  // 獲取狀態顏色
  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  // 獲取狀態文字
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'active':
        return '啟用';
      case 'inactive':
        return '停用';
      case 'suspended':
        return '暫停';
      default:
        return status;
    }
  };

  // 定義表格列
  const columns = [
    { field: 'code', headerName: '組織代碼', flex: 1.5 },
    { field: 'name', headerName: '組織名稱', flex: 1.5 },
    { field: 'description', headerName: '描述', flex: 1.5 },
    {
      field: 'status',
      headerName: '狀態',
      flex: 1,
      renderCell: (params: any) => (
        <Chip
          label={getStatusText(params.value)}
          color={getStatusColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'createdAt',
      headerName: '建立時間',
      flex: 1.3,
      valueFormatter: (params: any) => {
        if (!params.value) return '';
        try {
          const date = new Date(params.value);
          return date.toLocaleDateString('zh-TW');
        } catch (error) {
          console.error('日期格式化錯誤:', error);
          return params.value;
        }
      }
    },
    {
      field: 'actions',
      headerName: '操作',
      flex: 1.5,
      renderCell: (params: any) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => handleEditOrganization(params.row)}
            color="primary"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteOrganization(params.row)}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  // 為DataGrid準備行數據
  const rows = filteredOrganizations.map(org => ({
    id: org._id,
    _id: org._id,
    code: org.code,
    name: org.name,
    description: '-',
    status: org.status,
    createdAt: org.createdAt
  }));

  // 操作按鈕區域
  const actionButtons = (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <TextField
        size="small"
        label="搜尋"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="組織名稱、代碼..."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          )
        }}
        sx={{ minWidth: '250px' }}
      />
      <Button
        variant="contained"
        size="small"
        startIcon={<AddIcon />}
        onClick={handleAddOrganization}
      >
        新增組織
      </Button>
    </Box>
  );

  // 詳情面板
  const detailPanel = showDetailPanel ? (
    <Card elevation={2} sx={{ borderRadius: '0.5rem', height: '100%' }}>
      <CardContent sx={{ py: 1 }}>
        <Typography component="div" sx={{ fontWeight: 600 }}>組織 {selectedOrganization?.code}</Typography>
        <List dense sx={{ py: 0 }}>
          <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>組織名稱:</Typography>
            <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>{selectedOrganization?.name}</Typography>
          </ListItem>
          <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>狀態:</Typography>
            <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>
              <Chip
                label={getStatusText(selectedOrganization?.status || '')}
                color={getStatusColor(selectedOrganization?.status || '')}
                size="small"
              />
            </Typography>
          </ListItem>
          <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>建立時間:</Typography>
            <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>
              {selectedOrganization?.createdAt ? new Date(selectedOrganization.createdAt).toLocaleDateString('zh-TW') : ''}
            </Typography>
          </ListItem>
        </List>
        <Divider sx={{ my: 1.5 }} />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <Button
            onClick={() => handleEditOrganization(selectedOrganization as Organization)}
            variant="contained"
            color="primary"
            size="small"
            sx={{ textTransform: 'none' }}
            startIcon={<EditIcon />}
          >
            編輯組織
          </Button>
        </Box>
      </CardContent>
    </Card>
  ) : (
    <Card
      elevation={2}
      className="organization-card"
      sx={{
        borderRadius: '0.5rem',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 6
        },
        '&:hover .arrow-icon': {
          animation: `${arrowBounce} 0.8s infinite`,
          color: 'primary.dark'
        }
      }}
    >
      <CardContent sx={{ textAlign: 'center', py: 3, width: '100%' }}>
        {/* 大型組織圖標 */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <BusinessIcon
            color="primary"
            sx={{
              fontSize: '4rem',
              mb: 1,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.1)',
                color: 'primary.dark'
              }
            }}
          />
        </Box>
        
        {/* 內容區域 */}
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'center' }}>
            <ArrowBackIcon
              color="primary"
              className="arrow-icon"
              sx={{
                fontSize: '2rem',
                mr: 1,
                transform: 'translateX(-10px)',
                animation: 'arrowPulse 1.5s infinite',
                transition: 'color 0.3s ease'
              }}
            />
            <Typography variant="body1" color="primary.main" sx={{ fontWeight: 500 }}>
              左側列表
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            選擇一個組織查看詳情
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ width: '95%', mx: 'auto' }}>
      <CommonListPageLayout
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TitleWithCount title="組織管理" count={filteredOrganizations.length} />
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              px: 2,
              py: 0.5,
              borderRadius: 2,
              minWidth: 'fit-content'
            }}>
              <Typography variant="caption" sx={{ fontSize: '0.8rem', mr: 1 }}>
                總筆數
              </Typography>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                {filteredOrganizations.length}
              </Typography>
            </Box>
          </Box>
        }
        actionButtons={actionButtons}
        columns={columns}
        rows={rows}
        loading={loading}
        {...(error && { error: '載入組織資料失敗' })}
        onRowClick={(params) => selectOrganization(params.row)}
        detailPanel={detailPanel}
        tableGridWidth={9}
        detailGridWidth={3}
        dataTableProps={{
          rowsPerPageOptions: [25, 50, 100],
          disablePagination: false,
          pageSize: 25,
          initialState: {
            pagination: { pageSize: 25 },
            sorting: {
              sortModel: [{ field: 'code', sort: 'asc' }],
            },
          },
          getRowId: (row: any) => row.id,
          sx: {}
        }}
      />

      {/* 刪除確認對話框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDeleteOrganization}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>確認刪除組織</DialogTitle>
        <DialogContent>
          <Typography>
            確定要刪除組織「{organizationToDelete?.name}」嗎？
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            此操作無法復原，請謹慎操作。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteOrganization}>
            取消
          </Button>
          <Button
            onClick={confirmDeleteOrganization}
            color="error"
            variant="contained"
          >
            確認刪除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 通知 Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OrganizationPage;