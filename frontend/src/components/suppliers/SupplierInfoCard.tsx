import React, { FC } from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';
import PropTypes from 'prop-types';

// 定義供應商資料介面
interface Supplier {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  [key: string]: any;
}

// 定義組件 props 的介面
interface SupplierInfoCardProps {
  supplier: Supplier;
}

/**
 * 供應商基本資訊卡片
 * @param {SupplierInfoCardProps} props - 組件屬性
 * @returns {React.ReactElement} 供應商資訊卡片
 */
const SupplierInfoCard: FC<SupplierInfoCardProps> = ({ supplier }) => {
  if (!supplier) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          供應商資訊
        </Typography>
        <Grid container spacing={2}>
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              供應商名稱
            </Typography>
            <Typography variant="body1">
              {supplier.name}
            </Typography>
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              聯絡人
            </Typography>
            <Typography variant="body1">
              {supplier.contactPerson ?? '-'}
            </Typography>
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              電話
            </Typography>
            <Typography variant="body1">
              {supplier.phone ?? '-'}
            </Typography>
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              電子郵件
            </Typography>
            <Typography variant="body1">
              {supplier.email ?? '-'}
            </Typography>
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              地址
            </Typography>
            <Typography variant="body1">
              {supplier.address ?? '-'}
            </Typography>
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              備註
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {supplier.notes ?? '-'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

SupplierInfoCard.propTypes = {
  supplier: PropTypes.shape({
    name: PropTypes.string,
    contactPerson: PropTypes.string,
    phone: PropTypes.string,
    email: PropTypes.string,
    address: PropTypes.string,
    notes: PropTypes.string
  }).isRequired
} as any; // 使用 any 類型來避免 TypeScript 錯誤

export default SupplierInfoCard;