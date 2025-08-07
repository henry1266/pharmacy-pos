import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Link,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { BreadcrumbNavigation } from '../components/ui/BreadcrumbNavigation';

import { Organization } from '@pharmacy-pos/shared/types/organization';
import organizationService from '../services/organizationService';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [organizationToDelete, setOrganizationToDelete] = useState<Organization | null>(null);
  
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
      }
    } catch (error) {
      console.error('載入組織資料失敗:', error);
      showSnackbar('載入組織資料失敗', 'error');
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

  return (
    <Container maxWidth="xl" sx={{ py: 0, px: 0 }}>
      {/* 標題區域 */}
      <Paper sx={{
        mb: 3,
        bgcolor: 'background.paper',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <Box sx={{
          p: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 48
        }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            height: '100%'
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              height: 44
            }}>
              <Box sx={{
                '& > div': {
                  marginBottom: 0,
                  display: 'flex',
                  alignItems: 'center'
                }
              }}>
                <BreadcrumbNavigation
                  items={[
                    {
                      label: '會計首頁',
                      path: '/accounting3',
                      icon: <HomeIcon sx={{ fontSize: '1.1rem' }} />
                    },
                    {
                      label: '組織管理',
                      icon: <BusinessIcon sx={{ fontSize: '1.1rem' }} />
                    }
                  ]}
                  fontSize="0.975rem"
                  padding={0}
                />
              </Box>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'secondary.main',
                color: 'secondary.contrastText',
                px: 2,
                py: 0.5,
                ml: 2,
                borderRadius: 2,
                minWidth: 'fit-content',
                height: 36
              }}>
                <Typography variant="caption" sx={{ fontSize: '0.85rem', mr: 0.75 }}>
                  總筆數
                </Typography>
                <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold', lineHeight: 1 }}>
                  {filteredOrganizations.length}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            height: '100%'
          }}>
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
                ),
                sx: { height: 44 }
              }}
              sx={{
                mr: 1,
                '& .MuiInputBase-root': {
                  height: 44
                }
              }}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleAddOrganization}
              sx={{
                height: 44,
                minWidth: 110
              }}
            >
              新增組織
            </Button>
          </Box>
        </Box>
      </Paper>


      {/* 組織列表 */}
      <Box sx={{ p: 2, width: '100%', maxWidth: '100%', overflow: 'hidden', bgcolor: 'background.default' }}>
        <Paper sx={{
          width: '100%',
          overflow: 'hidden',
          bgcolor: 'background.paper',
          borderRadius: 1,
          border: 1,
          borderColor: 'divider',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{
                bgcolor: 'action.hover',
                '& th': {
                  fontWeight: 600
                }
              }}>
                <TableCell>組織代碼</TableCell>
                <TableCell>組織名稱</TableCell>
                <TableCell>描述</TableCell>
                <TableCell>狀態</TableCell>
                <TableCell>建立時間</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    載入中...
                  </TableCell>
                </TableRow>
              ) : filteredOrganizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    {searchTerm ? '沒有找到符合條件的組織' : '尚未建立任何組織'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrganizations.map((organization, index) => (
                  <TableRow
                    key={organization._id}
                    hover
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover'
                      },
                      ...(index % 2 === 1 ? { bgcolor: 'action.hover' } : {})
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {organization.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {organization.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(organization.status)}
                        color={getStatusColor(organization.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(organization.createdAt).toLocaleDateString('zh-TW')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleEditOrganization(organization)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteOrganization(organization)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>

      {/* 右側固定按鈕 */}
      <Box
        sx={{
          position: 'fixed',
          right: 16,
          top: '40%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          zIndex: 1000
        }}
      >
        <Tooltip title="返回會計管理" placement="left" arrow>
          <Fab 
            color="secondary" 
            size="medium" 
            onClick={() => navigate('/accounting3')}
            aria-label="返回會計系統"
          >
            <ArrowBackIcon />
          </Fab>
        </Tooltip>
        
        <Tooltip title="新增組織" placement="left" arrow>
          <Fab
            color="primary"
            size="medium"
            onClick={handleAddOrganization}
            aria-label="新增組織"
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      </Box>

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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default OrganizationPage;