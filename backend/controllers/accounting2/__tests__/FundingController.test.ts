import { Request, Response } from 'express';
import { FundingController } from '../FundingController';
import { FundingService } from '../../../services/accounting2/FundingService';
import { ValidationService } from '../../../services/accounting2/ValidationService';

jest.mock('../../../services/accounting2/FundingService');
jest.mock('../../../services/accounting2/ValidationService');
jest.mock('../../../utils/logger');

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

describe('FundingController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('trackFundingUsage', () => {
    it('應該追蹤資金使用情況', async () => {
      const req = mockRequest(
        {
          transactionId: 'tx-123',
          fundingSourceId: 'fs-456',
          amount: 1000,
          organizationId: 'org-1'
        },
        {},
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();
      const mockResult = {
        transactionId: 'tx-123',
        fundingSourceId: 'fs-456',
        amount: 1000,
        status: 'tracked'
      };

      (FundingService.trackFundingUsage as jest.Mock).mockResolvedValue(mockResult);

      await FundingController.trackFundingUsage(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: '資金使用追蹤成功',
        data: mockResult
      });
      expect(FundingService.trackFundingUsage).toHaveBeenCalledWith(
        'tx-123',
        'user-123',
        'org-1'
      );
    });

    it('應該在未提供 userId 時返回 401', async () => {
      const req = mockRequest(
        {
          transactionId: 'tx-123',
          fundingSourceId: 'fs-456',
          amount: 1000
        },
        {},
        {},
        null
      );
      const res = mockResponse();

      await FundingController.trackFundingUsage(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未提供使用者身份'
      });
    });

    it('應該在缺少必要欄位時返回 400', async () => {
      const req = mockRequest(
        {
          // transactionId is missing
          fundingSourceId: 'fs-456',
          amount: 1000
        },
        {},
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();

      await FundingController.trackFundingUsage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '缺少必要欄位：transactionId, fundingSourceId, amount'
      });
    });

    it('應該在發生錯誤時返回 500', async () => {
      const req = mockRequest(
        {
          transactionId: 'tx-123',
          fundingSourceId: 'fs-456',
          amount: 1000,
          organizationId: 'org-1'
        },
        {},
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();
      const errorMessage = '資料庫連線錯誤';

      (FundingService.trackFundingUsage as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await FundingController.trackFundingUsage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessage
      });
    });
  });

  describe('getFundingSources', () => {
    it('應該返回資金來源列表', async () => {
      const req = mockRequest(
        {},
        {},
        {
          organizationId: 'org-1',
          isActive: 'true',
          page: '1',
          limit: '50',
          sortBy: 'createdAt',
          sortOrder: 'desc'
        },
        { id: 'user-123' }
      );
      const res = mockResponse();
      const mockFundingSources = [
        {
          _id: 'fs-1',
          name: '資金來源1',
          totalAmount: 10000,
          availableAmount: 5000
        },
        {
          _id: 'fs-2',
          name: '資金來源2',
          totalAmount: 20000,
          availableAmount: 15000
        }
      ];

      (FundingService.getAvailableFundingSources as jest.Mock).mockResolvedValue(mockFundingSources);

      await FundingController.getFundingSources(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockFundingSources
      });
      expect(FundingService.getAvailableFundingSources).toHaveBeenCalledWith(
        'user-123',
        'org-1',
        undefined
      );
    });

    it('應該在未提供 userId 時返回 401', async () => {
      const req = mockRequest(
        {},
        {},
        { organizationId: 'org-1' },
        null
      );
      const res = mockResponse();

      await FundingController.getFundingSources(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未提供使用者身份'
      });
    });

    it('應該在發生錯誤時返回 500', async () => {
      const req = mockRequest(
        {},
        {},
        { organizationId: 'org-1' },
        { id: 'user-123' }
      );
      const res = mockResponse();
      const errorMessage = '資料庫連線錯誤';

      (FundingService.getAvailableFundingSources as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await FundingController.getFundingSources(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessage
      });
    });
  });

  describe('analyzeFundingFlow', () => {
    it('應該分析資金流向', async () => {
      const req = mockRequest(
        {},
        {},
        {
          organizationId: 'org-1',
          startDate: '2023-01-01',
          endDate: '2023-12-31'
        },
        { id: 'user-123' }
      );
      const res = mockResponse();
      const mockAnalysis = {
        totalFundingSources: 5,
        totalFundingAmount: 100000,
        totalUsedAmount: 60000,
        totalAvailableAmount: 40000,
        utilizationRate: 0.6,
        flowDetails: [
          {
            sourceId: 'fs-1',
            sourceDescription: '資金來源1',
            sourceTransactionId: 'tx-1',
            usedAmount: 30000
          },
          {
            sourceId: 'fs-2',
            sourceDescription: '資金來源2',
            sourceTransactionId: 'tx-2',
            usedAmount: 30000
          }
        ]
      };

      (FundingService.getFundingFlowAnalysis as jest.Mock).mockResolvedValue(mockAnalysis);

      await FundingController.analyzeFundingFlow(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockAnalysis
      });
      expect(FundingService.getFundingFlowAnalysis).toHaveBeenCalledWith(
        'user-123',
        'org-1',
        {
          startDate: expect.any(Date),
          endDate: expect.any(Date)
        }
      );
    });

    it('應該在未提供 userId 時返回 401', async () => {
      const req = mockRequest(
        {},
        {},
        { organizationId: 'org-1' },
        null
      );
      const res = mockResponse();

      await FundingController.analyzeFundingFlow(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未提供使用者身份'
      });
    });

    it('應該在發生錯誤時返回 500', async () => {
      const req = mockRequest(
        {},
        {},
        { organizationId: 'org-1' },
        { id: 'user-123' }
      );
      const res = mockResponse();
      const errorMessage = '資料庫連線錯誤';

      (FundingService.getFundingFlowAnalysis as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await FundingController.analyzeFundingFlow(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessage
      });
    });
  });

  describe('validateFundingAllocation', () => {
    it('應該驗證資金分配', async () => {
      const req = mockRequest(
        {
          transactionId: 'tx-123',
          allocations: [
            { fundingSourceId: 'fs-1', amount: 500 },
            { fundingSourceId: 'fs-2', amount: 500 }
          ]
        },
        {},
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();
      const mockValidation = {
        isValid: true,
        totalAmount: 1000,
        allocatedAmount: 1000,
        difference: 0,
        details: []
      };

      (FundingService.validateFundingAllocation as jest.Mock).mockResolvedValue(mockValidation);

      await FundingController.validateFundingAllocation(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockValidation
      });
      expect(FundingService.validateFundingAllocation).toHaveBeenCalledWith(
        'tx-123',
        'user-123'
      );
    });

    it('應該在未提供 userId 時返回 401', async () => {
      const req = mockRequest(
        {
          transactionId: 'tx-123',
          allocations: []
        },
        {},
        {},
        null
      );
      const res = mockResponse();

      await FundingController.validateFundingAllocation(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未提供使用者身份'
      });
    });

    it('應該在缺少必要欄位時返回 400', async () => {
      const req = mockRequest(
        {
          // transactionId is missing
          allocations: []
        },
        {},
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();

      await FundingController.validateFundingAllocation(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '缺少必要欄位：transactionId, allocations'
      });
    });

    it('應該在發生錯誤時返回 500', async () => {
      const req = mockRequest(
        {
          transactionId: 'tx-123',
          allocations: []
        },
        {},
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();
      const errorMessage = '資料庫連線錯誤';

      (FundingService.validateFundingAllocation as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await FundingController.validateFundingAllocation(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessage
      });
    });
  });

  describe('validateFunding', () => {
    it('應該驗證資金完整性', async () => {
      const req = mockRequest(
        { organizationId: 'org-1' },
        {},
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();
      const mockValidation = {
        isValid: true,
        issues: [
          { type: 'relationship', description: '資金來源關聯不完整' }
        ]
      };

      (ValidationService.validateSystemIntegrity as jest.Mock).mockResolvedValue(mockValidation);

      await FundingController.validateFunding(req, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          fundingSpecificIssues: expect.any(Array)
        })
      });
      expect(ValidationService.validateSystemIntegrity).toHaveBeenCalledWith(
        'user-123',
        'org-1'
      );
    });

    it('應該在未提供 userId 時返回 401', async () => {
      const req = mockRequest(
        { organizationId: 'org-1' },
        {},
        {},
        null
      );
      const res = mockResponse();

      await FundingController.validateFunding(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: '未提供使用者身份'
      });
    });

    it('應該在發生錯誤時返回 500', async () => {
      const req = mockRequest(
        { organizationId: 'org-1' },
        {},
        {},
        { id: 'user-123' }
      );
      const res = mockResponse();
      const errorMessage = '資料庫連線錯誤';

      (ValidationService.validateSystemIntegrity as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await FundingController.validateFunding(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessage
      });
    });
  });
});