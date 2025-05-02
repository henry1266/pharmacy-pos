import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Paper // Added for potential right column content
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { format } from 'date-fns'; // Keep for potential date formatting

import SupplierInfoCard from '../components/suppliers/SupplierInfoCard';
import TwoColumnLayout from '../components/common/TwoColumnLayout'; // Use the two-column layout

const SupplierDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchSupplierData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/suppliers/${id}`);
        setSupplier(response.data);
        setLoading(false);
      } catch (err) {
        console.error('獲取供應商詳情失敗:', err);
        setError(err.response?.data?.message || '獲取供應商詳情失敗');
        setLoading(false);
      }
    };
    
    if (id) {
      fetchSupplierData();
    }
  }, [id]);
  
  const handleBack = () => {
    navigate('/suppliers'); // Navigate back to suppliers list page
  };
  
  const handleEdit = () => {
    // Navigate to supplier edit page or open edit dialog
    // Assuming a similar pattern to products, navigate back to list with state
    navigate('/suppliers', { state: { editSupplierId: id } });
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box>
        <Typography color="error" variant="h6">
          載入供應商詳情時發生錯誤: {error}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          返回供應商列表
        </Button>
      </Box>
    );
  }
  
  if (!supplier) {
    return (
      <Box>
        <Typography variant="h6">
          找不到供應商
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          返回供應商列表
        </Button>
      </Box>
    );
  }

  // Left Column: Supplier Info
  const leftContent = <SupplierInfoCard supplier={supplier} />;

  // Right Column: Placeholder for related info (e.g., Purchase Orders)
  const rightContent = (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          相關進貨單 (待實作)
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">
            此處將顯示與此供應商相關的進貨單列表。
          </Typography>
        </Paper>
      </CardContent>
    </Card>
  );
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          供應商詳情
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            返回列表
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEdit}
            sx={{ mr: 1 }}
          >
            編輯
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => window.print()} // Basic print functionality
          >
            列印
          </Button>
        </Box>
      </Box>
      
      <TwoColumnLayout 
        leftContent={leftContent} 
        rightContent={rightContent} 
        leftWidth={4} 
        rightWidth={8} 
      />
    </Box>
  );
};

export default SupplierDetailPage;

