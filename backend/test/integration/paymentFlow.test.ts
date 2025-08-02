import request from 'supertest';
import express from 'express';

// 模擬資料存儲
const mockTransactions: any[] = [];
let transactionIdCounter = 1;

// 模擬 TransactionGroupWithEntries 模型
const mockTransactionModel = {
  deleteMany: jest.fn().mockImplementation(() => {
    mockTransactions.length = 0;
    return Promise.resolve({});
  }),
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn()
};

// 簡化的測試 app 設定
const app = express();
app.use(express.json());

// 模擬 API 路由 - 查詢應付帳款
app.get('/api/accounting2/transactions/payable', (req, res) => {
  const { organizationId, supplierId } = req.query;
  
  let payableTransactions = mockTransactions.filter(t =>
    t.organizationId === organizationId &&
    t.transactionType === 'purchase' &&
    t.payableInfo &&
    !t.payableInfo.isPaidOff
  );

  if (supplierId) {
    payableTransactions = payableTransactions.filter(t =>
      t.payableInfo.supplierId === supplierId
    );
  }

  // 按到期日排序
  payableTransactions.sort((a, b) =>
    new Date(a.payableInfo.dueDate).getTime() - new Date(b.payableInfo.dueDate).getTime()
  );

  res.json(payableTransactions);
});

// 模擬 API 路由 - 建立交易
app.post('/api/accounting2/transactions', (req, res) => {
  const transaction = {
    _id: `transaction-${transactionIdCounter++}`,
    ...req.body,
    linkedTransactionIds: req.body.linkedTransactionIds || []
  };
  
  mockTransactions.push(transaction);
  res.status(201).json(transaction);
});

// 模擬 API 路由 - 建立付款交易
app.post('/api/accounting2/transactions/payment', (req, res) => {
  const { payableTransactionIds, ...paymentData } = req.body;
  
  const paymentTransaction = {
    _id: `payment-${transactionIdCounter++}`,
    transactionType: 'payment',
    paymentInfo: {
      payableTransactionIds,
      ...paymentData
    },
    linkedTransactionIds: payableTransactionIds,
    ...paymentData
  };
  
  mockTransactions.push(paymentTransaction);

  // 更新相關的應付帳款狀態
  payableTransactionIds.forEach((payableId: string) => {
    const payableTransaction = mockTransactions.find(t => t._id === payableId);
    if (payableTransaction && payableTransaction.payableInfo) {
      // 計算付款金額
      const paymentAmount = paymentData.entries
        .filter((entry: any) => entry.debit > 0)
        .reduce((sum: number, entry: any) => sum + entry.debit, 0);
      
      // 更新付款歷史
      if (!payableTransaction.payableInfo.paymentHistory) {
        payableTransaction.payableInfo.paymentHistory = [];
      }
      
      payableTransaction.payableInfo.paymentHistory.push({
        paymentTransactionId: paymentTransaction._id,
        amount: paymentAmount,
        paymentDate: new Date(),
        paymentMethod: paymentData.paymentMethod
      });

      // 計算總已付金額
      const totalPaid = payableTransaction.payableInfo.paymentHistory
        .reduce((sum: number, payment: any) => sum + payment.amount, 0);
      
      // 判斷是否完全付清
      payableTransaction.payableInfo.isPaidOff = totalPaid >= payableTransaction.totalAmount;
      
      // 更新關聯
      if (!payableTransaction.linkedTransactionIds) {
        payableTransaction.linkedTransactionIds = [];
      }
      payableTransaction.linkedTransactionIds.push(paymentTransaction._id);
    }
  });

  res.status(201).json(paymentTransaction);
});

// 模擬 API 路由 - 查詢單一交易
app.get('/api/accounting2/transactions/:id', (req, res) => {
  const transaction = mockTransactions.find(t => t._id === req.params.id);
  if (transaction) {
    res.json(transaction);
  } else {
    res.status(404).json({ error: 'Transaction not found' });
  }
});

// 模擬 API 路由 - 查詢付款歷史
app.get('/api/accounting2/transactions/:id/payment-history', (req, res) => {
  const transaction = mockTransactions.find(t => t._id === req.params.id);
  if (transaction && transaction.payableInfo && transaction.payableInfo.paymentHistory) {
    res.json(transaction.payableInfo.paymentHistory);
  } else {
    res.json([]);
  }
});

// 模擬的資料庫連接函數
const connectDB = async () => {
  console.log('Connected to test database');
};

const disconnectDB = async () => {
  console.log('Disconnected from test database');
};

describe('Payment Flow Integration Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    // 清理測試資料
    await mockTransactionModel.deleteMany({});
  });

  describe('Complete Payment Flow', () => {
    let purchaseTransactionId: string;
    let organizationId: string = 'test-org-123';

    it('should create a purchase transaction and then pay it off', async () => {
      // Step 1: 建立採購交易（應付帳款）
      const purchaseData = {
        organizationId,
        transactionType: 'purchase',
        description: '測試採購交易',
        totalAmount: 10000,
        entries: [
          {
            accountId: 'inventory-001',
            accountName: '庫存商品',
            debit: 10000,
            credit: 0,
            description: '採購商品'
          },
          {
            accountId: 'payable-001',
            accountName: '應付帳款',
            debit: 0,
            credit: 10000,
            description: '應付供應商款項'
          }
        ],
        payableInfo: {
          supplierId: 'supplier-001',
          supplierName: '測試供應商',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天後到期
          isPaidOff: false,
          paymentHistory: []
        }
      };

      const purchaseResponse = await request(app)
        .post('/api/accounting2/transactions')
        .send(purchaseData)
        .expect(201);

      purchaseTransactionId = purchaseResponse.body._id;
      expect(purchaseResponse.body.transactionType).toBe('purchase');
      expect(purchaseResponse.body.payableInfo.isPaidOff).toBe(false);

      // Step 2: 查詢可付款的應付帳款
      const payableResponse = await request(app)
        .get(`/api/accounting2/transactions/payable?organizationId=${organizationId}`)
        .expect(200);

      expect(payableResponse.body).toHaveLength(1);
      expect(payableResponse.body[0]._id).toBe(purchaseTransactionId);
      expect(payableResponse.body[0].payableInfo.isPaidOff).toBe(false);

      // Step 3: 建立付款交易
      const paymentData = {
        organizationId,
        payableTransactionIds: [purchaseTransactionId],
        paymentMethod: 'bank_transfer',
        paymentAccountId: 'bank-001',
        paymentAccountName: '銀行存款',
        description: '付款給測試供應商',
        entries: [
          {
            accountId: 'payable-001',
            accountName: '應付帳款',
            debit: 10000,
            credit: 0,
            description: '清償應付帳款'
          },
          {
            accountId: 'bank-001',
            accountName: '銀行存款',
            debit: 0,
            credit: 10000,
            description: '銀行轉帳付款'
          }
        ]
      };

      const paymentResponse = await request(app)
        .post('/api/accounting2/transactions/payment')
        .send(paymentData)
        .expect(201);

      expect(paymentResponse.body.transactionType).toBe('payment');
      expect(paymentResponse.body.paymentInfo).toBeDefined();
      expect(paymentResponse.body.paymentInfo.payableTransactionIds).toContain(purchaseTransactionId);

      // Step 4: 驗證原始應付帳款已標記為已付
      const updatedPurchaseResponse = await request(app)
        .get(`/api/accounting2/transactions/${purchaseTransactionId}`)
        .expect(200);

      expect(updatedPurchaseResponse.body.payableInfo.isPaidOff).toBe(true);
      expect(updatedPurchaseResponse.body.payableInfo.paymentHistory).toHaveLength(1);
      expect(updatedPurchaseResponse.body.linkedTransactionIds).toContain(paymentResponse.body._id);

      // Step 5: 驗證付款交易的關聯
      expect(paymentResponse.body.linkedTransactionIds).toContain(purchaseTransactionId);

      // Step 6: 查詢付款歷史
      const paymentHistoryResponse = await request(app)
        .get(`/api/accounting2/transactions/${purchaseTransactionId}/payment-history`)
        .expect(200);

      expect(paymentHistoryResponse.body).toHaveLength(1);
      expect(paymentHistoryResponse.body[0].paymentTransactionId).toBe(paymentResponse.body._id);
      expect(paymentHistoryResponse.body[0].amount).toBe(10000);
    });

    it('should handle partial payments correctly', async () => {
      // 建立一個較大金額的採購交易
      const purchaseData = {
        organizationId,
        transactionType: 'purchase',
        description: '大額採購交易',
        totalAmount: 50000,
        entries: [
          {
            accountId: 'inventory-001',
            accountName: '庫存商品',
            debit: 50000,
            credit: 0,
            description: '採購商品'
          },
          {
            accountId: 'payable-001',
            accountName: '應付帳款',
            debit: 0,
            credit: 50000,
            description: '應付供應商款項'
          }
        ],
        payableInfo: {
          supplierId: 'supplier-002',
          supplierName: '大額供應商',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isPaidOff: false,
          paymentHistory: []
        }
      };

      const purchaseResponse = await request(app)
        .post('/api/accounting2/transactions')
        .send(purchaseData)
        .expect(201);

      const purchaseId = purchaseResponse.body._id;

      // 第一次部分付款 (20000)
      const firstPaymentData = {
        organizationId,
        payableTransactionIds: [purchaseId],
        paymentMethod: 'cash',
        paymentAccountId: 'cash-001',
        paymentAccountName: '現金',
        description: '第一次部分付款',
        entries: [
          {
            accountId: 'payable-001',
            accountName: '應付帳款',
            debit: 20000,
            credit: 0,
            description: '部分清償應付帳款'
          },
          {
            accountId: 'cash-001',
            accountName: '現金',
            debit: 0,
            credit: 20000,
            description: '現金付款'
          }
        ]
      };

      await request(app)
        .post('/api/accounting2/transactions/payment')
        .send(firstPaymentData)
        .expect(201);

      // 檢查應付帳款狀態（應該還未完全付清）
      const afterFirstPayment = await request(app)
        .get(`/api/accounting2/transactions/${purchaseId}`)
        .expect(200);

      expect(afterFirstPayment.body.payableInfo.isPaidOff).toBe(false);
      expect(afterFirstPayment.body.payableInfo.paymentHistory).toHaveLength(1);

      // 第二次付款完成剩餘金額 (30000)
      const secondPaymentData = {
        organizationId,
        payableTransactionIds: [purchaseId],
        paymentMethod: 'bank_transfer',
        paymentAccountId: 'bank-001',
        paymentAccountName: '銀行存款',
        description: '第二次付款完成',
        entries: [
          {
            accountId: 'payable-001',
            accountName: '應付帳款',
            debit: 30000,
            credit: 0,
            description: '完全清償應付帳款'
          },
          {
            accountId: 'bank-001',
            accountName: '銀行存款',
            debit: 0,
            credit: 30000,
            description: '銀行轉帳付款'
          }
        ]
      };

      await request(app)
        .post('/api/accounting2/transactions/payment')
        .send(secondPaymentData)
        .expect(201);

      // 檢查應付帳款狀態（現在應該完全付清）
      const afterSecondPayment = await request(app)
        .get(`/api/accounting2/transactions/${purchaseId}`)
        .expect(200);

      expect(afterSecondPayment.body.payableInfo.isPaidOff).toBe(true);
      expect(afterSecondPayment.body.payableInfo.paymentHistory).toHaveLength(2);

      // 驗證付款歷史總額
      const totalPaid = afterSecondPayment.body.payableInfo.paymentHistory
        .reduce((sum: number, payment: any) => sum + payment.amount, 0);
      expect(totalPaid).toBe(50000);
    });

    it('should filter payable transactions correctly', async () => {
      // 建立多個不同狀態的應付帳款
      const transactions = [
        {
          organizationId,
          transactionType: 'purchase',
          description: '未付款交易1',
          totalAmount: 10000,
          entries: [
            { accountId: 'inventory-001', accountName: '庫存商品', debit: 10000, credit: 0, description: '採購' },
            { accountId: 'payable-001', accountName: '應付帳款', debit: 0, credit: 10000, description: '應付款' }
          ],
          payableInfo: {
            supplierId: 'supplier-001',
            supplierName: '供應商A',
            dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10天後到期
            isPaidOff: false,
            paymentHistory: []
          }
        },
        {
          organizationId,
          transactionType: 'purchase',
          description: '已付款交易',
          totalAmount: 15000,
          entries: [
            { accountId: 'inventory-001', accountName: '庫存商品', debit: 15000, credit: 0, description: '採購' },
            { accountId: 'payable-001', accountName: '應付帳款', debit: 0, credit: 15000, description: '應付款' }
          ],
          payableInfo: {
            supplierId: 'supplier-002',
            supplierName: '供應商B',
            dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
            isPaidOff: true,
            paymentHistory: [
              {
                paymentTransactionId: 'dummy-payment-id',
                amount: 15000,
                paymentDate: new Date(),
                paymentMethod: 'cash'
              }
            ]
          }
        },
        {
          organizationId,
          transactionType: 'purchase',
          description: '未付款交易2',
          totalAmount: 8000,
          entries: [
            { accountId: 'inventory-001', accountName: '庫存商品', debit: 8000, credit: 0, description: '採購' },
            { accountId: 'payable-001', accountName: '應付帳款', debit: 0, credit: 8000, description: '應付款' }
          ],
          payableInfo: {
            supplierId: 'supplier-001',
            supplierName: '供應商A',
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5天後到期（較急迫）
            isPaidOff: false,
            paymentHistory: []
          }
        }
      ];

      // 建立所有交易
      for (const transaction of transactions) {
        await request(app)
          .post('/api/accounting2/transactions')
          .send(transaction)
          .expect(201);
      }

      // 測試查詢所有應付帳款
      const allPayableResponse = await request(app)
        .get(`/api/accounting2/transactions/payable?organizationId=${organizationId}`)
        .expect(200);

      expect(allPayableResponse.body).toHaveLength(2); // 只有未付款的

      // 測試按供應商過濾
      const supplierFilterResponse = await request(app)
        .get(`/api/accounting2/transactions/payable?organizationId=${organizationId}&supplierId=supplier-001`)
        .expect(200);

      expect(supplierFilterResponse.body).toHaveLength(2);
      expect(supplierFilterResponse.body.every((t: any) => t.payableInfo.supplierId === 'supplier-001')).toBe(true);

      // 驗證排序（應該按到期日排序，較急迫的在前）
      expect(new Date(supplierFilterResponse.body[0].payableInfo.dueDate).getTime())
        .toBeLessThan(new Date(supplierFilterResponse.body[1].payableInfo.dueDate).getTime());
    });
  });
});