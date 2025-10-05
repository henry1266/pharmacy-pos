import { z } from 'zod'
import { zodId } from '../../utils/zodUtils'
import { timestampSchema } from './common'

const optionalNumber = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isNaN(parsed)) {
      return value
    }
    return parsed
  }
  return value
}, z.number().optional())

const optionalBoolean = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true
    if (['false', '0', 'no', 'n'].includes(normalized)) return false
  }
  return value
}, z.boolean().optional())

export const productPackageUnitSchema = z
  .object({
    _id: zodId.optional(),
    productId: zodId.optional(),
    unitName: z.string().min(1),
    unitValue: optionalNumber,
    isBaseUnit: optionalBoolean,
    isActive: optionalBoolean,
    effectiveFrom: timestampSchema.optional(),
    effectiveTo: timestampSchema.optional(),
    version: optionalNumber,
    createdAt: timestampSchema.optional(),
    updatedAt: timestampSchema.optional(),
  })
  .passthrough()

const referenceSchema = z.union([
  zodId,
  z.object({ _id: zodId.optional(), name: z.string().optional() }).passthrough(),
])

export const productSchema = z
  .object({
    _id: zodId,
    code: z.string(),
    shortCode: z.string().optional(),
    name: z.string(),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    price: z.number().optional(),
    cost: z.number().optional(),
    purchasePrice: z.number().optional(),
    sellingPrice: z.number().optional(),
    category: referenceSchema.optional(),
    categoryName: z.string().optional(),
    supplier: referenceSchema.optional(),
    supplierName: z.string().optional(),
    stock: z.number().optional(),
    minStock: z.number().optional(),
    unit: z.string(),
    barcode: z.string().optional(),
    isMonitored: z.boolean().optional(),
    isMedicine: z.boolean().optional(),
    productType: z.enum(['product', 'medicine']).optional(),
    isActive: z.boolean().optional(),
    excludeFromStock: z.boolean().optional(),
    packageUnits: z.array(productPackageUnitSchema).optional(),
    date: timestampSchema.optional(),
    healthInsuranceCode: z.string().optional(),
    healthInsurancePrice: z.number().optional(),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .passthrough()

const packageUnitInputSchema = z
  .object({
    unitName: z.string().min(1),
    unitValue: optionalNumber,
    isBaseUnit: optionalBoolean,
    isActive: optionalBoolean,
    effectiveFrom: z.union([timestampSchema, z.null()]).optional(),
    effectiveTo: z.union([timestampSchema, z.null()]).optional(),
  })
  .passthrough()

export const productCreateSchema = z
  .object({
    code: z.string().optional(),
    shortCode: z.string().optional(),
    name: z.string().min(1),
    subtitle: z.string().optional(),
    category: z.string().optional(),
    unit: z.string().min(1),
    purchasePrice: optionalNumber,
    sellingPrice: optionalNumber,
    description: z.string().optional(),
    supplier: z.string().optional(),
    minStock: optionalNumber,
    barcode: z.string().optional(),
    healthInsuranceCode: z.string().optional(),
    healthInsurancePrice: optionalNumber,
    excludeFromStock: optionalBoolean,
    productType: z.enum(['product', 'medicine']).optional(),
    isActive: optionalBoolean,
    packageUnits: z.array(packageUnitInputSchema).optional(),
  })
  .passthrough()

export const productUpdateSchema = productCreateSchema.partial()

export const productQuerySchema = z
  .object({
    search: z.string().optional(),
    productType: z.enum(['all', 'product', 'medicine']).optional(),
    category: z.string().optional(),
    supplier: z.string().optional(),
    minPrice: optionalNumber,
    maxPrice: optionalNumber,
    stockStatus: z.enum(['all', 'inStock', 'lowStock', 'outOfStock']).optional(),
    sortBy: z.enum(['code', 'name', 'price', 'stock']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  })
  .passthrough()

export const productListFiltersSchema = productQuerySchema.extend({
  priceRange: z
    .object({
      min: optionalNumber,
      max: optionalNumber,
    })
    .partial()
    .optional(),
  sort: z
    .object({
      by: z.string().optional(),
      order: z.enum(['asc', 'desc']).optional(),
    })
    .optional(),
})

export const productDeleteResponseSchema = z
  .object({
    success: z.boolean(),
    message: z.string().optional(),
  })

export type ProductSchema = z.infer<typeof productSchema>
export type ProductCreateInput = z.infer<typeof productCreateSchema>
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>
export type ProductQueryParams = z.infer<typeof productQuerySchema>
export type ProductPackageUnit = z.infer<typeof productPackageUnitSchema>
