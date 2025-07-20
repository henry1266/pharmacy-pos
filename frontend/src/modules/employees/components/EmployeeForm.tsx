import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import {
  Box,
  Button,
  CircularProgress
} from '@mui/material';
import PersonalInfoSection from './PersonalInfoSection';
import ContactInfoSection from './ContactInfoSection';
import WorkInfoSection from './WorkInfoSection';
import AdditionalInfoSection from './AdditionalInfoSection';
import FormSection from './shared/FormSection';

// 定義員工資料介面
export interface EmployeeFormData {
  // 個人基本資料
  name: string;
  gender: string;
  birthDate: string;
  idNumber: string;
  education: string;
  nativePlace: string;
  
  // 聯絡資訊
  address: string;
  phone: string;
  
  // 工作資訊
  position: string;
  department: string;
  hireDate: string;
  salary: string;
  insuranceDate: string;
  
  // 其他資訊
  experience: string;
  rewards: string;
  injuries: string;
  additionalInfo: string;
  
  // 身分證影像
  idCardFront: File | null;
  idCardBack: File | null;
  
  // 簽署資訊
  signDate: string;
  
  // 允許其他可能的屬性
  [key: string]: any;
}

// 定義錯誤介面
export interface FormErrors {
  [key: string]: string | null;
}

// 定義元件 Props 介面
interface EmployeeFormProps {
  onSubmit: (data: EmployeeFormData) => void;
  initialData?: EmployeeFormData | null;
  isSubmitting?: boolean;
}

// 性別轉換函數
const convertGender = (gender: string): string => {
  if (gender === '男') {
    return 'male';
  } else if (gender === '女') {
    return 'female';
  } else {
    return gender;
  }
};

/**
 * 員工表單元件
 * 整合所有表單區塊，處理表單狀態與提交邏輯
 */
const EmployeeForm: React.FC<EmployeeFormProps> = ({ onSubmit, initialData = null, isSubmitting = false }) => {
  // 初始表單資料
  const initialFormData: EmployeeFormData = {
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
  const [formData, setFormData] = useState<EmployeeFormData>(initialData ?? initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});

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
      if (formattedData.signDate) {
        formattedData.signDate = new Date(formattedData.signDate).toISOString().split('T')[0];
      }
      
      setFormData(formattedData);
    }
  }, [initialData]);

  // 處理表單欄位變更
  const handleChange = (section: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
  const handleFileChange = (name: string, file: File | null) => {
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
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
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
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (validateForm()) {
      // 準備 API 提交資料
      const apiData = {
        ...formData,
        // 將性別轉換為 API 格式
        gender: convertGender(formData.gender)
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

  // 渲染取消按鈕
  const renderCancelButton = () => {
    return (
      <Button 
        variant="outlined" 
        sx={{ mr: 2 }}
        onClick={() => window.history.back()}
        disabled={isSubmitting}
      >
        取消
      </Button>
    );
  };

  // 渲染提交按鈕
  const renderSubmitButton = () => {
    // 提取巢狀三元運算符為獨立變數
    let buttonText = '儲存';
    if (isSubmitting) {
      buttonText = '儲存中...';
    }
    
    // 按鈕圖標
    let buttonIcon = null;
    if (isSubmitting) {
      buttonIcon = <CircularProgress size={20} color="inherit" />;
    }
    
    return (
      <Button 
        type="submit" 
        variant="contained" 
        color="primary"
        disabled={isSubmitting}
        startIcon={buttonIcon}
      >
        {buttonText}
      </Button>
    );
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <FormSection title="個人基本資料">
        <PersonalInfoSection
          formData={formData}
          errors={errors}
          onChange={handleChange('personal')}
        />
      </FormSection>
      
      <FormSection title="聯絡資訊">
        <ContactInfoSection
          formData={formData}
          errors={errors}
          onChange={handleChange('contact')}
        />
      </FormSection>
      
      <FormSection title="工作資訊">
        <WorkInfoSection
          formData={formData}
          errors={errors}
          onChange={handleChange('work')}
        />
      </FormSection>    
      <FormSection title="其他資訊">
        <AdditionalInfoSection
          formData={formData}
          errors={errors}
          onChange={handleChange('additional')}
        />
      </FormSection>
      
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        {renderCancelButton()}
        {renderSubmitButton()}
      </Box>
    </Box>
  );
};

export default EmployeeForm;