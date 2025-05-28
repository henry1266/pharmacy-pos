import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Button, 
  Paper, 
  Typography,
  Divider,
  CircularProgress
} from '@mui/material';
import PersonalInfoSection from './PersonalInfoSection';
import ContactInfoSection from './ContactInfoSection';
import WorkInfoSection from './WorkInfoSection';
import IDCardSection from './IDCardSection';
import AdditionalInfoSection from './AdditionalInfoSection';

/**
 * 員工表單元件
 * 整合所有表單區塊，處理表單狀態與提交邏輯
 */
const EmployeeForm = ({ onSubmit, initialData = null, isSubmitting = false }) => {
  // 初始表單資料
  const initialFormData = {
    // 個人基本資料
    name: '',
    gender: '',
    birthDate: '',
    idNumber: '',
    education: '',
    nativePlace: '',
    
    // 聯絡資訊
    address: '',
    phone: '',
    
    // 工作資訊
    position: '',
    department: '',
    hireDate: '',
    salary: '',
    insuranceDate: '',
    
    // 其他資訊
    experience: '',
    rewards: '',
    injuries: '',
    additionalInfo: '',
    
    // 身分證影像
    idCardFront: null,
    idCardBack: null,
    
    // 簽署資訊
    signDate: new Date().toISOString().split('T')[0],
  };

  // 表單狀態
  const [formData, setFormData] = useState(initialData || initialFormData);
  const [errors, setErrors] = useState({});

  // 當初始資料變更時更新表單
  useEffect(() => {
    if (initialData) {
      // 處理日期格式
      const formattedData = { ...initialData };
      if (formattedData.birthDate) {
        formattedData.birthDate = new Date(formattedData.birthDate).toISOString().split('T')[0];
      }
      if (formattedData.hireDate) {
        formattedData.hireDate = new Date(formattedData.hireDate).toISOString().split('T')[0];
      }
      if (formattedData.insuranceDate) {
        formattedData.insuranceDate = new Date(formattedData.insuranceDate).toISOString().split('T')[0];
      }
      
      setFormData(formattedData);
    }
  }, [initialData]);

  // 處理表單欄位變更
  const handleChange = (section) => (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除該欄位的錯誤訊息
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // 處理檔案上傳
  const handleFileChange = (name, file) => {
    setFormData(prev => ({
      ...prev,
      [name]: file
    }));
    
    // 清除該欄位的錯誤訊息
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // 驗證表單
  const validateForm = () => {
    const newErrors = {};
    
    // 驗證必填欄位
    if (!formData.name) newErrors.name = '請輸入姓名';
    if (!formData.gender) newErrors.gender = '請選擇性別';
    if (!formData.birthDate) newErrors.birthDate = '請輸入出生年月日';
    if (!formData.idNumber) newErrors.idNumber = '請輸入身分證統一號碼';
    else if (!/^[A-Z][12]\d{8}$/.test(formData.idNumber)) {
      newErrors.idNumber = '身分證統一號碼格式不正確';
    }
    if (!formData.address) newErrors.address = '請輸入住址';
    if (!formData.position) newErrors.position = '請輸入任職職務';
    if (!formData.department) newErrors.department = '請輸入所屬部門';
    if (!formData.hireDate) newErrors.hireDate = '請輸入到職年月日';
    
    // 驗證薪資
    if (formData.salary && isNaN(Number(formData.salary))) {
      newErrors.salary = '薪資必須為數字';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 處理表單提交
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // 準備 API 提交資料
      const apiData = {
        ...formData,
        // 將性別轉換為 API 格式
        gender: formData.gender === '男' ? 'male' : (formData.gender === '女' ? 'female' : formData.gender)
      };
      
      // 將表單資料傳給父元件處理
      onSubmit(apiData);
      
      // 注意：實際提交狀態由父元件控制
    } else {
      // 滾動到第一個錯誤欄位
      const firstError = document.querySelector('.Mui-error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // 提取嵌套的三元運算符為獨立變數
  let buttonText = isSubmitting ? '儲存中...' : '儲存';

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          個人基本資料
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <PersonalInfoSection 
          formData={formData} 
          errors={errors} 
          onChange={handleChange('personal')} 
        />
      </Paper>
      
      <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          聯絡資訊
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <ContactInfoSection 
          formData={formData} 
          errors={errors} 
          onChange={handleChange('contact')} 
        />
      </Paper>
      
      <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          工作資訊
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <WorkInfoSection 
          formData={formData} 
          errors={errors} 
          onChange={handleChange('work')} 
        />
      </Paper>
      
      <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          身分證影像
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <IDCardSection 
          formData={formData} 
          errors={errors} 
          onFileChange={handleFileChange} 
        />
      </Paper>
      
      <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          其他資訊
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <AdditionalInfoSection 
          formData={formData} 
          errors={errors} 
          onChange={handleChange('additional')} 
        />
      </Paper>
      
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="outlined" 
          sx={{ mr: 2 }}
          onClick={() => window.history.back()}
          disabled={isSubmitting}
        >
          取消
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          color="primary"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {buttonText}
        </Button>
      </Box>
    </Box>
  );
};

EmployeeForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  isSubmitting: PropTypes.bool
};

export default EmployeeForm;
