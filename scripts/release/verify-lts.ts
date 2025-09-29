import { readFileSync } from "fs";
import { resolve } from "path";

interface CliOptions {
  coveragePath?: string;
  matrixPath?: string;
  minCoverage: number;
  requiredSuites: string[];
}

interface CoverageSummary {
  total?: {
    lines?: { pct?: number };
    statements?: { pct?: number };
    branches?: { pct?: number };
    functions?: { pct?: number };
  };
}

interface MatrixEntry {
  name: string;
  status: string;
  detail?: string;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    minCoverage: 0.8,
    requiredSuites: [],
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--coverage" && argv[i + 1]) {
      options.coveragePath = argv[++i];
    } else if (arg === "--matrix" && argv[i + 1]) {
      options.matrixPath = argv[++i];
    } else if (arg === "--min-coverage" && argv[i + 1]) {
      const value = Number(argv[++i]);
      if (Number.isNaN(value) || value <= 0 || value > 1) {
        throw new Error("--min-coverage 必須介於 0 與 1 之間");
      }
      options.minCoverage = value;
    } else if (arg === "--require" && argv[i + 1]) {
      options.requiredSuites = argv[++i]
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
    } else if (arg === "--help") {
      printHelp();
      process.exit(0);
    }
  }

  if (!options.coveragePath && !options.matrixPath) {
    throw new Error("請至少提供 coverage 或 matrix 其中一項資料");
  }

  return options;
}

function printHelp(): void {
  console.log(`使用方式: ts-node scripts/release/verify-lts.ts [選項]\n\n` +
    `選項:\n` +
    `  --coverage <path>      指定 coverage-summary.json 路徑\n` +
    `  --matrix <path>        指定 LTS 測試矩陣 JSON 檔\n` +
    `  --min-coverage <0-1>   覆蓋率門檻 (預設 0.8)\n` +
    `  --require <a,b,c>      指定必須通過的測試套件名稱 (逗號分隔)\n` +
    `  --help                 顯示說明\n`);
}

function loadCoverage(path: string): CoverageSummary {
  const absolute = resolve(path);
  return JSON.parse(readFileSync(absolute, "utf8"));
}

function loadMatrix(path: string): MatrixEntry[] {
  const absolute = resolve(path);
  const data = JSON.parse(readFileSync(absolute, "utf8"));
  if (!Array.isArray(data)) {
    throw new Error("測試矩陣格式錯誤，應為陣列");
  }
  return data as MatrixEntry[];
}

function validateCoverage(summary: CoverageSummary, minCoverage: number): string[] {
  const failures: string[] = [];
  if (!summary.total) {
    failures.push("coverage 資料缺少 total 欄位");
    return failures;
  }

  const metrics: Array<[string, number | undefined]> = [
    ["lines", summary.total.lines?.pct],
    ["statements", summary.total.statements?.pct],
    ["branches", summary.total.branches?.pct],
    ["functions", summary.total.functions?.pct],
  ];

  metrics.forEach(([name, pct]) => {
    if (pct === undefined) {
      failures.push(`${name} 覆蓋率缺失`);
    } else if (pct / 100 < minCoverage) {
      failures.push(`${name} 覆蓋率 ${pct}% 低於門檻 ${minCoverage * 100}%`);
    }
  });

  return failures;
}

function validateMatrix(entries: MatrixEntry[], required: string[]): string[] {
  if (required.length === 0) {
    return [];
  }

  const failures: string[] = [];
  required.forEach((name) => {
    const record = entries.find((entry) => entry.name === name);
    if (!record) {
      failures.push(`找不到測試套件: ${name}`);
    } else if (record.status !== "pass") {
      failures.push(`測試套件 ${name} 狀態為 ${record.status}`);
    }
  });

  return failures;
}

function main(): void {
  const options = parseArgs(process.argv);
  const failures: string[] = [];

  if (options.coveragePath) {
    const coverage = loadCoverage(options.coveragePath);
    failures.push(...validateCoverage(coverage, options.minCoverage));
  }

  if (options.matrixPath) {
    const matrix = loadMatrix(options.matrixPath);
    failures.push(...validateMatrix(matrix, options.requiredSuites));
  }

  if (failures.length > 0) {
    console.error("LTS 驗證失敗:");
    failures.forEach((msg) => console.error(`- ${msg}`));
    process.exitCode = 1;
  } else {
    console.log("LTS 驗證通過");
  }
}

main();
