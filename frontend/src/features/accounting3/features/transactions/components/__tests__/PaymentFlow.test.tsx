import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PaymentPage } from '../PaymentPage';
import { PayableSelector } from '../PayableSelector';
import { PaymentTransactionForm } from '../PaymentTransactionForm';

// Mock API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock data
const mockPayableTransactions = [
  {
    _id: 'payable-1',
    description: '測試採購交易1',
    totalAmount: 10000,
    transactionDate: '2024-01-15',
    payableInfo: {
      supplierId: 'supplier-001',
      supplierName: '測試供應商A',
      dueDate: '2024-02-15',
      isPaidOff: false,
      paymentHistory: []
    },
    entries: [
      { accountId: 'inventory-001', accountName: '庫存商品', debit: 10000, credit: 0 },
      { accountId: 'payable-001', accountName: '應付帳款', debit: 0, credit: 10000 }
    ]
  },
  {
    _id: 'payable-2',
    description: '測試採購交易2',
    totalAmount: 15000,
    transactionDate: '2024-01-20',
    payableInfo: {
      supplierId: 'supplier-002',
      supplierName: '測試供應商B',
      dueDate: '2024-02-10',
      isPaidOff: false,
      paymentHistory: []
    },
    entries: [
      { accountId: 'inventory-001', accountName: '庫存商品', debit: 15000, credit: 0 },
      { accountId: 'payable-001', accountName: '應付帳款', debit: 0, credit: 15000 }
    ]
  }
];

const mockAccounts = [
  { _id: 'bank-001', name: '銀行存款', type: 'asset' },
  { _id: 'cash-001', name: '現金', type: 'asset' }
];

describe('Payment Flow Components', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('PayableSelector Component', () => {
    const defaultProps = {
      organizationId: 'test-org-123',
      selectedTransactions: [],
      onSelectionChange: jest.fn(),
      loading: false
    };

    it('should render payable transactions list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPayableTransactions
      });

      render(<PayableSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('測試採購交易1')).toBeInTheDocument();
        expect(screen.getByText('測試採購交易2')).toBeInTheDocument();
      });

      expect(screen.getByText('測試供應商A')).toBeInTheDocument();
      expect(screen.getByText('測試供應商B')).toBeInTheDocument();
      expect(screen.getByText('NT$ 10,000')).toBeInTheDocument();
      expect(screen.getByText('NT$ 15,000')).toBeInTheDocument();
    });

    it('should handle transaction selection', async () => {
      const onSelectionChange = jest.fn();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPayableTransactions
      });

      render(
        <PayableSelector 
          {...defaultProps} 
          onSelectionChange={onSelectionChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('測試採購交易1')).toBeInTheDocument();
      });

      // 選擇第一個交易
      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(firstCheckbox);

      expect(onSelectionChange).toHaveBeenCalledWith([mockPayableTransactions[0]]);
    });

    it('should filter transactions by supplier', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPayableTransactions
      });

      render(<PayableSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('測試採購交易1')).toBeInTheDocument();
      });

      // 輸入供應商名稱進行過濾
      const searchInput = screen.getByPlaceholderText(/搜尋供應商/);
      fireEvent.change(searchInput, { target: { value: '測試供應商A' } });

      await waitFor(() => {
        expect(screen.getByText('測試供應商A')).toBeInTheDocument();
        expect(screen.queryByText('測試供應商B')).not.toBeInTheDocument();
      });
    });

    it('should show loading state', () => {
      render(<PayableSelector {...defaultProps} loading={true} />);
      expect(screen.getByText('載入中...')).toBeInTheDocument();
    });

    it('should show empty state when no transactions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      render(<PayableSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('目前沒有待付款的應付帳款')).toBeInTheDocument();
      });
    });
  });

  describe('PaymentTransactionForm Component', () => {
    const defaultProps = {
      organizationId: 'test-org-123',
      selectedPayables: [mockPayableTransactions[0]],
      onSubmit: jest.fn(),
      onCancel: jest.fn(),
      loading: false
    };

    beforeEach(() => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccounts
      });
    });

    it('should render payment form with selected payables summary', async () => {
      render(<PaymentTransactionForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('付款交易建立')).toBeInTheDocument();
      });

      expect(screen.getByText('測試採購交易1')).toBeInTheDocument();
      expect(screen.getByText('測試供應商A')).toBeInTheDocument();
      expect(screen.getByText('NT$ 10,000')).toBeInTheDocument();
      expect(screen.getByText('總付款金額: NT$ 10,000')).toBeInTheDocument();
    });

    it('should handle payment method selection', async () => {
      render(<PaymentTransactionForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('付款交易建立')).toBeInTheDocument();
      });

      const paymentMethodSelect = screen.getByLabelText('付款方式');
      fireEvent.change(paymentMethodSelect, { target: { value: 'bank_transfer' } });

      expect(paymentMethodSelect).toHaveValue('bank_transfer');
    });

    it('should handle payment account selection', async () => {
      render(<PaymentTransactionForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('銀行存款')).toBeInTheDocument();
      });

      const accountSelect = screen.getByLabelText('付款帳戶');
      fireEvent.change(accountSelect, { target: { value: 'bank-001' } });

      expect(accountSelect).toHaveValue('bank-001');
    });

    it('should generate correct accounting entries', async () => {
      render(<PaymentTransactionForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('付款交易建立')).toBeInTheDocument();
      });

      // 選擇付款方式和帳戶
      const paymentMethodSelect = screen.getByLabelText('付款方式');
      fireEvent.change(paymentMethodSelect, { target: { value: 'bank_transfer' } });

      const accountSelect = screen.getByLabelText('付款帳戶');
      fireEvent.change(accountSelect, { target: { value: 'bank-001' } });

      // 檢查會計分錄預覽
      await waitFor(() => {
        expect(screen.getByText('會計分錄預覽')).toBeInTheDocument();
        expect(screen.getByText('應付帳款')).toBeInTheDocument();
        expect(screen.getByText('銀行存款')).toBeInTheDocument();
      });
    });

    it('should submit payment transaction', async () => {
      const onSubmit = jest.fn();
      render(<PaymentTransactionForm {...defaultProps} onSubmit={onSubmit} />);

      await waitFor(() => {
        expect(screen.getByText('付款交易建立')).toBeInTheDocument();
      });

      // 填寫表單
      const paymentMethodSelect = screen.getByLabelText('付款方式');
      fireEvent.change(paymentMethodSelect, { target: { value: 'bank_transfer' } });

      const accountSelect = screen.getByLabelText('付款帳戶');
      fireEvent.change(accountSelect, { target: { value: 'bank-001' } });

      const descriptionInput = screen.getByLabelText('付款說明');
      fireEvent.change(descriptionInput, { target: { value: '測試付款' } });

      // 提交表單
      const submitButton = screen.getByText('確認付款');
      fireEvent.click(submitButton);

      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
        paymentMethod: 'bank_transfer',
        paymentAccountId: 'bank-001',
        description: '測試付款'
      }));
    });

    it('should show validation errors for required fields', async () => {
      render(<PaymentTransactionForm {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('付款交易建立')).toBeInTheDocument();
      });

      // 直接提交表單而不填寫必填欄位
      const submitButton = screen.getByText('確認付款');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('請選擇付款方式')).toBeInTheDocument();
        expect(screen.getByText('請選擇付款帳戶')).toBeInTheDocument();
      });
    });
  });

  describe('PaymentPage Integration', () => {
    const defaultProps = {
      organizationId: 'test-org-123'
    };

    it('should complete full payment flow', async () => {
      // Mock API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPayableTransactions
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAccounts
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            _id: 'payment-123',
            transactionType: 'payment',
            description: '測試付款',
            totalAmount: 10000
          })
        });

      render(<PaymentPage {...defaultProps} />);

      // Step 1: 選擇應付帳款
      await waitFor(() => {
        expect(screen.getByText('選擇要付款的應付帳款')).toBeInTheDocument();
      });

      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(firstCheckbox);

      const nextButton = screen.getByText('下一步：建立付款');
      fireEvent.click(nextButton);

      // Step 2: 建立付款交易
      await waitFor(() => {
        expect(screen.getByText('付款交易建立')).toBeInTheDocument();
      });

      const paymentMethodSelect = screen.getByLabelText('付款方式');
      fireEvent.change(paymentMethodSelect, { target: { value: 'bank_transfer' } });

      const accountSelect = screen.getByLabelText('付款帳戶');
      fireEvent.change(accountSelect, { target: { value: 'bank-001' } });

      const submitButton = screen.getByText('確認付款');
      fireEvent.click(submitButton);

      // Step 3: 完成付款
      await waitFor(() => {
        expect(screen.getByText('付款完成')).toBeInTheDocument();
        expect(screen.getByText('付款交易已成功建立')).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      render(<PaymentPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('載入應付帳款時發生錯誤')).toBeInTheDocument();
      });
    });
  });
});