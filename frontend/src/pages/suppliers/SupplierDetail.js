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
const mockSuppliers = [
  { 
    id: '1', 
    name: '永信藥品', 
    contact: '張經理', 
    phone: '02-2345-6789', 
    email: 'contact@yungshin.com',
    address: '台北市信義區信義路五段7號',
    status: 'active',
    taxId: '12345678',
    website: 'https://www.yungshin.com',
    notes: '主要提供各類止痛藥和感冒藥',
    paymentTerms: '月結30天',
    createdAt: '2023-01-15',
    updatedAt: '2023-05-20'
  },
  { 
    id: '2', 
    name: '台灣武田', 
    contact: '李經理', 
    phone: '02-8765-4321', 
    email: 'contact@takeda.com.tw',
    address: '台北市南港區園區街3號',
    status: 'active',
    taxId: '87654321',
    website: 'https://www.takeda.com.tw',
    notes: '日本藥廠台灣分公司，提供高品質藥品',
    paymentTerms: '月結45天',
    createdAt: '2023-02-10',
    updatedAt: '2023-06-15'
  },
  { 
    id: '3', 
    name: '信東生技', 
    contact: '王經理', 
    phone: '03-456-7890', 
    email: 'contact@sintong.com',
    address: '桃園市中壢區中央西路三段150號',
    status: 'active',
    taxId: '23456789',
    website: 'https://www.sintong.com',
    notes: '專注於生技藥品研發與製造',
    paymentTerms: '月結60天',
    createdAt: '2023-03-05',
    updatedAt: '2023-07-10'
  },
  { 
    id: '4', 
    name: '生達製藥', 
    contact: '陳經理', 
    phone: '07-123-4567', 
    email: 'contact@standard.com.tw',
    address: '高雄市前鎮區復興四路12號',
    status: 'active',
    taxId: '34567890',
    website: 'https://www.standard.com.tw',
    notes: '提供多種處方藥和非處方藥',
    paymentTerms: '月結30天',
    createdAt: '2023-04-20',
    updatedAt: '2023-08-05'
  },
  { 
    id: '5', 
    name: '杏輝藥品', 
    contact: '林經理', 
    phone: '04-567-8901', 
    email: 'contact@sinphar.com',
    address: '台中市西屯區工業區一路10號',
    status: 'inactive',
    taxId: '45678901',
    website: 'https://www.sinphar.com',
    notes: '專注於中藥製劑和保健品',
    paymentTerms: '月結45天',
    createdAt: '2023-05-15',
    updatedAt: '2023-09-01'
  }
];

const SupplierDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模擬API請求
    setLoading(true);
    setTimeout(() => {
      const foundSupplier = mockSuppliers.find(s => s.id === id);
      setSupplier(foundSupplier || null);
      setLoading(false);
    }, 500);
  }, [id]);

  const handleEdit = () => {
    navigate(`/suppliers/${id}/edit`);
  };

  const handleBack = () => {
    navigate('/suppliers');
  };

  if (loading) {
    return (
      <PageContainer title="供應商詳情" subtitle="載入中...">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <Typography>載入中...</Typography>
        </Box>
      </PageContainer>
    );
  }

  if (!supplier) {
    return (
      <PageContainer title="供應商詳情" subtitle="找不到供應商">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <Typography>找不到ID為 {id} 的供應商</Typography>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="供應商詳情"
      subtitle={supplier.name}
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
                  <ListItemText primary="供應商名稱" secondary={supplier.name} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="聯絡人" secondary={supplier.contact} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="聯絡電話" secondary={supplier.phone} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="電子郵件" secondary={supplier.email} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="地址" secondary={supplier.address} />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="狀態" 
                    secondary={
                      <Chip 
                        label={supplier.status === 'active' ? '啟用' : '停用'} 
                        color={supplier.status === 'active' ? 'success' : 'error'}
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
                詳細資訊
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                <ListItem divider>
                  <ListItemText primary="統一編號" secondary={supplier.taxId} />
                </ListItem>
                <ListItem divider>
                  <ListItemText 
                    primary="網站" 
                    secondary={
                      supplier.website ? (
                        <a href={supplier.website} target="_blank" rel="noopener noreferrer">
                          {supplier.website}
                        </a>
                      ) : '無'
                    } 
                  />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="付款條件" secondary={supplier.paymentTerms} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="備註" secondary={supplier.notes || '無'} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="建立日期" secondary={supplier.createdAt} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="更新日期" secondary={supplier.updatedAt} />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default SupplierDetail;
