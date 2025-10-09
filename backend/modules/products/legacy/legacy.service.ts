import type { FilterQuery } from 'mongoose'
import BaseProduct, { Product, Medicine } from '../../../models/BaseProduct'
import { PackageUnitService } from '../../../services/PackageUnitService'
import { generateProductCodeByHealthInsurance } from '../../../utils/codeGenerator'
import { ProductType } from '@pharmacy-pos/shared/enums'
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants'
import type {
  IBaseProductDocument,
  IProductDocument,
  IMedicineDocument,
} from '../../../src/types/models'
import type { ProductPackageUnit } from '@pharmacy-pos/shared/types/package'
import { ensureMongoConnection } from '../../../utils/mongoConnection'

export class LegacyProductServiceError extends Error {
  public readonly status: number
  public readonly details?: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
    this.name = 'LegacyProductServiceError'
  }
}

export interface LegacyProductListQuery {
  search?: string | string[]
  productType?: string | string[]
  category?: string | string[]
  supplier?: string | string[]
  minPrice?: string | string[]
  maxPrice?: string | string[]
  stockStatus?: string | string[]
  sortBy?: string | string[]
  sortOrder?: string | string[]
}

export interface LegacyProductListResult {
  data: Array<Record<string, unknown>>
  filters: {
    search?: string
    productType?: string
    category?: string
    supplier?: string
    priceRange: {
      min?: string
      max?: string
    }
    stockStatus?: string
    sort: {
      by: string
      order: 'asc' | 'desc'
    }
  }
  count: number
}

export interface LegacyProductPayload {
  code?: unknown
  shortCode?: unknown
  name?: unknown
  subtitle?: unknown
  category?: unknown
  unit?: unknown
  purchasePrice?: unknown
  sellingPrice?: unknown
  description?: unknown
  supplier?: unknown
  minStock?: unknown
  barcode?: unknown
  healthInsuranceCode?: unknown
  healthInsurancePrice?: unknown
  excludeFromStock?: unknown
  packageUnits?: unknown
}

export type LegacyProductUpdatePayload = LegacyProductPayload

export interface LegacyProductCreateResult {
  document: IBaseProductDocument
  productType: ProductType
}

export interface LegacyTestDataResult {
  alreadyExists: boolean
  count?: number
  summary?: {
    created: number
    products: number
    medicines: number
  }
}

const ACTIVE_FILTER: FilterQuery<Record<string, unknown>> = { isActive: { $ne: false } }
const DEFAULT_MIN_STOCK = 10

type PackageUnitInput = Omit<ProductPackageUnit, '_id' | 'productId' | 'createdAt' | 'updatedAt'>
type PackageUnitsInput = PackageUnitInput[]

type AnyDocument = Record<string, unknown>

type SortOrder = 'asc' | 'desc'

type StockStatus = 'all' | 'inStock' | 'lowStock' | 'outOfStock'

function extractString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return extractString(value[0])
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }
  return undefined
}

function trimUnknown(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  return undefined
}

function parsePriceBoundary(value?: string): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseFloatOrDefault(value: unknown, defaultValue: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : defaultValue
  }
  return defaultValue
}

function parseIntOrDefault(value: unknown, defaultValue: number): number {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    return Number.isNaN(parsed) ? defaultValue : parsed
  }
  return defaultValue
}

function ensureMinStock(value: unknown): number {
  const parsed = parseIntOrDefault(value, DEFAULT_MIN_STOCK)
  return parsed >= 0 ? parsed : DEFAULT_MIN_STOCK
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'string') {
    return value.trim().toLowerCase() === 'true'
  }
  return false
}

function toPackageUnitInput(value: unknown): PackageUnitInput | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }
  const record = value as Record<string, unknown>
  const unitName = trimUnknown(record.unitName as string | undefined) ?? trimUnknown(record.name as string | undefined)
  const rawUnitValue = record.unitValue ?? record.conversionRate ?? record.multiplier
  const unitValue = typeof rawUnitValue === 'number' ? rawUnitValue : Number(rawUnitValue)

  if (!unitName || !Number.isFinite(unitValue) || !Number.isInteger(unitValue) || unitValue <= 0) {
    return undefined
  }

  const input: PackageUnitInput = {
    unitName,
    unitValue,
    isBaseUnit: toBoolean(record.isBaseUnit),
    isActive: record.isActive === undefined ? true : toBoolean(record.isActive),
  }

  if (record.effectiveFrom instanceof Date) {
    input.effectiveFrom = record.effectiveFrom
  }
  if (record.effectiveTo instanceof Date) {
    input.effectiveTo = record.effectiveTo
  }
  if (typeof record.version === 'number') {
    input.version = record.version
  }

  return input
}

function ensurePackageUnits(value: unknown): PackageUnitsInput | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }
  const normalised = value
    .map((unit) => toPackageUnitInput(unit))
    .filter((unit): unit is PackageUnitInput => unit !== undefined)
  if (normalised.length === 0 && value.length === 0) {
    return []
  }
  return normalised.length > 0 ? normalised : []
}


function toPlain(document: any): AnyDocument {
  if (!document) {
    return document
  }
  if (typeof document.toObject === 'function') {
    return document.toObject()
  }
  return document
}

function normaliseId(value: unknown): unknown {
  if (value && typeof (value as { toString?: () => string }).toString === 'function') {
    return String(value)
  }
  return value
}

function normaliseDate(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (value === null) {
    return null
  }
  return value ?? undefined
}

function normaliseReference(reference: unknown): unknown {
  if (!reference) return undefined
  const plain = toPlain(reference)
  if (plain && typeof plain === 'object') {
    return {
      ...plain,
      _id: normaliseId((plain as AnyDocument)._id),
    }
  }
  return reference
}

function getDocumentValue<T>(document: unknown, key: string): T | undefined {
  if (!document || typeof document !== 'object') {
    return undefined
  }
  const withGetter = document as { get?: (field: string) => unknown } & Record<string, unknown>
  if (typeof withGetter.get === 'function') {
    return withGetter.get(key) as T | undefined
  }
  return withGetter[key] as T | undefined
}

async function attachPackageUnits(product: IBaseProductDocument): Promise<Record<string, unknown>> {
  const plain = product.toObject() as AnyDocument
  try {
    plain.packageUnits = await PackageUnitService.getProductPackageUnits(String(product._id))
  } catch (error) {
    console.error(`載入商品 ${product._id} 的包裝單位失敗:`, error)
    plain.packageUnits = []
  }
  plain._id = normaliseId(plain._id)
  plain.category = normaliseReference(plain.category)
  plain.supplier = normaliseReference(plain.supplier)
  plain.createdAt = normaliseDate(plain.createdAt)
  plain.updatedAt = normaliseDate(plain.updatedAt)
  return plain
}

async function ensureGeneratedCode(hasHealthInsurance: boolean, provided?: string): Promise<string> {
  if (provided) {
    return provided
  }

  const result = await generateProductCodeByHealthInsurance(hasHealthInsurance)

  const rawCode =
    typeof result === 'string'
      ? result
      : result && typeof result === 'object' && 'code' in result
        ? (result as { code?: unknown }).code
        : undefined

  const code = typeof rawCode === 'string' ? rawCode.trim() : rawCode !== undefined ? String(rawCode).trim() : ''

  if (code) {
    return code
  }

  const successFlag =
    result && typeof result === 'object' && 'success' in result
      ? Boolean((result as { success?: unknown }).success)
      : undefined

  if (successFlag === false) {
    throw new LegacyProductServiceError(
      API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.GENERIC.INTERNAL_ERROR,
    )
  }

  throw new LegacyProductServiceError(
    API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR,
    ERROR_MESSAGES.GENERIC.INTERNAL_ERROR,
  )
}

function applyStockStatusFilter(filter: FilterQuery<Record<string, unknown>>, status?: StockStatus): void {
  switch (status) {
    case 'inStock':
      filter.stock = { $gt: 0 }
      break
    case 'lowStock':
      filter.stock = { $gt: 0, $lte: 5 }
      break
    case 'outOfStock':
      filter.stock = { $lte: 0 }
      break
    default:
      break
  }
}

export async function listProducts(query: LegacyProductListQuery): Promise<LegacyProductListResult> {
  await ensureMongoConnection()
  const search = extractString(query.search)
  const productType = extractString(query.productType)
  const category = extractString(query.category)
  const supplier = extractString(query.supplier)
  const minPriceRaw = extractString(query.minPrice)
  const maxPriceRaw = extractString(query.maxPrice)
  const stockStatus = extractString(query.stockStatus) as StockStatus | undefined
  const sortBy = extractString(query.sortBy) ?? 'code'
  const sortOrderValue = extractString(query.sortOrder)
  const sortOrder: SortOrder = sortOrderValue?.toLowerCase() === 'desc' ? 'desc' : 'asc'

  const filter: FilterQuery<Record<string, unknown>> = { ...ACTIVE_FILTER }

  if (search) {
    const regex = new RegExp(search, 'i')
    filter.$or = [
      { name: regex },
      { code: regex },
      { shortCode: regex },
      { barcode: regex },
      { healthInsuranceCode: regex },
    ]
  }

  if (productType && productType !== 'all') {
    filter.productType = productType
  }

  if (category) {
    filter.category = category
  }

  if (supplier) {
    filter.supplier = supplier
  }

  const minPrice = parsePriceBoundary(minPriceRaw)
  const maxPrice = parsePriceBoundary(maxPriceRaw)
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.sellingPrice = {}
    if (minPrice !== undefined) {
      ;(filter.sellingPrice as Record<string, number>).$gte = minPrice
    }
    if (maxPrice !== undefined) {
      ;(filter.sellingPrice as Record<string, number>).$lte = maxPrice
    }
  }

  const priceRange: { min?: string; max?: string } = {}
  if (minPriceRaw !== undefined) {
    priceRange.min = minPriceRaw
  }
  if (maxPriceRaw !== undefined) {
    priceRange.max = maxPriceRaw
  }

  applyStockStatusFilter(filter, stockStatus)

  const sortOptions: Record<string, 1 | -1> = {
    [sortBy]: sortOrder === 'desc' ? -1 : 1,
  }

  const products = await BaseProduct.find(filter)
    .populate('category', 'name')
    .populate('supplier', 'name')
    .sort(sortOptions)

  const enriched = await Promise.all(
    products.map((product) => attachPackageUnits(product as unknown as IBaseProductDocument)),
  )

  const filters: LegacyProductListResult['filters'] = {
    priceRange,
    sort: { by: sortBy, order: sortOrder },
  }

  if (search !== undefined) {
    filters.search = search
  }
  if (productType !== undefined) {
    filters.productType = productType
  }
  if (category !== undefined) {
    filters.category = category
  }
  if (supplier !== undefined) {
    filters.supplier = supplier
  }
  if (stockStatus !== undefined) {
    filters.stockStatus = stockStatus
  }

  return {
    data: enriched,
    filters,
    count: enriched.length,
  }
}

export async function listBaseProducts(): Promise<IProductDocument[]> {
  await ensureMongoConnection()
  const products = await Product.find(ACTIVE_FILTER)
    .populate('category', 'name')
    .populate('supplier', 'name')
    .sort({ code: 1 })
  return products as unknown as IProductDocument[]
}

export async function listMedicines(): Promise<IMedicineDocument[]> {
  await ensureMongoConnection()
  const medicines = await Medicine.find(ACTIVE_FILTER)
    .populate('category', 'name')
    .populate('supplier', 'name')
    .sort({ code: 1 })
  return medicines as unknown as IMedicineDocument[]
}

export async function findProductByCode(code: string): Promise<IBaseProductDocument> {
  await ensureMongoConnection()
  const value = code?.toString().trim().toUpperCase()
  if (!value) {
    throw new LegacyProductServiceError(
      API_CONSTANTS.HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PRODUCT.NOT_FOUND,
    )
  }
  const product = await BaseProduct.findByCode(value)
  if (!product) {
    throw new LegacyProductServiceError(
      API_CONSTANTS.HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PRODUCT.NOT_FOUND,
    )
  }
  return product as unknown as IBaseProductDocument
}

export async function findProductById(id: string): Promise<Record<string, unknown>> {
  await ensureMongoConnection()
  if (!id) {
    throw new LegacyProductServiceError(
      API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      '缺少產品 ID 參數',
    )
  }

  const product = await BaseProduct.findById(id)
    .populate('category', 'name')
    .populate('supplier', 'name')

  if (!product) {
    throw new LegacyProductServiceError(
      API_CONSTANTS.HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PRODUCT.NOT_FOUND,
    )
  }

  return attachPackageUnits(product as unknown as IBaseProductDocument)
}

async function createProductDocument(
  payload: LegacyProductPayload,
  forceMedicine: boolean,
): Promise<LegacyProductCreateResult> {
  await ensureMongoConnection()
  const trimmedCode = trimUnknown(payload.code)
  if (trimmedCode) {
    const existing = await BaseProduct.findByCode(trimmedCode)
    if (existing) {
      throw new LegacyProductServiceError(
        API_CONSTANTS.HTTP_STATUS.CONFLICT,
        ERROR_MESSAGES.PRODUCT.CODE_EXISTS,
      )
    }
  }

  const healthInsuranceCode = trimUnknown(payload.healthInsuranceCode)
  const hasHealthInsurance = Boolean(healthInsuranceCode)
  const productType = forceMedicine || hasHealthInsurance ? ProductType.MEDICINE : ProductType.PRODUCT
  const code = await ensureGeneratedCode(productType === ProductType.MEDICINE, trimmedCode)

  const Model = productType === ProductType.MEDICINE ? Medicine : Product
  const name = trimUnknown(payload.name)
  const unit = trimUnknown(payload.unit)

  if (!name || !unit) {
    throw new LegacyProductServiceError(
      API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
    )
  }

  const document = new Model({
    code,
    shortCode: trimUnknown(payload.shortCode) ?? '',
    name,
    subtitle: trimUnknown(payload.subtitle),
    category: payload.category,
    unit,
    purchasePrice: parseFloatOrDefault(payload.purchasePrice, 0),
    sellingPrice: parseFloatOrDefault(payload.sellingPrice, 0),
    description: trimUnknown(payload.description),
    supplier: payload.supplier,
    minStock: ensureMinStock(payload.minStock),
    barcode: trimUnknown(payload.barcode),
    healthInsuranceCode: productType === ProductType.MEDICINE ? healthInsuranceCode ?? '' : healthInsuranceCode,
    healthInsurancePrice: parseFloatOrDefault(payload.healthInsurancePrice, 0),
    excludeFromStock: toBoolean(payload.excludeFromStock),
    productType,
    isActive: true,
  })

  await document.save()

  const saved = await BaseProduct.findById(document._id)
    .populate('category', 'name')
    .populate('supplier', 'name')

  if (!saved) {
    throw new LegacyProductServiceError(
      API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.GENERIC.INTERNAL_ERROR,
    )
  }

  const packageUnits = ensurePackageUnits(payload.packageUnits)
  if (packageUnits && packageUnits.length > 0) {
    try {
      await PackageUnitService.createOrUpdatePackageUnits(String(document._id), packageUnits)
    } catch (error) {
      console.error('更新包裝單位失敗:', error)
    }
  }

  return {
    document: saved as unknown as IBaseProductDocument,
    productType,
  }
}

export async function createLegacyProduct(payload: LegacyProductPayload): Promise<LegacyProductCreateResult> {
  return createProductDocument(payload, false)
}

export async function createLegacyMedicine(payload: LegacyProductPayload): Promise<LegacyProductCreateResult> {
  return createProductDocument(payload, true)
}

export async function updateLegacyProduct(
  productId: string,
  payload: LegacyProductUpdatePayload,
): Promise<IBaseProductDocument> {
  await ensureMongoConnection()
  if (!productId) {
    throw new LegacyProductServiceError(
      API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      '缺少產品 ID 參數',
    )
  }

  const existingProduct = await BaseProduct.findById(productId)
  if (!existingProduct) {
    throw new LegacyProductServiceError(
      API_CONSTANTS.HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PRODUCT.NOT_FOUND,
    )
  }

  const updateData: Record<string, unknown> = { ...payload }

  if (Object.prototype.hasOwnProperty.call(updateData, 'code')) {
    const trimmedCode = trimUnknown(updateData.code)
    const currentCode = getDocumentValue<string>(existingProduct, 'code')
    if (trimmedCode && trimmedCode !== currentCode) {
      const duplicate = await BaseProduct.findByCode(trimmedCode)
      if (duplicate) {
        throw new LegacyProductServiceError(
          API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
          ERROR_MESSAGES.PRODUCT.CODE_EXISTS,
        )
      }
      updateData.code = trimmedCode
    } else if (currentCode) {
      updateData.code = currentCode
    } else {
      delete updateData.code
    }
  }

  if (Object.prototype.hasOwnProperty.call(updateData, 'purchasePrice')) {
    updateData.purchasePrice = parseFloatOrDefault(updateData.purchasePrice, 0)
  }

  if (Object.prototype.hasOwnProperty.call(updateData, 'sellingPrice')) {
    updateData.sellingPrice = parseFloatOrDefault(updateData.sellingPrice, 0)
  }

  if (Object.prototype.hasOwnProperty.call(updateData, 'healthInsurancePrice')) {
    updateData.healthInsurancePrice = parseFloatOrDefault(updateData.healthInsurancePrice, 0)
  }

  if (Object.prototype.hasOwnProperty.call(updateData, 'minStock')) {
    updateData.minStock = ensureMinStock(updateData.minStock)
  }

  if (Object.prototype.hasOwnProperty.call(updateData, 'shortCode')) {
    updateData.shortCode = trimUnknown(updateData.shortCode) ?? ''
  }

  if (Object.prototype.hasOwnProperty.call(updateData, 'healthInsuranceCode')) {
    const trimmedHealthCode = trimUnknown(updateData.healthInsuranceCode) ?? ''
    updateData.healthInsuranceCode = trimmedHealthCode
    updateData.productType = trimmedHealthCode ? ProductType.MEDICINE : ProductType.PRODUCT
  }

  if (Object.prototype.hasOwnProperty.call(updateData, 'barcode')) {
    updateData.barcode = trimUnknown(updateData.barcode) ?? ''
  }

  if (Object.prototype.hasOwnProperty.call(updateData, 'excludeFromStock')) {
    updateData.excludeFromStock = toBoolean(updateData.excludeFromStock)
  }

  const { packageUnits, ...productUpdateData } = updateData

  const updatedProduct = await BaseProduct.findByIdAndUpdate(
    productId,
    { $set: productUpdateData },
    { new: true },
  )
    .populate('category', 'name')
    .populate('supplier', 'name')

  if (!updatedProduct) {
    throw new LegacyProductServiceError(
      API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.GENERIC.INTERNAL_ERROR,
    )
  }

  const packageUnitsInput = ensurePackageUnits(packageUnits)
  if (packageUnitsInput !== undefined) {
    try {
      if (packageUnitsInput.length > 0) {
        await PackageUnitService.createOrUpdatePackageUnits(productId, packageUnitsInput)
      } else {
        await PackageUnitService.deletePackageUnits(productId)
      }
    } catch (error) {
      console.error('更新包裝單位失敗:', error)
    }
  }

  return updatedProduct as unknown as IBaseProductDocument
}

export async function softDeleteProduct(productId: string): Promise<IBaseProductDocument> {
  await ensureMongoConnection()
  if (!productId) {
    throw new LegacyProductServiceError(
      API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      '缺少產品 ID 參數',
    )
  }

  const existingProduct = await BaseProduct.findById(productId)
  if (!existingProduct) {
    throw new LegacyProductServiceError(
      API_CONSTANTS.HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PRODUCT.NOT_FOUND,
    )
  }

  const deletedProduct = await BaseProduct.findByIdAndUpdate(
    productId,
    { $set: { isActive: false } },
    { new: true },
  )

  if (!deletedProduct) {
    throw new LegacyProductServiceError(
      API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.GENERIC.INTERNAL_ERROR,
    )
  }

  return deletedProduct as unknown as IBaseProductDocument
}

export async function updateProductPackageUnits(
  productId: string,
  packageUnits: unknown,
): Promise<unknown[]> {
  await ensureMongoConnection()
  if (!productId) {
    throw new LegacyProductServiceError(
      API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      '缺少產品 ID 參數',
    )
  }

  const existingProduct = await BaseProduct.findById(productId)
  if (!existingProduct) {
    throw new LegacyProductServiceError(
      API_CONSTANTS.HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PRODUCT.NOT_FOUND,
    )
  }

  try {
    const units = ensurePackageUnits(packageUnits)
    if (units && units.length > 0) {
      await PackageUnitService.createOrUpdatePackageUnits(productId, units)
    } else {
      await PackageUnitService.deletePackageUnits(productId)
    }
    return await PackageUnitService.getProductPackageUnits(productId)
  } catch (error) {
    throw new LegacyProductServiceError(
      API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
      '更新包裝單位失敗',
      error instanceof Error ? error.message : error,
    )
  }
}

export async function createLegacyTestData(): Promise<LegacyTestDataResult> {
  await ensureMongoConnection()
  const existingCount = await BaseProduct.countDocuments()
  if (existingCount > 0) {
    return {
      alreadyExists: true,
      count: existingCount,
    }
  }

  const testProduct = new Product({
    code: 'P000001',
    shortCode: 'P001',
    name: '測試商品A',
    unit: '個',
    purchasePrice: 50,
    sellingPrice: 80,
    description: '這是一個測試商品',
    minStock: 10,
    productType: ProductType.PRODUCT,
    isActive: true,
  })

  const testProduct2 = new Product({
    code: 'P000002',
    shortCode: 'P002',
    name: '測試商品B',
    unit: '個',
    purchasePrice: 30,
    sellingPrice: 50,
    description: '這是另一個測試商品',
    minStock: 5,
    productType: ProductType.PRODUCT,
    isActive: true,
  })

  const testMedicine = new Medicine({
    code: 'M000001',
    shortCode: 'M001',
    name: '測試藥品A',
    unit: '盒',
    purchasePrice: 100,
    sellingPrice: 150,
    description: '這是一個測試藥品',
    minStock: 5,
    healthInsuranceCode: 'HC001',
    healthInsurancePrice: 120,
    productType: ProductType.MEDICINE,
    isActive: true,
  })

  const testMedicine2 = new Medicine({
    code: 'M000002',
    shortCode: 'M002',
    name: '測試藥品B',
    unit: '盒',
    purchasePrice: 80,
    sellingPrice: 120,
    description: '這是另一個測試藥品',
    minStock: 3,
    healthInsuranceCode: 'HC002',
    healthInsurancePrice: 100,
    productType: ProductType.MEDICINE,
    isActive: true,
  })

  await Promise.all([
    testProduct.save(),
    testProduct2.save(),
    testMedicine.save(),
    testMedicine2.save(),
  ])

  return {
    alreadyExists: false,
    summary: {
      created: 4,
      products: 2,
      medicines: 2,
    },
  }
}
