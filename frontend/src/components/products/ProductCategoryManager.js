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
  CircularProgress,
  Divider
} from '@mui/material';
import { DragDropContext, Draggable } from 'react-beautiful-dnd';
import { StrictModeDroppable } from '../common/StrictModeDroppable';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { getProductCategories, addProductCategory, updateProductCategory, deleteProductCategory } from '../../services/productCategoryService';

/**
 * 產品分類管理組件
 */
const ProductCategoryManager = () => {
  const navigate = useNavigate();
  
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
      const data = await getProductCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
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
        await updateProductCategory(item._id, {
          name: item.name,
          description: item.description,
          order: item.order,
          isActive: item.isActive
        });
      }
      
      showSnackbar('分類順序已更新', 'success');
    } catch (err) {
      console.error('更新分類順序失敗:', err);
      showSnackbar('更新分類順序失敗', 'error');
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
  
  // 處理對話框提交
  const handleDialogSubmit = async () => {
    try {
      if (dialogMode === 'add') {
        // 新增類別
        await addProductCategory({
          name: currentCategory.name,
          description: currentCategory.description,
          order: (categories.length + 1) * 10 // 新類別放在最後
        });
        showSnackbar('分類已新增', 'success');
      } else {
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
    } catch (err) {
      console.error('操作分類失敗:', err);
      showSnackbar(
        err.response?.data?.msg || '操作分類失敗',
        'error'
      );
    }
  };
  
  // 處理刪除類別
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('確定要刪除此分類嗎？')) return;
    
    try {
      await deleteProductCategory(categoryId);
      showSnackbar('分類已刪除', 'success');
      fetchCategories();
    } catch (err) {
      console.error('刪除分類失敗:', err);
      showSnackbar(
        err.response?.data?.msg || '刪除分類失敗',
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
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : categories.length === 0 ? (
          <Typography align="center" sx={{ p: 2 }}>
            尚無分類，請新增分類
          </Typography>
        ) : (
          <Box>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              拖動項目可調整順序。順序將影響產品表單中的顯示順序。
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
                          <ListItem
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            onClick={() => navigate(`/product-categories/${category._id}`)}
                            sx={{ cursor: 'pointer' }}
                            secondaryAction={
                              <Box>
                                <IconButton
                                  edge="end"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/product-categories/${category._id}`);
                                  }}
                                  title="查看分類詳情"
                                >
                                  <VisibilityIcon />
                                </IconButton>
                                <IconButton
                                  edge="end"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditDialog(category);
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  edge="end"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCategory(category._id);
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            }
                            sx={{ 
                              border: '1px solid #eee',
                              borderRadius: 1,
                              mb: 1,
                              bgcolor: 'background.paper'
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
                              secondary={category.description || '無描述'}
                            />
                          </ListItem>
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
