#!/usr/bin/env ts-node

/**
 * Generate OpenAPI from shared ts-rest contracts (Zod SSOT)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { generateOpenApi } from '@ts-rest/open-api';
import type { PharmacyContract } from '../api/contracts';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { ZodTypeAny } from 'zod';
import {
  supplierEntitySchema,
  createSupplierSchema,
  updateSupplierSchema,
  supplierSearchSchema,
} from '../schemas/zod/supplier';
import { zodId } from '../utils/zodUtils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadPharmacyContract(): Promise<PharmacyContract> {
  const candidates = [
    path.resolve(__dirname, '../api/contracts/index.js'),
    path.resolve(__dirname, '../api/contracts/index.mjs'),
    path.resolve(__dirname, '../api/contracts/index.cjs'),
    path.resolve(__dirname, '../api/contracts/index.ts'),
  ];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) {
      continue;
    }

    const moduleUrl = pathToFileURL(candidate).href;
    const mod = await import(moduleUrl) as { pharmacyContract?: PharmacyContract };
    if (mod.pharmacyContract) {
      return mod.pharmacyContract;
    }
  }

  throw new Error('Unable to resolve pharmacyContract module for OpenAPI generation.');
}

async function mergeStaticDescriptors(document: Record<string, any>) {
  const docAny = document as any;
  const descriptors = ['customers', 'suppliers', 'purchaseOrders'];

  for (const descriptor of descriptors) {
    try {
      const modPath = path.resolve(__dirname, `../api/paths/${descriptor}`);
      const pathsModule = await import(modPath);
      docAny.paths = { ...docAny.paths, ...(pathsModule.default ?? pathsModule) };
    } catch (_err) {
      // optional legacy descriptor; ignore if missing
    }
  }
}

const toJsonSchema = (schema: ZodTypeAny, name: string): Record<string, any> => {
  const jsonSchema = zodToJsonSchema(schema, {
    name,
    $refStrategy: 'none',
  });
  const definition = (jsonSchema as Record<string, any>)?.definitions?.[name];
  const resolved = (definition ?? jsonSchema) as Record<string, any>;
  if ('$schema' in resolved) {
    delete resolved.$schema;
  }
  return resolved;
};

function writeSuppliersArtifacts(baseOutDir: string) {
  const schemasDir = path.join(baseOutDir, 'components', 'schemas');
  fs.mkdirSync(schemasDir, { recursive: true });

  const supplierIdSchema = toJsonSchema(zodId, 'SupplierId');
  const supplierSchemaJson = toJsonSchema(supplierEntitySchema, 'Supplier');
  const supplierCreateJson = toJsonSchema(createSupplierSchema, 'SupplierCreateRequest');
  const supplierUpdateJson = toJsonSchema(updateSupplierSchema, 'SupplierUpdateRequest');
  const supplierSearchJson = toJsonSchema(supplierSearchSchema, 'SupplierSearchQuery');

  const supplierResponseJson = {
    allOf: [
      { $ref: 'common.json#/ApiResponse' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/Supplier' },
        },
      },
    ],
  };

  const supplierListResponseJson = {
    allOf: [
      { $ref: 'common.json#/ApiResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/Supplier' },
          },
        },
      },
    ],
  };

  const supplierDeleteResponseJson = {
    allOf: [
      { $ref: 'common.json#/ApiResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            required: ['id'],
            properties: {
              id: { $ref: '#/SupplierId' },
            },
          },
        },
      },
    ],
  };

  const suppliersComponents = {
    SupplierId: supplierIdSchema,
    Supplier: supplierSchemaJson,
    SupplierCreateRequest: supplierCreateJson,
    SupplierUpdateRequest: supplierUpdateJson,
    SupplierSearchQuery: supplierSearchJson,
    SupplierResponse: supplierResponseJson,
    SupplierListResponse: supplierListResponseJson,
    SupplierDeleteResponse: supplierDeleteResponseJson,
  };

  const suppliersComponentsPath = path.join(schemasDir, 'suppliers.json');
  fs.writeFileSync(suppliersComponentsPath, JSON.stringify(suppliersComponents, null, 2), 'utf-8');

  const pathsDir = path.join(baseOutDir, 'paths');
  fs.mkdirSync(pathsDir, { recursive: true });

  const suppliersPaths = {
    '/api/suppliers': {
      get: {
        summary: 'List suppliers',
        description: 'Retrieve suppliers with optional filters',
        tags: ['Suppliers'],
        parameters: [
          { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Keyword applied to code, name, short code, or contact person.' },
          { in: 'query', name: 'active', schema: { type: 'boolean' }, description: 'Filter by active status.' },
          { in: 'query', name: 'page', schema: { type: 'integer', minimum: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 100 } },
          { in: 'query', name: 'sortBy', schema: { type: 'string' } },
          { in: 'query', name: 'sortOrder', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '../components/schemas/suppliers.json#/SupplierListResponse' },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '../components/schemas/common.json#/ErrorResponse' },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create supplier',
        tags: ['Suppliers'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '../components/schemas/suppliers.json#/SupplierCreateRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Created',
            content: {
              'application/json': {
                schema: { $ref: '../components/schemas/suppliers.json#/SupplierResponse' },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '../components/schemas/common.json#/ErrorResponse' },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '../components/schemas/common.json#/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/suppliers/{id}': {
      get: {
        summary: 'Get supplier by ID',
        tags: ['Suppliers'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { $ref: '../components/schemas/suppliers.json#/SupplierId' },
          },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: '../components/schemas/suppliers.json#/SupplierResponse' },
              },
            },
          },
          404: {
            description: 'Not found',
            content: {
              'application/json': {
                schema: { $ref: '../components/schemas/common.json#/ErrorResponse' },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '../components/schemas/common.json#/ErrorResponse' },
              },
            },
          },
        },
      },
      put: {
        summary: 'Update supplier',
        tags: ['Suppliers'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { $ref: '../components/schemas/suppliers.json#/SupplierId' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '../components/schemas/suppliers.json#/SupplierUpdateRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Updated',
            content: {
              'application/json': {
                schema: { $ref: '../components/schemas/suppliers.json#/SupplierResponse' },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '../components/schemas/common.json#/ErrorResponse' },
              },
            },
          },
          404: {
            description: 'Not found',
            content: {
              'application/json': {
                schema: { $ref: '../components/schemas/common.json#/ErrorResponse' },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '../components/schemas/common.json#/ErrorResponse' },
              },
            },
          },
        },
      },
      delete: {
        summary: 'Delete supplier',
        tags: ['Suppliers'],
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: { $ref: '../components/schemas/suppliers.json#/SupplierId' },
          },
        ],
        responses: {
          200: {
            description: 'Deleted',
            content: {
              'application/json': {
                schema: { $ref: '../components/schemas/suppliers.json#/SupplierDeleteResponse' },
              },
            },
          },
          404: {
            description: 'Not found',
            content: {
              'application/json': {
                schema: { $ref: '../components/schemas/common.json#/ErrorResponse' },
              },
            },
          },
          500: {
            description: 'Server error',
            content: {
              'application/json': {
                schema: { $ref: '../components/schemas/common.json#/ErrorResponse' },
              },
            },
          },
        },
      },
    },
  };

  const suppliersPathsPath = path.join(pathsDir, 'suppliers.json');
  fs.writeFileSync(suppliersPathsPath, JSON.stringify(suppliersPaths, null, 2), 'utf-8');

  const suppliersModuleSpec = {
    openapi: '3.0.3',
    info: {
      title: 'Pharmacy POS Suppliers API',
      version: '1.0.0',
      description: 'OpenAPI specification for the suppliers domain, aligned with shared Zod schemas.',
    },
    servers: [{ url: '/api' }],
    paths: {
      '/api/suppliers': { $ref: './paths/suppliers.json#/~1api~1suppliers' },
      '/api/suppliers/{id}': { $ref: './paths/suppliers.json#/~1api~1suppliers~1{id}' },
    },
    components: {
      schemas: {
        SupplierId: { $ref: './components/schemas/suppliers.json#/SupplierId' },
        Supplier: { $ref: './components/schemas/suppliers.json#/Supplier' },
        SupplierCreateRequest: { $ref: './components/schemas/suppliers.json#/SupplierCreateRequest' },
        SupplierUpdateRequest: { $ref: './components/schemas/suppliers.json#/SupplierUpdateRequest' },
        SupplierSearchQuery: { $ref: './components/schemas/suppliers.json#/SupplierSearchQuery' },
        SupplierResponse: { $ref: './components/schemas/suppliers.json#/SupplierResponse' },
        SupplierListResponse: { $ref: './components/schemas/suppliers.json#/SupplierListResponse' },
        SupplierDeleteResponse: { $ref: './components/schemas/suppliers.json#/SupplierDeleteResponse' },
        ApiResponse: { $ref: './components/schemas/common.json#/ApiResponse' },
        ErrorResponse: { $ref: './components/schemas/common.json#/ErrorResponse' },
      },
    },
  };

  const suppliersModulePath = path.join(baseOutDir, 'suppliers.openapi.json');
  fs.writeFileSync(suppliersModulePath, JSON.stringify(suppliersModuleSpec, null, 2), 'utf-8');
}

async function main() {
  const pharmacyContract = await loadPharmacyContract();
  const document = generateOpenApi(pharmacyContract, {
    info: {
      title: 'Pharmacy POS API',
      version: '1.0.0',
      description: 'Generated from shared ts-rest contract (Zod SSOT)',
    },
    servers: [{ url: '/api' }],
    tags: [
      { name: 'Sales', description: 'Sales endpoints' },
      { name: 'Suppliers', description: 'Supplier management endpoints' },
    ],
  });

  await mergeStaticDescriptors(document as Record<string, any>);

  const outDir = path.resolve(__dirname, '../../../openapi');
  const outFile = path.join(outDir, 'openapi.json');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(document, null, 2), 'utf-8');
  console.log(`OpenAPI written: ${outFile}`);

  writeSuppliersArtifacts(outDir);
  console.log('Suppliers OpenAPI artifacts generated.');
}

main().catch((err) => {
  console.error('Failed to generate OpenAPI:', err);
  process.exit(1);
});
