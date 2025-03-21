import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Grid, 
  Typography, 
  Box, 
  Divider, 
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { 
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon
} from '@mui/icons-material';

import PageContainer from '../../components/common/PageContainer';
import ActionButton from '../../components/common/ActionButton';

// 模擬銷售資料
const mockSales = [
  { 
    id: '1', 
    invoiceNumber: 'INV-20230501-001', 
    date: '2023-05-01 14:30:25', 
    customer: '王小明',
    customerId: '1', 
    customerPhone: '0912-345-678',
    customerEmail: 'wang@example.com',
    items: [
      { id: '1', name: '阿斯匹靈', price: 120, quantity: 2, subtotal: 240 },
      { id: '2', name: '普拿疼', price: 80, quantity: 3, subtotal: 240 },
      { id: '3', name: '胃腸藥', price: 150, quantity: 1, subtotal: 150 },
      { id: '4', name: '感冒糖漿', price: 180, quantity: 2, subtotal: 360 },
      { id: '5', name: '維他命C', price: 250, quantity: 1, subtotal: 250 }
    ],
    subtotal: 1240,
    discount: 0,
    pointsUsed: 0,
    totalAmount: 1240,
    paymentMethod: '現金',
    amountPaid: 1500,
    change: 260,
    status: 'completed',
    staffName: '張藥師',
    notes: '客戶要求詳細用藥說明'
  },
  { 
    id: '2', 
    invoiceNumber: 'INV-20230502-001', 
    date: '2023-05-02 10:15:40', 
    customer: '李小華',
    customerId: '2', 
    customerPhone: '0923-456-789',
    customerEmail: 'lee@example.com',
    items: [
      { id: '1', name: '阿斯匹靈', price: 120, quantity: 1, subtotal: 120 },
      { id: '3', name: '胃腸藥', price: 150, quantity: 1, subtotal: 150 },
      { id: '5', name: '維他命C', price: 250, quantity: 1, subtotal: 250 }
    ],
    subtotal: 520,
    discount: 10,
    pointsUsed: 50,
    totalAmount: 450,
    paymentMethod: '信用卡',
    amountPaid: 450,
    change: 0,
    status: 'completed',
    staffName: '張藥師',
    notes: ''
  },
  // 其他銷售資料...
];

const SalesDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模擬API請求
    setLoading(true);
    setTimeout(() => {
      const foundSale = mockSales.find(s => s.id === id);
      setSale(foundSale || null);
      setLoading(false);
    }, 500);
  }, [id]);

  const handleEdit = () => {
    navigate(`/sales/${id}/edit`);
  };

  const handleBack = () => {
    navigate('/sales');
  };

  const handlePrint = () => {
    console.log(`列印銷售發票 ID: ${id}`);
    // 實際應用中應該調用列印功能
  };

  if (loading) {
    return (
      <PageContainer title="銷售詳情" subtitle="載入中...">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <Typography>載入中...</Typography>
        </Box>
      </PageContainer>
    );
  }

  if (!sale) {
    return (
      <PageContainer title="銷售詳情" subtitle="找不到銷售記錄">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <Typography>找不到ID為 {id} 的銷售記錄</Typography>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="銷售詳情"
      subtitle={`發票號碼: ${sale.invoiceNumber}`}
      action={
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ActionButton
            variant="outlined"
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            返回
          </ActionButton>
          <ActionButton
            variant="outlined"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            列印
          </ActionButton>
          <ActionButton
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={handleEdit}
          >
            編輯
          </ActionButton>
        </Box>
      }
    >
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                基本資訊
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                <ListItem divider>
                  <ListItemText primary="發票號碼" secondary={sale.invoiceNumber} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="日期時間" secondary={sale.date} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="經手人" secondary={sale.staffName} />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="狀態" 
                    secondary={
                      <Chip 
                        label={sale.status === 'completed' ? '已完成' : '處理中'} 
                        color={sale.status === 'completed' ? 'success' : 'warning'}
                        size="small"
                      />
                    } 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                客戶資訊
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                <ListItem divider>
                  <ListItemText primary="客戶姓名" secondary={sale.customer} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="聯絡電話" secondary={sale.customerPhone} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="電子郵件" secondary={sale.customerEmail} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="備註" secondary={sale.notes || '無'} />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                商品明細
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>商品名稱</TableCell>
                      <TableCell align="right">單價</TableCell>
                      <TableCell align="right">數量</TableCell>
                      <TableCell align="right">小計</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sale.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">${item.price}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">${item.subtotal}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <Typography variant="body1">
                  小計: ${sale.subtotal}
                </Typography>
                {sale.discount > 0 && (
                  <Typography variant="body1">
                    折扣 ({sale.discount}%): -${(sale.subtotal * sale.discount / 100).toFixed(2)}
                  </Typography>
                )}
                {sale.pointsUsed > 0 && (
                  <Typography variant="body1">
                    點數折抵: -${sale.pointsUsed}
                  </Typography>
                )}
                <Typography variant="h6" sx={{ mt: 1 }}>
                  總計: ${sale.totalAmount}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                付款資訊
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                <ListItem divider>
                  <ListItemText primary="付款方式" secondary={sale.paymentMethod} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="實收金額" secondary={`$${sale.amountPaid}`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="找零" secondary={`$${sale.change}`} />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default SalesDetail;
