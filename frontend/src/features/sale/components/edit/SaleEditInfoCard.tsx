import React, { useEffect } from 'react';
import { Grid, Card, CardContent, TextField } from '@mui/material';
import { SaleEditInfoCardProps } from '../../types/edit';

/**
 * 銷售編輯信息卡片組件
 * 用於顯示條碼輸入框
 * 
 * @param props 組件屬性
 * @returns 銷售編輯信息卡片組件
 */
const SaleEditInfoCard: React.FC<SaleEditInfoCardProps> = ({
  barcode,
  handleBarcodeChange,
  handleBarcodeSubmit,
  barcodeInputRef
}) => {
  // 自動聚焦邏輯保留，但使用傳遞的 ref
  useEffect(() => {
    const focusTimeout = setTimeout(() => {
      if (barcodeInputRef.current) {
        // 初始聚焦或條碼掃描後重新聚焦（可能由父組件處理）
        // 讓我們確保在需要時進行初始聚焦
        // barcodeInputRef.current.focus(); 
        // 決定不在每次渲染時自動聚焦，父組件控制明確的聚焦。
      }
    }, 100);
    return () => clearTimeout(focusTimeout);
  }, [barcodeInputRef]); // 依賴於 ref 本身

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} {...({} as any)}>
            <TextField
              fullWidth
              label="條碼 / 代碼 / 簡碼 / 健保碼"
              value={barcode}
              onChange={handleBarcodeChange}
              onKeyDown={handleBarcodeSubmit}
              placeholder="掃描條碼或輸入產品代碼、簡碼、健保碼後按 Enter"
              inputRef={barcodeInputRef} // 使用傳遞的 ref
              autoComplete="off"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SaleEditInfoCard;