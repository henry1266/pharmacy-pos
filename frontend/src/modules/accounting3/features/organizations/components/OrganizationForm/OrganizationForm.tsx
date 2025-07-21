import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Autocomplete,
  Alert,
  Divider,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Business as BusinessIcon,
  LocalPharmacy as PharmacyIcon,
  AccountBalance as HeadquartersIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import organizationService from '../../../../services/organizationService';
import {
  Organization,
  OrganizationType,
  OrganizationStatus,
  OrganizationFormData
} from '@pharmacy-pos/shared/types/organization';

interface OrganizationFormProps {
  organizationId?: string;
  mode: 'create' | 'edit';
}

const OrganizationForm: React.FC<OrganizationFormProps> = ({ organizationId, mode }) => {
  const navigate = useNavigate();
  
  // 表單狀態
  const [formData, setFormData] = useState<OrganizationFormData>({
    code: '',
    name: '',
    type: OrganizationType.CLINIC,
    status: OrganizationStatus.ACTIVE,
    contact: {
      address: '',
      phone: '',
      email: '',
      taxId: ''
    },
    business: {
      establishedDate: new Date().toISOString().split('T')[0],
      licenseNumber: ''
    },
    settings: {
      timezone: 'Asia/Taipei',
      currency: 'TWD',
      language: 'zh-TW'
    },
    notes: '',
    parentId: undefined
  });

  // UI 狀態
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 父機構選項
  const [parentOrganizations, setParentOrganizations] = useState<Organization[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);

  // 機構類型圖示映射
  const getTypeIcon = (type: OrganizationType) => {
    switch (type) {
      case OrganizationType.CLINIC:
        return <BusinessIcon />;
      case OrganizationType.PHARMACY:
        return <PharmacyIcon />;
      case OrganizationType.HEADQUARTERS:
        return <HeadquartersIcon />;
      default:
        return <BusinessIcon />;
    }
  };

  // 機構類型標籤
  const getTypeLabel = (type: OrganizationType) => {
    switch (type) {
      case OrganizationType.CLINIC:
        return '診所';
      case OrganizationType.PHARMACY:
        return '藥局';
      case OrganizationType.HEADQUARTERS:
        return '總部';
      default:
        return type;
    }
  };


  // 載入機構資料（編輯模式）
  useEffect(() => {
    if (mode === 'edit' && organizationId) {
      loadOrganizationData();
    }
  }, [mode, organizationId]);

  // 載入父機構選項
  useEffect(() => {
    loadParentOrganizations();
  }, [organizationId]);

  const loadOrganizationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await organizationService.getOrganizationById(organizationId!);
      const org = response.data;
      
      setFormData({
        code: org.code,
        name: org.name,
        type: org.type,
        status: org.status,
        contact: org.contact,
        business: {
          ...org.business,
          establishedDate: new Date(org.business.establishedDate).toISOString().split('T')[0]
        },
        settings: org.settings,
        notes: org.notes || '',
        parentId: org.parentId
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadParentOrganizations = async () => {
    try {
      setLoadingParents(true);
      const orgs = await organizationService.getAvailableParentOrganizations(organizationId);
      setParentOrganizations(orgs);
    } catch (err: any) {
      console.error('載入父機構選項失敗:', err);
    } finally {
      setLoadingParents(false);
    }
  };

  // 表單驗證
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = '機構代碼為必填';
    } else if (!/^[A-Z0-9]{2,10}$/.test(formData.code)) {
      newErrors.code = '機構代碼必須是2-10位英數字';
    }

    if (!formData.name.trim()) {
      newErrors.name = '機構名稱為必填';
    }

    if (!formData.contact.address.trim()) {
      newErrors.address = '地址為必填';
    }

    if (!formData.contact.phone.trim()) {
      newErrors.phone = '電話為必填';
    } else if (!/^[\d\-\(\)\+\s]+$/.test(formData.contact.phone)) {
      newErrors.phone = '請輸入有效的電話號碼';
    }

    if (formData.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact.email)) {
      newErrors.email = '請輸入有效的電子郵件';
    }

    if (formData.contact.taxId && !/^\d{8}$/.test(formData.contact.taxId)) {
      newErrors.taxId = '統一編號必須是8位數字';
    }

    if (!formData.business.establishedDate) {
      newErrors.establishedDate = '成立日期為必填';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 處理表單提交
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (mode === 'create') {
        await organizationService.createOrganization(formData);
        setSuccess('機構建立成功！');
        setTimeout(() => navigate('/accounting3/organizations'), 1500);
      } else {
        await organizationService.updateOrganization(organizationId!, formData);
        setSuccess('機構更新成功！');
        setTimeout(() => navigate('/accounting3/organizations'), 1500);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 處理取消
  const handleCancel = () => {
    navigate('/accounting3/organizations');
  };

  // 處理輸入變更
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      } else if (keys.length === 2) {
        const [parentKey, childKey] = keys;
        return {
          ...prev,
          [parentKey]: {
            ...(prev[parentKey as keyof OrganizationFormData] as any),
            [childKey]: value
          }
        };
      }
      return prev;
    });

    // 清除對應的錯誤
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };


  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>載入中...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 頁面標題 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          {mode === 'create' ? '新增機構' : '編輯機構'}
        </Typography>
      </Box>

      {/* 錯誤和成功訊息 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* 基本資訊 */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="基本資訊" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="機構代碼"
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                      error={!!errors.code}
                      helperText={errors.code || '2-10位英數字，建議使用簡短易記的代碼'}
                      required
                      inputProps={{ maxLength: 10 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="機構名稱"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      error={!!errors.name}
                      helperText={errors.name}
                      required
                      inputProps={{ maxLength: 100 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>機構類型</InputLabel>
                      <Select
                        value={formData.type}
                        label="機構類型"
                        onChange={(e) => handleInputChange('type', e.target.value)}
                      >
                        {Object.values(OrganizationType).map((type) => (
                          <MenuItem key={type} value={type}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getTypeIcon(type)}
                              {getTypeLabel(type)}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>營業狀態</InputLabel>
                      <Select
                        value={formData.status}
                        label="營業狀態"
                        onChange={(e) => handleInputChange('status', e.target.value)}
                      >
                        <MenuItem value={OrganizationStatus.ACTIVE}>營業中</MenuItem>
                        <MenuItem value={OrganizationStatus.INACTIVE}>暫停營業</MenuItem>
                        <MenuItem value={OrganizationStatus.SUSPENDED}>停業</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Autocomplete
                      options={parentOrganizations}
                      getOptionLabel={(option) => `${option.code} - ${option.name}`}
                      value={parentOrganizations.find(org => org._id === formData.parentId) || null}
                      onChange={(_, value) => handleInputChange('parentId', value?._id)}
                      loading={loadingParents}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="上級機構"
                          helperText="選擇此機構的上級機構（可選）"
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getTypeIcon(option.type)}
                            <Box>
                              <Typography variant="body2">{option.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {option.code} - {getTypeLabel(option.type)}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 聯絡資訊 */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="聯絡資訊" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="地址"
                      value={formData.contact.address}
                      onChange={(e) => handleInputChange('contact.address', e.target.value)}
                      error={!!errors.address}
                      helperText={errors.address}
                      required
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="聯絡電話"
                      value={formData.contact.phone}
                      onChange={(e) => handleInputChange('contact.phone', e.target.value)}
                      error={!!errors.phone}
                      helperText={errors.phone}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="電子郵件"
                      type="email"
                      value={formData.contact.email || ''}
                      onChange={(e) => handleInputChange('contact.email', e.target.value)}
                      error={!!errors.email}
                      helperText={errors.email}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="統一編號"
                      value={formData.contact.taxId || ''}
                      onChange={(e) => handleInputChange('contact.taxId', e.target.value)}
                      error={!!errors.taxId}
                      helperText={errors.taxId || '8位數字'}
                      inputProps={{ maxLength: 8 }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 營業資訊 */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="營業資訊" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="成立日期"
                      type="date"
                      value={formData.business.establishedDate}
                      onChange={(e) => handleInputChange('business.establishedDate', e.target.value)}
                      error={!!errors.establishedDate}
                      helperText={errors.establishedDate}
                      required
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="營業執照號碼"
                      value={formData.business.licenseNumber || ''}
                      onChange={(e) => handleInputChange('business.licenseNumber', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 系統設定 */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="系統設定" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="時區"
                      value={formData.settings.timezone}
                      onChange={(e) => handleInputChange('settings.timezone', e.target.value)}
                      helperText="預設：Asia/Taipei"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="預設貨幣"
                      value={formData.settings.currency}
                      onChange={(e) => handleInputChange('settings.currency', e.target.value)}
                      helperText="預設：TWD"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="預設語言"
                      value={formData.settings.language}
                      onChange={(e) => handleInputChange('settings.language', e.target.value)}
                      helperText="預設：zh-TW"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 備註 */}
          <Grid item xs={12}>
            <Card>
              <CardHeader title="備註" />
              <CardContent>
                <TextField
                  fullWidth
                  label="機構備註"
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  multiline
                  rows={4}
                  helperText="可輸入機構相關的備註資訊（最多1000字）"
                  inputProps={{ maxLength: 1000 }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* 操作按鈕 */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={saving}
                startIcon={<CancelIcon />}
              >
                取消
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                startIcon={<SaveIcon />}
              >
                {saving ? '儲存中...' : (mode === 'create' ? '建立機構' : '更新機構')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default OrganizationForm;