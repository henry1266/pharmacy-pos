import React from 'react';
import { keyframes } from '@emotion/react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Avatar,
  List,
  ListItem,
  Divider,
  Box,
  Button,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { SupplierData } from '../types/supplier.types';
import SupplierAccountMappingDisplay from './SupplierAccountMappingDisplay';

interface SupplierDetailPanelProps {
  selectedSupplier: SupplierData | null;
  onEdit: (supplier: SupplierData) => void;
  onDelete: (supplier: SupplierData) => void;
}

// 定義箭頭動畫
const arrowBounce = keyframes`
  0%, 100% {
    transform: translateX(-5px);
  }
  50% {
    transform: translateX(-15px);
  }
`;

const SupplierDetailPanel: React.FC<SupplierDetailPanelProps> = ({
  selectedSupplier,
  onEdit,
  onDelete
}) => {
  const navigate = useNavigate();

  if (!selectedSupplier) {
    return (
      <Card
        elevation={2}
        className="supplier-card"
        sx={{
          borderRadius: '0.5rem',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: 6
          },
          '&:hover .arrow-icon': {
            animation: `${arrowBounce} 0.8s infinite`,
            color: 'primary.dark'
          }
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 3, width: '100%' }}>
          {/* 大型供應商圖標 */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            <BusinessIcon
              color="primary"
              sx={{
                fontSize: '4rem',
                mb: 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  color: 'primary.dark'
                }
              }}
            />
          </Box>
          
          {/* 內容區域 */}
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'center' }}>
              <ArrowBackIcon
                color="primary"
                className="arrow-icon"
                sx={{
                  fontSize: '2rem',
                  mr: 1,
                  transform: 'translateX(-10px)',
                  animation: 'arrowPulse 1.5s infinite',
                  transition: 'color 0.3s ease'
                }}
              />
              <Typography variant="body1" color="primary.main" sx={{ fontWeight: 500 }}>
                左側列表
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              選擇一個供應商查看詳情
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={2} sx={{ borderRadius: '0.5rem', height: '100%' }}>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {selectedSupplier.shortCode?.charAt(0) ?? selectedSupplier.name?.charAt(0) ?? 'S'}
          </Avatar>
        }
        title={
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {selectedSupplier.name}
          </Typography>
        }
        subheader={`簡碼: ${selectedSupplier.shortCode ?? '無'}`}
        action={
          <Box>
            <Tooltip title="編輯">
              <IconButton color="primary" onClick={() => onEdit(selectedSupplier)} size="small">
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="刪除">
              <IconButton color="error" onClick={() => onDelete(selectedSupplier)} size="small">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
        sx={{ pb: 1 }}
      />
      <Divider />
      <CardContent sx={{ py: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          供應商資訊
        </Typography>
        <List dense sx={{ py: 0 }}>
          <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>
              供應商編號:
            </Typography>
            <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>
              {selectedSupplier.code}
            </Typography>
          </ListItem>
          <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>
              聯絡人:
            </Typography>
            <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>
              {selectedSupplier.contactPerson ?? '無'}
            </Typography>
          </ListItem>
          <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>
              電話:
            </Typography>
            <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>
              {selectedSupplier.phone ?? '無'}
            </Typography>
          </ListItem>
          <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>
              稅號:
            </Typography>
            <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>
              {selectedSupplier.taxId ?? '無'}
            </Typography>
          </ListItem>
          <ListItem sx={{ py: 0.5, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ width: '40%', color: 'text.secondary' }}>
              付款條件:
            </Typography>
            <Typography variant="body2" sx={{ width: '60%', fontWeight: 500 }}>
              {selectedSupplier.paymentTerms ?? '無'}
            </Typography>
          </ListItem>
          {selectedSupplier.notes && (
            <ListItem sx={{ py: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                備註:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                {selectedSupplier.notes}
              </Typography>
            </ListItem>
          )}
        </List>

        <Divider sx={{ my: 1.5 }} />

        {/* 會計科目配對顯示 */}
        <SupplierAccountMappingDisplay
          supplierId={selectedSupplier._id || selectedSupplier.id}
          supplierName={selectedSupplier.name}
          onEditClick={() => onEdit(selectedSupplier)}
        />

        <Divider sx={{ my: 1.5 }} />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <Button
            onClick={() => navigate(`/purchase-orders/supplier/${selectedSupplier.id}`)}
            variant="contained"
            color="primary"
            size="small"
            sx={{ textTransform: 'none' }}
          >
            查看進貨單
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SupplierDetailPanel;