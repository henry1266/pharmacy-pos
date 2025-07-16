import React, { useState, ChangeEvent } from 'react';
import { 
  Grid, 
  Box,
  Typography,
  Button
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { EmployeeFormData, FormErrors } from './EmployeeForm';

// 定義元件 Props 介面
interface IDCardSectionProps {
  formData: EmployeeFormData;
  errors: FormErrors;
  onFileChange: (name: string, file: File | null) => void;
}

/**
 * 身分證影像區塊
 * 處理身分證正反面上傳與預覽
 */
const IDCardSection: React.FC<IDCardSectionProps> = ({ formData, errors, onFileChange }) => {
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  // 處理檔案選擇
  const handleFileSelect = (side: 'front' | 'back') => (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      const file = event.target.files[0];
      
      // 檢查檔案類型
      if (!file.type.match('image.*')) {
        alert('請選擇圖片檔案');
        return;
      }
      
      // 檢查檔案大小 (限制為 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('檔案大小不能超過 5MB');
        return;
      }
      
      // 更新預覽
      const reader = new FileReader();
      reader.onload = (e) => {
        if (side === 'front') {
          setFrontPreview(e.target?.result as string);
        } else {
          setBackPreview(e.target?.result as string);
        }
      };
      reader.readAsDataURL(file);
      
      // 更新表單資料
      onFileChange(side === 'front' ? 'idCardFront' : 'idCardBack', file);
    }
  };

  return (
    <Grid container spacing={3} {...({} as any)}>
      {/* 身分證正面 */}
      <Grid item xs={12} sm={6} {...({} as any)}>
        <Typography variant="subtitle1" gutterBottom>
          身分證正面
        </Typography>
        <Box 
          sx={{ 
            border: '1px dashed #ccc', 
            borderRadius: 1, 
            p: 2, 
            minHeight: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f9f9f9'
          }}
        >
          {frontPreview ? (
            <Box sx={{ width: '100%', textAlign: 'center' }}>
              <img 
                src={frontPreview} 
                alt="身分證正面預覽" 
                style={{ maxWidth: '100%', maxHeight: 180 }} 
              />
              <Button 
                variant="outlined" 
                size="small" 
                sx={{ mt: 1 }}
                onClick={() => {
                  setFrontPreview(null);
                  onFileChange('idCardFront', null);
                }}
              >
                移除
              </Button>
            </Box>
          ) : (
            <>
              <input
                accept="image/*"
                id="id-card-front-upload"
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileSelect('front')}
              />
              <label htmlFor="id-card-front-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                >
                  上傳圖片
                </Button>
              </label>
              <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
                支援 JPG, PNG 格式，檔案大小不超過 5MB
              </Typography>
            </>
          )}
        </Box>
      </Grid>
      
      {/* 身分證反面 */}
      <Grid item xs={12} sm={6} {...({} as any)}>
        <Typography variant="subtitle1" gutterBottom>
          身分證反面
        </Typography>
        <Box 
          sx={{ 
            border: '1px dashed #ccc', 
            borderRadius: 1, 
            p: 2, 
            minHeight: 200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f9f9f9'
          }}
        >
          {backPreview ? (
            <Box sx={{ width: '100%', textAlign: 'center' }}>
              <img 
                src={backPreview} 
                alt="身分證反面預覽" 
                style={{ maxWidth: '100%', maxHeight: 180 }} 
              />
              <Button 
                variant="outlined" 
                size="small" 
                sx={{ mt: 1 }}
                onClick={() => {
                  setBackPreview(null);
                  onFileChange('idCardBack', null);
                }}
              >
                移除
              </Button>
            </Box>
          ) : (
            <>
              <input
                accept="image/*"
                id="id-card-back-upload"
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileSelect('back')}
              />
              <label htmlFor="id-card-back-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                >
                  上傳圖片
                </Button>
              </label>
              <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
                支援 JPG, PNG 格式，檔案大小不超過 5MB
              </Typography>
            </>
          )}
        </Box>
      </Grid>
    </Grid>
  );
};

export default IDCardSection;