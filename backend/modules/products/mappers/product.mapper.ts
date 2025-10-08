import type { ProductSchema } from '@pharmacy-pos/shared/schemas/zod/product'

export type PlainProduct = Record<string, any>

export function toPlain(document: any): PlainProduct {
  if (!document) {
    return document
  }
  if (typeof document.toObject === 'function') {
    return document.toObject()
  }
  return document
}

export function normaliseId(value: any): any {
  if (value && typeof value.toString === 'function') {
    return value.toString()
  }
  return value
}

export function normaliseDate(value: any): any {
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (value === null) {
    return null
  }
  return value ?? undefined
}

export function normaliseReference(reference: any): any {
  if (!reference) return undefined
  const plain = toPlain(reference)
  if (plain && typeof plain === 'object') {
    return {
      ...plain,
      _id: normaliseId(plain._id),
    }
  }
  return reference
}

export function normaliseProduct(product: any, packageUnits?: ProductSchema['packageUnits']): ProductSchema {
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
