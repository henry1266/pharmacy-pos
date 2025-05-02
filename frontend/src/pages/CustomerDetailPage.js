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

import CustomerInfoCard from '../components/customers/CustomerInfoCard';
import TwoColumnLayout from '../components/common/TwoColumnLayout'; // Use the two-column layout

const CustomerDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);
        // Assuming an API endpoint exists at /api/customers/:id
        const response = await axios.get(`/api/customers/${id}`); 
        setCustomer(response.data);
        setLoading(false);
      } catch (err) {
        console.error('獲取客戶詳情失敗:', err);
        setError(err.response?.data?.message || '獲取客戶詳情失敗');
        setLoading(false);
      }
    };
    
    if (id) {
      fetchCustomerData();
    }
  }, [id]);
  
  const handleBack = () => {
    navigate('/customers'); // Navigate back to customers list page
  };
  
  const handleEdit = () => {
    // Navigate to customer edit page or open edit dialog
    // Assuming a similar pattern to products, navigate back to list with state
    navigate('/customers', { state: { editCustomerId: id } });
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
          載入客戶詳情時發生錯誤: {error}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          返回客戶列表
        </Button>
      </Box>
    );
  }
  
  if (!customer) {
    return (
      <Box>
        <Typography variant="h6">
          找不到客戶
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          返回客戶列表
        </Button>
      </Box>
    );
  }

  // Left Column: Customer Info
  const leftContent = <CustomerInfoCard customer={customer} />;

  // Right Column: Placeholder for related info (e.g., Shipping Orders)
  const rightContent = (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          相關出貨單 (待實作)
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">
            此處將顯示與此客戶相關的出貨單列表。
          </Typography>
        </Paper>
      </CardContent>
    </Card>
  );
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          客戶詳情
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

export default CustomerDetailPage;

