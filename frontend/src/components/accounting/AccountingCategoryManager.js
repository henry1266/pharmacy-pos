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
import { DragDropContext, Draggable } from 'react-beautiful-dnd';
import { StrictModeDroppable } from '../common/StrictModeDroppable';
import AddIcon from '@mui/icons-material/Add';
import { getAccountingCategories, addAccountingCategory, updateAccountingCategory, deleteAccountingCategory } from '../../services/accountingCategoryService';
import CategoryListItem from './CategoryListItem';

/**
 * 會計名目類別管理組件
 */
const AccountingCategoryManager = () => {
  // 類別狀態
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 對話框狀態
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' 或 'edit'
  const [currentCategory, setCurrentCategory] = useState({ name: '', description: '' });
  const [currentCategoryId, setCurrentCategoryId] = useState(null);
  
  // 提示訊息狀態
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // 獲取類別
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getAccountingCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      console.error('獲取會計名目類別失敗:', err);
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
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // 更新本地狀態
    setCategories(items);
    
    // 更新所有項目的順序
    try {
      const updatedItems = items.map((item, index) => ({
        ...item,
        order: (index + 1) * 10 // 每個項目間隔10，方便將來插入新項目
      }));
      
      setCategories(updatedItems);
      
      // 逐個更新到資料庫
      for (const item of updatedItems) {
        await updateAccountingCategory(item._id, {
          name: item.name,
          description: item.description,
          order: item.order,
          isActive: item.isActive
        });
      }
      
      showSnackbar('類別順序已更新', 'success');
    } catch (err) {
      console.error('更新類別順序失敗:', err);
      showSnackbar('更新類別順序失敗', 'error');
      // 重新獲取類別，恢復原始順序
      fetchCategories();
    }
  };
  
  // 打開新增對話框
  const handleOpenAddDialog = () => {
    setDialogMode('add');
    setCurrentCategory({ name: '', description: '' });
    setCurrentCategoryId(null);
    setOpenDialog(true);
  };
  
  // 打開編輯對話框
  const handleOpenEditDialog = (category) => {
    setDialogMode('edit');
    setCurrentCategory({
      name: category.name,
      description: category.description || ''
    });
    setCurrentCategoryId(category._id);
    setOpenDialog(true);
  };
  
  // 關閉對話框
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // 處理對話框輸入變更
  const handleDialogInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCategory({
      ...currentCategory,
      [name]: value
    });
  };
  
  // 處理編輯按鈕點擊
  const handleEditButtonClick = (category) => {
    handleOpenEditDialog(category);
  };
  
  // 處理刪除按鈕點擊
  const handleDeleteButtonClick = (categoryId) => {
    handleDeleteCategory(categoryId);
  };
  
  // 處理詳細按鈕點擊
  const handleDetailButtonClick = (e, categoryId) => {
    e.stopPropagation();
    window.location.href = `/accounting/categories/${categoryId}`;
  };
  
  // 處理對話框提交
  const handleDialogSubmit = async () => {
    try {
      if (dialogMode === 'add') {
        // 新增類別
        await addAccountingCategory({
          name: currentCategory.name,
          description: currentCategory.description,
          order: (categories.length + 1) * 10 // 新類別放在最後
        });
        showSnackbar('類別已新增', 'success');
      } else {
        // 編輯類別
        await updateAccountingCategory(currentCategoryId, {
          name: currentCategory.name,
          description: currentCategory.description
        });
        showSnackbar('類別已更新', 'success');
      }
      
      // 重新獲取類別
      fetchCategories();
      handleCloseDialog();
    } catch (err) {
      console.error('操作類別失敗:', err);
      showSnackbar(
        err.response?.data?.msg || '操作類別失敗',
        'error'
      );
    }
  };
  
  // 處理刪除類別
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('確定要刪除此類別嗎？')) return;
    
    try {
      await deleteAccountingCategory(categoryId);
      showSnackbar('類別已刪除', 'success');
      fetchCategories();
    } catch (err) {
      console.error('刪除類別失敗:', err);
      showSnackbar(
        err.response?.data?.msg || '刪除類別失敗',
        'error'
      );
    }
  };
  
  // 顯示提示訊息
  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  // 關閉提示訊息
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
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
