#!/usr/bin/env ts-node

/**
 * Generate OpenAPI from shared ts-rest contracts (Zod SSOT)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { generateOpenApi } from '@ts-rest/open-api';
import type { PharmacyContract } from '../api/contracts';

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
    ],
  });

  await mergeStaticDescriptors(document as Record<string, any>);

  const outDir = path.resolve(__dirname, '../../openapi');
  const outFile = path.join(outDir, 'openapi.json');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(document, null, 2), 'utf-8');
  console.log(`OpenAPI written: ${outFile}`);
}

main().catch((err) => {
  console.error('Failed to generate OpenAPI:', err);
  process.exit(1);
});
