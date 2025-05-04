import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Removed axios import
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
// Removed date-fns import as it's not used directly here

// Import Hook
import useCustomerDetailData from '../hooks/useCustomerDetailData'; // Import the new hook

// Import Presentation Components
import CustomerInfoCard from '../components/customers/CustomerInfoCard';
import TwoColumnLayout from '../components/common/TwoColumnLayout'; // Use the two-column layout

/**
 * Customer Detail Page (Refactored)
 * Uses useCustomerDetailData hook for data fetching and state management.
 */
const CustomerDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Use the custom hook for data and state management
  const { customer, loading, error } = useCustomerDetailData(id);

  // Event Handlers remain the same
  const handleBack = () => {
    navigate('/customers'); // Navigate back to customers list page
  };

  const handleEdit = () => {
    // Navigate to customer edit page or open edit dialog
    // Assuming a similar pattern to products, navigate back to list with state
    navigate('/customers', { state: { editCustomerId: id } });
  };

  // --- Render Logic --- (Uses data from hook)

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
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
      <Box sx={{ p: 3 }}>
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
    <Box sx={{ p: 3 }}>
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

