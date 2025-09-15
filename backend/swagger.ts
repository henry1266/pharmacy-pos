import swaggerJSDoc from 'swagger-jsdoc';
import SwaggerParser from '@apidevtools/swagger-parser';
import path from 'path';
import fs from 'fs';
import { version } from './package.json';

// OpenAPI規範的類型定義
interface OpenAPISpec {
  openapi: string;
  info?: {
    title?: string;
    version?: string;
    description?: string;
    contact?: {
      name?: string;
      email?: string;
    };
    license?: {
      name: string;
      identifier?: string;
      url?: string;
    };
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths?: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
  security?: Array<Record<string, any>>;
  tags?: Array<{
    name: string;
    description?: string;
  }>;
}

/**
 * Swagger配置選項
 */
const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: '藥局POS系統 API',
      version: version,
      description: '藥局POS系統RESTful API文檔',
      contact: {
        name: '藥局POS開發團隊',
        email: 'dev@pharmacy-pos.com'
      },
      license: {
        name: 'ISC',
        identifier: 'ISC'
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? 'https://api.pharmacy-pos.com'
          : `http://192.168.68.90:${process.env.SERVER_PORT || process.env.PORT || 5000}`,
        description: process.env.NODE_ENV === 'production' ? '生產環境' : '開發環境'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key'
        }
      },
      schemas: {
        // 通用API響應格式
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: '操作是否成功'
            },
            message: {
              type: 'string',
              description: '響應消息'
            },
            data: {
              type: 'object',
              description: '響應數據'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: '響應時間戳'
            }
          }
        },
        // 錯誤響應格式
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: '錯誤消息'
            },
            error: {
              type: 'string',
              description: '詳細錯誤信息'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        // 產品基本模型
        BaseProduct: {
          type: 'object',
          required: ['code', 'name', 'unit'],
          properties: {
            _id: {
              type: 'string',
              description: '產品ID'
            },
            code: {
              type: 'string',
              description: '產品代碼'
            },
            shortCode: {
              type: 'string',
              description: '產品簡碼'
            },
            name: {
              type: 'string',
              description: '產品名稱'
            },
            subtitle: {
              type: 'string',
              description: '產品副標題'
            },
            unit: {
              type: 'string',
              description: '基本單位'
            },
            purchasePrice: {
              type: 'number',
              description: '進貨價格'
            },
            sellingPrice: {
              type: 'number',
              description: '售價'
            },
            description: {
              type: 'string',
              description: '產品描述'
            },
            category: {
              type: 'string',
              description: '分類ID'
            },
            supplier: {
              type: 'string',
              description: '供應商ID'
            },
            minStock: {
              type: 'number',
              description: '最低庫存量'
            },
            productType: {
              type: 'string',
              enum: ['PRODUCT', 'MEDICINE'],
              description: '產品類型'
            },
            isActive: {
              type: 'boolean',
              description: '是否啟用'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '創建時間'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新時間'
            }
          }
        },
        // 商品模型
        Product: {
          allOf: [
            { $ref: '#/components/schemas/BaseProduct' },
            {
              type: 'object',
              properties: {
                barcode: {
                  type: 'string',
                  description: '商品條碼'
                }
              }
            }
          ]
        },
        // 藥品模型
        Medicine: {
          allOf: [
            { $ref: '#/components/schemas/BaseProduct' },
            {
              type: 'object',
              properties: {
                healthInsuranceCode: {
                  type: 'string',
                  description: '健保碼'
                },
                healthInsurancePrice: {
                  type: 'number',
                  description: '健保價格'
                }
              }
            }
          ]
        },
        // 出貨單項目模型
        ShippingOrderItem: {
          type: 'object',
          properties: {
            did: {
              type: 'string',
              description: '產品代碼'
            },
            dname: {
              type: 'string',
              description: '產品名稱'
            },
            dquantity: {
              type: 'number',
              description: '數量'
            },
            dtotalCost: {
              type: 'number',
              description: '總成本'
            },
            product: {
              type: 'string',
              description: '產品ID'
            },
            healthInsuranceCode: {
              type: 'string',
              description: '健保代碼'
            },
            batchNumber: {
              type: 'string',
              description: '批號'
            },
            packageQuantity: {
              type: 'number',
              description: '包裝數量'
            },
            boxQuantity: {
              type: 'number',
              description: '每盒數量'
            },
            unit: {
              type: 'string',
              description: '單位'
            }
          }
        },
        // 出貨單模型
        ShippingOrder: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: '出貨單ID'
            },
            soid: {
              type: 'string',
              description: '出貨單號'
            },
            orderNumber: {
              type: 'string',
              description: '訂單號'
            },
            sosupplier: {
              type: 'string',
              description: '供應商名稱'
            },
            supplier: {
              type: 'string',
              description: '供應商ID'
            },
            items: {
              type: 'array',
              description: '出貨項目列表',
              items: {
                $ref: '#/components/schemas/ShippingOrderItem'
              }
            },
            notes: {
              type: 'string',
              description: '備註'
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'cancelled'],
              description: '出貨單狀態'
            },
            paymentStatus: {
              type: 'string',
              description: '付款狀態'
            },
            totalAmount: {
              type: 'number',
              description: '總金額'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '創建時間'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新時間'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  // 指定API路由文件的路徑模式
  apis: [
    './routes/*.ts',
    './routes/*/*.ts',
    './controllers/*/*.ts',
    './modules/**/*.ts'  // 添加 modules 目錄下的所有 TypeScript 檔案
  ]
};

// 確保openapi目錄存在
const openapiDir = path.join(__dirname, '../openapi');
if (!fs.existsSync(openapiDir)) {
  fs.mkdirSync(openapiDir, { recursive: true });
}

// 生成Swagger規格
const swaggerSpec = swaggerJSDoc(options);

/**
 * 驗證並保存OpenAPI規範作為SSOT
 */
async function validateAndSaveOpenAPISpec() {
  try {
    // 先保存規範為臨時JSON檔案
    const tempPath = path.join(openapiDir, 'temp-openapi.json');
    fs.writeFileSync(tempPath, JSON.stringify(swaggerSpec, null, 2));
    // If a generated openapi.json from shared exists, keep it as SSOT and skip overwriting
    const preferredPath = path.join(openapiDir, 'openapi.json');
    if (fs.existsSync(preferredPath)) {
      try { fs.unlinkSync(tempPath); } catch {}
      console.log('Detected generated openapi.json; skip writing swagger-generated spec.');
      return swaggerSpec;
    }
    
    // 驗證OpenAPI規範
    const validatedSpec = await SwaggerParser.validate(tempPath) as OpenAPISpec;
    console.log('OpenAPI 3.1規範驗證成功');
    
    // 保存為正式JSON檔案
    const outputPath = path.join(openapiDir, 'openapi.json');
    fs.writeFileSync(outputPath, JSON.stringify(validatedSpec, null, 2));
    console.log(`OpenAPI規範已保存至: ${outputPath}`);
    
    // 刪除臨時檔案
    fs.unlinkSync(tempPath);
    
    return validatedSpec;
  } catch (err) {
    console.error('OpenAPI規範驗證失敗:', err);
    return swaggerSpec; // 如果驗證失敗，返回原始規範
  }
}

// 在非測試環境中驗證並保存OpenAPI規範
if (process.env.NODE_ENV !== 'test') {
  validateAndSaveOpenAPISpec().catch(console.error);
}

export default swaggerSpec;
