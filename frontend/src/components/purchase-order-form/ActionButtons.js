import React from 'react';
import PropTypes from 'prop-types'; // 引入 PropTypes 進行 props 驗證
import { 
  Box, 
  Button
} from '@mui/material';
import { 
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

/**
 * 操作按鈕組件
 * @param {Object} props - 組件屬性
 * @param {boolean} props.loading - 是否正在加載
 * @param {Function} props.onCancel - 取消操作的函數
 * @returns {React.ReactElement} 操作按鈕組件
 */
const ActionButtons = ({
  loading,
  onCancel
}) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 3, mb: 3 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={onCancel}
        tabIndex="-1"
      >
        取消
      </Button>
      <Button
        type="submit"
        variant="contained"
        startIcon={<SaveIcon />}
        disabled={loading}
        tabIndex="-1"
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
};

export default ActionButtons;
