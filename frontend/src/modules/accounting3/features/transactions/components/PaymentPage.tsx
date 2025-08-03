import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PayableSelector } from './PayableSelector';
import { PaymentTransactionForm } from './PaymentTransactionForm';
import apiService from '../../../../../utils/apiService';

// 應付帳款資訊介面
interface PayableTransactionInfo {
  _id: string;
  groupNumber: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate?: Date;
  supplierInfo?: {
    supplierId: string;
    supplierName: string;
  };
  isPaidOff: boolean;
  paymentHistory: Array<{
    paymentTransactionId: string;
    paidAmount: number;
    paymentDate: Date;
    paymentMethod?: string;
  }>;
  transactionDate: Date;
  status?: 'draft' | 'confirmed' | 'cancelled'; // 新增交易狀態
}

// 付款交易資料介面
interface PaymentTransactionData {
  description: string;
  transactionDate: Date;
  paymentMethod: string;
  totalAmount: number;
  entries: Array<{
    sequence: number;
    accountId: string;
    debitAmount: number;
    creditAmount: number;
    description: string;
    sourceTransactionId?: string;
  }>;
  linkedTransactionIds: string[];
  organizationId?: string;
  paymentInfo: {
    paymentMethod: string;
    payableTransactions: Array<{
      transactionId: string;
      paidAmount: number;
      remainingAmount?: number;
    }>;
  };
}

interface PaymentPageProps {
  organizationId?: string;
}

const steps = ['選擇應付帳款', '建立付款交易', '完成'];

export const PaymentPage: React.FC<PaymentPageProps> = ({ organizationId }) => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedPayables, setSelectedPayables] = useState<PayableTransactionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTransactionId, setCreatedTransactionId] = useState<string | null>(null);

  // 處理應付帳款選擇變更
  const handlePayableSelectionChange = (payables: PayableTransactionInfo[]) => {
    setSelectedPayables(payables);
    setError(null);
  };

  // 下一步
  const handleNext = () => {
    if (activeStep === 0 && selectedPayables.length === 0) {
      setError('請選擇至少一筆應付帳款');
      return;
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setError(null);
  };

  // 上一步
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError(null);
  };

  // 重置
  const handleReset = () => {
    setActiveStep(0);
    setSelectedPayables([]);
    setError(null);
    setCreatedTransactionId(null);
  };

  // 提交付款交易
  const handlePaymentSubmit = async (paymentData: PaymentTransactionData) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 提交付款交易:', paymentData);
      
      // 使用 apiService 調用後端 API 建立付款交易（自動處理認證）
      const response = await apiService.post('/api/accounting2/transactions/payment', paymentData);
      const result = response.data;
      
      if (result.success) {
        setCreatedTransactionId(result.data._id);
        setActiveStep(2); // 跳到完成步驟
        console.log('✅ 付款交易建立成功:', result.data);
      } else {
        throw new Error(result.message || '建立付款交易失敗');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '建立付款交易失敗';
      console.error('❌ 建立付款交易失敗:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 查看建立的交易
  const handleViewTransaction = () => {
    if (createdTransactionId) {
      navigate(`/accounting3/transaction/${createdTransactionId}`);
    }
  };

  // 渲染步驟內容
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <PayableSelector
            {...(organizationId && { organizationId })}
            onSelectionChange={handlePayableSelectionChange}
            excludePaidOff={true}
            disabled={loading}
          />
        );
      
      case 1:
        return (
          <PaymentTransactionForm
            selectedPayables={selectedPayables}
            {...(organizationId && { organizationId })}
            onSubmit={handlePaymentSubmit}
            onCancel={handleBack}
            loading={loading}
          />
        );
      
      case 2:
        return (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom color="success.main">
              付款交易建立成功！
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              已成功建立付款交易，共處理 {selectedPayables.length} 筆應付帳款。
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={handleViewTransaction}
                disabled={!createdTransactionId}
              >
                查看交易詳情
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleReset}
              >
                建立新的付款
              </Button>
              
              <Button
                variant="text"
                onClick={() => navigate('/accounting3/transactions')}
              >
                返回交易列表
              </Button>
            </Box>
          </Paper>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>

      {/* 步驟指示器 */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* 錯誤提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 載入指示器 */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {/* 步驟內容 */}
      <Box sx={{ mb: 3 }}>
        {renderStepContent(activeStep)}
      </Box>

      {/* 導航按鈕 */}
      {activeStep < 2 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            上一步
          </Button>
          
          {activeStep !== steps.length - 2 && (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading || (activeStep === 0 && selectedPayables.length === 0)}
            >
              下一步
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

export default PaymentPage;