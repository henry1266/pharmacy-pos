import React from 'react';
import {
  CircularProgress,
  Box,
  Typography,
  Button,
  Grid as MuiGrid,
  Stack,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// 創建一個 Grid 組件，以便更容易使用
const Grid = MuiGrid as React.ComponentType<any>;

/**
 * Generic Detail Page Layout Component
 *
 * Provides the common structure (Header, Two-Column Grid) for detail pages.
 * Content for header actions, main area, and sidebar are passed as props.
 */
interface DetailLayoutProps {
  pageTitle?: string;
  recordIdentifier?: string | number;
  listPageUrl: string;
  editPageUrl?: string | null;
  printPageUrl?: string | null;
  additionalActions?: React.ReactNode[] | null;
  mainContent: React.ReactNode;
  sidebarContent: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  errorContent?: React.ReactNode | null;
}

const DetailLayout: React.FC<DetailLayoutProps> = ({
  pageTitle,
  recordIdentifier,
  listPageUrl,
  editPageUrl,
  printPageUrl,
  additionalActions,
  mainContent,
  sidebarContent,
  isLoading = false,
  loadingText = '載入中...',
  errorContent = null
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // --- Loading State --- 
  if (isLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>{loadingText}</Typography>
      </Box>
    );
  }

  // --- Error State --- 
  if (errorContent) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        {errorContent}
        <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={() => navigate(listPageUrl)} sx={{ mt: 2 }}>
          返回列表
        </Button>
      </Box>
    );
  }

  // --- Default Header Actions --- 
  const defaultActions: React.ReactNode[] = [];
  if (editPageUrl) {
    defaultActions.push(
      <Button key="edit" variant="outlined" color="primary" size="small" startIcon={<EditIcon />} onClick={() => navigate(editPageUrl)}>編輯</Button>
    );
  }
  if (printPageUrl) {
    defaultActions.push(
      <Button key="print" variant="outlined" color="secondary" size="small" startIcon={<PrintIcon />} onClick={() => navigate(printPageUrl)}>列印</Button>
    );
  }
  if (additionalActions) {
    defaultActions.push(...additionalActions);
  }
  defaultActions.push(
    <Button key="back" variant="contained" size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate(listPageUrl)}>返回列表</Button>
  );

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
          {pageTitle} #{recordIdentifier || 'N/A'}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
          {defaultActions}
        </Stack>
      </Stack>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Left Column (Main Content) */}
        <Grid item xs={12} md={8}>
          {mainContent}
        </Grid>

        {/* Right Column (Sidebar) */}
        <Grid item xs={12} md={4}>
          {sidebarContent}
        </Grid>
      </Grid>
      
      {/* Snackbar can be added here or managed by the parent page */} 
    </Box>
  );
};

export default DetailLayout;