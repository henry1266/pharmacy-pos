import React from 'react';
import { 
  Button,
  Box
} from '@mui/material';
import { 
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

/**
 * 表單操作按鈕組件
 * @param {Object} props - 組件屬性
 * @param {boolean} props.isSubmitting - 是否正在提交
 * @param {Function} props.onSave - 保存按鈕點擊處理函數
 * @param {Function} props.onCancel - 取消按鈕點擊處理函數
 * @returns {React.ReactElement} 表單操作按鈕組件
 */
const ActionButtons = ({
  isSubmitting,
  onSave,
  onCancel
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
      <Button
        variant="contained"
        color="primary"
        startIcon={<SaveIcon />}
        onClick={onSave}
        disabled={isSubmitting}
      >
        {isSubmitting ? '儲存中...' : '儲存'}
      </Button>
      <Button
        variant="outlined"
        startIcon={<CancelIcon />}
        onClick={onCancel}
        disabled={isSubmitting}
      >
        取消
      </Button>
    </Box>
  );
};

export default ActionButtons;
