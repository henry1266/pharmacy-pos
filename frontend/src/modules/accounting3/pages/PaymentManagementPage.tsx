import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  Chip
} from '@mui/material';
import { Business, Payment, ArrowForward } from '@mui/icons-material';
import { PaymentPage } from '../features/transactions/components';
import { accounting3Service } from '../services/accounting3Service';

interface Organization {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  accounts?: any[];
}

interface PaymentManagementPageProps {}

export const PaymentManagementPage: React.FC<PaymentManagementPageProps> = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 獲取組織列表
  const fetchOrganizations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 獲取組織列表...');
      const response = await accounting3Service.accounts.getAll();
      
      if (response.success && response.data) {
        // 從帳戶階層中提取組織資訊
        const orgList: Organization[] = response.data
          .filter((item: any) => item.type === 'organization' || item.organizationId)
          .map((item: any) => ({
            _id: item._id || item.organizationId,
            name: item.name || item.organizationName || '未命名組織',
            description: item.description,
            isActive: item.isActive !== false,
            accounts: item.accounts || item.children
          }));
        
        // 去重並過濾有效組織
        const uniqueOrgs = orgList.filter((org, index, self) =>
          org.isActive && self.findIndex(o => o._id === org._id) === index
        );
        
        setOrganizations(uniqueOrgs);
        console.log('✅ 組織列表載入成功:', uniqueOrgs.length, '個組織');
      } else {
        throw new Error('無法獲取組織資料');
      }
    } catch (err) {
      console.error('❌ 獲取組織列表失敗:', err);
      setError(err instanceof Error ? err.message : '獲取組織列表失敗');
    } finally {
      setLoading(false);
    }
  };

  // 處理組織選擇
  const handleOrganizationSelect = (orgId: string) => {
    navigate(`/accounting3/payments/${orgId}`);
  };

  // 返回組織選擇
  const handleBackToOrganizations = () => {
    navigate('/accounting3/payments');
  };

  // 初始化
  useEffect(() => {
    if (!organizationId) {
      fetchOrganizations();
    }
  }, [organizationId]);

  // 如果有 organizationId，顯示該組織的付款功能
  if (organizationId) {
    const selectedOrg = organizations.find(org => org._id === organizationId);
    
    return (
      <Box sx={{ p: 3 }}>
        {/* 麵包屑導航 */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            component="button"
            variant="body1"
            onClick={handleBackToOrganizations}
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Business fontSize="small" />
            組織選擇
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Payment fontSize="small" />
            {selectedOrg?.name || organizationId} - 付款管理
          </Typography>
        </Breadcrumbs>

        <PaymentPage organizationId={organizationId} />
      </Box>
    );
  }

  // 顯示組織選擇器
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Payment />
        應付帳款付款管理
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        選擇組織以管理和處理供應商應付帳款的付款作業
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {organizations.length === 0 ? (
            <Grid item xs={12}>
              <Alert severity="info">
                目前沒有可用的組織，請先建立組織和會計科目。
              </Alert>
            </Grid>
          ) : (
            organizations.map((org) => (
              <Grid item xs={12} sm={6} md={4} key={org._id}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardActionArea
                    onClick={() => handleOrganizationSelect(org._id)}
                    sx={{ height: '100%', p: 2 }}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Business
                        sx={{
                          fontSize: 48,
                          color: 'primary.main',
                          mb: 2
                        }}
                      />
                      
                      <Typography variant="h6" gutterBottom>
                        {org.name}
                      </Typography>
                      
                      {org.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {org.description}
                        </Typography>
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Chip
                          label={`${org.accounts?.length || 0} 個科目`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Typography variant="body2" color="primary">
                          進入付款管理
                        </Typography>
                        <ArrowForward fontSize="small" color="primary" />
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}
    </Box>
  );
};

export default PaymentManagementPage;