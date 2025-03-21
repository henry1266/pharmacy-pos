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
const mockProducts = [
  { 
    id: '1', 
    name: '阿斯匹靈', 
    category: '止痛藥', 
    price: 120, 
    stock: 500,
    supplier: '永信藥品',
    expiry: '2025-12-31',
    status: 'active',
    description: '阿斯匹靈是一種非類固醇消炎藥，具有解熱、鎮痛、抗發炎等功效。',
    dosage: '成人每次1-2錠，每日3-4次，飯後服用。',
    sideEffects: '可能引起胃部不適、噁心、嘔吐等副作用。',
    batchNumber: 'ASP20230501',
    location: 'A-12-3',
    createdAt: '2023-05-01',
    updatedAt: '2023-05-01'
  },
  { 
    id: '2', 
    name: '普拿疼', 
    category: '止痛藥', 
    price: 80, 
    stock: 350,
    supplier: '台灣武田',
    expiry: '2025-10-15',
    status: 'active',
    description: '普拿疼含有acetaminophen成分，用於緩解輕至中度疼痛和退燒。',
    dosage: '成人每次1-2錠，每日4-6次，間隔至少4小時。',
    sideEffects: '長期大量使用可能導致肝臟損傷。',
    batchNumber: 'TYL20230315',
    location: 'A-10-5',
    createdAt: '2023-03-15',
    updatedAt: '2023-03-15'
  },
  { 
    id: '3', 
    name: '胃腸藥', 
    category: '腸胃藥', 
    price: 150, 
    stock: 200,
    supplier: '信東生技',
    expiry: '2026-03-20',
    status: 'active',
    description: '用於緩解胃酸過多、消化不良、胃痛等症狀。',
    dosage: '成人每次1包，每日3次，飯後服用。',
    sideEffects: '可能引起便秘或腹瀉。',
    batchNumber: 'STM20230620',
    location: 'B-05-2',
    createdAt: '2023-06-20',
    updatedAt: '2023-06-20'
  },
  { 
    id: '4', 
    name: '感冒糖漿', 
    category: '感冒藥', 
    price: 180, 
    stock: 150,
    supplier: '生達製藥',
    expiry: '2025-08-10',
    status: 'active',
    description: '用於緩解感冒症狀，包括咳嗽、流鼻涕、喉嚨痛等。',
    dosage: '成人每次10-15ml，每日3-4次。',
    sideEffects: '可能引起嗜睡。',
    batchNumber: 'CLD20230410',
    location: 'C-08-1',
    createdAt: '2023-04-10',
    updatedAt: '2023-04-10'
  },
  { 
    id: '5', 
    name: '維他命C', 
    category: '維他命', 
    price: 250, 
    stock: 300,
    supplier: '杏輝藥品',
    expiry: '2026-05-25',
    status: 'active',
    description: '補充維他命C，增強免疫力。',
    dosage: '成人每日1-2錠。',
    sideEffects: '大劑量可能引起腹瀉。',
    batchNumber: 'VTC20230725',
    location: 'D-02-4',
    createdAt: '2023-07-25',
    updatedAt: '2023-07-25'
  }
];

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模擬API請求
    setLoading(true);
    setTimeout(() => {
      const foundProduct = mockProducts.find(p => p.id === id);
      setProduct(foundProduct || null);
      setLoading(false);
    }, 500);
  }, [id]);

  const handleEdit = () => {
    navigate(`/products/${id}/edit`);
  };

  const handleBack = () => {
    navigate('/products');
  };

  if (loading) {
    return (
      <PageContainer title="藥品詳情" subtitle="載入中...">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <Typography>載入中...</Typography>
        </Box>
      </PageContainer>
    );
  }

  if (!product) {
    return (
      <PageContainer title="藥品詳情" subtitle="找不到藥品">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <Typography>找不到ID為 {id} 的藥品</Typography>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="藥品詳情"
      subtitle={product.name}
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
                  <ListItemText primary="藥品名稱" secondary={product.name} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="類別" secondary={product.category} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="價格" secondary={`$${product.price}`} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="庫存" secondary={product.stock} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="供應商" secondary={product.supplier} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="有效期限" secondary={product.expiry} />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="狀態" 
                    secondary={
                      <Chip 
                        label={product.status === 'active' ? '啟用' : '停用'} 
                        color={product.status === 'active' ? 'success' : 'error'}
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
                  <ListItemText 
                    primary="藥品描述" 
                    secondary={product.description} 
                  />
                </ListItem>
                <ListItem divider>
                  <ListItemText 
                    primary="用法用量" 
                    secondary={product.dosage} 
                  />
                </ListItem>
                <ListItem divider>
                  <ListItemText 
                    primary="副作用" 
                    secondary={product.sideEffects} 
                  />
                </ListItem>
                <ListItem divider>
                  <ListItemText 
                    primary="批次號碼" 
                    secondary={product.batchNumber} 
                  />
                </ListItem>
                <ListItem divider>
                  <ListItemText 
                    primary="儲存位置" 
                    secondary={product.location} 
                  />
                </ListItem>
                <ListItem divider>
                  <ListItemText 
                    primary="建立日期" 
                    secondary={product.createdAt} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="更新日期" 
                    secondary={product.updatedAt} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default ProductDetail;
