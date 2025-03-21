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
const mockSuppliers = [
  { 
    id: '1', 
    name: '永信藥品', 
    contact: '張經理', 
    phone: '02-2345-6789', 
    email: 'contact@yungshin.com',
    address: '台北市信義區信義路五段7號',
    status: 'active',
    taxId: '12345678',
    website: 'https://www.yungshin.com',
    notes: '主要提供各類止痛藥和感冒藥',
    paymentTerms: '月結30天'
  },
  // 其他供應商資料...
];

// 狀態選項
const statusOptions = [
  { value: 'active', label: '啟用' },
  { value: 'inactive', label: '停用' }
];

// 付款條件選項
const paymentTermsOptions = [
  { value: '月結30天', label: '月結30天' },
  { value: '月結45天', label: '月結45天' },
  { value: '月結60天', label: '月結60天' },
  { value: '貨到付款', label: '貨到付款' },
  { value: '預付款', label: '預付款' }
];

const SupplierForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    status: 'active',
    taxId: '',
    website: '',
    notes: '',
    paymentTerms: '月結30天'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode) {
      // 模擬API請求獲取供應商資料
      setLoading(true);
      setTimeout(() => {
        const supplier = mockSuppliers.find(s => s.id === id);
        if (supplier) {
          setFormData(supplier);
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
      newErrors.name = '供應商名稱為必填項';
    }
    
    if (!formData.contact.trim()) {
      newErrors.contact = '聯絡人為必填項';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = '聯絡電話為必填項';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = '電子郵件為必填項';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '請輸入有效的電子郵件地址';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = '地址為必填項';
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
      navigate('/suppliers');
    }, 1000);
  };

  const handleCancel = () => {
    navigate('/suppliers');
  };

  return (
    <PageContainer
      title={isEditMode ? '編輯供應商' : '新增供應商'}
      subtitle={isEditMode ? `編輯 ${formData.name}` : '創建新的供應商記錄'}
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
              label="供應商名稱"
              value={formData.name}
              onChange={handleChange}
              required
              error={errors.name}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormField
              id="contact"
              name="contact"
              label="聯絡人"
              value={formData.contact}
              onChange={handleChange}
              required
              error={errors.contact}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormField
              id="phone"
              name="phone"
              label="聯絡電話"
              value={formData.phone}
              onChange={handleChange}
              required
              error={errors.phone}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormField
              id="email"
              name="email"
              label="電子郵件"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              error={errors.email}
            />
          </Grid>
          <Grid item xs={12}>
            <FormField
              id="address"
              name="address"
              label="地址"
              value={formData.address}
              onChange={handleChange}
              required
              error={errors.address}
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
          <Grid item xs={12} md={6}>
            <FormField
              id="taxId"
              name="taxId"
              label="統一編號"
              value={formData.taxId}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormField
              id="website"
              name="website"
              label="網站"
              value={formData.website}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormField
              id="paymentTerms"
              name="paymentTerms"
              label="付款條件"
              type="select"
              value={formData.paymentTerms}
              onChange={handleChange}
              options={paymentTermsOptions}
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

export default SupplierForm;
