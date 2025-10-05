/**
 * 商品服務 V2 - ts-rest contract client
 * 保持 shared SSOT 一致性並提供封裝便利函式
 */

import type { Product } from '@pharmacy-pos/shared/types/entities';
import type {
  ProductCreateInput,
  ProductUpdateInput,
  ProductQueryParams as ContractProductQueryParams,
} from '@pharmacy-pos/shared/schemas/zod/product';
import { createProductContractClient } from '@/features/product/api/client';
import type { ProductListEnvelope, ProductResponseDto } from '@/features/product/api/dto';

/**
 * 前端過濾參數介面
 */
export interface ProductFilters {
  search?: string;
  productType?: 'all' | 'product' | 'medicine';
  category?: string;
  supplier?: string;
  minPrice?: number;
  maxPrice?: number;
  stockStatus?: 'all' | 'low' | 'out' | 'normal';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const productClient = createProductContractClient();

type ListProductsArgs = Parameters<typeof productClient.listProducts>[0];
type GetProductByIdArgs = Parameters<typeof productClient.getProductById>[0];
type GetProductByCodeArgs = Parameters<typeof productClient.getProductByCode>[0];
type CreateProductArgs = Parameters<typeof productClient.createProduct>[0];
type CreateMedicineArgs = Parameters<typeof productClient.createMedicine>[0];
type UpdateProductArgs = Parameters<typeof productClient.updateProduct>[0];
type DeleteProductArgs = Parameters<typeof productClient.deleteProduct>[0];

const STOCK_STATUS_MAP: Record<'low' | 'out' | 'normal', Exclude<NonNullable<ContractProductQueryParams['stockStatus']>, 'all'>> = {
  low: 'lowStock',
  out: 'outOfStock',
  normal: 'inStock',
};

const toRecord = (body: unknown): Record<string, unknown> | undefined => (
  typeof body === 'object' && body !== null ? body as Record<string, unknown> : undefined
);

const createContractError = (
  result: { status: number; body: unknown },
  fallback: string,
): Error => {
  const candidate = toRecord(result.body);
  const message = typeof candidate?.message === 'string' ? candidate.message : fallback;
  const error = new Error(message);
  (error as any).status = result.status;
  (error as any).body = result.body;
  return error;
};

const isSuccessEnvelope = (
  body: unknown,
): body is ProductListEnvelope<ProductResponseDto[] | ProductResponseDto> => (
  typeof body === 'object'
  && body !== null
  && 'success' in body
  && (body as { success?: boolean }).success === true
);

const extractProductListFromBody = (body: unknown): Product[] => {
  if (Array.isArray(body)) {
    return body as Product[];
  }
  if (isSuccessEnvelope(body)) {
    const data = body.data;
    if (Array.isArray(data)) {
      return data as Product[];
    }
  }
  return [];
};

const extractProductFromBody = (body: unknown): Product | undefined => {
  if (!body) {
    return undefined;
  }
  if (Array.isArray(body)) {
    return (body[0] ?? undefined) as Product | undefined;
  }
  if (isSuccessEnvelope(body)) {
    if (Array.isArray(body.data)) {
      return (body.data[0] ?? undefined) as Product | undefined;
    }
    return body.data as Product | undefined;
  }
  return body as Product;
};

const ensureSuccessBody = (
  result: { status: number; body: unknown },
  fallback: string,
): unknown => {
  if (result.status >= 200 && result.status < 300) {
    return result.body;
  }
  throw createContractError(result, fallback);
};

const rethrow = (error: unknown, fallback: string): never => {
  if (error instanceof Error) {
    throw error;
  }
  throw new Error(fallback);
};

const mapFiltersToQuery = (filters: ProductFilters): ContractProductQueryParams => {
  const query: ContractProductQueryParams = {};

  if (filters.search?.trim()) {
    query.search = filters.search.trim();
  }
  if (filters.productType && filters.productType !== 'all') {
    query.productType = filters.productType;
  }
  if (filters.category) {
    query.category = filters.category;
  }
  if (filters.supplier) {
    query.supplier = filters.supplier;
  }
  if (typeof filters.minPrice === 'number') {
    query.minPrice = filters.minPrice;
  }
  if (typeof filters.maxPrice === 'number') {
    query.maxPrice = filters.maxPrice;
  }
  if (filters.stockStatus && filters.stockStatus !== 'all') {
    const mapped = STOCK_STATUS_MAP[filters.stockStatus];
    if (mapped) {
      query.stockStatus = mapped;
    }
  }
  if (filters.sortBy && ['code', 'name', 'price', 'stock'].includes(filters.sortBy)) {
    query.sortBy = filters.sortBy as ContractProductQueryParams['sortBy'];
  }
  if (filters.sortOrder) {
    query.sortOrder = filters.sortOrder;
  }

  return query;
};

const toProductListEnvelope = (body: unknown): ProductListEnvelope<Product[]> => {
  if (isSuccessEnvelope(body)) {
    const data = Array.isArray(body.data) ? body.data as Product[] : undefined;
    const count = typeof body.count === 'number' ? body.count : data?.length;
    return {
      ...body,
      data,
      ...(typeof count === 'number' ? { count } : {}),
    } as ProductListEnvelope<Product[]>;
  }

  if (Array.isArray(body)) {
    const products = body as Product[];
    return {
      success: true,
      data: products,
      count: products.length,
    };
  }

  const product = extractProductFromBody(body);
  return {
    success: true,
    data: product ? [product] : [],
    count: product ? 1 : 0,
  };
};

export const getAllProducts = async (
  params?: ContractProductQueryParams,
): Promise<Product[]> => {
  try {
    const query = params && Object.keys(params).length > 0 ? params : undefined;
    const result = await productClient.listProducts((query ? { query } : undefined) as ListProductsArgs);
    const body = ensureSuccessBody(result, 'Failed to fetch products');
    return extractProductListFromBody(body);
  } catch (error) {
    return rethrow(error, 'Failed to fetch products');
  }
};

export const getProductById = async (id: string): Promise<Product> => {
  try {
    const args: GetProductByIdArgs = { params: { id } };
    const result = await productClient.getProductById(args);
    const body = ensureSuccessBody(result, 'Failed to fetch product detail');
    const product = extractProductFromBody(body);
    if (product) {
      return product;
    }
    throw createContractError(result, 'Product detail is empty');
  } catch (error) {
    return rethrow(error, 'Failed to fetch product detail');
  }
};

export const getProductByCode = async (code: string): Promise<Product | null> => {
  try {
    const args: GetProductByCodeArgs = { params: { code } };
    const result = await productClient.getProductByCode(args);
    if (result.status === 404) {
      return null;
    }
    const body = ensureSuccessBody(result, 'Failed to fetch product by code');
    const product = extractProductFromBody(body);
    if (product) {
      return product;
    }
    throw createContractError(result, 'Product detail is empty');
  } catch (error) {
    if (error instanceof Error && (error as any).status === 404) {
      return null;
    }
    return rethrow(error, 'Failed to fetch product by code');
  }
};

const determineCreateEndpoint = (
  payload: ProductCreateInput,
): 'product' | 'medicine' => {
  if (payload.productType === 'medicine') {
    return 'medicine';
  }
  return 'product';
};

export const createProduct = async (
  payload: ProductCreateInput,
): Promise<Product> => {
  try {
    const target = determineCreateEndpoint(payload);
    const args = { body: payload } as CreateProductArgs & CreateMedicineArgs;

    const result = target === 'medicine'
      ? await productClient.createMedicine(args as CreateMedicineArgs)
      : await productClient.createProduct(args as CreateProductArgs);

    const body = ensureSuccessBody(result, 'Failed to create product');
    const product = extractProductFromBody(body);
    if (product) {
      return product;
    }
    throw createContractError(result, 'Product creation returned empty body');
  } catch (error) {
    return rethrow(error, 'Failed to create product');
  }
};

export const updateProduct = async (
  id: string,
  payload: ProductUpdateInput,
): Promise<Product> => {
  try {
    const args: UpdateProductArgs = { params: { id }, body: payload };
    const result = await productClient.updateProduct(args);
    const body = ensureSuccessBody(result, 'Failed to update product');
    const product = extractProductFromBody(body);
    if (product) {
      return product;
    }
    throw createContractError(result, 'Product update returned empty body');
  } catch (error) {
    return rethrow(error, 'Failed to update product');
  }
};

export const deleteProduct = async (
  id: string,
): Promise<{ success: boolean; message?: string }> => {
  try {
    const args: DeleteProductArgs = { params: { id } };
    const result = await productClient.deleteProduct(args);
    const body = ensureSuccessBody(result, 'Failed to delete product');
    const envelope = isSuccessEnvelope(body)
      ? body as ProductListEnvelope<{ id?: string }>
      : undefined;
    const message = envelope?.message;
    return {
      success: true,
      ...(message ? { message } : {}),
    };
  } catch (error) {
    return rethrow(error, 'Failed to delete product');
  }
};

export const searchProducts = async (query: string): Promise<Product[]> => {
  const trimmed = query.trim();
  if (!trimmed) {
    return getAllProducts();
  }
  return getAllProducts({ search: trimmed });
};

export const getLowStockProducts = async (): Promise<Product[]> => {
  return getAllProducts({ stockStatus: 'lowStock' });
};

export const updateProductStock = async (
  updates: Array<{ id: string; quantity: number }>,
): Promise<Product[]> => {
  const results: Product[] = [];
  for (const update of updates) {
    try {
      const product = await updateProduct(update.id, { stock: update.quantity });
      results.push(product);
    } catch (error) {
      console.error(`Failed to update stock for product ${update.id}`, error);
    }
  }
  return results;
};

export const getFilteredProducts = async (
  filters: ProductFilters = {},
): Promise<ProductListEnvelope<Product[]>> => {
  try {
    const query = mapFiltersToQuery(filters);
    const result = await productClient.listProducts((Object.keys(query).length > 0 ? { query } : undefined) as ListProductsArgs);
    const body = ensureSuccessBody(result, 'Failed to fetch products with filters');
    return toProductListEnvelope(body);
  } catch (error) {
    return rethrow(error, 'Failed to fetch products with filters');
  }
};

export const productServiceV2 = {
  getAllProducts,
  getProductById,
  getProductByCode,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getLowStockProducts,
  updateProductStock,
  getFilteredProducts,
};

export default productServiceV2;

// 類型 re-export
export type { Product };
export type { ProductQueryParams } from '@pharmacy-pos/shared';
