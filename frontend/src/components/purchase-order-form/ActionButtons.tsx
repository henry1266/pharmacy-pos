import React, { FC } from 'react';
import PropTypes from 'prop-types'; // 引入 PropTypes 進行 props 驗證
import { 
  Box, 
  Button
} from '@mui/material';
import { 
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

// 定義組件 props 的介面
interface ActionButtonsProps {
  loading?: boolean;
  onCancel: () => void;
}

/**
 * 操作按鈕組件
 * @param {ActionButtonsProps} props - 組件屬性
 * @returns {React.ReactElement} 操作按鈕組件
 */
const ActionButtons: FC<ActionButtonsProps> = ({
  loading,
  onCancel
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 0 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={onCancel}
        tabIndex={-1}
        size="small"
      >
        取消
      </Button>
      <Button
        type="submit"
        variant="contained"
        startIcon={<SaveIcon />}
        disabled={loading}
        tabIndex={-1}
        size="small"
      >
        {loading ? '儲存中...' : '儲存進貨單'}
      </Button>
    </Box>
  );
};

// 添加 ActionButtons 的 PropTypes 驗證
ActionButtons.propTypes = {
  loading: PropTypes.bool,
  onCancel: PropTypes.func.isRequired // 添加缺失的 onCancel 驗證
} as any; // 使用 any 類型來避免 TypeScript 錯誤

export default ActionButtons;