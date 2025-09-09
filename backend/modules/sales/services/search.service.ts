import Sale from '../../../models/Sale';
import logger from '../../../utils/logger';

/**
 * 使用 aggregation 進行萬用字元搜尋，支援關聯資料搜尋
 * 支援 * (任意字串) 和 ? (單一字元) 萬用字元
 */
export async function performWildcardSearch(wildcardSearch: string): Promise<any[]> {
  if (!wildcardSearch || wildcardSearch.trim() === '') {
    return [];
  }

  // 清理輸入，防止 ReDoS 攻擊
  const cleanSearch = wildcardSearch.trim().substring(0, 100); // 限制長度
  
  // 將萬用字元轉換為正規表達式
  // 支援 *, ?, [字元類別] 語法
  let regexPattern = cleanSearch;
  
  // 先處理字元類別 [...]，避免被跳脫
  const characterClassRegex = /\[([^\]]+)\]/g;
  const characterClasses: string[] = [];
  let classIndex = 0;
  
  // 暫時替換字元類別為佔位符
  regexPattern = regexPattern.replace(characterClassRegex, (_match, content) => {
    const placeholder = `__CHAR_CLASS_${classIndex}__`;
    characterClasses[classIndex] = `[${content}]`;
    classIndex++;
    return placeholder;
  });
  
  // 跳脫其他正規表達式特殊字元，但保留 * 和 ?
  regexPattern = regexPattern
    .replace(/[.+^${}()|\\]/g, '\\$&') // 跳脫正規表達式特殊字元（不包含 []）
    .replace(/\*/g, '.*') // * 轉換為 .*
    .replace(/\?/g, '.'); // ? 轉換為 .
  
  // 還原字元類別
  characterClasses.forEach((charClass, index) => {
    const placeholder = `__CHAR_CLASS_${index}__`;
    regexPattern = regexPattern.replace(placeholder, charClass);
  });

  try {
    const searchRegex = new RegExp(regexPattern, 'i');
    
    // 使用 aggregation 進行複雜搜尋
    const pipeline: any[] = [
      // 1. 關聯客戶資料
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerData'
        }
      },
      // 2. 關聯產品資料
      {
        $lookup: {
          from: 'baseproducts',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productData'
        }
      },
      // 3. 關聯收銀員資料
      {
        $lookup: {
          from: 'users',
          localField: 'cashier',
          foreignField: '_id',
          as: 'cashierData'
        }
      },
      // 4. 搜尋條件
      {
        $match: {
          $or: [
            { saleNumber: searchRegex },
            { note: searchRegex },
            { 'customerData.name': searchRegex },
            { 'productData.name': searchRegex }
          ]
        }
      },
      // 5. 重組資料結構，模擬 populate() 的效果
      {
        $addFields: {
          // 填充客戶資料
          customer: {
            $cond: {
              if: { $gt: [{ $size: '$customerData' }, 0] },
              then: { $arrayElemAt: ['$customerData', 0] },
              else: '$customer'
            }
          },
          // 填充收銀員資料
          cashier: {
            $cond: {
              if: { $gt: [{ $size: '$cashierData' }, 0] },
              then: { $arrayElemAt: ['$cashierData', 0] },
              else: '$cashier'
            }
          },
          // 重組 items 陣列，填充產品資料
          items: {
            $map: {
              input: '$items',
              as: 'item',
              in: {
                $mergeObjects: [
                  '$$item',
                  {
                    product: {
                      $let: {
                        vars: {
                          matchedProduct: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: '$productData',
                                  cond: { $eq: ['$$this._id', '$$item.product'] }
                                }
                              },
                              0
                            ]
                          }
                        },
                        in: {
                          $cond: {
                            if: { $ne: ['$$matchedProduct', null] },
                            then: '$$matchedProduct',
                            else: '$$item.product'
                          }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      },
      // 6. 清理臨時欄位
      {
        $project: {
          customerData: 0,
          productData: 0,
          cashierData: 0
        }
      },
      // 7. 排序
      {
        $sort: { saleNumber: -1 as 1 | -1 }
      }
    ];

    const results = await Sale.aggregate(pipeline);
    return results;
  } catch (error) {
    logger.error(`萬用字元搜尋 aggregation 錯誤: ${(error as Error).message}`);
    return [];
  }
}

/**
 * 使用 aggregation 進行普通搜尋，支援關聯資料搜尋
 * 不進行萬用字元轉換，直接使用正規表達式搜尋
 */
export async function performRegularSearch(searchTerm: string): Promise<any[]> {
  if (!searchTerm || searchTerm.trim() === '') {
    return [];
  }

  // 清理輸入，防止 ReDoS 攻擊
  const cleanSearch = searchTerm.trim().substring(0, 100); // 限制長度
  
  try {
    // 直接使用正規表達式，不進行萬用字元轉換
    const searchRegex = new RegExp(cleanSearch, 'i');
    
    // 使用與萬用字元搜尋相同的 aggregation pipeline
    const pipeline: any[] = [
      // 1. 關聯客戶資料
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerData'
        }
      },
      // 2. 關聯產品資料
      {
        $lookup: {
          from: 'baseproducts',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productData'
        }
      },
      // 3. 關聯收銀員資料
      {
        $lookup: {
          from: 'users',
          localField: 'cashier',
          foreignField: '_id',
          as: 'cashierData'
        }
      },
      // 4. 搜尋條件
      {
        $match: {
          $or: [
            { saleNumber: searchRegex },
            { note: searchRegex },
            { 'customerData.name': searchRegex },
            { 'productData.name': searchRegex }
          ]
        }
      },
      // 5. 重組資料結構，模擬 populate() 的效果
      {
        $addFields: {
          // 填充客戶資料
          customer: {
            $cond: {
              if: { $gt: [{ $size: '$customerData' }, 0] },
              then: { $arrayElemAt: ['$customerData', 0] },
              else: '$customer'
            }
          },
          // 填充收銀員資料
          cashier: {
            $cond: {
              if: { $gt: [{ $size: '$cashierData' }, 0] },
              then: { $arrayElemAt: ['$cashierData', 0] },
              else: '$cashier'
            }
          },
          // 重組 items 陣列，填充產品資料
          items: {
            $map: {
              input: '$items',
              as: 'item',
              in: {
                $mergeObjects: [
                  '$$item',
                  {
                    product: {
                      $let: {
                        vars: {
                          matchedProduct: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: '$productData',
                                  cond: { $eq: ['$$this._id', '$$item.product'] }
                                }
                              },
                              0
                            ]
                          }
                        },
                        in: {
                          $cond: {
                            if: { $ne: ['$$matchedProduct', null] },
                            then: '$$matchedProduct',
                            else: '$$item.product'
                          }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      },
      // 6. 清理臨時欄位
      {
        $project: {
          customerData: 0,
          productData: 0,
          cashierData: 0
        }
      },
      // 7. 排序
      {
        $sort: { saleNumber: -1 as 1 | -1 }
      }
    ];

    const results = await Sale.aggregate(pipeline);
    return results;
  } catch (error) {
    logger.error(`普通搜尋 aggregation 錯誤: ${(error as Error).message}`);
    return [];
  }
}