import React, { FC } from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, Typography, Grid } from '@mui/material';

// 定義客戶資料介面
interface Customer {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  [key: string]: any;
}

// 定義組件 props 的介面
interface CustomerInfoCardProps {
  customer: Customer;
}

/**
 * 客戶基本資訊卡片
 * @param {CustomerInfoCardProps} props - 組件屬性
 * @returns {React.ReactElement} 客戶資訊卡片
 */
const CustomerInfoCard: FC<CustomerInfoCardProps> = ({ customer }) => {
  if (!customer) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          客戶資訊
        </Typography>
        <Grid container spacing={2}>
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              客戶名稱
            </Typography>
            <Typography variant="body1">
              {customer.name}
            </Typography>
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              聯絡人
            </Typography>
            <Typography variant="body1">
              {customer.contactPerson ?? '-'}
            </Typography>
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              電話
            </Typography>
            <Typography variant="body1">
              {customer.phone ?? '-'}
            </Typography>
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              電子郵件
            </Typography>
            <Typography variant="body1">
              {customer.email ?? '-'}
            </Typography>
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              地址
            </Typography>
            <Typography variant="body1">
              {customer.address ?? '-'}
            </Typography>
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              備註
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {customer.notes ?? '-'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// 添加 PropTypes 驗證
CustomerInfoCard.propTypes = {
  customer: PropTypes.shape({
    name: PropTypes.string,
    contactPerson: PropTypes.string,
    phone: PropTypes.string,
    email: PropTypes.string,
    address: PropTypes.string,
    notes: PropTypes.string
  }).isRequired
} as any; // 使用 any 類型來避免 TypeScript 錯誤

export default CustomerInfoCard;