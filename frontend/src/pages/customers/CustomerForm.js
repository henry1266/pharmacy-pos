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
const mockCustomers = [
  { 
    id: '1', 
    name: '王小明', 
    phone: '0912-345-678', 
    email: 'wang@example.com', 
    address: '台北市信義區信義路五段7號',
    level: 'gold',
    registerDate: '2023-01-15',
    totalSpent: 12500,
    status: 'active',
    birthdate: '1985-05-20',
    gender: 'male',
    notes: '對止痛藥過敏，需特別注意',
    points: 1250
  },
  // 其他會員資料...
];

// 會員等級選項
const levelOptions = [
  { value: 'gold', label: '金卡會員' },
  { value: 'silver', label: '銀卡會員' },
  { value: 'bronze', label: '銅卡會員' },
  { value: 'regular', label: '一般會員' }
];

// 性別選項
const genderOptions = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' }
];

// 狀態選項
const statusOptions = [
  { value: 'active', label: '啟用' },
  { value: 'inactive', label: '停用' }
];

const CustomerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    level: 'regular',
    status: 'active',
    birthdate: '',
    gender: '',
    notes: '',
    points: 0
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode) {
      // 模擬API請求獲取會員資料
      setLoading(true);
      setTimeout(() => {
        const customer = mockCustomers.find(c => c.id === id);
        if (customer) {
          setFormData(customer);
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
      newErrors.name = '會員姓名為必填項';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = '聯絡電話為必填項';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '請輸入有效的電子郵件地址';
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
      navigate('/customers');
    }, 1000);
  };

  const handleCancel = () => {
    navigate('/customers');
  };

  return (
    <PageContainer
      title={isEditMode ? '編輯會員' : '新增會員'}
      subtitle={isEditMode ? `編輯 ${formData.name}` : '創建新的會員記錄'}
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
              label="會員姓名"
              value={formData.name}
              onChange={handleChange}
              required
              error={errors.name}
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
              error={errors.email}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormField
              id="birthdate"
              name="birthdate"
              label="出生日期"
              type="date"
              value={formData.birthdate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormField
              id="gender"
              name="gender"
              label="性別"
              type="select"
              value={formData.gender}
              onChange={handleChange}
              options={genderOptions}
            />
          </Grid>
          <Grid item xs={12}>
            <FormField
              id="address"
              name="address"
              label="地址"
              value={formData.address}
              onChange={handleChange}
            />
          </Grid>
        </FormSection>

        <FormSection title="會員資訊">
          <Grid item xs={12} md={6}>
            <FormField
              id="level"
              name="level"
              label="會員等級"
              type="select"
              value={formData.level}
              onChange={handleChange}
              options={levelOptions}
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
          {isEditMode && (
            <Grid item xs={12} md={6}>
              <FormField
                id="points"
                name="points"
                label="會員點數"
                type="number"
                value={formData.points}
                onChange={handleChange}
              />
            </Grid>
          )}
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

export default CustomerForm;
