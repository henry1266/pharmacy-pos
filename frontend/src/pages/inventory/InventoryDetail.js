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
const mockInventory = [
  { 
    id: '1', 
    productId: '1',
    productName: '阿斯匹靈', 
    batchNumber: 'ASP20230501',
    quantity: 500,
    location: 'A-12-3',
    expiryDate: '2025-12-31',
    purchaseDate: '2023-05-01',
    purchasePrice: 80,
    sellingPrice: 120,
    status: 'active',
    supplier: '永信藥品',
    category: '止痛藥',
    notes: '正常儲存於陰涼乾燥處',
    lastUpdated: '2023-12-15',
    minimumStock: 100,
    reorderPoint: 150
  },
  { 
    id: '2', 
    productId: '2',
    productName: '普拿疼', 
    batchNumber: 'TYL20230315',
    quantity: 350,
    location: 'A-10-5',
    expiryDate: '2025-10-15',
    purchaseDate: '2023-03-15',
    purchasePrice: 50,
    sellingPrice: 80,
    status: 'active',
    supplier: '台灣武田',
    category: '止痛藥',
    notes: '避免陽光直射',
    lastUpdated: '2023-11-20',
    minimumStock: 80,
    reorderPoint: 120
  },
  { 
    id: '3', 
    productId: '3',
    productName: '胃腸藥', 
    batchNumber: 'STM20230620',
    quantity: 200,
    location: 'B-05-2',
    expiryDate: '2026-03-20',
    purchaseDate: '2023-06-20',
    purchasePrice: 100,
    sellingPrice: 150,
    status: 'active',
    supplier: '信東生技',
    category: '腸胃藥',
    notes: '儲存於室溫下',
    lastUpdated: '2023-12-05',
    minimumStock: 50,
    reorderPoint: 80
  },
  { 
    id: '4', 
    productId: '4',
    productName: '感冒糖漿', 
    batchNumber: 'CLD20230410',
    quantity: 150,
    location: 'C-08-1',
    expiryDate: '2025-08-10',
    purchaseDate: '2023-04-10',
    purchasePrice: 120,
    sellingPrice: 180,
    status: 'active',
    supplier: '生達製藥',
    category: '感冒藥',
    notes: '開封後需冷藏保存',
    lastUpdated: '2023-10-15',
    minimumStock: 30,
    reorderPoint: 50
  },
  { 
    id: '5', 
    productId: '5',
    productName: '維他命C', 
    batchNumber: 'VTC20230725',
    quantity: 300,
    location: 'D-02-4',
    expiryDate: '2026-05-25',
    purchaseDate: '2023-07-25',
    purchasePrice: 180,
    sellingPrice: 250,
    status: 'active',
    supplier: '杏輝藥品',
    category: '維他命',
    notes: '保存於陰涼乾燥處',
    lastUpdated: '2023-11-10',
    minimumStock: 60,
    reorderPoint: 100
  }
];

const InventoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模擬API請求
    setLoading(true);
    setTimeout(() => {
      const foundInventory = mockInventory.find(item => item.id === id);
      setInventory(foundInventory || null);
      setLoading(false);
    }, 500);
  }, [id]);

  const handleEdit = () => {
    navigate(`/inventory/${id}/edit`);
  };

  const handleBack = () => {
    navigate('/inventory');
  };

  if (loading) {
    return (
      <PageContainer title="庫存詳情" subtitle="載入中...">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <Typography>載入中...</Typography>
        </Box>
      </PageContainer>
    );
  }

  if (!inventory) {
    return (
      <PageContainer title="庫存詳情" subtitle="找不到庫存項目">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <Typography>找不到ID為 {id} 的庫存項目</Typography>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="庫存詳情"
      subtitle={inventory.productName}
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
                  <ListItemText primary="藥品名稱" secondary={inventory.productName} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="批次號碼" secondary={inventory.batchNumber} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="庫存數量" secondary={inventory.quantity} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="儲存位置" secondary={inventory.location} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="有效期限" secondary={inventory.expiryDate} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="類別" secondary={inventory.category} />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="狀態" 
                    secondary={
                      <Chip 
                        label={inventory.status === 'active' ? '正常' : '停用'} 
                        color={inventory.status === 'active' ? 'success' : 'error'}
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
                價格與供應資訊
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                <ListItem divider>
                  <ListItemText 
                    primary="進貨價" 
                    secondary={`$${inventory.purchasePrice}`} 
                  />
                </ListItem>
                <ListItem divider>
                  <ListItemText 
                    primary="售價" 
                    secondary={`$${inventory.sellingPrice}`} 
                  />
                </ListItem>
                <ListItem divider>
                  <ListItemText 
                    primary="毛利" 
                    secondary={`$${inventory.sellingPrice - inventory.purchasePrice} (${Math.round((inventory.sellingPrice - inventory.purchasePrice) / inventory.sellingPrice * 100)}%)`} 
                  />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="供應商" secondary={inventory.supplier} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="進貨日期" secondary={inventory.purchaseDate} />
                </ListItem>
                <ListItem divider>
                  <ListItemText primary="最低庫存量" secondary={inventory.minimumStock} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="再訂購點" secondary={inventory.reorderPoint} />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                其他資訊
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                <ListItem divider>
                  <ListItemText primary="備註" secondary={inventory.notes || '無'} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="最後更新日期" secondary={inventory.lastUpdated} />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default InventoryDetail;
