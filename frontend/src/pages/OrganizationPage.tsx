import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  LocalPharmacy as PharmacyIcon,
  AccountBalance as HeadquartersIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import organizationService, { OrganizationListParams } from '../services/organizationService';
import {
  Organization,
  OrganizationType,
  OrganizationStatus
} from '@pharmacy-pos/shared/types/organization';

const OrganizationPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 狀態管理
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  
  // 分頁狀態
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // 篩選狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<OrganizationType | ''>('');
  const [statusFilter, setStatusFilter] = useState<OrganizationStatus | ''>('');
  
  // 對話框狀態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);

  // 機構類型圖示映射
  const getTypeIcon = (type: OrganizationType) => {
    switch (type) {
      case OrganizationType.CLINIC:
        return <BusinessIcon />;
      case OrganizationType.PHARMACY:
        return <PharmacyIcon />;
      case OrganizationType.HEADQUARTERS:
        return <HeadquartersIcon />;
      default:
        return <BusinessIcon />;
    }
  };

  // 機構類型標籤
  const getTypeLabel = (type: OrganizationType) => {
    switch (type) {
      case OrganizationType.CLINIC:
        return '診所';
      case OrganizationType.PHARMACY:
        return '藥局';
      case OrganizationType.HEADQUARTERS:
        return '總部';
      default:
        return type;
    }
  };

  // 狀態標籤顏色
  const getStatusColor = (status: OrganizationStatus): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case OrganizationStatus.ACTIVE:
        return 'success';
      case OrganizationStatus.INACTIVE:
        return 'warning';
      case OrganizationStatus.SUSPENDED:
        return 'error';
      default:
        return 'default';
    }
  };

  // 狀態標籤文字
  const getStatusLabel = (status: OrganizationStatus) => {
    switch (status) {
      case OrganizationStatus.ACTIVE:
        return '營業中';
      case OrganizationStatus.INACTIVE:
        return '暫停營業';
      case OrganizationStatus.SUSPENDED:
        return '停業';
      default:
        return status;
    }
  };

  // 載入機構列表
  const loadOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: OrganizationListParams = {
        page: page + 1,
        limit: rowsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(typeFilter && { type: typeFilter }),
        ...(statusFilter && { status: statusFilter })
      };
      
      const response = await organizationService.getOrganizations(params);
      setOrganizations(response.data);
      setTotalCount(response.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 初始載入和依賴更新
  useEffect(() => {
    loadOrganizations();
  }, [page, rowsPerPage, searchTerm, typeFilter, statusFilter]);

  // 處理搜尋
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0); // 重置到第一頁
  };

  // 處理類型篩選
  const handleTypeFilter = (event: any) => {
    setTypeFilter(event.target.value);
    setPage(0);
  };

  // 處理狀態篩選
  const handleStatusFilter = (event: any) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  // 處理分頁變更
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 處理新增機構
  const handleAddOrganization = () => {
    navigate('/organizations/new');
  };

  // 處理編輯機構
  const handleEditOrganization = (organization: Organization) => {
    navigate(`/organizations/${organization._id}/edit`);
  };

  // 處理檢視機構
  const handleViewOrganization = (organization: Organization) => {
    navigate(`/organizations/${organization._id}`);
  };

  // 處理刪除機構
  const handleDeleteOrganization = (organization: Organization) => {
    setSelectedOrganization(organization);
    setDeleteDialogOpen(true);
  };

  // 確認刪除
  const confirmDelete = async () => {
    if (!selectedOrganization) return;
    
    try {
      await organizationService.deleteOrganization(selectedOrganization._id);
      setDeleteDialogOpen(false);
      setSelectedOrganization(null);
      loadOrganizations(); // 重新載入列表
    } catch (err: any) {
      setError(err.message);
    }
  };

  // 取消刪除
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setSelectedOrganization(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 頁面標題 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          機構管理
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadOrganizations}
            disabled={loading}
          >
            重新整理
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddOrganization}
          >
            新增機構
          </Button>
        </Box>
      </Box>

      {/* 錯誤訊息 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 篩選區域 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="搜尋機構"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="輸入機構名稱或代碼"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>機構類型</InputLabel>
                <Select
                  value={typeFilter}
                  label="機構類型"
                  onChange={handleTypeFilter}
                >
                  <MenuItem value="">全部類型</MenuItem>
                  <MenuItem value={OrganizationType.HEADQUARTERS}>總部</MenuItem>
                  <MenuItem value={OrganizationType.CLINIC}>診所</MenuItem>
                  <MenuItem value={OrganizationType.PHARMACY}>藥局</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>營業狀態</InputLabel>
                <Select
                  value={statusFilter}
                  label="營業狀態"
                  onChange={handleStatusFilter}
                >
                  <MenuItem value="">全部狀態</MenuItem>
                  <MenuItem value={OrganizationStatus.ACTIVE}>營業中</MenuItem>
                  <MenuItem value={OrganizationStatus.INACTIVE}>暫停營業</MenuItem>
                  <MenuItem value={OrganizationStatus.SUSPENDED}>停業</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 機構列表 */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>機構代碼</TableCell>
                <TableCell>機構名稱</TableCell>
                <TableCell>類型</TableCell>
                <TableCell>狀態</TableCell>
                <TableCell>聯絡電話</TableCell>
                <TableCell>地址</TableCell>
                <TableCell>建立日期</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    載入中...
                  </TableCell>
                </TableRow>
              ) : organizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    沒有找到機構資料
                  </TableCell>
                </TableRow>
              ) : (
                organizations.map((organization) => (
                  <TableRow key={organization._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getTypeIcon(organization.type)}
                        <Typography variant="body2" fontWeight="medium">
                          {organization.code}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {organization.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getTypeLabel(organization.type)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(organization.status)}
                        size="small"
                        color={getStatusColor(organization.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {organization.contact.phone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {organization.contact.address}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(organization.createdAt).toLocaleDateString('zh-TW')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="檢視詳情">
                          <IconButton
                            size="small"
                            onClick={() => handleViewOrganization(organization)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="編輯">
                          <IconButton
                            size="small"
                            onClick={() => handleEditOrganization(organization)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="刪除">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteOrganization(organization)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* 分頁 */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="每頁顯示筆數:"
          labelDisplayedRows={({ from, to, count }) => 
            `第 ${from}-${to} 筆，共 ${count} 筆`
          }
        />
      </Paper>

      {/* 刪除確認對話框 */}
      <Dialog open={deleteDialogOpen} onClose={cancelDelete}>
        <DialogTitle>確認刪除機構</DialogTitle>
        <DialogContent>
          <Typography>
            確定要刪除機構「{selectedOrganization?.name}」嗎？
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            此操作會將機構狀態設為停業，但不會永久刪除資料。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>取消</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            確認刪除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrganizationPage;