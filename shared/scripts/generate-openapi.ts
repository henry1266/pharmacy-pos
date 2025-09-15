#!/usr/bin/env ts-node

/**
 * Generate OpenAPI from shared Zod schemas (SSOT)
 */
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { SchemaRegistry, OpenAPIGenerator } from 'zod-to-openapi';

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
  const registry = new SchemaRegistry();

  const saleMod = loadSaleZodModule();
  const saleItemSchema = saleMod.saleItemSchema as z.ZodTypeAny | undefined;
  const createSaleSchema = saleMod.createSaleSchema as z.ZodTypeAny | undefined;
  const updateSaleSchema = saleMod.updateSaleSchema as z.ZodTypeAny | undefined;
  const saleSearchSchema = saleMod.saleSearchSchema as z.ZodTypeAny | undefined;

  if (!saleItemSchema || !createSaleSchema || !updateSaleSchema || !saleSearchSchema) {
    throw new Error('Missing sale schemas from shared module.');
  }

  // Register schemas
  registry.register('SaleItem', saleItemSchema);
  registry.register('SaleCreateRequest', createSaleSchema);
  registry.register('SaleUpdateRequest', updateSaleSchema);
  registry.register('SaleSearchQuery', saleSearchSchema);

  const generator = new OpenAPIGenerator(registry.schemas);
  const schemas = generator.generate();
  const document = {
    openapi: '3.0.3',
    info: {
      title: 'Pharmacy POS Sales API',
      version: '1.0.0'
    },
    servers: [
      { url: '/api' }
    ],
    paths: {},
    components: { schemas }
  } as const;

  const outDir = path.resolve(__dirname, '../../openapi');
  const outFile = path.join(outDir, 'sales.openapi.json');
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
