import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  VisibilityOff as VisibilityOffIcon,
  LocalOffer as PackageIcon,
  ShoppingCart as CartIcon,
  TrendingUp as TrendingUpIcon,
  Category as CategoryIcon,
  Label as TagIcon
} from '@mui/icons-material';
import { usePackageData } from '../hooks/usePackageData';
import { Package, PackageFilters, PackageCreateRequest, PackageUpdateRequest } from '../../../shared/types/package';
import { PackageService } from '../services/packageService';
import PackageFormDialog from '../components/packages/PackageFormDialog';

const PackagesPage: React.FC = () => {
  const {
    packages,
    filteredPackages,
    loading,
    error,
    stats,
    categories,
    tags,
    filters,
    searchTerm,
    setFilters,
    setSearchTerm,
    refreshPackages,
    deletePackage,
    togglePackageActive,
    clearError
  } = usePackageData();

  // 本地狀態
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<Package | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // 處理搜尋
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // 處理篩選變更
  const handleFilterChange = (newFilters: Partial<PackageFilters>) => {
    setFilters({ ...filters, ...newFilters });
  };

  // 處理查看套餐詳情
  const handleViewPackage = (pkg: Package) => {
    setSelectedPackage(pkg);
    setViewDialogOpen(true);
  };

  // 處理刪除套餐
  const handleDeleteClick = (pkg: Package) => {
    setPackageToDelete(pkg);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (packageToDelete) {
      try {
        await deletePackage(packageToDelete._id!);
        setDeleteDialogOpen(false);
        setPackageToDelete(null);
      } catch (error) {
        console.error('刪除套餐失敗:', error);
      }
    }
  };

  // 處理切換啟用狀態
  const handleToggleActive = async (pkg: Package) => {
    try {
      await togglePackageActive(pkg._id!);
    } catch (error) {
      console.error('切換套餐狀態失敗:', error);
    }
  };

  // 處理新增套餐
  const handleAddPackage = () => {
    setEditMode(false);
    setSelectedPackage(null);
    setFormDialogOpen(true);
  };

  // 處理編輯套餐
  const handleEditPackage = (pkg: Package) => {
    setEditMode(true);
    setSelectedPackage(pkg);
    setFormDialogOpen(true);
  };

  // 處理保存套餐
  const handleSavePackage = async (packageData: PackageCreateRequest | PackageUpdateRequest) => {
    setFormLoading(true);
    try {
      if (editMode && selectedPackage) {
        // 更新套餐
        await PackageService.updatePackage(selectedPackage._id!, packageData as PackageUpdateRequest);
      } else {
        // 新增套餐
        await PackageService.createPackage(packageData as PackageCreateRequest);
      }
      
      // 重新載入套餐列表
      await refreshPackages();
      setFormDialogOpen(false);
    } catch (error) {
      console.error('保存套餐失敗:', error);
      throw error; // 讓表單組件處理錯誤
    } finally {
      setFormLoading(false);
    }
  };

  // 格式化價格
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(price);
  };

  // 計算統計資訊
  const displayStats = useMemo(() => {
    if (stats) return stats;
    
    // 如果沒有後端統計，從本地計算
    const totalPackages = packages.length;
    const activePackages = packages.filter(pkg => pkg.isActive).length;
    const inactivePackages = totalPackages - activePackages;
    const totalValue = packages.reduce((sum, pkg) => sum + pkg.totalPrice, 0);
    return {
      totalPackages,
      activePackages,
      inactivePackages,
      totalValue,
      averageDiscount: 0 // 移除折扣功能，固定為 0
    };
  }, [packages, stats]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 頁面標題 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          <PackageIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          套餐管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddPackage}
        >
          新增套餐
        </Button>
      </Box>

      {/* 錯誤提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* 統計卡片 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PackageIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    總套餐數
                  </Typography>
                  <Typography variant="h5">
                    {displayStats.totalPackages}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CartIcon color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    啟用套餐
                  </Typography>
                  <Typography variant="h5">
                    {displayStats.activePackages}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUpIcon color="info" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    總價值
                  </Typography>
                  <Typography variant="h5">
                    {formatPrice(displayStats.totalValue)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TagIcon color="warning" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    平均折扣
                  </Typography>
                  <Typography variant="h5">
                    {displayStats.averageDiscount.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 搜尋和篩選 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="搜尋套餐名稱、代碼、描述..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>分類</InputLabel>
              <Select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange({ category: e.target.value || undefined })}
              >
                <MenuItem value="">全部分類</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>狀態</InputLabel>
              <Select
                value={filters.isActive === undefined ? '' : filters.isActive.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFilterChange({ 
                    isActive: value === '' ? undefined : value === 'true' 
                  });
                }}
              >
                <MenuItem value="">全部狀態</MenuItem>
                <MenuItem value="true">啟用</MenuItem>
                <MenuItem value="false">停用</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" gap={1}>
              <TextField
                label="最低價格"
                type="number"
                size="small"
                value={filters.minPrice || ''}
                onChange={(e) => handleFilterChange({ 
                  minPrice: e.target.value ? Number(e.target.value) : undefined 
                })}
              />
              <TextField
                label="最高價格"
                type="number"
                size="small"
                value={filters.maxPrice || ''}
                onChange={(e) => handleFilterChange({ 
                  maxPrice: e.target.value ? Number(e.target.value) : undefined 
                })}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 套餐列表 */}
      <Grid container spacing={2}>
        {filteredPackages.map((pkg) => (
          <Grid item xs={12} md={6} lg={4} key={pkg._id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Typography variant="h6" component="h3" noWrap>
                    {pkg.name}
                  </Typography>
                  <Chip
                    label={pkg.isActive ? '啟用' : '停用'}
                    color={pkg.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {pkg.code}
                </Typography>
                
                {pkg.description && (
                  <Typography variant="body2" sx={{ mb: 1 }} noWrap>
                    {pkg.description}
                  </Typography>
                )}
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {PackageService.getPackageSummary(pkg)}
                </Typography>
                
                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                  <Box>
                    <Typography variant="h6" color="primary">
                      {formatPrice(pkg.totalPrice)}
                    </Typography>
                  </Box>
                </Box>
                
                {pkg.category && (
                  <Chip
                    label={pkg.category}
                    size="small"
                    sx={{ mt: 1 }}
                    icon={<CategoryIcon />}
                  />
                )}
                
                {pkg.tags && pkg.tags.length > 0 && (
                  <Box mt={1}>
                    {pkg.tags.slice(0, 2).map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                    {pkg.tags.length > 2 && (
                      <Chip
                        label={`+${pkg.tags.length - 2}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                )}
              </CardContent>
              
              <CardActions>
                <Tooltip title="查看詳情">
                  <IconButton onClick={() => handleViewPackage(pkg)}>
                    <ViewIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="編輯">
                  <IconButton onClick={() => handleEditPackage(pkg)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={pkg.isActive ? '停用' : '啟用'}>
                  <IconButton onClick={() => handleToggleActive(pkg)}>
                    {pkg.isActive ? <VisibilityOffIcon /> : <ViewIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="刪除">
                  <IconButton onClick={() => handleDeleteClick(pkg)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 空狀態 */}
      {filteredPackages.length === 0 && !loading && (
        <Box textAlign="center" py={4}>
          <PackageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            {searchTerm || Object.keys(filters).length > 0 ? '沒有符合條件的套餐' : '尚未建立任何套餐'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ mt: 2 }}
            onClick={handleAddPackage}
          >
            建立第一個套餐
          </Button>
        </Box>
      )}

      {/* 套餐詳情對話框 */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          套餐詳情 - {selectedPackage?.name}
        </DialogTitle>
        <DialogContent>
          {selectedPackage && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">套餐代碼</Typography>
                  <Typography variant="body1">{selectedPackage.code}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">狀態</Typography>
                  <Chip
                    label={selectedPackage.isActive ? '啟用' : '停用'}
                    color={selectedPackage.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </Grid>
              </Grid>
              
              {selectedPackage.description && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">描述</Typography>
                  <Typography variant="body1">{selectedPackage.description}</Typography>
                </Box>
              )}
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">價格資訊</Typography>
                <Typography variant="h6" color="primary">
                  套餐價格: {formatPrice(selectedPackage.totalPrice)}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>套餐內容</Typography>
              <List>
                {selectedPackage.items.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`${item.productName} (${item.productCode})`}
                      secondary={`單價: ${formatPrice(item.unitPrice)} | 單位: ${item.unit} | 模式: ${item.priceMode === 'unit' ? '單價' : '小計'}`}
                    />
                    <ListItemSecondaryAction>
                      <Box textAlign="right">
                        <Typography variant="body2">
                          數量: {item.quantity}
                        </Typography>
                        <Typography variant="body2" color="primary">
                          小計: {formatPrice(item.subtotal || 0)}
                        </Typography>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>關閉</Button>
        </DialogActions>
      </Dialog>

      {/* 刪除確認對話框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>確認刪除</DialogTitle>
        <DialogContent>
          <Typography>
            確定要刪除套餐「{packageToDelete?.name}」嗎？此操作無法復原。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            刪除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 套餐表單對話框 */}
      <PackageFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        onSave={handleSavePackage}
        editMode={editMode}
        initialData={selectedPackage}
        loading={formLoading}
      />
    </Box>
  );
};

export default PackagesPage;