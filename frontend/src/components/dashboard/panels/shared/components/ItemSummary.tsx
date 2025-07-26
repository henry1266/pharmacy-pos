import React from 'react';
import { Box, Typography } from '@mui/material';
import { DAILY_PANEL_STYLES } from '../styles';

export interface ItemSummaryProps {
  orderNumber?: string;
  amount: number;
  rightContent?: React.ReactNode;
  amountColor?: string;
}

/**
 * 通用的項目摘要組件
 * 用於顯示訂單號、金額和右側內容
 */
export const ItemSummary: React.FC<ItemSummaryProps> = ({
  orderNumber,
  amount,
  rightContent,
  amountColor = 'primary.main'
}) => {
  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 1,
      width: '100%'
    }}>
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 'bold',
          ...DAILY_PANEL_STYLES.typography.large,
          ...DAILY_PANEL_STYLES.typography.ellipsis,
          flex: '0 1 auto',
          minWidth: 0
        }}
      >
        {orderNumber ?? '無單號'}
      </Typography>
      
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 'bold',
          color: amountColor,
          ...DAILY_PANEL_STYLES.typography.medium,
          flexShrink: 0
        }}
      >
        ${amount.toFixed(0)}
      </Typography>
      
      {rightContent && (
        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
          {rightContent}
        </Box>
      )}
    </Box>
  );
};

export interface ItemDetailHeaderProps {
  icon: React.ReactNode;
  text: string;
  rightContent?: React.ReactNode;
}

/**
 * 通用的項目詳情標題組件
 */
export const ItemDetailHeader: React.FC<ItemDetailHeaderProps> = ({
  icon,
  text,
  rightContent
}) => {
  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 1,
      gap: 1
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
        {React.cloneElement(icon as React.ReactElement, {
          sx: { fontSize: 16, mr: 0.5, color: 'text.secondary' }
        })}
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{
            ...DAILY_PANEL_STYLES.typography.medium,
            ...DAILY_PANEL_STYLES.typography.ellipsis
          }}
        >
          {text}
        </Typography>
      </Box>
      
      {rightContent && (
        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
          {rightContent}
        </Box>
      )}
    </Box>
  );
};

export interface ItemListProps {
  title: string;
  items: Array<{
    name: string;
    quantity: number;
    price?: number;
  }>;
}

/**
 * 通用的項目列表組件
 */
export const ItemList: React.FC<ItemListProps> = ({ title, items }) => {
  return (
    <Box sx={{ mb: 1 }}>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 'medium',
          mb: 0.5,
          ...DAILY_PANEL_STYLES.typography.medium
        }}
      >
        {title}：
      </Typography>
      {items.map((item, index) => (
        <Typography
          key={index}
          variant="body2"
          color="textSecondary"
          sx={{
            ...DAILY_PANEL_STYLES.typography.small,
            ml: 1
          }}
        >
          • {item.name} x {item.quantity}
          {item.price !== undefined && ` = $${(item.quantity * item.price).toFixed(0)}`}
        </Typography>
      ))}
    </Box>
  );
};

export interface DetailLinkProps {
  href: string;
  onClick?: (e: React.MouseEvent) => void;
  text?: string;
}

/**
 * 通用的詳情連結組件
 */
export const DetailLink: React.FC<DetailLinkProps> = ({
  href,
  onClick,
  text = '詳情'
}) => {
  return (
    <Box sx={{ mt: 1, textAlign: 'right' }}>
      <Typography
        component="a"
        href={href}
        color="primary"
        sx={{
          ...DAILY_PANEL_STYLES.typography.small,
          fontWeight: 'medium',
          cursor: 'pointer',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline'
          }
        }}
        onClick={onClick}
      >
        {text}
      </Typography>
    </Box>
  );
};