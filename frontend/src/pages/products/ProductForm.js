import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Grid } from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';

import PageContainer from '../../components/common/PageContainer';
import ActionButton from '../../components/common/ActionButton';
import FormContainer from '../../components/forms/FormContainer';
import FormSection from '../../components/forms/FormSection';
import FormField from '../../components/forms/FormField';

// 模擬資料
const mockProducts = [
  { 
    id: '1', 
    name: '阿斯匹靈', 
    category: '止痛藥', 
    price: 120, 
    stock: 500,
    supplier: '永信藥品',
    expiry: '2025-12-31',
    status: 'active',
    description: '阿斯匹靈是一種非類固醇消炎藥，具有解熱、鎮痛、抗發炎等功效。',
    dosage: '成人每次1-2錠，每日3-4次，飯後服用。',
    sideEffects: '可能引起胃部不適、噁心、嘔吐等副作用。',
    batchNumber: 'ASP20230501',
    location: 'A-12-3'
  },
  // 其他產品資料...
];

// 類別選項
const categoryOptions = [
  { value: '止痛藥', label: '止痛藥' },
  { value: '腸胃藥', label: '腸胃藥' },
  { value: '感冒藥', label: '感冒藥' },
  { value: '維他命', label: '維他命' },
  { value: '抗生素', label: '抗生素' },
  { value: '皮膚藥', label: '皮膚藥' },
  { value: '眼藥', label: '眼藥' },
  { value: '其他', label: '其他' }
];

// 供應商選項
const supplierOptions = [
  { value: '永信藥品', label: '永信藥品' },
  { value: '台灣武田', label: '台灣武田' },
  { value: '信東生技', label: '信東生技' },
  { value: '生達製藥', label: '生達製藥' },
  { value: '杏輝藥品', label: '杏輝藥品' }
];

// 狀態選項
const statusOptions = [
  { value: 'active', label: '啟用' },
  { value: 'inactive', label: '停用' }
];

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    supplier: '',
    expiry: '',
    status: 'active',
    description: '',
    dosage: '',
    sideEffects: '',
    batchNumber: '',
    location: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode) {
      // 模擬API請求獲取產品資料
      setLoading(true);
      setTimeout(() => {
        const product = mockProducts.find(p => p.id === id);
        if (product) {
          setFormData(product);
        }
        setLoading(false);
      }, 500);
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // 清除錯誤
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '藥品名稱為必填項';
    }
    
    if (!formData.category) {
      newErrors.category = '類別為必填項';
    }
    
    if (!formData.price) {
      newErrors.price = '價格為必填項';
    } else if (isNaN(formData.price) || Number(formData.price) <= 0) {
      newErrors.price = '價格必須為正數';
    }
    
    if (!formData.stock) {
      newErrors.stock = '庫存為必填項';
    } else if (isNaN(formData.stock) || Number(formData.stock) < 0) {
      newErrors.stock = '庫存必須為非負數';
    }
    
    if (!formData.supplier) {
      newErrors.supplier = '供應商為必填項';
    }
    
    if (!formData.expiry) {
      newErrors.expiry = '有效期限為必填項';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    // 模擬API請求
    setTimeout(() => {
      setLoading(false);
      // 返回列表頁
      navigate('/products');
    }, 1000);
  };

  const handleCancel = () => {
    navigate('/products');
  };

  return (
    <PageContainer
      title={isEditMode ? '編輯藥品' : '新增藥品'}
      subtitle={isEditMode ? `編輯 ${formData.name}` : '創建新的藥品記錄'}
      action={
        <ActionButton
          variant="outlined"
          color="inherit"
          startIcon={<ArrowBackIcon />}
          onClick={handleCancel}
        >
          返回
        </ActionButton>
      }
    >
      <FormContainer
        onSubmit={handleSubmit}
        loading={loading}
        submitLabel={isEditMode ? '更新' : '創建'}
        showCancel={true}
        onCancel={handleCancel}
        cancelLabel="取消"
      >
        <FormSection title="基本資訊">
          <Grid item xs={12} md={6}>
            <FormField
              id="name"
              name="name"
              label="藥品名稱"
              value={formData.name}
              onChange={handleChange}
              required
              error={errors.name}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormField
              id="category"
              name="category"
              label="類別"
              type="select"
              value={formData.category}
              onChange={handleChange}
              options={categoryOptions}
              required
              error={errors.category}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormField
              id="price"
              name="price"
              label="價格"
              type="number"
              value={formData.price}
              onChange={handleChange}
              required
              error={errors.price}
              InputProps={{ startAdornment: '$' }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormField
              id="stock"
              name="stock"
              label="庫存"
              type="number"
              value={formData.stock}
              onChange={handleChange}
              required
              error={errors.stock}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormField
              id="supplier"
              name="supplier"
              label="供應商"
              type="select"
              value={formData.supplier}
              onChange={handleChange}
              options={supplierOptions}
              required
              error={errors.supplier}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormField
              id="expiry"
              name="expiry"
              label="有效期限"
              type="date"
              value={formData.expiry}
              onChange={handleChange}
              required
              error={errors.expiry}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormField
              id="status"
              name="status"
              label="狀態"
              type="select"
              value={formData.status}
              onChange={handleChange}
              options={statusOptions}
            />
          </Grid>
        </FormSection>

        <FormSection title="詳細資訊">
          <Grid item xs={12}>
            <FormField
              id="description"
              name="description"
              label="藥品描述"
              type="textarea"
              value={formData.description}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormField
              id="dosage"
              name="dosage"
              label="用法用量"
              value={formData.dosage}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormField
              id="sideEffects"
              name="sideEffects"
              label="副作用"
              value={formData.sideEffects}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormField
              id="batchNumber"
              name="batchNumber"
              label="批次號碼"
              value={formData.batchNumber}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormField
              id="location"
              name="location"
              label="儲存位置"
              value={formData.location}
              onChange={handleChange}
            />
          </Grid>
        </FormSection>
      </FormContainer>
    </PageContainer>
  );
};

export default ProductForm;
