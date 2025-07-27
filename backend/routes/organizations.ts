import express, { Router } from 'express';
import mongoose from 'mongoose';
import { body, param, validationResult } from 'express-validator';
import Organization from '../models/Organization';
import {
  OrganizationType,
  OrganizationStatus,
  OrganizationFormData,
  OrganizationApiResponse,
  OrganizationListApiResponse
} from '@pharmacy-pos/shared/types/organization';
import auth from '../middleware/auth';

// 擴展 Request 介面
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    userId?: string;
  };
}

const router: Router = express.Router();

// 驗證規則
const organizationValidation = [
  body('code')
    .isLength({ min: 2, max: 10 })
    .matches(/^[A-Z0-9]+$/)
    .withMessage('機構代碼必須是2-10位英數字'),
  body('name')
    .isLength({ min: 1, max: 100 })
    .trim()
    .withMessage('機構名稱必須在1-100字元之間'),
  body('type')
    .isIn(Object.values(OrganizationType))
    .withMessage('無效的機構類型'),
  body('contact.address')
    .isLength({ min: 1 })
    .trim()
    .withMessage('地址不能為空'),
  body('contact.phone')
    .matches(/^[\d\-\(\)\+\s]+$/)
    .isLength({ min: 8, max: 20 })
    .withMessage('請輸入有效的電話號碼'),
  body('contact.email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('請輸入有效的電子郵件'),
  body('contact.taxId')
    .optional({ checkFalsy: true })
    .matches(/^\d{8}$/)
    .withMessage('統一編號必須是8位數字')
];

// 取得所有機構列表
router.get('/', auth, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as OrganizationType;
    const status = req.query.status as OrganizationStatus;
    const search = req.query.search as string;

    // 建立查詢條件
    const filter: any = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    // 執行查詢
    const skip = (page - 1) * limit;
    const [organizations, total] = await Promise.all([
      Organization.find(filter)
        .populate('parent', 'name code type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Organization.countDocuments(filter)
    ]);

    const response: OrganizationListApiResponse = {
      success: true,
      data: organizations as any[],
      total,
      page,
      limit
    };

    res.json(response);
  } catch (error) {
    console.error('取得機構列表錯誤:', error);
    res.status(500).json({
      success: false,
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      message: '取得機構列表失敗'
    });
  }
});

// 根據ID取得單一機構
router.get('/:id', [
  auth,
  param('id').isMongoId().withMessage('無效的機構ID')
], async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        data: null,
        message: '參數驗證失敗',
        errors: errors.array()
      });
      return;
    }

    const organization = await Organization.findById(req.params.id)
      .populate('parent', 'name code type')
      .populate('children', 'name code type status');

    if (!organization) {
      res.status(404).json({
        success: false,
        data: null,
        message: '找不到指定的機構'
      });
      return;
    }

    const response: OrganizationApiResponse = {
      success: true,
      data: {
        ...organization.toJSON(),
        _id: organization._id.toString()
      } as any
    };

    res.json(response);
  } catch (error) {
    console.error('取得機構詳情錯誤:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '取得機構詳情失敗'
    });
  }
});

// 建立新機構
router.post('/', [
  auth,
  ...organizationValidation
], async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    console.log('=== 建立機構請求 ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('驗證錯誤:', errors.array());
      res.status(400).json({
        success: false,
        data: null,
        message: '資料驗證失敗',
        errors: errors.array()
      });
      return;
    }

    const formData: OrganizationFormData = req.body;
    const userId = req.user?.id || req.user?.userId;

    if (!userId) {
      console.log('未找到用戶ID');
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    // 檢查機構代碼是否已存在
    const existingOrg = await Organization.findOne({ code: formData.code.toUpperCase() });
    if (existingOrg) {
      console.log('機構代碼已存在:', formData.code);
      res.status(400).json({
        success: false,
        data: null,
        message: '機構代碼已存在'
      });
      return;
    }

    // 建立新機構
    console.log('準備建立機構，資料:', {
      ...formData,
      code: formData.code.toUpperCase(),
      business: {
        ...formData.business,
        establishedDate: new Date(formData.business.establishedDate)
      },
      createdBy: userId,
      updatedBy: userId
    });

    const organization = new Organization({
      ...formData,
      code: formData.code.toUpperCase(),
      business: {
        ...formData.business,
        establishedDate: new Date(formData.business.establishedDate)
      },
      createdBy: userId,
      updatedBy: userId
    });

    await organization.save();
    console.log('機構建立成功:', organization._id);

    const response: OrganizationApiResponse = {
      success: true,
      data: {
        ...organization.toJSON(),
        _id: organization._id.toString()
      } as any,
      message: '機構建立成功'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('建立機構錯誤:', error);
    console.error('錯誤詳情:', error instanceof Error ? error.message : error);
    if (error instanceof Error && 'errors' in error) {
      console.error('Mongoose 驗證錯誤:', (error as any).errors);
    }
    res.status(500).json({
      success: false,
      data: null,
      message: '建立機構失敗'
    });
  }
});

// 更新機構
router.put('/:id', [
  auth,
  param('id').isMongoId().withMessage('無效的機構ID'),
  ...organizationValidation
], async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        data: null,
        message: '資料驗證失敗',
        errors: errors.array()
      });
      return;
    }

    const formData: OrganizationFormData = req.body;
    const userId = req.user?.id || req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    // 檢查機構是否存在
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      res.status(404).json({
        success: false,
        data: null,
        message: '找不到指定的機構'
      });
      return;
    }

    // 檢查機構代碼是否與其他機構衝突
    if (formData.code.toUpperCase() !== organization.code) {
      const existingOrg = await Organization.findOne({
        code: formData.code.toUpperCase(),
        _id: { $ne: req.params.id }
      });
      if (existingOrg) {
        res.status(400).json({
          success: false,
          data: null,
          message: '機構代碼已存在'
        });
        return;
      }
    }

    // 更新機構資料
    Object.assign(organization, {
      ...formData,
      code: formData.code.toUpperCase(),
      business: {
        ...formData.business,
        establishedDate: new Date(formData.business.establishedDate)
      },
      updatedBy: userId
    });

    await organization.save();

    const response: OrganizationApiResponse = {
      success: true,
      data: {
        ...organization.toJSON(),
        _id: organization._id.toString()
      } as any,
      message: '機構更新成功'
    };

    res.json(response);
  } catch (error) {
    console.error('更新機構錯誤:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '更新機構失敗'
    });
  }
});

// 刪除機構
router.delete('/:id', [
  auth,
  param('id').isMongoId().withMessage('無效的機構ID')
], async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        data: null,
        message: '參數驗證失敗',
        errors: errors.array()
      });
      return;
    }

    const userId = req.user?.id || req.user?.userId;

    if (!userId) {
      res.status(401).json({ message: '未授權的請求' });
      return;
    }

    // 檢查機構是否存在
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      res.status(404).json({
        success: false,
        data: null,
        message: '找不到指定的機構'
      });
      return;
    }

    // 檢查是否有子機構
    const childrenCount = await Organization.countDocuments({ parentId: req.params.id });
    if (childrenCount > 0) {
      res.status(400).json({
        success: false,
        data: null,
        message: '無法刪除有子機構的機構，請先刪除或移動子機構'
      });
      return;
    }

    // 軟刪除：設定狀態為停業
    organization.status = OrganizationStatus.SUSPENDED;
    organization.updatedBy = new mongoose.Types.ObjectId(userId);
    await organization.save();

    const response: OrganizationApiResponse = {
      success: true,
      data: {
        ...organization.toJSON(),
        _id: organization._id.toString()
      } as any,
      message: '機構已停業'
    };

    res.json(response);
  } catch (error) {
    console.error('刪除機構錯誤:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '刪除機構失敗'
    });
  }
});

// 取得機構階層結構
router.get('/:id/hierarchy', [
  auth,
  param('id').isMongoId().withMessage('無效的機構ID')
], async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        data: null,
        message: '參數驗證失敗',
        errors: errors.array()
      });
      return;
    }

    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      res.status(404).json({
        success: false,
        data: null,
        message: '找不到指定的機構'
      });
      return;
    }

    // 取得階層路徑 - 暫時實作簡單版本
    const hierarchyPath = [];
    let currentOrg = organization;
    
    while (currentOrg) {
      hierarchyPath.unshift({
        _id: currentOrg._id.toString(),
        name: currentOrg.name,
        code: currentOrg.code,
        type: currentOrg.type
      });
      
      if (currentOrg.parentId) {
        currentOrg = await Organization.findById(currentOrg.parentId);
      } else {
        break;
      }
    }

    res.json({
      success: true,
      data: {
        organization: {
          ...organization.toJSON(),
          _id: organization._id.toString()
        },
        hierarchyPath
      }
    });
  } catch (error) {
    console.error('取得機構階層錯誤:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '取得機構階層失敗'
    });
  }
});

// 取得機構統計資料
router.get('/stats/summary', auth, async (_req: AuthenticatedRequest, res: express.Response) => {
  try {
    const [totalCount, typeStats, statusStats] = await Promise.all([
      Organization.countDocuments(),
      Organization.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Organization.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    const organizationsByType = typeStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const organizationsByStatus = statusStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalOrganizations: totalCount,
        organizationsByType,
        organizationsByStatus
      }
    });
  } catch (error) {
    console.error('取得機構統計錯誤:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '取得機構統計失敗'
    });
  }
});

export default router;