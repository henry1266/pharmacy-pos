import type {
  ProductCreateInput,
  ProductUpdateInput,
  ProductQueryParams,
  ProductPackageUnit,
} from '../../schemas/zod/product';

export const basePackageUnits: ProductPackageUnit[] = [
  {
    unitName: 'Box',
    unitValue: 1,
    isBaseUnit: true,
    isActive: true,
  },
  {
    unitName: 'Tablet',
    unitValue: 10,
    isBaseUnit: false,
    isActive: true,
  },
];

export const validNonMedicineCreatePayload: ProductCreateInput = {
  name: 'Reusable Ice Pack',
  unit: 'piece',
  productType: 'product',
  packageUnits: basePackageUnits,
  purchasePrice: 45,
  sellingPrice: 75,
  supplier: '60f71ad7d4f1a2b5c1234567',
  excludeFromStock: false,
  isActive: true,
};

export const validMedicineCreatePayload: ProductCreateInput = {
  name: 'Acetaminophen 500mg',
  unit: 'box',
  productType: 'medicine',
  healthInsuranceCode: 'NHI-ACETA-500',
  healthInsurancePrice: 120,
  packageUnits: basePackageUnits,
  purchasePrice: 95,
  sellingPrice: 150,
  supplier: '60f71ad7d4f1a2b5c7654321',
  isActive: true,
};

export const validProductUpdatePayload: ProductUpdateInput = {
  name: 'Acetaminophen 500mg (sugar coated)',
  subtitle: 'Pain relief tablets',
  minStock: 20,
  excludeFromStock: false,
  packageUnits: [
    {
      unitName: 'Box',
      unitValue: 1,
      isBaseUnit: true,
    },
    {
      unitName: 'Tablet',
      unitValue: 10,
      isBaseUnit: false,
    },
  ],
};

export const validProductQueryParams: ProductQueryParams = {
  search: 'acet',
  productType: 'medicine',
  sortBy: 'name',
  sortOrder: 'asc',
  stockStatus: 'inStock',
};

export const validProductSuccessEnvelope = {
  success: true,
  message: 'Products fetched successfully.',
  timestamp: '2025-10-05T10:00:00.000Z',
  filters: {
    search: 'acet',
    productType: 'medicine',
    stockStatus: 'inStock',
  },
  count: 1,
  data: [
    {
      _id: '60f71ad7d4f1a2b5c9999999',
      code: 'PRD-001',
      name: 'Acetaminophen 500mg',
      unit: 'box',
      productType: 'medicine',
      packageUnits: basePackageUnits,
      isActive: true,
      createdAt: '2025-10-01T00:00:00.000Z',
      updatedAt: '2025-10-01T00:00:00.000Z',
    },
  ],
} as const;

export const validProductDetailEnvelope = {
  success: true,
  message: 'Product fetched successfully.',
  timestamp: '2025-10-05T10:00:00.000Z',
  data: {
    _id: '60f71ad7d4f1a2b5c9999999',
    code: 'PRD-001',
    name: 'Acetaminophen 500mg',
    unit: 'box',
    productType: 'medicine',
    packageUnits: basePackageUnits,
    isActive: true,
    createdAt: '2025-10-01T00:00:00.000Z',
    updatedAt: '2025-10-01T00:00:00.000Z',
  },
} as const;

export const invalidProductCreatePayloads: Array<Record<string, unknown>> = [
  {},
  {
    name: '',
    unit: '',
  },
  {
    name: 'Valid Name',
    unit: 'piece',
    productType: 'invalid-type',
  },
  {
    name: 'Valid Name',
    unit: 'piece',
    packageUnits: [
      {
        unitName: '',
        unitValue: -1,
        isBaseUnit: false,
      },
    ],
  },
  {
    name: 'Valid Name',
    unit: 'piece',
    healthInsurancePrice: -30,
  },
];

export const invalidProductQueryPayloads: Array<Record<string, unknown>> = [
  {
    productType: 'hardware',
  },
  {
    sortBy: 'unknown-field',
  },
  {
    sortOrder: 'ascending',
  },
  {
    minPrice: 'not-a-number',
    maxPrice: 'still-not-a-number',
  },
];

