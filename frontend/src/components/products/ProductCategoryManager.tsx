import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { DragDropContext, Draggable, DropResult } from 'react-beautiful-dnd';
import { StrictModeDroppable } from '../common/StrictModeDroppable';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { getProductCategories, addProductCategory, updateProductCategory, deleteProductCategory } from '../../services/productCategoryService';
import { Category } from '@pharmacy-pos/shared/types/entities';

// 擴展 Category 型別以包含 order 和 isActive 屬性
interface ExtendedCategory extends Category {
  order?: number;
  isActive?: boolean;
}

/**
 * 產品分類管理組件
 */
const ProductCategoryManager: React.FC = () => {
  const navigate = useNavigate();
  
  // 類別狀態
  const [categories, setCategories] = useState<ExtendedCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 對話框狀態
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [currentCategory, setCurrentCategory] = useState<{ name: string; description: string }>({ name: '', description: '' });
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  
  // 提示訊息狀態
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // 獲取類別
  const fetchCategories = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await getProductCategories();
      setCategories(data);
      setError(null);
    } catch (err: any) {
      console.error('獲取產品分類失敗:', err);
      setError('獲取產品分類失敗');
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
      const updatedItems = items.map((item, index) => ({
        ...item,
        order: (index + 1) * 10 // 每個項目間隔10，方便將來插入新項目
      }));
      
      setCategories(updatedItems);
      
      // 逐個更新到資料庫
      for (const item of updatedItems) {
        await updateProductCategory(item._id, {
          name: item.name,
          description: item.description,
          ...(item.order !== undefined && { order: item.order }),
          ...(item.isActive !== undefined && { isActive: item.isActive })
        });
      }
      
      showSnackbar('分類順序已更新', 'success');
    } catch (err: any) {
      console.error('更新分類順序失敗:', err);
      showSnackbar('更新分類順序失敗', 'error');
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
  const handleOpenEditDialog = (category: ExtendedCategory): void => {
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
  
  // 處理對話框提交
  const handleDialogSubmit = async (): Promise<void> => {
    try {
      if (dialogMode === 'add') {
        // 新增類別
        await addProductCategory({
          name: currentCategory.name,
          description: currentCategory.description,
          ...(categories.length > 0 && { order: (categories.length + 1) * 10 }) // 新類別放在最後
        });
        showSnackbar('分類已新增', 'success');
      } else if (currentCategoryId) {
        // 編輯類別
        await updateProductCategory(currentCategoryId, {
          name: currentCategory.name,
          description: currentCategory.description
        });
        showSnackbar('分類已更新', 'success');
      }
      
      // 重新獲取類別
      fetchCategories();
      handleCloseDialog();
    } catch (err: any) {
      console.error('操作分類失敗:', err);
      showSnackbar(
        err.response?.data?.msg ?? '操作分類失敗',
        'error'
      );
    }
  };
  
  // 處理刪除類別
  const handleDeleteCategory = async (categoryId: string): Promise<void> => {
    if (!window.confirm('確定要刪除此分類嗎？')) return;
    
    try {
      await deleteProductCategory(categoryId);
      showSnackbar('分類已刪除', 'success');
      fetchCategories();
    } catch (err: any) {
      console.error('刪除分類失敗:', err);
      showSnackbar(
        err.response?.data?.msg ?? '刪除分類失敗',
        'error'
      );
    }
  };
  
  // 顯示提示訊息
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info'): void => {
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
  
  // 處理分類項目點擊
  const handleCategoryClick = (categoryId: string): void => {
    navigate(`/product-categories/${categoryId}`);
  };
  
  // 處理查看分類詳情按鈕點擊
  const handleViewCategoryClick = (e: React.MouseEvent, categoryId: string): void => {
    e.stopPropagation();
    navigate(`/product-categories/${categoryId}`);
  };
  
  // 處理編輯分類按鈕點擊
  const handleEditButtonClick = (e: React.MouseEvent, category: ExtendedCategory): void => {
    e.stopPropagation();
    handleOpenEditDialog(category);
  };
  
  // 處理刪除分類按鈕點擊
  const handleDeleteButtonClick = (e: React.MouseEvent, categoryId: string): void => {
    e.stopPropagation();
    handleDeleteCategory(categoryId);
  };
  
  // 渲染分類項目的操作按鈕
  const renderCategoryActions = (category: ExtendedCategory): JSX.Element => {
    return (
      <Box>
        <IconButton
          edge="end"
          onClick={(e) => handleViewCategoryClick(e, category._id)}
          title="查看分類詳情"
        >
          <VisibilityIcon />
        </IconButton>
        <IconButton
          edge="end"
          onClick={(e) => handleEditButtonClick(e, category)}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          edge="end"
          onClick={(e) => handleDeleteButtonClick(e, category._id)}
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    );
  };
  
  // 渲染單個分類項目
  const renderCategoryItem = (category: ExtendedCategory, index: number, provided: any): JSX.Element => {
    return (
      <ListItem
        ref={provided.innerRef}
        {...provided.draggableProps}
        onClick={() => handleCategoryClick(category._id)}
        secondaryAction={renderCategoryActions(category)}
        sx={{ 
          border: '1px solid #eee',
          borderRadius: 1,
          mb: 1,
          bgcolor: 'background.paper',
          cursor: 'pointer',
          color: 'text.primary',
          '& .MuiListItemText-primary': {
            color: 'text.primary',
            fontWeight: 500
          },
          '& .MuiListItemText-secondary': {
            color: 'text.secondary'
          }
        }}
      >
        <IconButton
          {...provided.dragHandleProps}
          sx={{ mr: 1 }}
        >
          <DragHandleIcon />
        </IconButton>
        <ListItemText
          primary={category.name}
          secondary={category.description ?? '無描述'}
          primaryTypographyProps={{
            sx: { color: '#000000 !important', fontWeight: 500 }
          }}
          secondaryTypographyProps={{
            sx: { color: 'rgba(0, 0, 0, 0.7) !important' }
          }}
        />
      </ListItem>
    );
  };
  
  // Helper function to map category to Draggable component
  const mapCategoryToDraggable = (category: ExtendedCategory, index: number): JSX.Element => {
    return (
      <Draggable
        key={category._id}
        draggableId={category._id}
        index={index}
      >
        {/* The Draggable's render prop is now nested inside mapCategoryToDraggable, reducing overall depth */}
        {(draggableProvided) => renderCategoryItem(category, index, draggableProvided)}
      </Draggable>
    );
  };
  
  // 渲染可拖放的分類列表
  const renderDraggableCategoryList = (): JSX.Element => {
    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <StrictModeDroppable droppableId="categories">
          {(droppableProvided) => ( // Renamed 'provided' to 'droppableProvided' for clarity
            <List
              {...droppableProvided.droppableProps}
              ref={droppableProvided.innerRef}
            >
              {categories.map(mapCategoryToDraggable)} {/* Use the new helper function */}
              {droppableProvided.placeholder}
            </List>
          )}
        </StrictModeDroppable>
      </DragDropContext>
    );
  };
  
  // 提取嵌套的三元運算符為獨立函數
  const renderCategoryList = (): JSX.Element => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }
    
    if (categories.length === 0) {
      return (
        <Typography align="center" sx={{ p: 2 }}>
          尚無分類，請新增分類
        </Typography>
      );
    }
    
    return (
      <Box>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          拖動項目可調整順序。順序將影響產品表單中的顯示順序。
        </Typography>
        {renderDraggableCategoryList()}
      </Box>
    );
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">產品分類管理</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
        >
          新增分類
        </Button>
      </Box>
      
      <Paper sx={{ p: 2 }}>
        {renderCategoryList()}
      </Paper>
      
      {/* 新增/編輯對話框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {dialogMode === 'add' ? '新增分類' : '編輯分類'}
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

export default ProductCategoryManager;