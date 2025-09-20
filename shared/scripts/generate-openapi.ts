#!/usr/bin/env ts-node

/**
 * Generate OpenAPI from shared Zod schemas (SSOT)
 */
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

type SupportedSchemaModule = 'sale' | 'customer';

function resolveZodModule(name: SupportedSchemaModule): any {
  const fileName = `${name}.js`;
  const candidates = [
    path.resolve(__dirname, `../dist/schemas/zod/${fileName}`),
    // fallback when script executed from repo root
    path.resolve(__dirname, `../../shared/dist/schemas/zod/${fileName}`)
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require(candidate);
    }
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
  const saleMod = resolveZodModule('sale');
  const customerMod = resolveZodModule('customer');

  const saleItemSchema = saleMod.saleItemSchema as z.ZodTypeAny | undefined;
  const createSaleSchema = saleMod.createSaleSchema as z.ZodTypeAny | undefined;
  const updateSaleSchema = saleMod.updateSaleSchema as z.ZodTypeAny | undefined;
  const saleSearchSchema = saleMod.saleSearchSchema as z.ZodTypeAny | undefined;

  const customerSchema = customerMod.customerSchema as z.ZodTypeAny | undefined;
  const createCustomerSchema = customerMod.createCustomerSchema as z.ZodTypeAny | undefined;
  const updateCustomerSchema = customerMod.updateCustomerSchema as z.ZodTypeAny | undefined;
  const customerSearchSchema = customerMod.customerSearchSchema as z.ZodTypeAny | undefined;
  const quickCreateCustomerSchema = customerMod.quickCreateCustomerSchema as z.ZodTypeAny | undefined;

  if (!saleItemSchema || !createSaleSchema || !updateSaleSchema || !saleSearchSchema) {
    throw new Error('Missing sale schemas from shared module.');
  }
  if (!customerSchema || !createCustomerSchema || !updateCustomerSchema || !customerSearchSchema || !quickCreateCustomerSchema) {
    throw new Error('Missing customer schemas from shared module.');
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
      { name: 'Customers', description: 'Customer management endpoints' }
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
        CustomerQuickCreateRequest: toJsonSchema(quickCreateCustomerSchema, 'CustomerQuickCreateRequest')
      }
    }
  } as const;

  const docAny = document as any;

  // Merge static path descriptors (LLM-friendly)
  for (const descriptor of ['sales', 'customers']) {
    try {
      const modPath = path.resolve(__dirname, `../api/paths/${descriptor}`);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const paths = require(modPath).default as Record<string, any>;
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
