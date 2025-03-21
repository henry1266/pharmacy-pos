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
const mockInventory = [
  { 
    id: '1', 
    productId: '1',
    productName: '阿斯匹靈', 
    batchNumber: 'ASP20230501',
    quantity: 500,
    location: 'A-12-3',
    expiryDate: '2025-12-31',
    purchaseDate: '2023-05-01',
    purchasePrice: 80,
    sellingPrice: 120,
    status: 'active',
    supplier: '永信藥品',
    category: '止痛藥',
    notes: '正常儲存於陰涼乾燥處',
    minimumStock: 100,
    reorderPoint: 150
  },
  // 其他庫存資料...
];

// 產品選項 (實際應用中應該從API獲取)
const productOptions = [
  { value: '1', label: '阿斯匹靈' },
  { value: '2', label: '普拿疼' },
  { value: '3', label: '胃腸藥' },
  { value: '4', label: '感冒糖漿' },
  { value: '5', label: '維他命C' }
];

// 供應商選項 (實際應用中應該從API獲取)
const supplierOptions = [
  { value: '永信藥品', label: '永信藥品' },
  { value: '台灣武田', label: '台灣武田' },
  { value: '信東生技', label: '信東生技' },
  { value: '生達製藥', label: '生達製藥' },
  { value: '杏輝藥品', label: '杏輝藥品' }
];

// 類別選項
const categoryOptions = [
  { value: '止痛藥', label: '止痛藥' },
  { value: '腸胃藥', label: '腸胃藥' },
  { value: '感冒藥', label: '感冒藥' },
  { value: '維他命', label: '維他命' },
  { value: '抗生素', label: '抗生素' }
];

// 狀態選項
const statusOptions = [
  { value: 'active', label: '正常' },
  { value: 'inactive', label: '停用' }
];

const InventoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    productName: '',
    batchNumber: '',
    quantity: '',
    location: '',
    expiryDate: '',
    purchaseDate: '',
    purchasePrice: '',
    sellingPrice: '',
    status: 'active',
    supplier: '',
    category: '',
    notes: '',
    minimumStock: '',
    reorderPoint: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode) {
      // 模擬API請求獲取庫存資料
      setLoading(true);
      setTimeout(() => {
        const inventory = mockInventory.find(item => item.id === id);
        if (inventory) {
          setFormData(inventory);
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

    // 如果選擇了產品，自動填充產品名稱
    if (name === 'productId' && value) {
      const selectedProduct = productOptions.find(p => p.value === value);
      if (selectedProduct) {
        setFormData(prev => ({
          ...prev,
          productName: selectedProduct.label
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.productId) {
      newErrors.productId = '產品為必填項';
    }
    
    if (!formData.batchNumber.trim()) {
      newErrors.batchNumber = '批次號碼為必填項';
    }
    
    if (!formData.quantity) {
      newErrors.quantity = '庫存數量為必填項';
    } else if (isNaN(formData.quantity) || Number(formData.quantity) < 0) {
      newErrors.quantity = '庫存數量必須為非負數';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = '儲存位置為必填項';
    }
    
    if (!formData.expiryDate) {
      newErrors.expiryDate = '有效期限為必填項';
    }
    
    if (!formData.purchasePrice) {
      newErrors.purchasePrice = '進貨價為必填項';
    } else if (isNaN(formData.purchasePrice) || Number(formData.purchasePrice) <= 0) {
      newErrors.purchasePrice = '進貨價必須為正數';
    }
    
    if (!formData.sellingPrice) {
      newErrors.sellingPrice = '售價為必填項';
    } else if (isNaN(formData.sellingPrice) || Number(formData.sellingPrice) <= 0) {
      newErrors.sellingPrice = '售價必須為正數';
    }
    
    if (!formData.supplier) {
      newErrors.supplier = '供應商為必填項';
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
      navigate('/inventory');
    }, 1000);
  };

  const handleCancel = () => {
    navigate('/inventory');
  };

  return (
    <PageContainer
      title={isEditMode ? '編輯庫存' : '新增庫存'}
      subtitle={isEditMode ? `編輯 ${formData.productName} 庫存` : '創建新的庫存記錄'}
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
              id="productId"
              name="productId"
              label="產品"
              type="select"
              value={formData.productId}
              onChange={handleChange}
              options={productOptions}
              required
              error={errors.productId}
              disabled={isEditMode}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormField
              id="batchNumber"
              name="batchNumber"
              label="批次號碼"
              value={formData.batchNumber}
              onChange={handleChange}
              required
              error={errors.batchNumber}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormField
              id="quantity"
              name="quantity"
              label="庫存數量"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
              required
              error={errors.quantity}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormField
              id="location"
              name="location"
              label="儲存位置"
              value={formData.location}
              onChange={handleChange}
              required
              error={errors.location}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormField
              id="expiryDate"
              name="expiryDate"
              label="有效期限"
              type="date"
              value={formData.expiryDate}
              onChange={handleChange}
              required
              error={errors.expiryDate}
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

        <FormSection title="價格與供應資訊">
          <Grid item xs={12} md={6}>
            <FormField
              id="purchasePrice"
              name="purchasePrice"
              label="進貨價"
              type="number"
              value={formData.purchasePrice}
              onChange={handleChange}
              required
              error={errors.purchasePrice}
              InputProps={{ startAdornment: '$' }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormField
              id="sellingPrice"
              name="sellingPrice"
              label="售價"
              type="number"
              value={formData.sellingPrice}
              onChange={handleChange}
              required
              error={errors.sellingPrice}
              InputProps={{ startAdornment: '$' }}
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
              id="purchaseDate"
              name="purchaseDate"
              label="進貨日期"
              type="date"
              value={formData.purchaseDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
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
            />
          </Grid>
        </FormSection>

        <FormSection title="庫存控制">
          <Grid item xs={12} md={6}>
            <FormField
              id="minimumStock"
              name="minimumStock"
              label="最低庫存量"
              type="number"
              value={formData.minimumStock}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormField
              id="reorderPoint"
              name="reorderPoint"
              label="再訂購點"
              type="number"
              value={formData.reorderPoint}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <FormField
              id="notes"
              name="notes"
              label="備註"
              type="textarea"
              value={formData.notes}
              onChange={handleChange}
            />
          </Grid>
        </FormSection>
      </FormContainer>
    </PageContainer>
  );
};

export default InventoryForm;
