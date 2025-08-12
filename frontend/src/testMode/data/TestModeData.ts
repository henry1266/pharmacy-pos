import type { Product, Customer, Category } from '@pharmacy-pos/shared/types/entities';
import type { SalesTrend, CategorySales } from '../../services/dashboardService';

/**
 * 測試模式統一數據模組
 * 包含所有頁面需要的模擬數據
 */

// ===== 供應商數據 =====
export interface TestSupplierData {
  id: string;
  _id?: string;
  code: string;
  shortCode?: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
  [key: string]: any;
}

export const mockSuppliersData: TestSupplierData[] = [
  {
    id: 'mockSup001',
    code: 'MKSUP001',
    shortCode: 'MS1',
    name: '測試供應商甲 (模擬)',
    contactPerson: '陳先生',
    phone: '02-12345678',
    taxId: '12345678',
    paymentTerms: '月結30天',
    notes: '這是模擬的供應商資料。'
  },
  {
    id: 'mockSup002',
    code: 'MKSUP002',
    shortCode: 'MS2',
    name: '測試供應商乙 (模擬)',
    contactPerson: '林小姐',
    phone: '03-87654321',
    taxId: '87654321',
    paymentTerms: '貨到付款',
    notes: '這是另一筆模擬供應商資料，用於測試。'
  },
  {
    id: 'mockSup003',
    code: 'MKSUP003',
    shortCode: 'MS3',
    name: '測試供應商丙 (模擬)',
    contactPerson: '王小姐',
    phone: '04-55667788',
    taxId: '55667788',
    paymentTerms: '現金交易',
    notes: '第三個模擬供應商資料。'
  }
];

// ===== 客戶數據 =====
export interface TestCustomerData {
  id: string;
  code: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  idCardNumber?: string;
  birthdate?: string | null;
  notes?: string;
  membershipLevel: string;
  level?: string;
  [key: string]: any;
}

export const mockCustomersData: TestCustomerData[] = [
  {
    id: 'mockCust001',
    code: 'MKC001',
    name: '模擬客戶張三',
    phone: '0911222333',
    email: 'test1@example.com',
    address: '模擬地址一',
    idCardNumber: 'A123456789',
    birthdate: '1990-01-15',
    notes: '這是模擬客戶資料。',
    membershipLevel: 'platinum',
  },
  {
    id: 'mockCust002',
    code: 'MKC002',
    name: '模擬客戶李四',
    phone: '0955666777',
    email: 'test2@example.com',
    address: '模擬地址二',
    idCardNumber: 'B987654321',
    birthdate: '1985-05-20',
    notes: '另一筆模擬客戶資料。',
    membershipLevel: 'regular',
  },
  {
    id: 'mockCust003',
    code: 'MKC003',
    name: '模擬客戶王五',
    phone: '0933444555',
    email: 'test3@example.com',
    address: '模擬地址三',
    idCardNumber: 'C555666777',
    birthdate: '1992-08-10',
    notes: '第三筆模擬客戶資料。',
    membershipLevel: 'regular',
  }
];

// ===== 產品數據 =====
export const mockProductsData: Product[] = [
  {
    _id: 'mockProd001',
    code: 'MOCK001',
    name: '測試藥品X (模擬)',
    cost: 100,
    price: 150,
    stock: 50,
    unit: '盒',
    category: { name: '測試分類' } as any,
    supplier: { name: '測試供應商' } as any,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'mockProd002',
    code: 'MOCK002',
    name: '測試藥品Y (模擬)',
    cost: 200,
    price: 250,
    stock: 30,
    unit: '盒',
    category: { name: '測試分類' } as any,
    supplier: { name: '測試供應商' } as any,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'mockProd003',
    code: 'MOCK003',
    name: '測試保健品Z (模擬)',
    cost: 250,
    price: 300,
    stock: 0,
    unit: '盒',
    category: { name: '測試分類' } as any,
    supplier: { name: '測試供應商' } as any,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'mockProd004',
    code: 'MOCK004',
    name: '測試維他命A (模擬)',
    cost: 80,
    price: 120,
    stock: 100,
    unit: '瓶',
    category: { name: '保健品' } as any,
    supplier: { name: '測試供應商' } as any,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'mockProd005',
    code: 'MOCK005',
    name: '測試感冒藥B (模擬)',
    cost: 150,
    price: 200,
    stock: 25,
    unit: '盒',
    category: { name: '感冒藥' } as any,
    supplier: { name: '測試供應商' } as any,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// ===== 產品分類數據 =====
export const mockCategoriesData: Category[] = [
  {
    _id: 'mockCat001',
    name: '感冒藥',
    description: '感冒相關藥品分類',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'mockCat002',
    name: '保健品',
    description: '保健食品分類',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'mockCat003',
    name: '維他命',
    description: '維他命補充品分類',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'mockCat004',
    name: '醫療器材',
    description: '醫療器材用品分類',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'mockCat005',
    name: '測試分類',
    description: '測試用分類',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// ===== 銷售數據 =====
// 定義與 SalesListPage 兼容的 ExtendedSale 類型
export interface ExtendedSale {
  _id: string;
  saleNumber?: string;
  date?: string | Date;
  customer?: Customer | { name: string; _id?: string };
  items: SaleItem[];
  totalAmount?: number;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'mobile_payment' | 'other';
  paymentStatus: 'paid' | 'pending' | 'partial' | 'cancelled';
  status?: 'completed' | 'pending' | 'cancelled';
  user?: { _id: string; name: string };
  notes?: string;
  createdBy?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  discount?: number;
}

export interface SaleItem {
  product?: {
    name: string;
    _id?: string;
    id?: string;
  };
  name?: string;
  quantity: number;
  price: number;
  unitPrice?: number;
  amount?: number;
  subtotal?: number;
}

export const mockSalesData: ExtendedSale[] = [
  {
    _id: 'mockSale001',
    saleNumber: 'SALE001',
    date: new Date(),
    customer: { name: mockCustomersData[0]?.name || '未知客戶', _id: mockCustomersData[0]?.id || 'unknown' },
    items: [
      {
        product: { name: mockProductsData[0]?.name || '未知產品', _id: mockProductsData[0]?._id || 'unknown' },
        quantity: 2,
        unitPrice: 150,
        price: 150,
        subtotal: 300
      }
    ],
    totalAmount: 300,
    discount: 0,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    status: 'completed',
    notes: '測試銷售記錄',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'mockSale002',
    saleNumber: 'SALE002',
    date: new Date(),
    customer: { name: mockCustomersData[1]?.name || '未知客戶', _id: mockCustomersData[1]?.id || 'unknown' },
    items: [
      {
        product: { name: mockProductsData[1]?.name || '未知產品', _id: mockProductsData[1]?._id || 'unknown' },
        quantity: 1,
        unitPrice: 250,
        price: 250,
        subtotal: 250
      }
    ],
    totalAmount: 250,
    discount: 0,
    paymentMethod: 'credit_card',
    paymentStatus: 'paid',
    status: 'completed',
    notes: '另一筆測試銷售記錄',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 'mockSale003',
    saleNumber: 'SALE003',
    date: new Date(),
    customer: { name: mockCustomersData[2]?.name || '未知客戶', _id: mockCustomersData[2]?.id || 'unknown' },
    items: [
      {
        product: { name: mockProductsData[2]?.name || '未知產品', _id: mockProductsData[2]?._id || 'unknown' },
        quantity: 3,
        unitPrice: 300,
        price: 300,
        subtotal: 900
      },
      {
        product: { name: mockProductsData[3]?.name || '未知產品', _id: mockProductsData[3]?._id || 'unknown' },
        quantity: 1,
        unitPrice: 120,
        price: 120,
        subtotal: 120
      }
    ],
    totalAmount: 1020,
    discount: 20,
    paymentMethod: 'mobile_payment',
    paymentStatus: 'paid',
    status: 'completed',
    notes: '多項目測試銷售記錄',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// ===== Dashboard 數據 =====
export interface MockLowStockItem {
  id: string;
  name: string;
  currentStock: number;
  reorderPoint: number;
}

export interface MockSalesSummary {
  total: number;
  today: number;
  month: number;
}

export interface MockCounts {
  products: number;
  suppliers: number;
  customers: number;
  purchaseOrders: number;
  orders: number;
  salesToday: number;
}

export interface MockDashboardData {
  totalSalesToday: number;
  totalOrdersToday: number;
  newCustomersToday: number;
  pendingPurchaseOrders: number;
  counts: MockCounts;
  lowStockItems: MockLowStockItem[];
  salesSummary: MockSalesSummary;
}

export const mockDashboardData: MockDashboardData = {
  totalSalesToday: 12345.67,
  totalOrdersToday: 152,
  newCustomersToday: 23,
  pendingPurchaseOrders: 5,
  counts: {
    products: 580,
    suppliers: 45,
    customers: 1203,
    purchaseOrders: 78,
    salesToday: 152,
    orders: 152,
  },
  lowStockItems: [
    { id: '1', name: '測試藥品A (低庫存)', currentStock: 3, reorderPoint: 5 },
    { id: '2', name: '測試藥品B (低庫存)', currentStock: 1, reorderPoint: 3 },
    { id: '3', name: '測試保健品C (低庫存)', currentStock: 2, reorderPoint: 10 },
  ],
  salesSummary: {
    total: 123456.78,
    today: 12345.67,
    month: 98765.43
  }
};

export const mockSalesTrend: SalesTrend[] = [
  { date: '2025-05-01', totalSales: 1200 },
  { date: '2025-05-02', totalSales: 1500 },
  { date: '2025-05-03', totalSales: 900 },
  { date: '2025-05-04', totalSales: 1500 },
  { date: '2025-05-05', totalSales: 1300 },
  { date: '2025-05-06', totalSales: 1600 },
  { date: '2025-05-07', totalSales: 1400 },
];

export const mockCategorySales: CategorySales[] = [
  { category: '感冒藥 (測試)', totalSales: 500 },
  { category: '維他命 (測試)', totalSales: 3500 },
  { category: '保健品 (測試)', totalSales: 2500 },
  { category: '醫療器材 (測試)', totalSales: 1500 },
  { category: '其他 (測試)', totalSales: 1000 },
];

// ===== 員工數據 =====
export interface TestEmployeeData {
  _id: string;
  name: string;
  position: string;
  phone?: string;
  email?: string;
  schedule?: {
    [key: string]: string; // 日期 -> 班別
  };
}

export const mockEmployeesData: TestEmployeeData[] = [
  {
    _id: 'mockEmp001',
    name: '測試員工甲',
    position: '藥師',
    phone: '0911111111',
    email: 'emp1@test.com',
    schedule: {
      '2025-01-20': '早班',
      '2025-01-21': '中班',
      '2025-01-22': '晚班'
    }
  },
  {
    _id: 'mockEmp002',
    name: '測試員工乙',
    position: '助理',
    phone: '0922222222',
    email: 'emp2@test.com',
    schedule: {
      '2025-01-20': '中班',
      '2025-01-21': '晚班',
      '2025-01-22': '早班'
    }
  },
  {
    _id: 'mockEmp003',
    name: '測試員工丙',
    position: '收銀員',
    phone: '0933333333',
    email: 'emp3@test.com',
    schedule: {
      '2025-01-20': '晚班',
      '2025-01-21': '早班',
      '2025-01-22': '中班'
    }
  }
];

// ===== 進貨單測試數據 =====
export interface TestPurchaseOrderProduct {
  id: string;
  _id: string;
  name: string;
  unit: string;
  purchasePrice: number;
  stock: number;
  did: string;
  dname: string;
  category: { name: string };
  supplier: { name: string };
  code: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

export interface TestPurchaseOrderSupplier {
  id: string;
  _id: string;
  name: string;
  [key: string]: any;
}

export const mockPurchaseOrderProducts: TestPurchaseOrderProduct[] = [
  {
    id: 'mockProd1',
    _id: 'mockProd1',
    name: '模擬產品A (測試)',
    unit: '瓶',
    purchasePrice: 50,
    stock: 100,
    did: 'T001',
    dname: '模擬產品A (測試)',
    category: { name: '測試分類' },
    supplier: { name: '模擬供應商X' },
    code: 'T001',
    price: 60,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mockProd2',
    _id: 'mockProd2',
    name: '模擬產品B (測試)',
    unit: '盒',
    purchasePrice: 120,
    stock: 50,
    did: 'T002',
    dname: '模擬產品B (測試)',
    category: { name: '測試分類' },
    supplier: { name: '模擬供應商Y' },
    code: 'T002',
    price: 150,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mockProd3',
    _id: 'mockProd3',
    name: '模擬產品C (測試)',
    unit: '支',
    purchasePrice: 75,
    stock: 200,
    did: 'T003',
    dname: '模擬產品C (測試)',
    category: { name: '測試分類' },
    supplier: { name: '模擬供應商X' },
    code: 'T003',
    price: 90,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const mockPurchaseOrderSuppliers: TestPurchaseOrderSupplier[] = [
  { id: 'mockSup1', _id: 'mockSup1', name: '模擬供應商X (測試)' },
  { id: 'mockSup2', _id: 'mockSup2', name: '模擬供應商Y (測試)' }
];

// ===== 匯出所有測試數據的統一介面 =====
export interface TestModeDataCollection {
  suppliers: TestSupplierData[];
  customers: TestCustomerData[];
  products: Product[];
  categories: Category[];
  sales: ExtendedSale[];
  employees: TestEmployeeData[];
  dashboard: {
    summary: MockDashboardData;
    salesTrend: SalesTrend[];
    categorySales: CategorySales[];
  };
  purchaseOrder: {
    products: TestPurchaseOrderProduct[];
    suppliers: TestPurchaseOrderSupplier[];
  };
}

export const getAllTestModeData = (): TestModeDataCollection => ({
  suppliers: mockSuppliersData,
  customers: mockCustomersData,
  products: mockProductsData,
  categories: mockCategoriesData,
  sales: mockSalesData,
  employees: mockEmployeesData,
  dashboard: {
    summary: mockDashboardData,
    salesTrend: mockSalesTrend,
    categorySales: mockCategorySales
  },
  purchaseOrder: {
    products: mockPurchaseOrderProducts,
    suppliers: mockPurchaseOrderSuppliers
  }
});

// ===== 個別數據獲取函數 =====
export const getTestSuppliers = (): TestSupplierData[] => mockSuppliersData;
export const getTestCustomers = (): TestCustomerData[] => mockCustomersData;
export const getTestProducts = (): Product[] => mockProductsData;
export const getTestCategories = (): Category[] => mockCategoriesData;
export const getTestSales = (): ExtendedSale[] => mockSalesData;
export const getTestEmployees = (): TestEmployeeData[] => mockEmployeesData;
export const getTestDashboardData = (): MockDashboardData => mockDashboardData;
export const getTestSalesTrend = (): SalesTrend[] => mockSalesTrend;
export const getTestCategorySales = (): CategorySales[] => mockCategorySales;