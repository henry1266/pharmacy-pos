import type { FilterQuery } from 'mongoose'
import BaseProduct, { Product, Medicine } from '../../models/BaseProduct'
import { PackageUnitService } from '../../services/PackageUnitService'
import { ERROR_MESSAGES } from '@pharmacy-pos/shared/constants'
import { ProductType } from '@pharmacy-pos/shared/enums'
import { generateProductCodeByHealthInsurance } from '../../utils/codeGenerator'
import type {
  ProductCreateInput,
  ProductQueryParams,
  ProductSchema,
  ProductUpdateInput,
} from '@pharmacy-pos/shared/schemas/zod/product'

export type ProductListResult = {
  data?: ProductSchema[]
  filters?: Record<string, unknown>
  count?: number
}

export type ProductServiceErrorStatus = 400 | 404 | 409 | 500

export class ProductServiceError extends Error {
  public readonly status: ProductServiceErrorStatus

  constructor(status: ProductServiceErrorStatus, message: string) {
    super(message)
    this.status = status
    this.name = 'ProductServiceError'
  }
}

type RawProduct = Record<string, any>

type PackageUnitsInput = NonNullable<ProductCreateInput['packageUnits']>

const ACTIVE_FILTER: FilterQuery<RawProduct> = { isActive: { $ne: false } }
const DEFAULT_MIN_STOCK = 10

function parsePriceBoundary(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function normaliseSort(sortBy?: string | null, sortOrder?: string | null) {
  const fieldMap: Record<string, string> = {
    code: 'code',
    name: 'name',
    price: 'sellingPrice',
    stock: 'stock',
  }

  const order = sortOrder === 'desc' ? -1 : 1
  const mappedField = fieldMap[sortBy ?? ''] ?? 'code'

  return { field: mappedField, order }
}

function toPlain(document: any): RawProduct {
  if (!document) {
    return document
  }
  if (typeof document.toObject === 'function') {
    return document.toObject()
  }
  return document
}

function normaliseId(value: any): any {
  if (value && typeof value.toString === 'function') {
    return value.toString()
  }
  return value
}

function normaliseDate(value: any): any {
  if (value instanceof Date) {
    return value.toISOString()
  }
  return value ?? undefined
}

function normaliseReference(reference: any): any {
  if (!reference) return reference
  const plain = toPlain(reference)
  if (plain && typeof plain === 'object') {
    return {
      ...plain,
      _id: normaliseId(plain._id),
    }
  }
  return reference
}

function normaliseProduct(product: any, packageUnits?: ProductSchema['packageUnits']): ProductSchema {
  const plain = toPlain(product)
  return {
    ...plain,
    _id: normaliseId(plain._id),
    category: normaliseReference(plain.category),
    supplier: normaliseReference(plain.supplier),
    createdAt: normaliseDate(plain.createdAt),
    updatedAt: normaliseDate(plain.updatedAt),
    packageUnits: packageUnits ?? plain.packageUnits,
  } as ProductSchema
}

async function withPackageUnits(product: RawProduct): Promise<ProductSchema> {
  const productId = normaliseId(product._id)
  try {
    const units = await PackageUnitService.getProductPackageUnits(String(productId))
    return normaliseProduct(product, units as ProductSchema['packageUnits'])
  } catch (error) {
    console.error(`Failed to load package units for product ${productId}:`, error)
    return normaliseProduct(product, [] as ProductSchema['packageUnits'])
  }
}

function trimOrUndefined(value: string | undefined | null) {
  return value?.trim() ? value.trim() : undefined
}

function ensureBoolean(value: boolean | undefined): boolean {
  return value ?? false
}

function ensureNumber(value: number | undefined, fallback = 0): number {
  return value !== undefined && Number.isFinite(value) ? value : fallback
}

function ensureMinStock(value: number | undefined): number {
  if (value === undefined) return DEFAULT_MIN_STOCK
  if (!Number.isFinite(value) || value < 0) {
    return DEFAULT_MIN_STOCK
  }
  return value
}

function normalisePackageUnits(units: PackageUnitsInput | undefined) {
  if (!units) return undefined
  return units.map((unit) => ({
    ...unit,
    unitValue: unit.unitValue ?? undefined,
    isBaseUnit: unit.isBaseUnit ?? false,
    isActive: unit.isActive ?? true,
  }))
}

async function generateCode(hasHealthInsurance: boolean, provided?: string) {
  const trimmed = trimOrUndefined(provided)
  if (trimmed) {
    return trimmed
  }
  const result = await generateProductCodeByHealthInsurance(hasHealthInsurance)
  if (!result.success || !result.code) {
    throw new ProductServiceError(500, ERROR_MESSAGES.GENERIC.INTERNAL_ERROR)
  }
  return result.code
}

async function createProductDocument(payload: ProductCreateInput, forceMedicine: boolean): Promise<ProductSchema> {
  const trimmedCode = trimOrUndefined(payload.code)
  if (trimmedCode) {
    const existing = await BaseProduct.findByCode(trimmedCode)
    if (existing) {
      throw new ProductServiceError(409, ERROR_MESSAGES.PRODUCT.CODE_EXISTS)
    }
  }

  const trimmedHealthCode = trimOrUndefined(payload.healthInsuranceCode)
  const isMedicine = forceMedicine || Boolean(trimmedHealthCode)
  const productType = isMedicine ? ProductType.MEDICINE : ProductType.PRODUCT
  const code = await generateCode(productType === ProductType.MEDICINE, trimmedCode)
  const Model = productType === ProductType.MEDICINE ? Medicine : Product

  const document = new Model({
    code,
    shortCode: trimOrUndefined(payload.shortCode) ?? '',
    name: payload.name,
    subtitle: trimOrUndefined(payload.subtitle),
    category: payload.category,
    unit: payload.unit,
    purchasePrice: ensureNumber(payload.purchasePrice),
    sellingPrice: ensureNumber(payload.sellingPrice),
    description: trimOrUndefined(payload.description),
    supplier: payload.supplier,
    minStock: ensureMinStock(payload.minStock),
    barcode: trimOrUndefined(payload.barcode),
    healthInsuranceCode: trimmedHealthCode ?? '',
    healthInsurancePrice: ensureNumber(payload.healthInsurancePrice),
    excludeFromStock: ensureBoolean(payload.excludeFromStock),
    productType,
    isActive: payload.isActive ?? true,
  })

  const saved = await document.save()
  const savedId = String((saved as any)._id)

  const packageUnits = normalisePackageUnits(payload.packageUnits)
  if (packageUnits && packageUnits.length > 0) {
    const result = await PackageUnitService.createOrUpdatePackageUnits(savedId, packageUnits as any)
    if (!result.success) {
      console.error('Failed to create package units:', result.error)
    }
  }

  const refreshed = await BaseProduct.findById(savedId)
    .populate('category', 'name')
    .populate('supplier', 'name')
    .lean<RawProduct | null>({ virtuals: true })

  if (!refreshed) {
    throw new ProductServiceError(500, ERROR_MESSAGES.GENERIC.INTERNAL_ERROR)
  }

  return withPackageUnits(refreshed)
}

async function ensureDistinctCode(id: string, code?: string) {
  const trimmed = trimOrUndefined(code)
  if (!trimmed) {
    return undefined
  }
  const existing = await BaseProduct.findByCode(trimmed)
  if (existing) {
    const existingId = String((existing as any)._id)
    if (existingId !== id) {
      throw new ProductServiceError(409, ERROR_MESSAGES.PRODUCT.CODE_EXISTS)
    }
  }
  return trimmed
}

async function applyPackageUnitsUpdate(productId: string, units: ProductUpdateInput['packageUnits']) {
  if (units === undefined) {
    return
  }
  const normalised = normalisePackageUnits(units)
  try {
    if (normalised && normalised.length > 0) {
      const result = await PackageUnitService.createOrUpdatePackageUnits(productId, normalised as any)
      if (!result.success) {
        console.error('Failed to update package units:', result.error)
      }
    } else {
      const result = await PackageUnitService.deletePackageUnits(productId)
      if (!result.success) {
        console.error('Failed to delete package units:', result.error)
      }
    }
  } catch (error) {
    console.error('Package unit update error:', error)
  }
}

export async function listProducts(params: ProductQueryParams = {}): Promise<ProductListResult> {
  try {
    const {
      search,
      productType,
      category,
      supplier,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
      stockStatus,
    } = params

    const query: FilterQuery<RawProduct> = { ...ACTIVE_FILTER }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i')
      query.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { shortCode: searchRegex },
        { barcode: searchRegex },
        { healthInsuranceCode: searchRegex },
      ]
    }

    if (productType && productType !== 'all') {
      query.productType = productType
    }

    if (category) {
      query.category = category
    }

    if (supplier) {
      query.supplier = supplier
    }

    const min = parsePriceBoundary(minPrice)
    const max = parsePriceBoundary(maxPrice)
    if (min !== undefined || max !== undefined) {
      query.sellingPrice = {}
      if (min !== undefined) {
        query.sellingPrice.$gte = min
      }
      if (max !== undefined) {
        query.sellingPrice.$lte = max
      }
    }

    const { field: sortField, order } = normaliseSort(sortBy ?? undefined, sortOrder ?? undefined)

    const products = await BaseProduct.find(query)
      .populate('category', 'name')
      .populate('supplier', 'name')
      .sort({ [sortField]: order } as Record<string, 1 | -1>)
      .lean<RawProduct[]>({ virtuals: true })

    const data = await Promise.all(products.map((product) => withPackageUnits(product)))

    return {
      data,
      filters: {
        search,
        productType,
        category,
        supplier,
        priceRange: { min: min ?? null, max: max ?? null },
        stockStatus,
        sort: { by: sortBy ?? 'code', order: sortOrder ?? 'asc' },
      },
      count: data.length,
    }
  } catch (error) {
    console.error('Failed to list products:', error)
    throw new ProductServiceError(500, ERROR_MESSAGES.GENERIC.INTERNAL_ERROR)
  }
}

export async function listBaseProducts(): Promise<ProductListResult> {
  try {
    const products = await Product.find(ACTIVE_FILTER)
      .populate('category', 'name')
      .populate('supplier', 'name')
      .sort({ code: 1 } as Record<string, 1 | -1>)
      .lean<RawProduct[]>({ virtuals: true })

    return {
      data: products.map((product) => normaliseProduct(product)),
      count: products.length,
    }
  } catch (error) {
    console.error('Failed to list base products:', error)
    throw new ProductServiceError(500, ERROR_MESSAGES.GENERIC.INTERNAL_ERROR)
  }
}

export async function listMedicines(): Promise<ProductListResult> {
  try {
    const products = await Medicine.find(ACTIVE_FILTER)
      .populate('category', 'name')
      .populate('supplier', 'name')
      .sort({ code: 1 } as Record<string, 1 | -1>)
      .lean<RawProduct[]>({ virtuals: true })

    return {
      data: products.map((product) => normaliseProduct(product)),
      count: products.length,
    }
  } catch (error) {
    console.error('Failed to list medicines:', error)
    throw new ProductServiceError(500, ERROR_MESSAGES.GENERIC.INTERNAL_ERROR)
  }
}

export async function getProductByCode(code: string): Promise<ProductSchema | null> {
  try {
    const normalisedCode = code.trim().toUpperCase()
    const product = await BaseProduct.findByCode(normalisedCode)
    if (!product) {
      return null
    }
    return normaliseProduct(product)
  } catch (error) {
    console.error('Failed to get product by code:', error)
    throw new ProductServiceError(500, ERROR_MESSAGES.GENERIC.INTERNAL_ERROR)
  }
}

export async function getProductById(id: string): Promise<ProductSchema | null> {
  try {
    const product = await BaseProduct.findById(id)
      .populate('category', 'name')
      .populate('supplier', 'name')
      .lean<RawProduct | null>({ virtuals: true })

    if (!product) {
      return null
    }

    return await withPackageUnits(product)
  } catch (error) {
    console.error('Failed to get product by id:', error)
    if (error instanceof Error && error.name === 'CastError') {
      throw new ProductServiceError(404, ERROR_MESSAGES.PRODUCT.NOT_FOUND)
    }
    throw new ProductServiceError(500, ERROR_MESSAGES.GENERIC.INTERNAL_ERROR)
  }
}

export async function createProduct(payload: ProductCreateInput): Promise<ProductSchema> {
  return createProductDocument(payload, false)
}

export async function createMedicine(payload: ProductCreateInput): Promise<ProductSchema> {
  return createProductDocument(payload, true)
}

export async function updateProduct(id: string, payload: ProductUpdateInput): Promise<ProductSchema> {
  try {
    const product = await BaseProduct.findById(id)
    if (!product) {
      throw new ProductServiceError(404, ERROR_MESSAGES.PRODUCT.NOT_FOUND)
    }
    const productDoc = product as any

    const trimmedCode = await ensureDistinctCode(id, payload.code)
    if (trimmedCode !== undefined) {
      productDoc.code = trimmedCode
    }

    if (payload.name !== undefined) productDoc.name = payload.name
    if (payload.subtitle !== undefined) productDoc.subtitle = payload.subtitle ?? undefined
    if (payload.category !== undefined) productDoc.category = payload.category as any
    if (payload.unit !== undefined) productDoc.unit = payload.unit
    if (payload.purchasePrice !== undefined) productDoc.purchasePrice = ensureNumber(payload.purchasePrice)
    if (payload.sellingPrice !== undefined) productDoc.sellingPrice = ensureNumber(payload.sellingPrice)
    if (payload.description !== undefined) productDoc.description = payload.description ?? undefined
    if (payload.supplier !== undefined) productDoc.supplier = payload.supplier as any
    if (payload.minStock !== undefined) productDoc.minStock = ensureMinStock(payload.minStock)
    if (payload.barcode !== undefined) productDoc.barcode = payload.barcode?.trim() ?? ''
    if (payload.healthInsurancePrice !== undefined) productDoc.healthInsurancePrice = ensureNumber(payload.healthInsurancePrice)
    if (payload.excludeFromStock !== undefined) productDoc.excludeFromStock = ensureBoolean(payload.excludeFromStock)
    if (payload.isActive !== undefined) productDoc.isActive = payload.isActive
    if (payload.shortCode !== undefined) productDoc.shortCode = payload.shortCode?.trim() ?? ''

    if (payload.healthInsuranceCode !== undefined) {
      const trimmed = trimOrUndefined(payload.healthInsuranceCode)
      productDoc.healthInsuranceCode = trimmed ?? ''
      productDoc.productType = trimmed ? ProductType.MEDICINE : ProductType.PRODUCT
    } else if (payload.productType !== undefined) {
      productDoc.productType = payload.productType
    }

    await productDoc.save()

    await applyPackageUnitsUpdate(String(productDoc._id), payload.packageUnits)

    const refreshed = await BaseProduct.findById(id)
      .populate('category', 'name')
      .populate('supplier', 'name')
      .lean<RawProduct | null>({ virtuals: true })

    if (!refreshed) {
      throw new ProductServiceError(500, ERROR_MESSAGES.GENERIC.INTERNAL_ERROR)
    }

    return await withPackageUnits(refreshed)
  } catch (error) {
    if (error instanceof ProductServiceError) {
      throw error
    }
    console.error('Failed to update product:', error)
    if (error instanceof Error && error.name === 'CastError') {
      throw new ProductServiceError(404, ERROR_MESSAGES.PRODUCT.NOT_FOUND)
    }
    throw new ProductServiceError(500, ERROR_MESSAGES.GENERIC.INTERNAL_ERROR)
  }
}

export async function deleteProduct(id: string): Promise<ProductSchema> {
  try {
    const existing = await BaseProduct.findById(id)
    if (!existing) {
      throw new ProductServiceError(404, ERROR_MESSAGES.PRODUCT.NOT_FOUND)
    }

    const deleted = await BaseProduct.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    )
      .populate('category', 'name')
      .populate('supplier', 'name')
      .lean<RawProduct | null>({ virtuals: true })

    if (!deleted) {
      throw new ProductServiceError(500, ERROR_MESSAGES.GENERIC.INTERNAL_ERROR)
    }

    return await withPackageUnits(deleted)
  } catch (error) {
    if (error instanceof ProductServiceError) {
      throw error
    }
    console.error('Failed to delete product:', error)
    if (error instanceof Error && error.name === 'CastError') {
      throw new ProductServiceError(404, ERROR_MESSAGES.PRODUCT.NOT_FOUND)
    }
    throw new ProductServiceError(500, ERROR_MESSAGES.GENERIC.INTERNAL_ERROR)
  }
}
