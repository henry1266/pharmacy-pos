import React, { useRef, useState, useEffect } from 'react';
import { keyframes } from '@emotion/react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Snackbar,
  Alert,
  Grid,
  CircularProgress
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import LaunchIcon from '@mui/icons-material/Launch';
import { DragDropContext, Draggable, DropResult } from 'react-beautiful-dnd';
import { StrictModeDroppable } from '../../../components/common/StrictModeDroppable';
import TitleWithCount from '../../../components/common/TitleWithCount';
import PageHeaderSection from '../../../components/common/PageHeaderSection';
import { getProductCategories, updateProductCategory } from '../../../services/productCategoryService';
import { Category } from '@pharmacy-pos/shared/types/entities';

// 擴展 Category 型別以包含 order 和 isActive 屬性
interface ExtendedCategory extends Category {
  order?: number;
  isActive?: boolean;
}

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
 * 產品分類管理頁面
 */
const ProductCategoryPage: React.FC = () => {
  const navigate = useNavigate();
  const categoryManagerRef = useRef<any>(null);
  
  // 狀態管理
  const [categories, setCategories] = useState<ExtendedCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ExtendedCategory | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState<boolean>(false);
  
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
  
  // 處理新增分類按鈕點擊
  const handleAddCategory = () => {
    if (categoryManagerRef.current && categoryManagerRef.current.handleOpenAddDialog) {
      categoryManagerRef.current.handleOpenAddDialog();
    }
  };
  
  // 獲取分類數據
  const fetchCategories = async () => {
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
  
  // 過濾分類
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // 處理搜尋
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // 處理行點擊
  const handleCategoryClick = (categoryId: string) => {
    const category = categories.find(cat => cat._id === categoryId) || null;
    setSelectedCategory(category);
    setShowDetailPanel(true);
  };
  
  // 處理編輯分類
  const handleEditCategory = (categoryId: string) => {
    navigate(`/product-categories/${categoryId}`);
  };
  
  // 處理刪除分類
  const handleDeleteCategory = (categoryId: string) => {
    if (categoryManagerRef.current && categoryManagerRef.current.handleDeleteCategory) {
      categoryManagerRef.current.handleDeleteCategory(categoryId);
    }
  };
  
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
      const updatedItems = items.map((item, index) => ({
        ...item,
        order: (index + 1) * 10 // 每個項目間隔10，方便將來插入新項目
      }));
      
      setCategories(updatedItems);
      
      // 逐個更新到資料庫
      for (const item of updatedItems) {
        await updateProductCategory(item._id, {
          name: item.name,
          description: item.description || '',
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
  
  // 處理跳轉到詳情頁面
  const handleNavigateToDetail = (categoryId: string) => {
    navigate(`/product-categories/${categoryId}`);
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
          border: '1px solid rgba(0, 0, 0, 0.08)',
          '&:hover': {
            bgcolor: 'rgba(0, 0, 0, 0.04)',
            borderColor: 'rgba(0, 0, 0, 0.15)'
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
          <Box>
            <IconButton
              edge="end"
              onClick={(e) => {
                e.stopPropagation();
                handleNavigateToDetail(category._id);
              }}
              color="primary"
              size="small"
              title="前往詳情頁面"
            >
              <LaunchIcon fontSize="small" />
            </IconButton>
            <IconButton
              edge="end"
              onClick={(e) => {
                e.stopPropagation();
                handleEditCategory(category._id);
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
        onClick={handleAddCategory}
      >
        新增分類
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
              onClick={() => handleEditCategory(selectedCategory._id)}
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
          <CategoryIcon
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
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            請從左側列表中選擇一個分類
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
          拖動項目可調整順序。順序將影響產品表單中的顯示順序。
        </Typography>
        {renderDraggableCategoryList()}
      </Box>
    );
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
            label: '分類管理',
            icon: <CategoryIcon sx={{ fontSize: '1.1rem' }} />
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

export default ProductCategoryPage;