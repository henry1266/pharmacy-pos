import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { execSync } from "child_process";

type SemverLevel = "major" | "minor" | "patch";

interface CliOptions {
  baseRef: string;
  headRef: string;
  schemaDiffPath?: string;
  output?: string;
  explicitLevel?: SemverLevel;
}

interface PackageInfo {
  name: string;
  path: string;
  version: string;
  recommendedBump: SemverLevel | null;
  nextVersion: string | null;
  reasoning: string[];
}

interface AnalysisResult {
  baseRef: string;
  headRef: string;
  detectedLevel: SemverLevel;
  packages: PackageInfo[];
  changedPaths: string[];
}

const SUPPORTED_LEVELS: SemverLevel[] = ["major", "minor", "patch"];

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    baseRef: "",
    headRef: "HEAD",
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--base" && argv[i + 1]) {
      options.baseRef = argv[++i];
    } else if (arg === "--head" && argv[i + 1]) {
      options.headRef = argv[++i];
    } else if (arg === "--schema-diff" && argv[i + 1]) {
      options.schemaDiffPath = argv[++i];
    } else if (arg === "--output" && argv[i + 1]) {
      options.output = argv[++i];
    } else if (arg === "--level" && argv[i + 1]) {
      const level = argv[++i] as SemverLevel;
      if (!SUPPORTED_LEVELS.includes(level)) {
        throw new Error(`無效的 --level 參數: ${level}`);
      }
      options.explicitLevel = level;
    } else if (arg === "--help") {
      printHelp();
      process.exit(0);
    }
  }

  if (!options.baseRef) {
    options.baseRef = detectLatestTag() ?? "HEAD~1";
  }

  return options;
}

function printHelp(): void {
  console.log(`使用方式: ts-node scripts/release/version-bump.ts [選項]\n\n` +
    `選項:\n` +
    `  --base <ref>         指定比較基準 (預設最近標籤或 HEAD~1)\n` +
    `  --head <ref>         指定比較目標 (預設 HEAD)\n` +
    `  --schema-diff <path> 指定 schema-diff.json，若未提供則直接比較 git 變更\n` +
    `  --level <major|minor|patch> 直接覆寫建議等級\n` +
    `  --output <file>      將結果輸出為 JSON 檔\n` +
    `  --help               顯示說明\n`);
}

function detectLatestTag(): string | null {
  try {
    const tag = execSync("git describe --tags --abbrev=0", {
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
    }).trim();
    return tag || null;
  } catch (error) {
    return null;
  }
}

function collectChangedPaths(baseRef: string, headRef: string): string[] {
  try {
    const raw = execSync(`git diff --name-only ${baseRef} ${headRef}`, {
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
    });
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (error) {
    throw new Error(`無法取得 git 變更列表: ${(error as Error).message}`);
  }
}

function readSchemaDiff(path: string): string[] {
  const absolute = resolve(path);
  const json = JSON.parse(readFileSync(absolute, "utf8"));
  if (!Array.isArray(json.files)) {
    return [];
  }
  return json.files
    .map((entry: { path?: string }) => entry?.path)
    .filter((entry: unknown): entry is string => typeof entry === "string" && entry.length > 0);
}

function detectLevel(options: CliOptions, changedPaths: string[]): SemverLevel {
  if (options.explicitLevel) {
    return options.explicitLevel;
  }

  let level: SemverLevel = "patch";
  const touchesShared = changedPaths.some((p) => p.startsWith("shared/"));
  const touchesOpenapi = changedPaths.some((p) => p.startsWith("openapi/"));
  const hasBreaking = changedPaths.some((p) => /breaking-change/i.test(p));

  if (hasBreaking) {
    level = "major";
  } else if (touchesShared || touchesOpenapi) {
    level = "minor";
  }

  return level;
}

function readPackageVersion(pkgPath: string): string {
  const absolute = resolve(pkgPath);
  const json = JSON.parse(readFileSync(absolute, "utf8"));
  if (typeof json.version !== "string") {
    throw new Error(`package.json 缺少 version 欄位: ${pkgPath}`);
  }
  return json.version;
}

function bumpVersion(current: string, level: SemverLevel): string {
  const parts = current.split(".");
  if (parts.length < 3) {
    throw new Error(`無法解析版本號: ${current}`);
  }
  const [major, minor, patch] = parts.slice(0, 3).map((value) => Number(value));
  if ([major, minor, patch].some((value) => Number.isNaN(value))) {
    throw new Error(`無法解析版本號: ${current}`);
  }

  switch (level) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

function analyse(options: CliOptions): AnalysisResult {
  const changedPaths = options.schemaDiffPath
    ? readSchemaDiff(options.schemaDiffPath)
    : collectChangedPaths(options.baseRef, options.headRef);

  const level = detectLevel(options, changedPaths);

  const packages: Array<{ key: string; path: string }> = [
    { key: "root", path: "package.json" },
    { key: "shared", path: "shared/package.json" },
    { key: "openapi", path: "openapi/package.json" },
    { key: "backend", path: "backend/package.json" },
    { key: "frontend", path: "frontend/package.json" },
  ];

  const resultPackages: PackageInfo[] = packages.map(({ key, path }) => {
    if (!existsSync(path)) {
      return {
        name: key,
        path,
        version: "n/a",
        recommendedBump: null,
        nextVersion: null,
        reasoning: ["未找到 package.json"],
      };
    }

    const version = readPackageVersion(path);
    const reasoning: string[] = [];
    let recommended: SemverLevel | null = null;

    if (key === "shared" && changedPaths.some((p) => p.startsWith("shared/"))) {
      recommended = level;
      reasoning.push("shared 目錄有變更");
    } else if (key === "openapi" && changedPaths.some((p) => p.startsWith("openapi/"))) {
      recommended = level;
      reasoning.push("openapi 目錄有變更");
    } else if (key === "backend" && changedPaths.some((p) => p.startsWith("backend/"))) {
      recommended = level === "patch" ? "patch" : "minor";
      reasoning.push("backend 目錄有變更");
    } else if (key === "frontend" && changedPaths.some((p) => p.startsWith("frontend/"))) {
      recommended = level === "patch" ? "patch" : "minor";
      reasoning.push("frontend 目錄有變更");
    } else if (key === "root" && changedPaths.length > 0) {
      recommended = "patch";
      reasoning.push("跨模組有變更");
    } else {
      reasoning.push("未偵測到相關變更");
    }

    const nextVersion = recommended ? bumpVersion(version, recommended) : version;

    return {
      name: key,
      path,
      version,
      recommendedBump: recommended,
      nextVersion,
      reasoning,
    };
  });

  return {
    baseRef: options.baseRef,
    headRef: options.headRef,
    detectedLevel: level,
    packages: resultPackages,
    changedPaths,
  };
}

function outputResult(result: AnalysisResult, filePath?: string): void {
  console.log("建議版本等級:", result.detectedLevel);
  result.packages.forEach((pkg) => {
    const recommendation = pkg.recommendedBump ?? "無需調整";
    console.log(`- ${pkg.name}: ${pkg.version} -> ${pkg.nextVersion} (${recommendation})`);
    pkg.reasoning.forEach((reason) => console.log(`  • ${reason}`));
  });

  if (!filePath) {
    return;
  }

  const target = resolve(filePath);
  const folder = dirname(target);
  if (!existsSync(folder)) {
    mkdirSync(folder, { recursive: true });
  }

  writeFileSync(target, JSON.stringify(result, null, 2), "utf8");
  console.log(`已輸出版本建議: ${target}`);
}

function main(): void {
  const options = parseArgs(process.argv);
  const analysis = analyse(options);
  outputResult(analysis, options.output);
}

main();
