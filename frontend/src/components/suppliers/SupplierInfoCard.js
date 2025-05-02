import React from 'react';
import { Card, CardContent, Typography, Grid, Box } from '@mui/material';

/**
 * 供應商基本資訊卡片
 * @param {Object} props - 組件屬性
 * @param {Object} props.supplier - 供應商資料物件
 * @returns {React.ReactElement} 供應商資訊卡片
 */
const SupplierInfoCard = ({ supplier }) => {
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
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              供應商名稱
            </Typography>
            <Typography variant="body1">
              {supplier.name}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              聯絡人
            </Typography>
            <Typography variant="body1">
              {supplier.contactPerson || '-'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              電話
            </Typography>
            <Typography variant="body1">
              {supplier.phone || '-'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              電子郵件
            </Typography>
            <Typography variant="body1">
              {supplier.email || '-'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              地址
            </Typography>
            <Typography variant="body1">
              {supplier.address || '-'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              備註
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {supplier.notes || '-'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SupplierInfoCard;

