import type { FilterQuery } from "mongoose"
import BaseProduct, { Product, Medicine } from "../../models/BaseProduct"
import { PackageUnitService } from "../../services/PackageUnitService"
import { ERROR_MESSAGES } from "@pharmacy-pos/shared/constants"
import type {
  ProductCreateInput,
  ProductQueryParams,
  ProductSchema,
  ProductUpdateInput,
} from "@pharmacy-pos/shared/schemas/zod/product"

export type ProductListResult = {
  data?: ProductSchema[]
  filters?: Record<string, unknown>
  count?: number
}

export type ProductDeleteResult = {
  id: string
}

export type ProductServiceErrorStatus = 400 | 404 | 409 | 500

export class ProductServiceError extends Error {
  public readonly status: ProductServiceErrorStatus

  constructor(status: ProductServiceErrorStatus, message: string) {
    super(message)
    this.status = status
    this.name = "ProductServiceError"
  }
}

function notImplemented(operation: string): ProductServiceError {
  return new ProductServiceError(500, `${operation} not implemented yet`)
}

type RawProduct = Record<string, any>

const ACTIVE_FILTER: FilterQuery<RawProduct> = { isActive: { $ne: false } }

function parsePriceBoundary(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function normaliseSort(sortBy?: string | null, sortOrder?: string | null) {
  const fieldMap: Record<string, string> = {
    code: "code",
    name: "name",
    price: "sellingPrice",
    stock: "stock",
  }

  const order = sortOrder === "desc" ? -1 : 1
  const mappedField = fieldMap[sortBy ?? ""] ?? "code"

  return { field: mappedField, order }
}

function toPlain(document: any): RawProduct {
  if (!document) {
    return document
  }
  if (typeof document.toObject === "function") {
    return document.toObject()
  }
  return document
}

function normaliseId(value: any): any {
  if (value && typeof value.toString === "function") {
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
  if (plain && typeof plain === "object") {
    return {
      ...plain,
      _id: normaliseId(plain._id),
    }
  }
  return reference
}

function normaliseProduct(product: any, packageUnits?: ProductSchema["packageUnits"]): ProductSchema {
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
    return normaliseProduct(product, units as ProductSchema["packageUnits"])
  } catch (error) {
    console.error(`Failed to load package units for product ${productId}:`, error)
    return normaliseProduct(product, [] as ProductSchema["packageUnits"])
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
      const searchRegex = new RegExp(search.trim(), "i")
      query.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { shortCode: searchRegex },
        { barcode: searchRegex },
        { healthInsuranceCode: searchRegex },
      ]
    }

    if (productType && productType !== "all") {
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
      .populate("category", "name")
      .populate("supplier", "name")
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
        sort: { by: sortBy ?? "code", order: sortOrder ?? "asc" },
      },
      count: data.length,
    }
  } catch (error) {
    console.error("Failed to list products:", error)
    throw new ProductServiceError(500, ERROR_MESSAGES.GENERIC.INTERNAL_ERROR)
  }
}

export async function listBaseProducts(): Promise<ProductListResult> {
  try {
    const products = await Product.find(ACTIVE_FILTER)
      .populate("category", "name")
      .populate("supplier", "name")
      .sort({ code: 1 } as Record<string, 1 | -1>)
      .lean<RawProduct[]>({ virtuals: true })

    return {
      data: products.map((product) => normaliseProduct(product)),
      count: products.length,
    }
  } catch (error) {
    console.error("Failed to list base products:", error)
    throw new ProductServiceError(500, ERROR_MESSAGES.GENERIC.INTERNAL_ERROR)
  }
}

export async function listMedicines(): Promise<ProductListResult> {
  try {
    const products = await Medicine.find(ACTIVE_FILTER)
      .populate("category", "name")
      .populate("supplier", "name")
      .sort({ code: 1 } as Record<string, 1 | -1>)
      .lean<RawProduct[]>({ virtuals: true })

    return {
      data: products.map((product) => normaliseProduct(product)),
      count: products.length,
    }
  } catch (error) {
    console.error("Failed to list medicines:", error)
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
    console.error("Failed to get product by code:", error)
    throw new ProductServiceError(500, ERROR_MESSAGES.GENERIC.INTERNAL_ERROR)
  }
}

export async function getProductById(id: string): Promise<ProductSchema | null> {
  try {
    const product = await BaseProduct.findById(id)
      .populate("category", "name")
      .populate("supplier", "name")
      .lean<RawProduct | null>({ virtuals: true })

    if (!product) {
      return null
    }

    return await withPackageUnits(product)
  } catch (error) {
    console.error("Failed to get product by id:", error)
    if (error instanceof Error && error.name === "CastError") {
      throw new ProductServiceError(404, ERROR_MESSAGES.PRODUCT.NOT_FOUND)
    }
    throw new ProductServiceError(500, ERROR_MESSAGES.GENERIC.INTERNAL_ERROR)
  }
}

export async function createProduct(_payload: ProductCreateInput): Promise<ProductSchema> {
  throw notImplemented("createProduct")
}

export async function createMedicine(_payload: ProductCreateInput): Promise<ProductSchema> {
  throw notImplemented("createMedicine")
}

export async function updateProduct(_id: string, _payload: ProductUpdateInput): Promise<ProductSchema> {
  throw notImplemented("updateProduct")
}

export async function deleteProduct(_id: string): Promise<ProductDeleteResult> {
  throw notImplemented("deleteProduct")
}
