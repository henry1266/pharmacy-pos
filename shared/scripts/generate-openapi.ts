#!/usr/bin/env ts-node

/**
 * Generate OpenAPI from shared Zod schemas (SSOT)
 */
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

function loadSaleZodModule(): any {
  const candidates = [
    path.resolve(__dirname, '../dist/schemas/zod/sale.js'),
    path.resolve(__dirname, '../../shared/dist/schemas/zod/sale.js') // fallback if executed from different cwd
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require(p);
    }
  }
  throw new Error('Cannot find compiled sale zod module. Build shared first.');
}

async function main() {
  // Using createSchema per-schema (no registry needed for now)

  const saleMod = loadSaleZodModule();
  const saleItemSchema = saleMod.saleItemSchema as z.ZodTypeAny | undefined;
  const createSaleSchema = saleMod.createSaleSchema as z.ZodTypeAny | undefined;
  const updateSaleSchema = saleMod.updateSaleSchema as z.ZodTypeAny | undefined;
  const saleSearchSchema = saleMod.saleSearchSchema as z.ZodTypeAny | undefined;

  if (!saleItemSchema || !createSaleSchema || !updateSaleSchema || !saleSearchSchema) {
    throw new Error('Missing sale schemas from shared module.');
  }

  // Register schemas
  const sSaleItem = zodToJsonSchema(saleItemSchema as any, { name: 'SaleItem' }).definitions?.SaleItem || zodToJsonSchema(saleItemSchema as any);
  const sCreate = zodToJsonSchema(createSaleSchema as any, { name: 'SaleCreateRequest' }).definitions?.SaleCreateRequest || zodToJsonSchema(createSaleSchema as any);
  const sUpdate = zodToJsonSchema(updateSaleSchema as any, { name: 'SaleUpdateRequest' }).definitions?.SaleUpdateRequest || zodToJsonSchema(updateSaleSchema as any);
  const sSearch = zodToJsonSchema(saleSearchSchema as any, { name: 'SaleSearchQuery' }).definitions?.SaleSearchQuery || zodToJsonSchema(saleSearchSchema as any);

  const document = {
    openapi: '3.0.3',
    info: {
      title: 'Pharmacy POS Sales API',
      version: '1.0.0'
    },
    servers: [{ url: '/api' }],
    paths: {},
    components: {
      schemas: {
        SaleItem: sSaleItem,
        SaleCreateRequest: sCreate,
        SaleUpdateRequest: sUpdate,
        SaleSearchQuery: sSearch
      }
    }
  } as const;

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
