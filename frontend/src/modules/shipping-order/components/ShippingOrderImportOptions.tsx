import React, { FC, ChangeEvent, SyntheticEvent } from 'react';
import { Box, Typography, Divider } from '@mui/material';
import MedicineCsvImportController from '../../../components/shipping-orders/import/medicine-csv/MedicineCsvImportController';
import CsvImportDialog from '../../../components/shipping-orders/import/CsvImportDialog';

// 定義組件 props 的介面
interface ShippingOrderImportOptionsProps {
  openBasicImport: boolean;
  openItemsImport: boolean;
  handleBasicImportOpen: () => void;
  handleItemsImportOpen: () => void;
  handleImportClose: () => void;
  handleTabChange: (event: SyntheticEvent, newValue: number) => void;
  tabValue: number;
  csvFile?: File | null | undefined;
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleImport: () => void;
  loading?: boolean;
  error?: string;
  success?: boolean;
}

/**
 * 出貨單匯入選項組件
 * 整合各種CSV匯入選項，包括基本資訊、藥品項目和新增的藥品CSV匯入器
 */
const ShippingOrderImportOptions: FC<ShippingOrderImportOptionsProps> = ({
  openBasicImport,
  openItemsImport,
  handleBasicImportOpen,
  handleItemsImportOpen,
  handleImportClose,
  handleTabChange,
  tabValue,
  csvFile,
  handleFileChange,
  handleImport,
  loading,
  error,
  success
}) => {
  return (
    <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>
        出貨單匯入選項
      </Typography>
      
      <Divider sx={{ mb: 2 }} />
      
      {/* 原有的CSV匯入選項 */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          標準CSV匯入
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box>
            <Typography variant="button" onClick={handleBasicImportOpen} sx={{ cursor: 'pointer', color: 'primary.main' }}>
              匯入基本資訊
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
              出貨單號、發票號碼、日期、客戶等
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="button" onClick={handleItemsImportOpen} sx={{ cursor: 'pointer', color: 'primary.main' }}>
              匯入藥品項目
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
              出貨單號、藥品代碼、數量、金額等
            </Typography>
          </Box>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {/* 新增的藥品CSV匯入器 */}
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          簡化藥品匯入
        </Typography>
        
        <MedicineCsvImportController />
      </Box>
      
      {/* 原有的CSV匯入對話框 */}
      <CsvImportDialog
        open={openBasicImport || openItemsImport}
        onClose={handleImportClose}
        tabValue={tabValue}
        onTabChange={handleTabChange}
        csvFile={csvFile ?? null}
        onFileChange={handleFileChange}
        onImport={handleImport}
        loading={loading ?? false}
        {...(error && { error })}
        success={success ?? false}
      />
    </Box>
  );
};

export default ShippingOrderImportOptions;