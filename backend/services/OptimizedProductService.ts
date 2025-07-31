import BaseProduct from '../models/BaseProduct';
import ProductPackageUnit from '../models/ProductPackageUnit';
import { IBaseProductDocument } from '../src/types/models';
import { PackageUnitService } from './PackageUnitService';

/**
 * 優化的產品服務
 * 解決 N+1 查詢問題和性能瓶頸
 */
export class OptimizedProductService {
  
  /**
   * 優化的產品列表查詢 - 解決 N+1 查詢問題
   * @param query 查詢條件
   * @param options 查詢選項
   * @returns 包含包裝單位的產品列表
   */
  static async getProductsWithPackageUnits(
    query: any = {},
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      includePackageUnits?: boolean;
    } = {}
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'code',
      sortOrder = 'asc',
      includePackageUnits = true
    } = options;

    // 計算分頁
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // 並行執行產品查詢和總數查詢
    const [products, total] = await Promise.all([
      BaseProduct.find(query)
        .populate('category', 'name')
        .populate('supplier', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(), // 使用 lean() 提升性能
      BaseProduct.countDocuments(query)
    ]);

    if (!includePackageUnits || products.length === 0) {
      return {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    }

    // 批量查詢包裝單位 - 解決 N+1 問題
    const productIds = products.map(p => p._id);
    const allPackageUnits = await ProductPackageUnit.find({
      productId: { $in: productIds },
      isActive: true
    }).lean();

    // 建立包裝單位映射表
    const packageUnitsMap = new Map<string, any[]>();
    allPackageUnits.forEach(unit => {
      const productId = unit.productId.toString();
      if (!packageUnitsMap.has(productId)) {
        packageUnitsMap.set(productId, []);
      }
      packageUnitsMap.get(productId)!.push(unit);
    });

    // 組合產品和包裝單位數據
    const productsWithPackageUnits = products.map(product => ({
      ...product,
      packageUnits: packageUnitsMap.get(product._id.toString()) || []
    }));

    return {
      products: productsWithPackageUnits,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 優化的產品搜尋 - 使用索引和聚合管道
   * @param searchTerm 搜尋詞
   * @param options 搜尋選項
   * @returns 搜尋結果
   */
  static async searchProducts(
    searchTerm: string,
    options: {
      page?: number;
      limit?: number;
      productType?: string;
      category?: string;
      supplier?: string;
      minPrice?: number;
      maxPrice?: number;
    } = {}
  ) {
    const {
      page = 1,
      limit = 20,
      productType,
      category,
      supplier,
      minPrice,
      maxPrice
    } = options;

    const skip = (page - 1) * limit;

    // 建立聚合管道
    const pipeline: any[] = [];

    // 1. 匹配基本條件
    const matchStage: any = {
      isActive: { $ne: false }
    };

    // 文字搜尋（使用文字索引）
    if (searchTerm && searchTerm.trim()) {
      matchStage.$text = { $search: searchTerm.trim() };
    }

    // 產品類型篩選
    if (productType && productType !== 'all') {
      matchStage.productType = productType;
    }

    // 分類篩選
    if (category) {
      matchStage.category = category;
    }

    // 供應商篩選
    if (supplier) {
      matchStage.supplier = supplier;
    }

    // 價格區間篩選
    if (minPrice !== undefined || maxPrice !== undefined) {
      matchStage.sellingPrice = {};
      if (minPrice !== undefined) matchStage.sellingPrice.$gte = minPrice;
      if (maxPrice !== undefined) matchStage.sellingPrice.$lte = maxPrice;
    }

    pipeline.push({ $match: matchStage });

    // 2. 關聯分類和供應商資料
    pipeline.push(
      {
        $lookup: {
          from: 'productcategories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryData'
        }
      },
      {
        $lookup: {
          from: 'suppliers',
          localField: 'supplier',
          foreignField: '_id',
          as: 'supplierData'
        }
      }
    );

    // 3. 添加文字搜尋評分（如果有搜尋詞）
    if (searchTerm && searchTerm.trim()) {
      pipeline.push({
        $addFields: {
          score: { $meta: 'textScore' }
        }
      });
    }

    // 4. 排序
    const sortStage: any = {};
    if (searchTerm && searchTerm.trim()) {
      sortStage.score = { $meta: 'textScore' };
    } else {
      sortStage.code = 1;
    }
    pipeline.push({ $sort: sortStage });

    // 5. 分頁
    pipeline.push({ $skip: skip }, { $limit: limit });

    // 6. 重組輸出格式
    pipeline.push({
      $project: {
        _id: 1,
        code: 1,
        shortCode: 1,
        name: 1,
        subtitle: 1,
        unit: 1,
        purchasePrice: 1,
        sellingPrice: 1,
        description: 1,
        minStock: 1,
        barcode: 1,
        healthInsuranceCode: 1,
        healthInsurancePrice: 1,
        excludeFromStock: 1,
        productType: 1,
        isActive: 1,
        createdAt: 1,
        updatedAt: 1,
        category: { $arrayElemAt: ['$categoryData', 0] },
        supplier: { $arrayElemAt: ['$supplierData', 0] },
        score: 1
      }
    });

    // 執行聚合查詢
    const [products, totalResult] = await Promise.all([
      BaseProduct.aggregate(pipeline),
      BaseProduct.aggregate([
        { $match: matchStage },
        { $count: 'total' }
      ])
    ]);

    const total = totalResult[0]?.total || 0;

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      searchTerm
    };
  }

  /**
   * 批量更新產品庫存
   * @param updates 更新數據陣列
   * @returns 更新結果
   */
  static async batchUpdateStock(
    updates: Array<{ productId: string; quantity: number; operation: 'add' | 'subtract' | 'set' }>
  ) {
    const bulkOps = updates.map(update => {
      const { productId, quantity, operation } = update;
      
      let updateQuery: any;
      switch (operation) {
        case 'add':
          updateQuery = { $inc: { currentStock: quantity } };
          break;
        case 'subtract':
          updateQuery = { $inc: { currentStock: -quantity } };
          break;
        case 'set':
          updateQuery = { $set: { currentStock: quantity } };
          break;
        default:
          throw new Error(`不支援的操作: ${operation}`);
      }

      return {
        updateOne: {
          filter: { _id: productId },
          update: updateQuery
        }
      };
    });

    const result = await BaseProduct.bulkWrite(bulkOps);
    
    return {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
      upsertedCount: result.upsertedCount
    };
  }

  /**
   * 獲取低庫存產品
   * @param threshold 庫存閾值
   * @returns 低庫存產品列表
   */
  static async getLowStockProducts(threshold?: number) {
    const pipeline = [
      {
        $match: {
          isActive: { $ne: false },
          excludeFromStock: { $ne: true }
        }
      },
      {
        $lookup: {
          from: 'inventories',
          localField: '_id',
          foreignField: 'product',
          as: 'inventoryRecords'
        }
      },
      {
        $addFields: {
          currentStock: {
            $sum: '$inventoryRecords.quantity'
          }
        }
      },
      {
        $match: {
          $expr: {
            $lt: ['$currentStock', threshold ? threshold : '$minStock']
          }
        }
      },
      {
        $lookup: {
          from: 'productcategories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryData'
        }
      },
      {
        $lookup: {
          from: 'suppliers',
          localField: 'supplier',
          foreignField: '_id',
          as: 'supplierData'
        }
      },
      {
        $project: {
          code: 1,
          name: 1,
          unit: 1,
          minStock: 1,
          currentStock: 1,
          stockDifference: { $subtract: ['$minStock', '$currentStock'] },
          category: { $arrayElemAt: ['$categoryData.name', 0] },
          supplier: { $arrayElemAt: ['$supplierData.name', 0] }
        }
      },
      {
        $sort: { stockDifference: -1 }
      }
    ];

    const lowStockProducts = await BaseProduct.aggregate(pipeline);
    
    return {
      products: lowStockProducts,
      count: lowStockProducts.length,
      threshold: threshold || '各產品最低庫存設定'
    };
  }

  /**
   * 產品銷售統計
   * @param startDate 開始日期
   * @param endDate 結束日期
   * @param limit 限制數量
   * @returns 銷售統計
   */
  static async getProductSalesStats(
    startDate: Date,
    endDate: Date,
    limit: number = 20
  ) {
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
          salesCount: { $sum: 1 },
          avgPrice: { $avg: '$items.price' }
        }
      },
      {
        $lookup: {
          from: 'baseproducts',
          localField: '_id',
          foreignField: '_id',
          as: 'productData'
        }
      },
      {
        $unwind: '$productData'
      },
      {
        $project: {
          productId: '$_id',
          productCode: '$productData.code',
          productName: '$productData.name',
          unit: '$productData.unit',
          totalQuantity: 1,
          totalRevenue: 1,
          salesCount: 1,
          avgPrice: 1,
          costPrice: '$productData.purchasePrice'
        }
      },
      {
        $addFields: {
          grossProfit: {
            $subtract: ['$totalRevenue', { $multiply: ['$totalQuantity', '$costPrice'] }]
          },
          profitMargin: {
            $cond: {
              if: { $gt: ['$totalRevenue', 0] },
              then: {
                $multiply: [
                  {
                    $divide: [
                      { $subtract: ['$totalRevenue', { $multiply: ['$totalQuantity', '$costPrice'] }] },
                      '$totalRevenue'
                    ]
                  },
                  100
                ]
              },
              else: 0
            }
          }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: limit
      }
    ];

    const stats = await BaseProduct.aggregate([
      {
        $lookup: {
          from: 'sales',
          let: { productId: '$_id' },
          pipeline: pipeline,
          as: 'salesData'
        }
      }
    ]);

    return stats;
  }
}

export default OptimizedProductService;