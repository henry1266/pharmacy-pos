import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Autocomplete,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  AttachMoney as UnitPriceIcon,
  Receipt as SubtotalIcon
} from '@mui/icons-material';
import { PackageCreateRequest, PackageUpdateRequest, PackageItem } from '../../../../shared/types/package';
import useProductData from '../../hooks/useProductData';

interface PackageFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (packageData: PackageCreateRequest | PackageUpdateRequest) => Promise<void>;
  editMode?: boolean;
  initialData?: any;
  loading?: boolean;
}

interface FormData {
  name: string;
  shortCode: string;
  description: string;
  tags: string[];
  isActive: boolean;
  items: PackageItem[];
}

const PackageFormDialog: React.FC<PackageFormDialogProps> = ({
  open,
  onClose,
  onSave,
  editMode = false,
  initialData,
  loading = false
}) => {
  const { allProducts } = useProductData();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    shortCode: '',
    description: '',
    tags: [],
    isActive: true,
    items: []
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState('');

  // 生成下一個套餐編號
  const generateNextPackageCode = async (): Promise<string> => {
    try {
      // 這裡應該調用 API 獲取最新的套餐編號
      // 暫時使用簡單的邏輯生成
      const timestamp = Date.now().toString().slice(-4);
      return `T1${timestamp}`;
    } catch (error) {
      console.error('生成套餐編號失敗:', error);
      return `T10001`;
    }
  };

  // 初始化表單數據
  useEffect(() => {
    const initializeForm = async () => {
      if (open) {
        if (editMode && initialData) {
          setFormData({
            name: initialData.name || '',
            shortCode: initialData.shortCode || '',
            description: initialData.description || '',
            tags: initialData.tags || [],
            isActive: initialData.isActive !== undefined ? initialData.isActive : true,
            items: initialData.items || []
          });
        } else {
          // 新增模式時，簡碼留空讓用戶自己輸入
          setFormData({
            name: '',
            shortCode: '',
            description: '',
            tags: [],
            isActive: true,
            items: []
          });
        }
        setErrors({});
      }
    };

    initializeForm();
  }, [open, editMode, initialData]);

  // 處理表單輸入變更
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除對應的錯誤
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // 新增產品項目
  const handleAddItem = () => {
    const newItem: PackageItem = {
      productId: '',
      productCode: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      unit: '個',
      subtotal: 0,
      priceMode: 'unit'
    };
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  // 更新產品項目
  const handleUpdateItem = (index: number, field: keyof PackageItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          
          // 當數量或單價變更時，如果是單價模式，自動更新小計
          if ((field === 'quantity' || field === 'unitPrice') && updatedItem.priceMode === 'unit') {
            updatedItem.subtotal = updatedItem.unitPrice * updatedItem.quantity;
          }
          
          // 當價格模式變更時，重新計算小計
          if (field === 'priceMode') {
            if (value === 'unit') {
              updatedItem.subtotal = updatedItem.unitPrice * updatedItem.quantity;
            }
            // 如果切換到小計模式，保持當前小計值不變
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  // 選擇產品
  const handleSelectProduct = (index: number, product: any) => {
    if (product) {
      const unitPrice = product.sellingPrice || product.price || 0;
      handleUpdateItem(index, 'productId', product.id || product._id);
      handleUpdateItem(index, 'productCode', product.code);
      handleUpdateItem(index, 'productName', product.name);
      handleUpdateItem(index, 'unitPrice', unitPrice);
      handleUpdateItem(index, 'unit', product.unit || '個');
      
      // 根據當前模式更新小計
      const currentItem = formData.items[index];
      if (currentItem?.priceMode === 'unit') {
        handleUpdateItem(index, 'subtotal', unitPrice * (currentItem.quantity || 1));
      }
    }
  };

  // 刪除產品項目
  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // 計算套餐總價（各項目小計的加總）
  const calculateTotalPrice = () => {
    return formData.items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  };

  // 計算原始總價（基於單價×數量）
  const calculateOriginalTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  };

  // 表單驗證
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '套餐名稱為必填項目';
    }

    if (formData.items.length === 0) {
      newErrors.items = '至少需要一個產品項目';
    }


    // 檢查產品項目
    formData.items.forEach((item, index) => {
      if (!item.productId) {
        newErrors[`item_${index}_product`] = '請選擇產品';
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = '數量必須大於0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 處理保存
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const packageData = {
        name: formData.name.trim(),
        shortCode: formData.shortCode.trim(),
        description: formData.description.trim(),
        tags: formData.tags,
        isActive: formData.isActive,
        items: formData.items
      };

      await onSave(packageData);
      onClose();
    } catch (error) {
      console.error('保存套餐失敗:', error);
    }
  };

  // 新增標籤
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleInputChange('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // 刪除標籤
  const handleRemoveTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {editMode ? '編輯套餐' : '新增套餐'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {/* 基本資訊 */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="套餐名稱"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              required
              sx={{ flex: 1 }}
            />
            <TextField
              label="套餐簡碼"
              value={formData.shortCode}
              onChange={(e) => handleInputChange('shortCode', e.target.value)}
              error={!!errors.shortCode}
              helperText={errors.shortCode || '用戶自定義簡碼，可選填'}
              placeholder="例如：VIP套餐"
              sx={{ flex: 1 }}
            />
          </Box>
          
          <TextField
            label="套餐描述"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            multiline
            rows={2}
            fullWidth
          />

          {/* 標籤 */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>標籤</Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              {formData.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  size="small"
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                placeholder="新增標籤"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <Button onClick={handleAddTag} size="small">新增</Button>
            </Box>
          </Box>

          {/* 產品項目 */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">套餐內容</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddItem}
                variant="outlined"
                size="small"
              >
                新增產品
              </Button>
            </Box>
            
            {errors.items && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.items}
              </Alert>
            )}

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>產品</TableCell>
                    <TableCell>數量</TableCell>
                    <TableCell>單價</TableCell>
                    <TableCell>價格模式</TableCell>
                    <TableCell>小計</TableCell>
                    <TableCell width={50}>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Autocomplete
                          size="small"
                          options={allProducts}
                          getOptionLabel={(option) => `${option.name} (${option.code})`}
                          value={allProducts.find(p => (p.id || p._id) === item.productId) || null}
                          onChange={(_, value) => handleSelectProduct(index, value)}
                          renderInput={(params) => {
                            const { size, InputLabelProps, ...restParams } = params;
                            const cleanInputLabelProps = InputLabelProps ? {
                              ...InputLabelProps,
                              className: InputLabelProps.className || '',
                              style: InputLabelProps.style || {}
                            } : {};
                            
                            return (
                              <TextField
                                {...restParams}
                                error={!!errors[`item_${index}_product`]}
                                helperText={errors[`item_${index}_product`]}
                                placeholder="選擇產品"
                                size="small"
                                InputLabelProps={cleanInputLabelProps}
                              />
                            );
                          }}
                          sx={{ minWidth: 200 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(index, 'quantity', Number(e.target.value))}
                          error={!!errors[`item_${index}_quantity`]}
                          inputProps={{ min: 1 }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          NT$ {item.unitPrice.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Button
                            size="small"
                            variant={item.priceMode === 'unit' ? 'contained' : 'outlined'}
                            onClick={() => handleUpdateItem(index, 'priceMode', 'unit')}
                            startIcon={<UnitPriceIcon />}
                            sx={{ minWidth: 'auto', px: 1 }}
                          >
                            單價
                          </Button>
                          <Button
                            size="small"
                            variant={item.priceMode === 'subtotal' ? 'contained' : 'outlined'}
                            onClick={() => handleUpdateItem(index, 'priceMode', 'subtotal')}
                            startIcon={<SubtotalIcon />}
                            sx={{ minWidth: 'auto', px: 1 }}
                          >
                            小計
                          </Button>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {item.priceMode === 'subtotal' ? (
                          <TextField
                            size="small"
                            type="number"
                            value={item.subtotal || 0}
                            onChange={(e) => handleUpdateItem(index, 'subtotal', Number(e.target.value))}
                            inputProps={{ min: 0 }}
                            sx={{ width: 100 }}
                            InputProps={{
                              startAdornment: <Typography sx={{ mr: 0.5 }}>NT$</Typography>
                            }}
                          />
                        ) : (
                          <Typography variant="body2" fontWeight="bold">
                            NT$ {(item.subtotal || 0).toLocaleString()}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveItem(index)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* 價格摘要 */}
          {formData.items.length > 0 && (
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom>價格摘要</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>原始總價 (單價×數量):</Typography>
                <Typography>NT$ {calculateOriginalTotal().toLocaleString()}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>套餐總價 (小計加總):</Typography>
                <Typography fontWeight="bold" color="primary">
                  NT$ {calculateTotalPrice().toLocaleString()}
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} startIcon={<CancelIcon />}>
          取消
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
          disabled={loading}
        >
          {editMode ? '更新' : '建立'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PackageFormDialog;