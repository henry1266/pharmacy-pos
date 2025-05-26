import React from 'react';
import PropTypes from 'prop-types';
import { Button as MuiButton } from '@mui/material';

/**
 * 自定義按鈕組件
 * @param {Object} props - 組件屬性
 * @param {string} props.variant - 按鈕變體 (contained, outlined, text)
 * @param {string} props.color - 按鈕顏色 (primary, secondary, success, error, info, warning)
 * @param {string} props.size - 按鈕大小 (small, medium, large)
 * @param {boolean} props.fullWidth - 是否佔滿整行寬度
 * @param {function} props.onClick - 點擊事件處理函數
 * @param {React.ReactNode} props.children - 按鈕內容
 * @returns {React.ReactElement} 按鈕組件
 */
const Button = ({ 
  variant = 'contained', 
  color = 'primary', 
  size = 'medium',
  fullWidth = false,
  onClick,
  children,
  ...rest
}) => {
  return (
    <MuiButton
      variant={variant}
      color={color}
      size={size}
      fullWidth={fullWidth}
      onClick={onClick}
      {...rest}
    >
      {children}
    </MuiButton>
  );
};

// 添加 PropTypes 驗證
Button.propTypes = {
  variant: PropTypes.string,
  color: PropTypes.string,
  size: PropTypes.string,
  fullWidth: PropTypes.bool,
  onClick: PropTypes.func,
  children: PropTypes.node
};

export default Button;
