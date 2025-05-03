import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
  Snackbar,
  Alert,
  Divider,
  CircularProgress,
  Stack,
  IconButton,
  Collapse,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  ListAlt as ListAltIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * Generic Detail Page Template Component
 *
 * Props:
 * - pageTitle: String - The title prefix (e.g., "銷售詳情", "採購單詳情")
 * - pageType: String - Identifier for the page type (e.g., "sales", "purchase", "shipping")
 * - id: String - The ID of the record from URL params
 * - apiEndpoint: String - Base API endpoint (e.g., "/api/sales")
 * - listPageUrl: String - URL to navigate back to the list page (e.g., "/sales")
 * - editPageUrl: String - URL for the edit page (e.g., "/sales/edit/:id")
 * - printPageUrl: String | null - URL for the print page, or null if not applicable
 * - recordIdentifierKey: String - Key in the fetched data object that holds the main identifier (e.g., "saleNumber", "purchaseOrderNumber")
 * - renderBasicInfo: Function(data, isSmallScreen) => ReactNode - Renders the basic info card content
 * - renderAmountInfo: Function(data, relatedData, isSmallScreen, loadingRelated) => ReactNode | null - Renders the amount info card content (optional)
 * - renderItemsTable: Function(data, relatedData, isSmallScreen, loadingRelated) => ReactNode - Renders the items list/table content
 * - fetchRelatedData: Function(id) => Promise<any> | null - Async function to fetch additional data (optional)
 * - additionalActions: Array<ReactNode> | null - Array of additional action buttons (optional)
 */
const DetailPageTemplate = ({
  pageTitle,
  pageType,
  id,
  apiEndpoint,
  listPageUrl,
  editPageUrl,
  printPageUrl,
  recordIdentifierKey,
  renderBasicInfo,
  renderAmountInfo,
  renderItemsTable,
  fetchRelatedData,
  additionalActions
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // State Management
  const [data, setData] = useState(null);
  const [relatedData, setRelatedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [error, setError] = useState(null);
  const [errorRelated, setErrorRelated] = useState(null);
  const [amountInfoOpen, setAmountInfoOpen] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch Main Data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${apiEndpoint}/${id}`);
      setData(response.data);
      setLoading(false);
    } catch (err) {
      console.error(`獲取${pageTitle}數據失敗:`, err);
      const errorMsg = `獲取${pageTitle}數據失敗: ${err.response?.data?.msg || err.message}`;
      setError(errorMsg);
      setLoading(false);
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
    }
  };

  // Fetch Related Data (if applicable)
  const handleFetchRelatedData = async () => {
    if (!fetchRelatedData) return;
    try {
      setLoadingRelated(true);
      setErrorRelated(null);
      const result = await fetchRelatedData(id);
      setRelatedData(result);
      setLoadingRelated(false);
    } catch (err) {
      console.error(`獲取相關數據失敗 (${pageType}):`, err);
      const errorMsg = `獲取相關數據失敗: ${err.response?.data?.msg || err.message}`;
      setErrorRelated(errorMsg);
      setLoadingRelated(false);
      // Show warning only if main data loaded successfully
      if (!error) {
          setSnackbar({ open: true, message: errorMsg, severity: 'warning' });
      }
    }
  };

  // Initial Data Load
  useEffect(() => {
    fetchData();
    handleFetchRelatedData(); // Fetch related data after main data potentially
  }, [id, apiEndpoint, pageType]); // Dependencies

  // Handle Snackbar Close
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Toggle Amount Info Collapse
  const handleToggleAmountInfo = () => {
    setAmountInfoOpen(!amountInfoOpen);
  };

  // --- Loading and Error States --- 
  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>載入中...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="h6">{error}</Typography>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate(listPageUrl)} sx={{ mt: 2 }}>
          返回列表
        </Button>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">找不到記錄</Typography>
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate(listPageUrl)} sx={{ mt: 2 }}>
          返回列表
        </Button>
      </Box>
    );
  }

  const recordIdentifier = data[recordIdentifierKey] || 'N/A';
  const finalEditUrl = editPageUrl.replace(':id', id);
  const finalPrintUrl = printPageUrl ? printPageUrl.replace(':id', id) : null;

  // --- Component Structure --- 
  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1}
        sx={{ mb: 3 }}
      >
        <Typography variant={isSmallScreen ? 'h5' : 'h4'} component="h1" gutterBottom={false} noWrap sx={{ flexShrink: 0 }}>
          {pageTitle} #{recordIdentifier}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
          {editPageUrl && (
            <Button variant="outlined" color="primary" size="small" startIcon={<EditIcon />} onClick={() => navigate(finalEditUrl)}>編輯</Button>
          )}
          {finalPrintUrl && (
            <Button variant="outlined" color="secondary" size="small" startIcon={<PrintIcon />} onClick={() => navigate(finalPrintUrl)}>列印</Button>
          )}
          {additionalActions}
          <Button variant="contained" size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate(listPageUrl)}>返回列表</Button>
        </Stack>
      </Stack>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            {/* Amount Information Card (Optional) */}
            {renderAmountInfo && (
              <Card variant="outlined">
                <CardContent sx={{ pb: '16px !important' }}>
                  <Grid container spacing={1} alignItems="center" justifyContent="space-between">
                    <Grid item xs={12} sm="auto" onClick={handleToggleAmountInfo} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', flexGrow: { xs: 1, sm: 0 } }}>
                      <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccountBalanceWalletIcon sx={{ verticalAlign: 'middle', mr: 1 }}/>金額信息
                      </Typography>
                      <IconButton size="small" sx={{ ml: 0.5 }}>
                        <ExpandMoreIcon sx={{ transform: amountInfoOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
                      </IconButton>
                    </Grid>
                    {/* Optional: Render a summary amount here if needed, passed via renderAmountInfo? */}
                  </Grid>
                </CardContent>
                <Collapse in={amountInfoOpen} timeout="auto" unmountOnExit>
                  <Divider />
                  <CardContent>
                    {renderAmountInfo(data, relatedData, isSmallScreen, loadingRelated, errorRelated)}
                  </CardContent>
                </Collapse>
              </Card>
            )}

            {/* Items Table Card */}
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6"><ListAltIcon sx={{ verticalAlign: 'middle', mr: 1 }}/>項目列表</Typography>
                  {/* Optional: Add controls like filtering/sorting here */} 
                </Stack>
                <Divider sx={{ mb: 2 }} />
                {renderItemsTable(data, relatedData, isSmallScreen, loadingRelated, errorRelated)}
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right Column (Sidebar Info) */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Basic Information Card */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom><InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }}/>基本信息</Typography>
                <Divider sx={{ mb: 2 }} />
                {renderBasicInfo(data, isSmallScreen)}
              </CardContent>
            </Card>
            {/* Optional: Add more cards to the sidebar if needed */} 
          </Stack>
        </Grid>
      </Grid>

      {/* Snackbar */} 
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DetailPageTemplate;

