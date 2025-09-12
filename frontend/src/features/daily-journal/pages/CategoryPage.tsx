import React, { useState, useEffect } from 'react';
import { keyframes } from '@emotion/react';
import {
  Paper,
  Box,
  Typography,
  List,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  InputAdornment,
  ListItem,
  ListItemText
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import HomeIcon from '@mui/icons-material/Home';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import LaunchIcon from '@mui/icons-material/Launch';
import { useNavigate } from 'react-router-dom';
import PageHeaderSection from '../../../components/common/PageHeaderSection';
import { DragDropContext, Draggable, DropResult } from 'react-beautiful-dnd';
import { StrictModeDroppable } from '../../../components/common/StrictModeDroppable';
import { accountingServiceV2 } from '../../../services/accountingServiceV2';
import CategoryListItem from '../components/CategoryListItem';
import type { AccountingCategory } from '@pharmacy-pos/shared/types/accounting';

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

// 擴展 AccountingCategory 型別以包含 order 和 isActive 屬性
interface ExtendedCategory extends AccountingCategory {
  order?: number;
  isActive?: boolean;
}

/**
 * 會計名目類別管理頁面
 */
const CategoryPage: React.FC = () => {
  const navigate = useNavigate();
  
  // 類別狀態
  const [categories, setCategories] = useState<ExtendedCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ExtendedCategory | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState<boolean>(false);
  
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
  
  // 返回上一頁
  const handleBack = (): void => {
    navigate('/journals');
  };
  
  // 處理搜尋
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // 處理類別點擊
  const handleCategoryClick = (categoryId: string) => {
    const category = categories.find(cat => cat._id === categoryId) || null;
    setSelectedCategory(category);
    setShowDetailPanel(true);
  };
  
  // 處理跳轉到詳情頁面
  const handleNavigateToDetail = (categoryId: string) => {
    navigate(`/journals/categories/${categoryId}`);
  };
  
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
  
  // 過濾分類
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // 處理拖放結束
  const handleDragEnd = async (result: DropResult): Promise<void> => {
    if (!result.destination) return;
    
    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    if (reorderedItem) {
      items.splice(result.destination.index, 0, reorderedItem);
    }
    
    // 更新本地狀態
    setCategories(items);
    
    // 更新所有項目的順序
    try {
      const updatedItems: ExtendedCategory[] = items.map((item, index) => ({
        ...item,
        order: (index + 1) * 10 // 每個項目間隔10，方便將來插入新項目
      }));
      
      setCategories(updatedItems);
      
      // 逐個更新到資料庫
      for (const item of updatedItems) {
        const updateData: CategoryUpdateData = {
          name: item.name,
          description: item.description ?? '',
          order: item.order ?? 0
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
  
  // 渲染分類項目
  const renderCategoryItem = (category: ExtendedCategory, _index: number, provided: any): JSX.Element => {
    return (
      <ListItem
        ref={provided.innerRef}
        {...provided.draggableProps}
        onClick={() => handleCategoryClick(category._id)}
        sx={{
          borderRadius: 1,
          mb: 1,
          bgcolor: 'transparent',
          cursor: 'pointer',
          color: 'text.primary',
          border: '1px solid rgba(5, 5, 5, 0.2)',
          '&:hover': {
            borderColor: 'rgba(0, 0, 0, 0.8)'
          },
          '& .MuiListItemText-primary': {
            color: 'text.primary',
            fontWeight: 500
          },
          '& .MuiListItemText-secondary': {
            color: 'text.secondary'
          }
        }}
        secondaryAction={
        <Box sx={{ display: 'flex', gap: 2 }}>
          <IconButton
            edge="end"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigateToDetail(category._id);
            }}
            color="primary"
            size="medium"
            title="前往詳情頁面"
            sx={{
              padding: '12px',
              backgroundColor: 'transparent',
              borderColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.hover',
                opacity: 0.7
              }
            }}
          >
            <LaunchIcon fontSize="medium" />
          </IconButton>
          <IconButton
            edge="end"
            onClick={(e) => {
              e.stopPropagation();
              handleEditButtonClick(category);
            }}
            size="medium"
            color="info"
            sx={{
              padding: '12px',
              backgroundColor: 'transparent',
              borderColor: 'info.main',
              '&:hover': {
                backgroundColor: 'info.hover',
                opacity: 0.7
              }
            }}
          >
            <EditIcon fontSize="medium" />
          </IconButton>
          <IconButton
            edge="end"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteButtonClick(category._id);
            }}
            size="medium"
            color="error"
            sx={{
              padding: '12px',
              backgroundColor: 'transparent',
              borderColor: 'error.main',
              '&:hover': {
                backgroundColor: 'error.hover',
                opacity: 0.7
              }
            }}
          >
            <DeleteIcon fontSize="medium" />
          </IconButton>
        </Box>
      }
      >
        <IconButton
          {...provided.dragHandleProps}
          sx={{
            mr: 1.5,
            padding: '12px',
            backgroundColor: 'transparent',
            borderColor: 'action.active',
            '&:hover': {
              backgroundColor: 'action.hover',
              opacity: 0.7
            }
          }}
          size="medium"
        >
          <DragHandleIcon fontSize="medium" />
        </IconButton>
        <ListItemText
          primary={category.name}
          secondary={category.description ?? '無描述'}
          primaryTypographyProps={{
            sx: { fontWeight: 500 }
          }}
        />
      </ListItem>
    );
  };
  
  // 將分類映射到Draggable組件
  const mapCategoryToDraggable = (category: ExtendedCategory, index: number): JSX.Element => {
    return (
      <Draggable
        key={category._id}
        draggableId={category._id}
        index={index}
      >
        {(draggableProvided) => renderCategoryItem(category, index, draggableProvided)}
      </Draggable>
    );
  };
  
  // 渲染可拖放的分類列表
  const renderDraggableCategoryList = (): JSX.Element => {
    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        <StrictModeDroppable droppableId="categories">
          {(droppableProvided) => (
            <List
              {...droppableProvided.droppableProps}
              ref={droppableProvided.innerRef}
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 1,
                '& > div:nth-of-type(odd)': {
                  bgcolor: 'rgba(150, 150, 150, 0.04)'
                },
                border: 'none',
                boxShadow: 'none'
              }}
            >
              {filteredCategories.map(mapCategoryToDraggable)}
              {droppableProvided.placeholder}
            </List>
          )}
        </StrictModeDroppable>
      </DragDropContext>
    );
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
  
  // 處理編輯按鈕點擊
  const handleEditButtonClick = (category: ExtendedCategory): void => {
    handleOpenEditDialog(category);
  };
  
  // 處理刪除按鈕點擊
  const handleDeleteButtonClick = (categoryId: string): void => {
    handleDeleteCategory(categoryId);
  };
  
  // 處理詳細按鈕點擊
  const handleDetailButtonClick = (e: React.MouseEvent<HTMLButtonElement>, categoryId: string): void => {
    e.stopPropagation();
    window.location.href = `/journals/categories/${categoryId}`;
  };
  
  // 操作按鈕區域
  const actionButtons = (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <TextField
        size="small"
        label="搜尋"
        value={searchTerm}
        onChange={handleSearch}
        placeholder="分類名稱..."
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
        onClick={handleOpenAddDialog}
      >
        新增類別
      </Button>
    </Box>
  );
  
  // 詳情面板
  const detailPanel = showDetailPanel && selectedCategory ? (
    <Card elevation={2} sx={{ borderRadius: '0.5rem', height: '100%' }}>
      <CardContent sx={{ py: 1 }}>
        <Typography component="div" sx={{ fontWeight: 600 }}>分類詳情</Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>分類名稱:</Typography>
          <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>{selectedCategory.name}</Typography>
          
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>描述:</Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>{selectedCategory.description || '無描述'}</Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              onClick={() => handleEditButtonClick(selectedCategory)}
              variant="contained"
              color="primary"
              size="small"
              sx={{ textTransform: 'none', mr: 1 }}
              startIcon={<EditIcon />}
            >
              編輯分類
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  ) : (
    <Card
      elevation={2}
      className="category-card"
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
        {/* 大型分類圖標 */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <AccountBalanceWalletIcon
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
            選擇一個分類查看詳情
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
  
  // 渲染主要內容
  const renderMainContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      );
    }
    
    if (filteredCategories.length === 0) {
      return (
        <Box sx={{ p: 2 }}>
          <Typography align="center">尚無分類，請新增分類</Typography>
        </Box>
      );
    }
    
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
          拖動項目可調整順序。順序將影響記帳表單中的顯示順序。
        </Typography>
        {renderDraggableCategoryList()}
      </Box>
    );
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
    <Box sx={{ width: '95%', mx: 'auto' }}>
      {/* 頁面標題和操作按鈕 */}
      <PageHeaderSection
        breadcrumbItems={[
          {
            label: '首頁',
            path: '/',
            icon: <HomeIcon sx={{ fontSize: '1.1rem' }} />
          },
          {
            label: '記帳管理',
            path: '/journals',
            icon: <AccountBalanceWalletIcon sx={{ fontSize: '1.1rem' }} />
          },
          {
            label: '名目管理',
            icon: <AddIcon sx={{ fontSize: '1.1rem' }} />
          }
        ]}
        actions={actionButtons}
      />

      {/* 主要內容 */}
      <Grid container spacing={2}>
        {/* 左側：分類列表 */}
        <Grid item xs={12} md={9}>
          <Paper
            elevation={0}
            variant="outlined"
            sx={{
              p: { xs: 0, md: 0 },
              mb: { xs: 0, md: 0 },
              height: '74vh',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {renderMainContent()}
          </Paper>
        </Grid>

        {/* 右側：詳情面板 - 始終顯示 */}
        <Grid item xs={12} md={3}>
          {detailPanel}
        </Grid>
      </Grid>
      
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

export default CategoryPage;