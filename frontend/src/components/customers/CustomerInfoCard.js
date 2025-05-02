import React from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';

/**
 * 客戶基本資訊卡片
 * @param {Object} props - 組件屬性
 * @param {Object} props.customer - 客戶資料物件
 * @returns {React.ReactElement} 客戶資訊卡片
 */
const CustomerInfoCard = ({ customer }) => {
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
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              客戶名稱
            </Typography>
            <Typography variant="body1">
              {customer.name}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              聯絡人
            </Typography>
            <Typography variant="body1">
              {customer.contactPerson || '-'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              電話
            </Typography>
            <Typography variant="body1">
              {customer.phone || '-'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              電子郵件
            </Typography>
            <Typography variant="body1">
              {customer.email || '-'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              地址
            </Typography>
            <Typography variant="body1">
              {customer.address || '-'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              備註
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {customer.notes || '-'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default CustomerInfoCard;

