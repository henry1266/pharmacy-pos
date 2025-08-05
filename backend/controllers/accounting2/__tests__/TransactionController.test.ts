import { Request, Response } from 'express';
import { TransactionController } from '../TransactionController';
import { TransactionService } from '../../../services/accounting2/TransactionService';

jest.mock('../../../services/accounting2/TransactionService');
jest.mock('../../../services/accounting2/ValidationService');

const mockRequest = (body: any = {}, params: any = {}, query: any = {}, user: any = null) => {
  const req = {} as Request;
  req.body = body;
  req.params = params;
  req.query = query;
  if (user) {
    (req as any).user = user;
  }
  return req;
};

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.send = jest.fn().mockReturnThis();
  res.setHeader = jest.fn().mockReturnThis();
  return res;
};

describe('TransactionController', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createTransaction', () => {
        it('應該建立一個新的交易', async () => {
            const req = mockRequest(
                {
                    groupNumber: 'TEST-001',
                    transactionDate: new Date(),
                    entries: [
                        { accountId: '1', debitAmount: 100, creditAmount: 0 },
                        { accountId: '2', debitAmount: 0, creditAmount: 100 },
                    ],
                },
                {},
                {},
                { id: 'user-123' }
            );
            const res = mockResponse();
            const mockTransaction = { _id: 'tx-1', groupNumber: 'TEST-001' };

            (TransactionService.createTransactionGroup as jest.Mock).mockResolvedValue(mockTransaction);

            await TransactionController.createTransaction(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: '交易建立成功',
                data: mockTransaction,
            });
            expect(TransactionService.createTransactionGroup).toHaveBeenCalledWith(req.body, 'user-123');
        });

        it('應該在未提供 userId 時返回 401', async () => {
            const req = mockRequest(
                {
                    groupNumber: 'TEST-001',
                    transactionDate: new Date(),
                    entries: [{}, {}]
                },
                {},
                {},
                null
            );
            const res = mockResponse();

            await TransactionController.createTransaction(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: '未提供使用者身份',
            });
        })

        it('應該在缺少必要欄位時返回 400', async () => {
            const req = mockRequest(
                {
                    // groupNumber is missing
                    transactionDate: new Date(),
                    entries: [{}, {}]
                },
                {},
                {},
                { id: 'user-123' }
            );
            const res = mockResponse();

            await TransactionController.createTransaction(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: '缺少必要欄位：groupNumber, transactionDate, entries',
            });
        })

        it('應該在分錄少於兩筆時返回 400', async () => {
            const req = mockRequest(
                {
                    groupNumber: 'TEST-001',
                    transactionDate: new Date(),
                    entries: [{}]
                },
                {},
                {},
                { id: 'user-123' }
            );
            const res = mockResponse();

            await TransactionController.createTransaction(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: '交易至少需要兩筆分錄',
            });
        })

        it('應該在服務層拋出錯誤時返回 500', async () => {
            const req = mockRequest(
                {
                    groupNumber: 'TEST-001',
                    transactionDate: new Date(),
                    entries: [{}, {}],
                },
                {},
                {},
                { id: 'user-123' }
            );
            const res = mockResponse();
            const errorMessage = 'Database error';

            (TransactionService.createTransactionGroup as jest.Mock).mockRejectedValue(new Error(errorMessage));

            await TransactionController.createTransaction(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: errorMessage,
            });
        });
    });

    describe('getTransactionById', () => {
        it('應該返回指定的交易', async () => {
            const req = mockRequest({}, { id: 'tx-1' }, {}, { id: 'user-123' });
            const res = mockResponse();
            const mockTransaction = { _id: 'tx-1', groupNumber: 'TEST-001' };

            (TransactionService.getTransactionGroupById as jest.Mock).mockResolvedValue(mockTransaction);

            await TransactionController.getTransactionById(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockTransaction,
            });
            expect(TransactionService.getTransactionGroupById).toHaveBeenCalledWith('tx-1', 'user-123');
        });

        it('應該在找不到交易時返回 404', async () => {
            const req = mockRequest({}, { id: 'non-existent-id' }, {}, { id: 'user-123' });
            const res = mockResponse();

            (TransactionService.getTransactionGroupById as jest.Mock).mockResolvedValue(null);

            await TransactionController.getTransactionById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: '交易不存在或無權限查看',
            });
        });
    });

    describe('getTransactionsByUser', () => {
        it('應該返回使用者相關的交易列表', async () => {
            const req = mockRequest({}, {}, { page: '1', limit: '10' }, { id: 'user-123' });
            const res = mockResponse();
            const mockResult = {
                transactions: [{ _id: 'tx-1' }],
                total: 1,
                page: 1,
                limit: 10,
            };

            (TransactionService.getTransactionGroups as jest.Mock).mockResolvedValue(mockResult);

            await TransactionController.getTransactionsByUser(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockResult.transactions,
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 1,
                    totalPages: 1,
                },
            });
        });
    });

    describe('updateTransaction', () => {
        it('應該更新指定的交易', async () => {
            const req = mockRequest({ description: 'Updated' }, { id: 'tx-1' }, {}, { id: 'user-123' });
            const res = mockResponse();
            const mockTransaction = { _id: 'tx-1', description: 'Updated' };

            (TransactionService.updateTransactionGroup as jest.Mock).mockResolvedValue(mockTransaction);

            await TransactionController.updateTransaction(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: '交易更新成功',
                data: mockTransaction,
            });
            expect(TransactionService.updateTransactionGroup).toHaveBeenCalledWith('tx-1', { description: 'Updated' }, 'user-123');
        });

        it('應該在找不到交易時返回 404', async () => {
            const req = mockRequest({ description: 'Updated' }, { id: 'non-existent-id' }, {}, { id: 'user-123' });
            const res = mockResponse();

            (TransactionService.updateTransactionGroup as jest.Mock).mockResolvedValue(null);

            await TransactionController.updateTransaction(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: '交易不存在或無權限修改',
            });
        });
    });

    describe('deleteTransaction', () => {
        it('應該刪除指定的交易', async () => {
            const req = mockRequest({}, { id: 'tx-1' }, {}, { id: 'user-123' });
            const res = mockResponse();

            (TransactionService.cancelTransactionGroup as jest.Mock).mockResolvedValue({ _id: 'tx-1' });

            await TransactionController.deleteTransaction(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: '交易刪除成功',
            });
            expect(TransactionService.cancelTransactionGroup).toHaveBeenCalledWith('tx-1', 'user-123', '使用者刪除');
        });

        it('應該在找不到交易時返回 404', async () => {
            const req = mockRequest({}, { id: 'non-existent-id' }, {}, { id: 'user-123' });
            const res = mockResponse();

            (TransactionService.cancelTransactionGroup as jest.Mock).mockResolvedValue(null);

            await TransactionController.deleteTransaction(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: '交易不存在或無權限刪除',
            });
        });
    });
});