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
  ListItemText
} from '@mui/material';
import { 
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

import PageContainer from '../../components/common/PageContainer';
import ActionButton from '../../components/common/ActionButton';

// 模擬資料
const mockCustomers = [
  { 
    id: '1', 
    name: '王小明', 
    phone: '0912-345-678', 
    email: 'wang@example.com', 
    address: '台北市信義區信義路五段7號',
    level: 'gold',
    registerDate: '2023-01-15',
    totalSpent: 12500,
    status: 'active',
    birthdate: '1985-05-20',
    gender: 'male',
    notes: '對止痛藥過敏，需特別注意',
    lastVisit: '2023-12-10',
    points: 1250
  },
  { 
    id: '2', 
    name: '李小華', 
    phone: '0923-456-789', 
    email: 'lee@example.com', 
    address: '台北市大安區復興南路一段390號',
    level: 'silver',
    registerDate: '2023-02-20',
    totalSpent: 8300,
    status: 'active',
    birthdate: '1990-08-15',
    gender: 'female',
    notes: '偏好自然成分的保健品',
    lastVisit: '2023-11-25',
    points: 830
  },
  { 
    id: '3', 
    name: '張美玲', 
    phone: '0934-567-890', 
    email: 'chang@example.com', 
    address: '新北市板橋區文化路一段25號',
    level: 'bronze',
    registerDate: '2023-03-10',
    totalSpent: 4200,
    status: 'active',
    birthdate: '1978-12-03',
    gender: 'female',
    notes: '有高血壓病史',
    lastVisit: '2023-12-05',
    points: 420
  },
  { 
    id: '4', 
    name: '陳大偉', 
    phone: '0945-678-901', 
    email: 'chen@example.com', 
    address: '台中市西屯區台灣大道三段99號',
    level: 'gold',
    registerDate: '2023-01-05',
    totalSpent: 15800,
    status: 'active',
    birthdate: '1982-03-25',
    gender: 'male',
    notes: '定期購買糖尿病相關藥品',
    lastVisit: '2023-12-15',
    points: 1580
  },
  { 
    id: '5', 
    name: '林小芳', 
    phone: '0956-789-012', 
    email: 'lin@example.com', 
    address: '高雄市前鎮區中山二路2號',
    level: 'silver',
    registerDate: '2023-04-15',
    totalSpent: 7600,
    status: 'inactive',
    birthdate: '1995-10-08',
    gender: 'female',
    notes: '長期使用皮膚藥品',
    lastVisit: '2023-10-20',
    points: 760
  }
];

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模擬API請求
    setLoading(true);
    setTimeout(() => {
      const foundCustomer = mockCustomers.find(c => c.id === id);
      setCustomer(foundCustomer || null);
      setLoading(false);
    }, 500);
  }, [id]);

  const handleEdit = () => {
    navigate(`/customers/${id}/edit`);
  };

  const handleBack = () => {
    navigate('/customers');
  };

  const getLevelLabel = (level) => {
    switch(level) {
      case 'gold': return '金卡會員';
      case 'silver': return '銀卡會員';
      case 'bronze': return '銅卡會員';
      default: return '一般會員';
    }
  };

  const getGenderLabel = (gender) => {
    switch(gender) {
      case 'male': return '男';
      case 'female': return '女';
      default: return '未指定';
    }
  };

  if (loading) {
    return (
      <PageContainer title="會員詳情" subtitle="載入中...">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <Typography>載入中...</Typography>
        </Box>
      </PageContainer>
    );
  }

  if (!customer) {
    return (
      <PageContainer title="會員詳情" subtitle="找不到會員">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <Typography>找不到ID為 {id} 的會員</Typography>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="會員詳情"
      subtitle={customer.name}
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
                  <ListItemText primary="會員姓名" secondary={customer.name} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="聯絡電話" secondary={customer.phone} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="電子郵件" secondary={customer.email} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="地址" secondary={customer.address} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="出生日期" secondary={customer.birthdate} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="性別" secondary={getGenderLabel(customer.gender)} />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="狀態" 
                    secondary={
                      <Chip 
                        label={customer.status === 'active' ? '啟用' : '停用'} 
                        color={customer.status === 'active' ? 'success' : 'error'}
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
                會員資訊
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                <ListItem divider>
                  <ListItemText 
                    primary="會員等級" 
                    secondary={
                      <Chip 
                        label={getLevelLabel(customer.level)} 
                        color={
                          customer.level === 'gold' ? 'warning' : 
                          customer.level === 'silver' ? 'secondary' : 
                          customer.level === 'bronze' ? 'error' : 'default'
                        }
                        size="small"
                      />
                    } 
                  />
                </ListItem>
                <ListItem divider>
                  <ListItemText 
                    primary="累計消費" 
                    secondary={`$${customer.totalSpent.toLocaleString()}`} 
                  />
                </ListItem>
                <ListItem divider>
                  <ListItemText 
                    primary="會員點數" 
                    secondary={customer.points.toLocaleString()} 
                  />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="註冊日期" secondary={customer.registerDate} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="最後造訪日期" secondary={customer.lastVisit} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="備註" secondary={customer.notes || '無'} />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default CustomerDetail;
