import React, { FC, ChangeEvent, SyntheticEvent } from 'react';
import PropTypes from 'prop-types';
import { 
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';

// 定義標籤頁內容的介面
interface TabContent {
  title: string;
  description: string;
}

// 定義組件 props 的介面
interface CsvImportDialogProps {
  open: boolean;
  onClose: () => void;
  tabValue: number;
  onTabChange: (event: SyntheticEvent, newValue: number) => void;
  csvFile: File | null;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onImport: () => void;
  loading: boolean;
  error?: string;
  success: boolean;
}

/**
 * CSV導入對話框組件
 * @param {CsvImportDialogProps} props - 組件屬性
 * @returns {React.ReactElement} CSV導入對話框組件
 */
const CsvImportDialog: FC<CsvImportDialogProps> = ({
  open,
  onClose,
  tabValue,
  onTabChange,
  csvFile,
  onFileChange,
  onImport,
  loading,
  error,
  success
}) => {
  // 標籤頁內容配置
  const tabContents: TabContent[] = [
    {
      title: "匯入進貨單基本資訊",
      description: "請上傳包含進貨單基本資訊的CSV文件。文件應包含以下欄位：進貨單號、發票號碼、發票日期、供應商、狀態、付款狀態等。"
    },
    {
      title: "匯入進貨品項",
      description: "請上傳包含進貨品項的CSV文件。文件應包含以下欄位：進貨單號、藥品代碼、藥品名稱、數量、總成本等。"
    }
  ];

  // 渲染標籤頁內容
  const renderTabContent = (index: number) => {
    if (tabValue !== index || index >= tabContents.length) return null;
    
    const content = tabContents[index];
    return (
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          {content.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {content.description}
        </Typography>
      </Box>
    );
  };

  // 渲染狀態訊息
  const renderStatusMessages = () => {
    return (
      <>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            CSV導入成功！
          </Alert>
        )}
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>CSV匯入進貨單</DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={onTabChange}>
            <Tab label="進貨單基本資訊" />
            <Tab label="進貨品項" />
          </Tabs>
        </Box>
        
        {renderTabContent(0)}
        {renderTabContent(1)}
        
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUploadIcon />}
            disabled={loading}
          >
            選擇CSV文件{' '}
            <input
              type="file"
              accept=".csv"
              hidden
              onChange={onFileChange}
            />
          </Button>
          {csvFile && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              已選擇: {csvFile.name}
            </Typography>
          )}
        </Box>
        
        {renderStatusMessages()}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button 
          onClick={onImport} 
          variant="contained" 
          disabled={!csvFile || loading}
        >
          匯入
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// PropTypes 驗證
CsvImportDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  tabValue: PropTypes.number.isRequired,
  onTabChange: PropTypes.func.isRequired,
  csvFile: PropTypes.object,
  onFileChange: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  success: PropTypes.bool.isRequired
} as any; // 使用 any 類型來避免 TypeScript 錯誤

export default CsvImportDialog;