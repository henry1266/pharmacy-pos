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
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Tooltip,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { IAccountType } from '@pharmacy-pos/shared/types/accounting2';
import accountTypeService, {
  AccountTypeCreateRequest,
  AccountTypeUpdateRequest
} from '../../../../../services/accounting2/accountTypeService';

interface AccountTypeManagementProps {
  organizationId?: string;
}

interface AccountTypeFormData {
  code: string;
  name: string;
  label: string;
  description: string;
  codePrefix: string;
  normalBalance: 'debit' | 'credit';
  isActive: boolean;
  sortOrder: number;
}

const initialFormData: AccountTypeFormData = {
  code: '',
  name: '',
  label: '',
  description: '',
  codePrefix: '',
  normalBalance: 'debit',
  isActive: true,
  sortOrder: 999
};

const AccountTypeManagement: React.FC<AccountTypeManagementProps> = ({ 
  organizationId 
}) => {
  const [accountTypes, setAccountTypes] = useState<IAccountType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<IAccountType | null>(null);
  const [formData, setFormData] = useState<AccountTypeFormData>(initialFormData);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // 載入帳戶類型列表
  const loadAccountTypes = async () => {
    try {
      setLoading(true);
      const response = await accountTypeService.getAccountTypes(organizationId);
      if (response.success) {
        setAccountTypes(response.data);
      } else {
        showSnackbar('載入帳戶類型失敗', 'error');
      }
    } catch (error) {
      console.error('載入帳戶類型失敗:', error);
      showSnackbar('載入帳戶類型失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountTypes();
  }, [organizationId]);

  // 顯示通知
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // 開啟新增對話框
  const handleAdd = () => {
    setEditingType(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  // 開啟編輯對話框
  const handleEdit = (accountType: IAccountType) => {
    if (accountType.isSystem) {
      showSnackbar('系統預設類型無法編輯', 'warning');
      return;
    }
    
    setEditingType(accountType);
    setFormData({
      code: accountType.code,
      name: accountType.name,
      label: accountType.label,
      description: accountType.description || '',
      codePrefix: accountType.codePrefix,
      normalBalance: accountType.normalBalance,
      isActive: accountType.isActive,
      sortOrder: accountType.sortOrder
    });
    setDialogOpen(true);
  };

  // 刪除帳戶類型
  const handleDelete = async (accountType: IAccountType) => {
    if (accountType.isSystem) {
      showSnackbar('系統預設類型無法刪除', 'warning');
      return;
    }

    if (!window.confirm(`確定要刪除帳戶類型「${accountType.name}」嗎？`)) {
      return;
    }

    try {
      const response = await accountTypeService.deleteAccountType(accountType._id);
      if (response.success) {
        showSnackbar('刪除成功', 'success');
        loadAccountTypes();
      } else {
        showSnackbar('刪除失敗', 'error');
      }
    } catch (error) {
      console.error('刪除失敗:', error);
      showSnackbar('刪除失敗', 'error');
    }
  };

  // 儲存帳戶類型
  const handleSave = async () => {
    try {
      if (editingType) {
        // 更新
        const updateData: AccountTypeUpdateRequest = {
          id: editingType._id,
          ...formData,
          organizationId
        };
        const response = await accountTypeService.updateAccountType(updateData);
        if (response.success) {
          showSnackbar('更新成功', 'success');
          setDialogOpen(false);
          loadAccountTypes();
        } else {
          showSnackbar('更新失敗', 'error');
        }
      } else {
        // 新增
        const createData: AccountTypeCreateRequest = {
          ...formData,
          organizationId
        };
        const response = await accountTypeService.createAccountType(createData);
        if (response.success) {
          showSnackbar('新增成功', 'success');
          setDialogOpen(false);
          loadAccountTypes();
        } else {
          showSnackbar('新增失敗', 'error');
        }
      }
    } catch (error) {
      console.error('儲存失敗:', error);
      showSnackbar('儲存失敗', 'error');
    }
  };

  // 拖拽重新排序
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(accountTypes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // 更新本地狀態
    setAccountTypes(items);

    // 準備重新排序資料
    const reorderData = items.map((item, index) => ({
      id: item._id,
      sortOrder: index + 1
    }));

    try {
      const response = await accountTypeService.reorderAccountTypes({ items: reorderData });
      if (response.success) {
        showSnackbar('排序更新成功', 'success');
      } else {
        showSnackbar('排序更新失敗', 'error');
        // 重新載入以恢復原始順序
        loadAccountTypes();
      }
    } catch (error) {
      console.error('排序更新失敗:', error);
      showSnackbar('排序更新失敗', 'error');
      loadAccountTypes();
    }
  };

  // 初始化系統類型
  const handleInitializeSystemTypes = async () => {
    if (!window.confirm('確定要初始化系統預設類型嗎？這將會新增標準的會計科目類型。')) {
      return;
    }

    try {
      const response = await accountTypeService.initializeSystemTypes();
      if (response.success) {
        showSnackbar('系統類型初始化成功', 'success');
        loadAccountTypes();
      } else {
        showSnackbar('系統類型初始化失敗', 'error');
      }
    } catch (error) {
      console.error('系統類型初始化失敗:', error);
      showSnackbar('系統類型初始化失敗', 'error');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 標題與操作按鈕 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          帳戶類型管理
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={handleInitializeSystemTypes}
          >
            初始化系統類型
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadAccountTypes}
          >
            重新整理
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            新增類型
          </Button>
        </Box>
      </Box>

      {/* 帳戶類型表格 */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell width={50}>排序</TableCell>
                  <TableCell>代碼</TableCell>
                  <TableCell>名稱</TableCell>
                  <TableCell>標籤</TableCell>
                  <TableCell>前綴</TableCell>
                  <TableCell>餘額方向</TableCell>
                  <TableCell>類型</TableCell>
                  <TableCell>狀態</TableCell>
                  <TableCell width={120}>操作</TableCell>
                </TableRow>
              </TableHead>
              <Droppable droppableId="accountTypes">
                {(provided) => (
                  <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                    {accountTypes.map((accountType, index) => (
                      <Draggable
                        key={accountType._id}
                        draggableId={accountType._id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <TableRow
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            sx={{
                              backgroundColor: snapshot.isDragging ? 'action.hover' : 'inherit'
                            }}
                          >
                            <TableCell {...provided.dragHandleProps}>
                              <DragIcon color="action" />
                            </TableCell>
                            <TableCell>{accountType.code}</TableCell>
                            <TableCell>{accountType.name}</TableCell>
                            <TableCell>{accountType.label}</TableCell>
                            <TableCell>{accountType.codePrefix}</TableCell>
                            <TableCell>
                              <Chip
                                label={accountType.normalBalance === 'debit' ? '借方' : '貸方'}
                                color={accountType.normalBalance === 'debit' ? 'primary' : 'secondary'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={accountType.isSystem ? '系統' : '自訂'}
                                color={accountType.isSystem ? 'default' : 'info'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={accountType.isActive ? '啟用' : '停用'}
                                color={accountType.isActive ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Tooltip title="編輯">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(accountType)}
                                  disabled={accountType.isSystem}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="刪除">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(accountType)}
                                  disabled={accountType.isSystem}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </TableBody>
                )}
              </Droppable>
            </Table>
          </DragDropContext>
        </TableContainer>
      </Paper>

      {/* 新增/編輯對話框 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingType ? '編輯帳戶類型' : '新增帳戶類型'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="類型代碼"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="科目代號前綴"
                value={formData.codePrefix}
                onChange={(e) => setFormData({ ...formData, codePrefix: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="類型名稱"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="顯示標籤"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>正常餘額方向</InputLabel>
                <Select
                  value={formData.normalBalance}
                  onChange={(e) => setFormData({ ...formData, normalBalance: e.target.value as 'debit' | 'credit' })}
                  label="正常餘額方向"
                >
                  <MenuItem value="debit">借方</MenuItem>
                  <MenuItem value="credit">貸方</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="排序順序"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 999 })}
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
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="啟用"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>取消</Button>
          <Button onClick={handleSave} variant="contained">
            {editingType ? '更新' : '新增'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 通知 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AccountTypeManagement;