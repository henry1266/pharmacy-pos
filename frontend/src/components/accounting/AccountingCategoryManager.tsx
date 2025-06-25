import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  Button
} from '@mui/material';
import { DragDropContext, Draggable, DropResult } from 'react-beautiful-dnd';
import { StrictModeDroppable } from '../common/StrictModeDroppable';
import AddIcon from '@mui/icons-material/Add';
import { accountingServiceV2 } from '../../services/accountingServiceV2';
import CategoryListItem from './CategoryListItem';
import type { AccountingCategory } from '@pharmacy-pos/shared/types/accounting';

// 對話框模式類型
type DialogMode = 'add' | 'edit';

// 提示訊息狀態介面
interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

// 當前類別表單資料介面
interface CategoryFormData {
  name: string;
  description: string;
}

// API 錯誤回應介面
interface ApiErrorResponse {
  response?: {
    data?: {
      msg?: string;
    };
  };
  message?: string;
}

// 類別更新資料介面
interface CategoryUpdateData {
  name: string;
  description: string;
  order?: number;
}

// 類別新增資料介面
interface CategoryCreateData {
  name: string;
  description: string;
  order: number;
  isExpense: boolean;
}

/**
 * 會計名目類別管理組件
 */
const AccountingCategoryManager: React.FC = () => {
  // 類別狀態
  const [categories, setCategories] = useState<AccountingCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 對話框狀態
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>('add');
  const [currentCategory, setCurrentCategory] = useState<CategoryFormData>({ name: '', description: '' });
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  
  // 提示訊息狀態
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // 獲取類別
  const fetchCategories = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await accountingServiceV2.getAccountingCategories();
      setCategories(data);
      setError(null);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      console.error('獲取會計名目類別失敗:', errorMessage);
      setError('獲取會計名目類別失敗');
    } finally {
      setLoading(false);
    }
  };
  
  // 初始加載
  useEffect(() => {
    fetchCategories();
  }, []);
  
  // 處理拖放結束
  const handleDragEnd = async (result: DropResult): Promise<void> => {
    if (!result.destination) return;
    
    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // 更新本地狀態
    setCategories(items);
    
    // 更新所有項目的順序
    try {
      const updatedItems: AccountingCategory[] = items.map((item, index) => ({
        ...item,
        order: (index + 1) * 10 // 每個項目間隔10，方便將來插入新項目
      }));
      
      setCategories(updatedItems);
      
      // 逐個更新到資料庫
      for (const item of updatedItems) {
        const updateData: CategoryUpdateData = {
          name: item.name,
          description: item.description ?? '',
          order: item.order
        };
        await accountingServiceV2.updateAccountingCategory(item._id, updateData);
      }
      
      showSnackbar('類別順序已更新', 'success');
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      console.error('更新類別順序失敗:', errorMessage);
      showSnackbar('更新類別順序失敗', 'error');
      // 重新獲取類別，恢復原始順序
      fetchCategories();
    }
  };
  
  // 打開新增對話框
  const handleOpenAddDialog = (): void => {
    setDialogMode('add');
    setCurrentCategory({ name: '', description: '' });
    setCurrentCategoryId(null);
    setOpenDialog(true);
  };
  
  // 打開編輯對話框
  const handleOpenEditDialog = (category: AccountingCategory): void => {
    setDialogMode('edit');
    setCurrentCategory({
      name: category.name,
      description: category.description ?? ''
    });
    setCurrentCategoryId(category._id);
    setOpenDialog(true);
  };
  
  // 關閉對話框
  const handleCloseDialog = (): void => {
    setOpenDialog(false);
  };
  
  // 處理對話框輸入變更
  const handleDialogInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setCurrentCategory({
      ...currentCategory,
      [name]: value
    });
  };
  
  // 處理編輯按鈕點擊
  const handleEditButtonClick = (category: AccountingCategory): void => {
    handleOpenEditDialog(category);
  };
  
  // 處理刪除按鈕點擊
  const handleDeleteButtonClick = (categoryId: string): void => {
    handleDeleteCategory(categoryId);
  };
  
  // 處理詳細按鈕點擊
  const handleDetailButtonClick = (e: React.MouseEvent<HTMLButtonElement>, categoryId: string): void => {
    e.stopPropagation();
    window.location.href = `/accounting/categories/${categoryId}`;
  };
  
  // 處理對話框提交
  const handleDialogSubmit = async (): Promise<void> => {
    try {
      if (dialogMode === 'add') {
        // 新增類別
        const createData: CategoryCreateData = {
          name: currentCategory.name,
          description: currentCategory.description,
          order: (categories.length + 1) * 10, // 新類別放在最後
          isExpense: false // 預設為收入類別，可根據需求調整
        };
        await accountingServiceV2.addAccountingCategory(createData);
        showSnackbar('類別已新增', 'success');
      } else if (currentCategoryId) {
        // 編輯類別
        // 使用參數化方式更新資料，避免SQL注入風險 (Sonar Rule S5147)
        const updateData: CategoryUpdateData = {
          name: currentCategory.name,
          description: currentCategory.description
        };
        await accountingServiceV2.updateAccountingCategory(currentCategoryId, updateData);
        showSnackbar('類別已更新', 'success');
      }
      
      // 重新獲取類別
      fetchCategories();
      handleCloseDialog();
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      console.error('操作類別失敗:', errorMessage);
      showSnackbar(errorMessage, 'error');
    }
  };
  
  // 處理刪除類別
  const handleDeleteCategory = async (categoryId: string): Promise<void> => {
    if (!window.confirm('確定要刪除此類別嗎？')) return;
    
    try {
      await accountingServiceV2.deleteAccountingCategory(categoryId);
      showSnackbar('類別已刪除', 'success');
      fetchCategories();
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err);
      console.error('刪除類別失敗:', errorMessage);
      showSnackbar(errorMessage, 'error');
    }
  };
  
  // 顯示提示訊息
  const showSnackbar = (message: string, severity: SnackbarState['severity']): void => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  // 關閉提示訊息
  const handleCloseSnackbar = (): void => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // 錯誤訊息提取工具函式
  const getErrorMessage = (err: unknown): string => {
    if (isApiError(err)) {
      return err.response?.data?.msg ?? err.message ?? '操作失敗';
    }
    if (err instanceof Error) {
      return err.message;
    }
    return '未知錯誤';
  };

  // 型別守衛：檢查是否為 API 錯誤
  const isApiError = (err: unknown): err is ApiErrorResponse => {
    return typeof err === 'object' && err !== null &&
           ('response' in err || 'message' in err);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">會計名目類別管理</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
        >
          新增類別
        </Button>
      </Box>
      
      <Paper sx={{ p: 2 }}>
        {/* 拆解巢狀三元運算子為獨立條件判斷 */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}
        {!loading && error && (
          <Alert severity="error">{error}</Alert>
        )}
        {!loading && !error && categories.length === 0 && (
          <Typography align="center" sx={{ p: 2 }}>
            尚無類別，請新增類別
          </Typography>
        )}
        {!loading && !error && categories.length > 0 && (
          <Box>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              拖動項目可調整順序。順序將影響記帳表單中的顯示順序。
            </Typography>
            <DragDropContext onDragEnd={handleDragEnd}>
              <StrictModeDroppable droppableId="categories">
                {(provided) => (
                  <List
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {categories.map((category, index) => (
                      <Draggable
                        key={category._id}
                        draggableId={category._id}
                        index={index}
                      >
                        {(provided) => (
                          <CategoryListItem
                            category={category}
                            provided={provided}
                            onEdit={handleEditButtonClick}
                            onDelete={handleDeleteButtonClick}
                            onDetail={handleDetailButtonClick}
                          />
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </List>
                )}
              </StrictModeDroppable>
            </DragDropContext>
          </Box>
        )}
      </Paper>
      
      {/* 新增/編輯對話框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {dialogMode === 'add' ? '新增類別' : '編輯類別'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="名稱"
            type="text"
            fullWidth
            value={currentCategory.name}
            onChange={handleDialogInputChange}
            required
          />
          <TextField
            margin="dense"
            name="description"
            label="描述"
            type="text"
            fullWidth
            value={currentCategory.description}
            onChange={handleDialogInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button onClick={handleDialogSubmit} color="primary">
            {dialogMode === 'add' ? '新增' : '更新'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 提示訊息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AccountingCategoryManager;