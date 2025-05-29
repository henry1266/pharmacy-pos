import React from 'react';
import { Chip } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * 出貨單付款狀態標籤組件
 * @param {Object} props - 組件屬性
 * @param {string} props.status - 付款狀態值
 * @returns {React.ReactElement} 付款狀態標籤組件
 */
const PaymentStatusChip = ({ status }) => {
  let color = 'default';
  let label = status || '未收';
  
  switch (status) {
    case '未付':
      color = 'warning';
      break;
    case '未收':
      color = 'warning';
      break;
    case '已收款':
      color = 'info';
      break;
    case '已下收':
      color = 'info';
      break;
    case '已匯款':
      color = 'success';
      break; // 添加缺少的 break 語句
    case '已開立':
      color = 'success';
      break;
    default:
      // 預設情況已在初始化時處理
      break;
  }
  
  return <Chip size="small" color={color} label={label} />;
};

// 添加 Props 驗證
PaymentStatusChip.propTypes = {
  status: PropTypes.string
};

// 預設值
PaymentStatusChip.defaultProps = {
  status: '未收'
};

export default PaymentStatusChip;
