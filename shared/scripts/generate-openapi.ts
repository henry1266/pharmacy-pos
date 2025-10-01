#!/usr/bin/env ts-node

/**
 * Generate OpenAPI from shared Zod schemas (SSOT)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type SupportedSchemaModule = 'sale' | 'customer' | 'supplier' | 'purchaseOrder';

async function resolveZodModule(name: SupportedSchemaModule): Promise<any> {
  const fileName = `${name}.js`;
  // When script is executed from shared/dist/scripts, the correct path is ../../dist/schemas/zod
  const candidate = path.resolve(__dirname, `../../dist/schemas/zod/${fileName}`);
  
  if (fs.existsSync(candidate)) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return await import(`file://${candidate}`);
  }
  throw new Error(`Cannot find compiled ${name} zod module. Build shared first.`);
}

function toJsonSchema(schema: z.ZodTypeAny, name: string) {
  const jsonSchema = zodToJsonSchema(schema as any, { name });
  // zod-to-json-schema may nest definition under definitions[name]
  return (jsonSchema.definitions && name in jsonSchema.definitions)
    ? jsonSchema.definitions[name]
    : jsonSchema;
}

async function main() {
  const saleMod = await resolveZodModule('sale');
  const customerMod = await resolveZodModule('customer');
  const supplierMod = await resolveZodModule('supplier');
  const purchaseOrderMod = await resolveZodModule('purchaseOrder');

  const saleItemSchema = saleMod.saleItemSchema as z.ZodTypeAny | undefined;
  const createSaleSchema = saleMod.createSaleSchema as z.ZodTypeAny | undefined;
  const updateSaleSchema = saleMod.updateSaleSchema as z.ZodTypeAny | undefined;
  const saleSearchSchema = saleMod.saleQuerySchema as z.ZodTypeAny | undefined;

  const customerSchema = customerMod.customerSchema as z.ZodTypeAny | undefined;
  const createCustomerSchema = customerMod.createCustomerSchema as z.ZodTypeAny | undefined;
  const updateCustomerSchema = customerMod.updateCustomerSchema as z.ZodTypeAny | undefined;
  const customerSearchSchema = customerMod.customerSearchSchema as z.ZodTypeAny | undefined;
  const quickCreateCustomerSchema = customerMod.quickCreateCustomerSchema as z.ZodTypeAny | undefined;

  const supplierSchema = supplierMod.supplierSchema as z.ZodTypeAny | undefined;
  const createSupplierSchema = supplierMod.createSupplierSchema as z.ZodTypeAny | undefined;
  const updateSupplierSchema = supplierMod.updateSupplierSchema as z.ZodTypeAny | undefined;
  const supplierSearchSchema = supplierMod.supplierSearchSchema as z.ZodTypeAny | undefined;

  const purchaseOrderSchema = purchaseOrderMod.purchaseOrderSchema as z.ZodTypeAny | undefined;
  const purchaseOrderItemSchema = purchaseOrderMod.purchaseOrderItemSchema as z.ZodTypeAny | undefined;
  const createPurchaseOrderSchema = purchaseOrderMod.createPurchaseOrderSchema as z.ZodTypeAny | undefined;
  const updatePurchaseOrderSchema = purchaseOrderMod.updatePurchaseOrderSchema as z.ZodTypeAny | undefined;
  const purchaseOrderSearchSchema = purchaseOrderMod.purchaseOrderSearchSchema as z.ZodTypeAny | undefined;

  if (!saleItemSchema || !createSaleSchema || !updateSaleSchema || !saleSearchSchema) {
    throw new Error('Missing sale schemas from shared module.');
  }
  if (!customerSchema || !createCustomerSchema || !updateCustomerSchema || !customerSearchSchema || !quickCreateCustomerSchema) {
    throw new Error('Missing customer schemas from shared module.');
  }

  if (!supplierSchema || !createSupplierSchema || !updateSupplierSchema || !supplierSearchSchema) {
    throw new Error('Missing supplier schemas from shared module.');
  }

  if (!purchaseOrderSchema || !purchaseOrderItemSchema || !createPurchaseOrderSchema || !updatePurchaseOrderSchema || !purchaseOrderSearchSchema) {
    throw new Error('Missing purchase order schemas from shared module.');
  }

  const document = {
    openapi: '3.0.3',
    info: {
      title: 'Pharmacy POS API',
      version: '1.0.0',
      description: 'Generated from shared Zod schemas (SSOT)'
    },
    servers: [{ url: '/api' }],
    tags: [
      { name: 'Sales', description: 'Sales endpoints' },
      { name: 'Customers', description: 'Customer management endpoints' },
      { name: 'Suppliers', description: 'Supplier management endpoints' },
      { name: 'Purchase Orders', description: 'Purchase order management endpoints' }
    ],
    paths: {},
    components: {
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {},
            timestamp: { type: 'string', format: 'date-time' }
          },
          required: ['success']
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [false] },
            message: { type: 'string' },
            error: { type: 'string' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  msg: { type: 'string' },
                  param: { type: 'string' },
                  location: { type: 'string' }
                },
                required: ['msg']
              }
            },
            details: { type: 'object', additionalProperties: true },
            statusCode: { type: 'number' },
            timestamp: { type: 'string', format: 'date-time' }
          },
          required: ['success', 'message']
        },
        SaleItem: toJsonSchema(saleItemSchema, 'SaleItem'),
        SaleCreateRequest: toJsonSchema(createSaleSchema, 'SaleCreateRequest'),
        SaleUpdateRequest: toJsonSchema(updateSaleSchema, 'SaleUpdateRequest'),
        SaleSearchQuery: toJsonSchema(saleSearchSchema, 'SaleSearchQuery'),
        Customer: toJsonSchema(customerSchema, 'Customer'),
        CustomerCreateRequest: toJsonSchema(createCustomerSchema, 'CustomerCreateRequest'),
        CustomerUpdateRequest: toJsonSchema(updateCustomerSchema, 'CustomerUpdateRequest'),
        CustomerSearchQuery: toJsonSchema(customerSearchSchema, 'CustomerSearchQuery'),
        CustomerQuickCreateRequest: toJsonSchema(quickCreateCustomerSchema, 'CustomerQuickCreateRequest'),
        Supplier: toJsonSchema(supplierSchema!, 'Supplier'),
        SupplierCreateRequest: toJsonSchema(createSupplierSchema!, 'SupplierCreateRequest'),
        SupplierUpdateRequest: toJsonSchema(updateSupplierSchema!, 'SupplierUpdateRequest'),
        SupplierSearchQuery: toJsonSchema(supplierSearchSchema!, 'SupplierSearchQuery'),
        PurchaseOrder: toJsonSchema(purchaseOrderSchema!, 'PurchaseOrder'),
        PurchaseOrderItem: toJsonSchema(purchaseOrderItemSchema!, 'PurchaseOrderItem'),
        PurchaseOrderCreateRequest: toJsonSchema(createPurchaseOrderSchema!, 'PurchaseOrderCreateRequest'),
        PurchaseOrderUpdateRequest: toJsonSchema(updatePurchaseOrderSchema!, 'PurchaseOrderUpdateRequest'),
        PurchaseOrderSearchQuery: toJsonSchema(purchaseOrderSearchSchema!, 'PurchaseOrderSearchQuery')
      }
    }
  } as const;

  const docAny = document as any;

  // Merge static path descriptors (LLM-friendly)
  for (const descriptor of ['sales', 'customers', 'suppliers', 'purchaseOrders']) {
    try {
      const modPath = path.resolve(__dirname, `../api/paths/${descriptor}`);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const paths = (await import(modPath)).default as Record<string, any>;
      docAny.paths = { ...docAny.paths, ...paths };
    } catch (_err) {
      // optional descriptor; ignore if missing
    }
  }

  const outDir = path.resolve(__dirname, '../../openapi');
  const outFile = path.join(outDir, 'openapi.json');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(document, null, 2), 'utf-8');
  // eslint-disable-next-line no-console
  console.log(`OpenAPI written: ${outFile}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to generate OpenAPI:', err);
  process.exit(1);
});
