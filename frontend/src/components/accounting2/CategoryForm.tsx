import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Grid,
  Chip,
  FormHelperText
} from '@mui/material';
import { Category2 } from '@pharmacy-pos/shared/types/accounting2';
import { Organization } from '@pharmacy-pos/shared/types/organization';

interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (categoryData: Partial<Category2>) => void;
  category?: Category2 | null;
  organizations: Organization[];
  selectedOrganizationId: string | null;
  categories: Category2[]; // 用於父類別選擇
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  open,
  onClose,
  onSubmit,
  category,
  organizations,
  selectedOrganizationId,
  categories
}) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    parentId: '',
    icon: '',
    color: '#1976d2',
    description: '',
    organizationId: selectedOrganizationId || (organizations.length > 0 ? organizations[0]._id : '')
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (category) {
      // 編輯模式
      console.log('🔍 CategoryForm 編輯模式 - 原始 category:', category);
      
      // 處理 organizationId 轉換
      let organizationIdValue = 'personal';
      if (category.organizationId) {
        organizationIdValue = typeof category.organizationId === 'object'
          ? (category.organizationId as any)?.toString() || 'personal'
          : category.organizationId;
      }
      
      console.log('🔍 CategoryForm 編輯模式 - 轉換後 organizationId:', organizationIdValue);

      setFormData({
        name: category.name || '',
        type: category.type || 'expense',
        parentId: category.parentId || '',
        icon: category.icon || '',
        color: category.color || '#1976d2',
        description: category.description || '',
        organizationId: organizationIdValue
      });
    } else {
      // 新增模式
      setFormData({
        name: '',
        type: 'expense',
        parentId: '',
        icon: '',
        color: '#1976d2',
        description: '',
        organizationId: selectedOrganizationId || (organizations.length > 0 ? organizations[0]._id : '')
      });
    }
    setErrors({});
  }, [category, selectedOrganizationId, open]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除該欄位的錯誤
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '請輸入類別名稱';
    }

    if (!formData.type) {
      newErrors.type = '請選擇類別類型';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const submitData: Partial<Category2> = {
      name: formData.name.trim(),
      type: formData.type,
      parentId: formData.parentId || undefined,
      icon: formData.icon || undefined,
      color: formData.color,
      description: formData.description || undefined,
      organizationId: formData.organizationId
    };

    console.log('📤 CategoryForm 提交資料:', submitData);
    onSubmit(submitData);
  };

  const handleClose = () => {
    setFormData({
      name: '',
      type: 'expense',
      parentId: '',
      icon: '',
      color: '#1976d2',
      description: '',
      organizationId: selectedOrganizationId || (organizations.length > 0 ? organizations[0]._id : '')
    });
    setErrors({});
    onClose();
  };

  // 過濾可用的父類別（同類型、同機構、非自己）
  const availableParentCategories = categories.filter(cat =>
    cat.type === formData.type &&
    cat._id !== category?._id &&
    cat.organizationId === formData.organizationId
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {category ? '編輯類別' : '新增類別'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            {/* 類別名稱 */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="類別名稱"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>

            {/* 類別類型 */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.type}>
                <InputLabel>類別類型 *</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  label="類別類型 *"
                >
                  <MenuItem value="income">收入</MenuItem>
                  <MenuItem value="expense">支出</MenuItem>
                </Select>
                {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* 所屬機構 */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>所屬機構</InputLabel>
                <Select
                  value={formData.organizationId}
                  onChange={(e) => handleChange('organizationId', e.target.value)}
                  label="所屬機構"
                >
                  {organizations.map((org) => (
                    <MenuItem key={org._id} value={org._id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="機構" size="small" color="primary" />
                        {org.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* 父類別 */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>父類別</InputLabel>
                <Select
                  value={formData.parentId}
                  onChange={(e) => handleChange('parentId', e.target.value)}
                  label="父類別"
                >
                  <MenuItem value="">無（頂層類別）</MenuItem>
                  {availableParentCategories.map((cat) => (
                    <MenuItem key={cat._id} value={cat._id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* 圖示 */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="圖示"
                value={formData.icon}
                onChange={(e) => handleChange('icon', e.target.value)}
                placeholder="例如：💰、🏠、🍔"
              />
            </Grid>

            {/* 顏色 */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="顏色"
                type="color"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
              />
            </Grid>

            {/* 描述 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="描述"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="類別的詳細說明..."
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          取消
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained"
          disabled={!formData.name.trim()}
        >
          {category ? '更新' : '建立'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryForm;