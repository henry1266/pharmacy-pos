/**
 * 共享 API Schema 驗證定義
 * 統一前後端的資料驗證規則
 */

import { VALIDATION_CONSTANTS, REGEX_PATTERNS } from '../constants';

/**
 * 基礎驗證規則介面
 */
export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: readonly string[];
  custom?: (value: any) => boolean | string;
  message?: string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

/**
 * 認證相關 Schema
 */
export const AuthSchemas = {
  login: {
    username: {
      required: false,
      type: 'string' as const,
      minLength: VALIDATION_CONSTANTS.USERNAME.MIN_LENGTH,
      maxLength: VALIDATION_CONSTANTS.USERNAME.MAX_LENGTH,
      pattern: VALIDATION_CONSTANTS.USERNAME.PATTERN,
      message: '使用者名稱格式錯誤'
    },
    email: {
      required: false,
      type: 'string' as const,
      maxLength: VALIDATION_CONSTANTS.EMAIL.MAX_LENGTH,
      pattern: VALIDATION_CONSTANTS.EMAIL.PATTERN,
      message: '電子郵件格式錯誤'
    },
    password: {
      required: true,
      type: 'string' as const,
      minLength: VALIDATION_CONSTANTS.PASSWORD.MIN_LENGTH,
      maxLength: VALIDATION_CONSTANTS.PASSWORD.MAX_LENGTH,
      message: '密碼長度必須在 8-128 字元之間'
    },
    loginType: {
      required: false,
      type: 'string' as const,
      enum: ['username', 'email'] as const,
      message: '登入類型必須是 username 或 email'
    }
  },

  updateUser: {
    username: {
      required: false,
      type: 'string' as const,
      minLength: VALIDATION_CONSTANTS.USERNAME.MIN_LENGTH,
      maxLength: VALIDATION_CONSTANTS.USERNAME.MAX_LENGTH,
      pattern: VALIDATION_CONSTANTS.USERNAME.PATTERN,
      message: '使用者名稱格式錯誤'
    },
    email: {
      required: false,
      type: 'string' as const,
      maxLength: VALIDATION_CONSTANTS.EMAIL.MAX_LENGTH,
      pattern: VALIDATION_CONSTANTS.EMAIL.PATTERN,
      message: '電子郵件格式錯誤'
    },
    currentPassword: {
      required: false,
      type: 'string' as const,
      minLength: VALIDATION_CONSTANTS.PASSWORD.MIN_LENGTH,
      message: '目前密碼格式錯誤'
    },
    newPassword: {
      required: false,
      type: 'string' as const,
      minLength: VALIDATION_CONSTANTS.PASSWORD.MIN_LENGTH,
      maxLength: VALIDATION_CONSTANTS.PASSWORD.MAX_LENGTH,
      message: '新密碼長度必須在 8-128 字元之間'
    }
  }
} as const;

/**
 * 產品相關 Schema
 */
export const ProductSchemas = {
  create: {
    code: {
      required: true,
      type: 'string' as const,
      minLength: VALIDATION_CONSTANTS.PRODUCT_CODE.MIN_LENGTH,
      maxLength: VALIDATION_CONSTANTS.PRODUCT_CODE.MAX_LENGTH,
      pattern: VALIDATION_CONSTANTS.PRODUCT_CODE.PATTERN,
      message: '產品代碼格式錯誤'
    },
    name: {
      required: true,
      type: 'string' as const,
      minLength: VALIDATION_CONSTANTS.PRODUCT_NAME.MIN_LENGTH,
      maxLength: VALIDATION_CONSTANTS.PRODUCT_NAME.MAX_LENGTH,
      message: '產品名稱長度必須在 1-200 字元之間'
    },
    description: {
      required: false,
      type: 'string' as const,
      maxLength: 1000,
      message: '產品描述不能超過 1000 字元'
    },
    price: {
      required: false,
      type: 'number' as const,
      min: 0,
      max: 999999.99,
      message: '價格必須在 0-999999.99 之間'
    },
    cost: {
      required: false,
      type: 'number' as const,
      min: 0,
      max: 999999.99,
      message: '成本必須在 0-999999.99 之間'
    },
    unit: {
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 20,
      message: '單位長度必須在 1-20 字元之間'
    },
    stock: {
      required: false,
      type: 'number' as const,
      min: 0,
      max: 999999,
      message: '庫存數量必須在 0-999999 之間'
    },
    minStock: {
      required: false,
      type: 'number' as const,
      min: 0,
      max: 999999,
      message: '最小庫存必須在 0-999999 之間'
    },
    productType: {
      required: false,
      type: 'string' as const,
      enum: ['product', 'medicine'] as const,
      message: '產品類型必須是 product 或 medicine'
    },
    isMedicine: {
      required: false,
      type: 'boolean' as const,
      message: '是否為藥品必須是布林值'
    },
    isMonitored: {
      required: false,
      type: 'boolean' as const,
      message: '是否監控必須是布林值'
    }
  },

  update: {
    // 更新時所有欄位都是可選的
    code: {
      required: false,
      type: 'string' as const,
      minLength: VALIDATION_CONSTANTS.PRODUCT_CODE.MIN_LENGTH,
      maxLength: VALIDATION_CONSTANTS.PRODUCT_CODE.MAX_LENGTH,
      pattern: VALIDATION_CONSTANTS.PRODUCT_CODE.PATTERN,
      message: '產品代碼格式錯誤'
    },
    name: {
      required: false,
      type: 'string' as const,
      minLength: VALIDATION_CONSTANTS.PRODUCT_NAME.MIN_LENGTH,
      maxLength: VALIDATION_CONSTANTS.PRODUCT_NAME.MAX_LENGTH,
      message: '產品名稱長度必須在 1-200 字元之間'
    }
    // ... 其他欄位與 create 相同但都是 required: false
  }
} as const;

/**
 * 客戶相關 Schema
 */
export const CustomerSchemas = {
  create: {
    name: {
      required: true,
      type: 'string' as const,
      minLength: VALIDATION_CONSTANTS.CUSTOMER_NAME.MIN_LENGTH,
      maxLength: VALIDATION_CONSTANTS.CUSTOMER_NAME.MAX_LENGTH,
      message: '客戶名稱長度必須在 1-100 字元之間'
    },
    phone: {
      required: false,
      type: 'string' as const,
      pattern: VALIDATION_CONSTANTS.PHONE.PATTERN,
      minLength: VALIDATION_CONSTANTS.PHONE.MIN_LENGTH,
      maxLength: VALIDATION_CONSTANTS.PHONE.MAX_LENGTH,
      message: '電話號碼格式錯誤'
    },
    email: {
      required: false,
      type: 'string' as const,
      maxLength: VALIDATION_CONSTANTS.EMAIL.MAX_LENGTH,
      pattern: VALIDATION_CONSTANTS.EMAIL.PATTERN,
      message: '電子郵件格式錯誤'
    },
    idCardNumber: {
      required: false,
      type: 'string' as const,
      pattern: VALIDATION_CONSTANTS.ID_NUMBER.PATTERN,
      message: '身分證字號格式錯誤'
    },
    gender: {
      required: false,
      type: 'string' as const,
      enum: ['male', 'female', 'other'] as const,
      message: '性別必須是 male、female 或 other'
    },
    membershipLevel: {
      required: false,
      type: 'string' as const,
      enum: ['regular', 'silver', 'gold', 'platinum'] as const,
      message: '會員等級必須是 regular、silver、gold 或 platinum'
    }
  }
} as const;

/**
 * 供應商相關 Schema
 */
export const SupplierSchemas = {
  create: {
    name: {
      required: true,
      type: 'string' as const,
      minLength: VALIDATION_CONSTANTS.SUPPLIER_NAME.MIN_LENGTH,
      maxLength: VALIDATION_CONSTANTS.SUPPLIER_NAME.MAX_LENGTH,
      message: '供應商名稱長度必須在 1-100 字元之間'
    },
    phone: {
      required: false,
      type: 'string' as const,
      pattern: VALIDATION_CONSTANTS.PHONE.PATTERN,
      minLength: VALIDATION_CONSTANTS.PHONE.MIN_LENGTH,
      maxLength: VALIDATION_CONSTANTS.PHONE.MAX_LENGTH,
      message: '電話號碼格式錯誤'
    },
    email: {
      required: false,
      type: 'string' as const,
      maxLength: VALIDATION_CONSTANTS.EMAIL.MAX_LENGTH,
      pattern: VALIDATION_CONSTANTS.EMAIL.PATTERN,
      message: '電子郵件格式錯誤'
    },
    taxId: {
      required: false,
      type: 'string' as const,
      pattern: VALIDATION_CONSTANTS.TAX_ID.PATTERN,
      message: '統一編號格式錯誤'
    }
  }
} as const;

/**
 * 銷售相關 Schema
 */
export const SaleSchemas = {
  create: {
    items: {
      required: true,
      type: 'array' as const,
      minLength: 1,
      message: '銷售項目不能為空'
    },
    totalAmount: {
      required: false,
      type: 'number' as const,
      min: 0,
      max: 9999999.99,
      message: '總金額必須在 0-9999999.99 之間'
    },
    discount: {
      required: false,
      type: 'number' as const,
      min: 0,
      max: 9999999.99,
      message: '折扣金額必須在 0-9999999.99 之間'
    },
    paymentMethod: {
      required: true,
      type: 'string' as const,
      enum: ['cash', 'card', 'credit_card', 'debit_card', 'transfer', 'mobile_payment', 'other'] as const,
      message: '付款方式無效'
    },
    paymentStatus: {
      required: false,
      type: 'string' as const,
      enum: ['paid', 'pending', 'partial', 'cancelled'] as const,
      message: '付款狀態無效'
    }
  },

  item: {
    product: {
      required: true,
      type: 'string' as const,
      minLength: 24,
      maxLength: 24,
      message: '產品ID格式錯誤'
    },
    quantity: {
      required: true,
      type: 'number' as const,
      min: 0.001,
      max: 999999,
      message: '數量必須在 0.001-999999 之間'
    },
    price: {
      required: false,
      type: 'number' as const,
      min: 0,
      max: 999999.99,
      message: '單價必須在 0-999999.99 之間'
    },
    discount: {
      required: false,
      type: 'number' as const,
      min: 0,
      max: 999999.99,
      message: '折扣金額必須在 0-999999.99 之間'
    }
  }
} as const;

/**
 * 採購訂單相關 Schema
 */
export const PurchaseOrderSchemas = {
  create: {
    supplier: {
      required: true,
      type: 'string' as const,
      minLength: 24,
      maxLength: 24,
      message: '供應商ID格式錯誤'
    },
    items: {
      required: true,
      type: 'array' as const,
      minLength: 1,
      message: '採購項目不能為空'
    },
    totalAmount: {
      required: false,
      type: 'number' as const,
      min: 0,
      max: 9999999.99,
      message: '總金額必須在 0-9999999.99 之間'
    },
    status: {
      required: false,
      type: 'string' as const,
      enum: ['pending', 'approved', 'received', 'cancelled', 'completed'] as const,
      message: '訂單狀態無效'
    }
  }
} as const;

/**
 * 出貨訂單相關 Schema
 */
export const ShippingOrderSchemas = {
  create: {
    items: {
      required: true,
      type: 'array' as const,
      minLength: 1,
      message: '出貨項目不能為空'
    },
    totalAmount: {
      required: false,
      type: 'number' as const,
      min: 0,
      max: 9999999.99,
      message: '總金額必須在 0-9999999.99 之間'
    },
    status: {
      required: false,
      type: 'string' as const,
      enum: ['pending', 'shipped', 'delivered', 'cancelled', 'completed'] as const,
      message: '訂單狀態無效'
    }
  }
} as const;

/**
 * 會計相關 Schema
 */
export const AccountingSchemas = {
  create: {
    date: {
      required: true,
      type: 'string' as const,
      pattern: /^\d{4}-\d{2}-\d{2}$/,
      message: '日期格式必須是 YYYY-MM-DD'
    },
    shift: {
      required: true,
      type: 'string' as const,
      enum: ['morning', 'afternoon', 'evening', '早', '中', '晚'] as const,
      message: '班別無效'
    },
    category: {
      required: true,
      type: 'string' as const,
      minLength: 24,
      maxLength: 24,
      message: '分類ID格式錯誤'
    },
    amount: {
      required: true,
      type: 'number' as const,
      min: -999999.99,
      max: 999999.99,
      message: '金額必須在 -999999.99 到 999999.99 之間'
    },
    isExpense: {
      required: true,
      type: 'boolean' as const,
      message: '是否為支出必須是布林值'
    },
    type: {
      required: false,
      type: 'string' as const,
      enum: ['income', 'expense', 'transfer'] as const,
      message: '交易類型無效'
    }
  }
} as const;

/**
 * 員工相關 Schema
 */
export const EmployeeSchemas = {
  create: {
    name: {
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 100,
      message: '員工姓名長度必須在 1-100 字元之間'
    },
    position: {
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 50,
      message: '職位長度必須在 1-50 字元之間'
    },
    phone: {
      required: false,
      type: 'string' as const,
      pattern: VALIDATION_CONSTANTS.PHONE.PATTERN,
      message: '電話號碼格式錯誤'
    },
    email: {
      required: false,
      type: 'string' as const,
      pattern: VALIDATION_CONSTANTS.EMAIL.PATTERN,
      message: '電子郵件格式錯誤'
    },
    idNumber: {
      required: false,
      type: 'string' as const,
      pattern: VALIDATION_CONSTANTS.ID_NUMBER.PATTERN,
      message: '身分證字號格式錯誤'
    },
    gender: {
      required: false,
      type: 'string' as const,
      enum: ['male', 'female', 'other', '男', '女', '其他'] as const,
      message: '性別無效'
    },
    salary: {
      required: false,
      type: 'number' as const,
      min: 0,
      max: 999999,
      message: '薪資必須在 0-999999 之間'
    }
  }
} as const;

/**
 * 分頁參數 Schema
 */
export const PaginationSchema = {
  page: {
    required: false,
    type: 'number' as const,
    min: 1,
    max: 999999,
    message: '頁碼必須大於 0'
  },
  limit: {
    required: false,
    type: 'number' as const,
    min: 1,
    max: 100,
    message: '每頁筆數必須在 1-100 之間'
  },
  sortBy: {
    required: false,
    type: 'string' as const,
    maxLength: 50,
    message: '排序欄位長度不能超過 50 字元'
  },
  sortOrder: {
    required: false,
    type: 'string' as const,
    enum: ['asc', 'desc'] as const,
    message: '排序方向必須是 asc 或 desc'
  },
  search: {
    required: false,
    type: 'string' as const,
    maxLength: 200,
    message: '搜尋關鍵字長度不能超過 200 字元'
  }
} as const;

/**
 * 查詢參數 Schema
 */
export const QuerySchema = {
  ...PaginationSchema,
  category: {
    required: false,
    type: 'string' as const,
    minLength: 24,
    maxLength: 24,
    message: '分類ID格式錯誤'
  },
  status: {
    required: false,
    type: 'string' as const,
    maxLength: 50,
    message: '狀態長度不能超過 50 字元'
  },
  startDate: {
    required: false,
    type: 'string' as const,
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    message: '開始日期格式必須是 YYYY-MM-DD'
  },
  endDate: {
    required: false,
    type: 'string' as const,
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    message: '結束日期格式必須是 YYYY-MM-DD'
  },
  isActive: {
    required: false,
    type: 'boolean' as const,
    message: '是否啟用必須是布林值'
  }
} as const;

/**
 * 匯出所有 Schema
 */
export const Schemas = {
  Auth: AuthSchemas,
  Product: ProductSchemas,
  Customer: CustomerSchemas,
  Supplier: SupplierSchemas,
  Sale: SaleSchemas,
  PurchaseOrder: PurchaseOrderSchemas,
  ShippingOrder: ShippingOrderSchemas,
  Accounting: AccountingSchemas,
  Employee: EmployeeSchemas,
  Pagination: PaginationSchema,
  Query: QuerySchema
} as const;

/**
 * Schema 驗證函數型別
 */
export type SchemaValidator = (data: any, schema: ValidationSchema) => {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
};