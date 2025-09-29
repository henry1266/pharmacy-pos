import { spawnSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, resolve } from "path";

type OutputFormat = "markdown" | "json";

type CollectItem = {
  label: string;
  path: string;
};

type Options = {
  baseRef?: string;
  headRef?: string;
  outputDir: string;
  formats: OutputFormat[];
  coverage?: string;
  matrix?: string;
  minCoverage?: number;
  requireSuites: string[];
  skipTests: boolean;
  skipTypeCheck: boolean;
  skipVerify: boolean;
  skipCollect: boolean;
  extraCollect: CollectItem[];
  versionLevelOverride?: "major" | "minor" | "patch";
};

type StepResult = {
  name: string;
  success: boolean;
};

const pnpmCmd = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function parseArgs(argv: string[]): Options {
  const options: Options = {
    outputDir: "artifacts/release/auto",
    formats: ["markdown", "json"],
    requireSuites: [],
    skipTests: false,
    skipTypeCheck: false,
    skipVerify: false,
    skipCollect: false,
    extraCollect: [],
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--base") {
      if (!argv[i + 1]) throw new Error("--base 需要指定參照");
      options.baseRef = argv[++i];
    } else if (arg === "--head") {
      if (!argv[i + 1]) throw new Error("--head 需要指定參照");
      options.headRef = argv[++i];
    } else if (arg === "--output") {
      if (!argv[i + 1]) throw new Error("--output 需要指定路徑");
      options.outputDir = argv[++i];
    } else if (arg === "--format") {
      if (!argv[i + 1]) throw new Error("--format 需要指定格式");
      const list = argv[++i]
        .split(/[\s,]+/)
        .map((item) => item.trim())
        .filter(Boolean) as OutputFormat[];
      if (list.length === 0) throw new Error("--format 至少需要一個格式");
      list.forEach((item) => {
        if (item !== "markdown" && item !== "json") {
          throw new Error(`不支援的輸出格式: ${item}`);
        }
      });
      options.formats = list;
    } else if (arg === "--coverage") {
      if (!argv[i + 1]) throw new Error("--coverage 需要指定路徑");
      options.coverage = argv[++i];
    } else if (arg === "--matrix") {
      if (!argv[i + 1]) throw new Error("--matrix 需要指定路徑");
      options.matrix = argv[++i];
    } else if (arg === "--min-coverage") {
      if (!argv[i + 1]) throw new Error("--min-coverage 需要指定數值");
      const value = Number(argv[++i]);
      if (Number.isNaN(value) || value <= 0 || value > 1) {
        throw new Error("--min-coverage 必須介於 0 與 1 之間");
      }
      options.minCoverage = value;
    } else if (arg === "--require") {
      if (!argv[i + 1]) throw new Error("--require 需要指定名稱");
      options.requireSuites = argv[++i]
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    } else if (arg === "--collect") {
      if (!argv[i + 1]) throw new Error("--collect 需要指定參數");
      const raw = argv[++i];
      const [label, path] = raw.includes("=") ? raw.split("=") : ["", raw];
      const sourcePath = path.trim();
      if (!sourcePath) throw new Error("--collect 需要 label=path 或 path 形式");
      const finalLabel = (label || `item${options.extraCollect.length + 1}`).trim();
      options.extraCollect.push({ label: finalLabel, path: sourcePath });
    } else if (arg === "--level") {
      if (!argv[i + 1]) throw new Error("--level 需要指定等級");
      const next = argv[++i] as "major" | "minor" | "patch";
      if (!(["major", "minor", "patch"] as const).includes(next)) {
        throw new Error(`無效的 --level 參數: ${next}`);
      }
      options.versionLevelOverride = next;
    } else if (arg === "--skip-tests") {
      options.skipTests = true;
    } else if (arg === "--skip-type-check") {
      options.skipTypeCheck = true;
    } else if (arg === "--skip-verify") {
      options.skipVerify = true;
    } else if (arg === "--skip-collect") {
      options.skipCollect = true;
    } else if (arg === "--help") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`未知參數: ${arg}`);
    }
  }

  options.outputDir = resolve(options.outputDir);

  return options;
}

function printHelp(): void {
  const lines = [
    '使用方式: pnpm run release:auto -- [選項]',
    '',
    '選項:',
    '  --base <ref>            指定 schema diff 基準 (預設為最近標籤)',
    '  --head <ref>            指定目標 (預設 HEAD)',
    '  --output <dir>          指定輸出目錄 (預設 artifacts/release/auto)',
    '  --format <markdown,json>  覆寫 diff 格式',
    '  --coverage <path>       指向 coverage-summary.json',
    '  --matrix <path>         指向 LTS 測試矩陣 JSON',
    '  --min-coverage <0-1>    覆蓋率門檻 (預設 0.8)',
    '  --require <a,b>         指定必須通過的測試套件',
    '  --collect <label=path>  追加要打包的檔案或目錄',
    '  --level <major|minor|patch> 覆寫版本建議等級',
    '  --skip-tests            略過測試流程',
    '  --skip-type-check       略過型別檢查',
    '  --skip-verify           略過 release:verify-lts',
    '  --skip-collect          略過 release:collect-artifacts',
    '  --help                  顯示此說明'
  ];
  console.log(lines.join('\n'));
}function ensureDir(target: string): void {
  if (!existsSync(target)) {
    mkdirSync(target, { recursive: true });
  }
}

function runStep(name: string, command: string, args: string[]): StepResult {
  console.log(`\n[release:auto] 開始步驟: ${name}`);
  const useShell = process.platform === "win32";
  const result = spawnSync(command, args, { stdio: "inherit", shell: useShell });
  if (result.error) {
    throw result.error;
  }
  if (typeof result.status === "number" && result.status !== 0) {
    throw new Error(`${name} 執行失敗 (exit ${result.status})`);
  }
  return { name, success: true };
}

function buildCollectArgs(items: CollectItem[], outputDir: string): string[] {
  const args: string[] = [
    "run",
    "release:collect-artifacts",
    "--",
    "--output",
    outputDir,
    "--batch",
    "auto-bundle",
  ];
  items.forEach((item) => {
    args.push("--input", `${item.label}=${item.path}`);
  });
  return args;
}

function buildVerifyArgs(options: Options): string[] {
  const args: string[] = ["run", "release:verify-lts", "--"];
  if (options.coverage) {
    args.push("--coverage", options.coverage);
  }
  if (options.matrix) {
    args.push("--matrix", options.matrix);
  }
  if (options.minCoverage) {
    args.push("--min-coverage", options.minCoverage.toString());
  }
  if (options.requireSuites.length > 0) {
    args.push("--require", options.requireSuites.join(","));
  }
  return args;
}

function resolveAndValidate(pathValue: string, description: string): string {
  const resolved = resolve(pathValue);
  if (!existsSync(resolved)) {
    throw new Error(`找不到 ${description}: ${resolved}`);
  }
  return resolved;
}

function main(): void {
  try {
    const options = parseArgs(process.argv);
    ensureDir(options.outputDir);

    const steps: StepResult[] = [];
    const matrixEntries: Array<{ name: string; status: string; detail?: string }> = [];

    if (!options.skipTypeCheck) {
      steps.push(runStep("type-check", pnpmCmd, ["run", "type-check"]));
    }

    if (!options.skipTests) {
      const backendArgs = [
        "--filter",
        "backend",
        "test",
        "--coverage",
        "--coverageReporters=json-summary",
        "--coverageDirectory=coverage",
        "--passWithNoTests",
      ];
      steps.push(runStep("backend-test", pnpmCmd, backendArgs));
      options.coverage = resolveAndValidate("backend/coverage/coverage-summary.json", "coverage 檔案");
      matrixEntries.push({
        name: "regression",
        status: "pass",
        detail: "pnpm --filter backend test --coverage --coverageReporters=json-summary --coverageDirectory=coverage --passWithNoTests",
      });

      steps.push(runStep("frontend-test", pnpmCmd, ["--filter", "frontend", "test"]));
    }

    const schemaArgs = [
      "run",
      "release:schema-diff",
      "--",
      "--output",
      options.outputDir,
      "--format",
      options.formats.join(","),
    ];
    if (options.baseRef) {
      schemaArgs.push("--base", options.baseRef);
    }
    if (options.headRef) {
      schemaArgs.push("--head", options.headRef);
    }
    steps.push(runStep("schema-diff", pnpmCmd, schemaArgs));
    matrixEntries.push({
      name: "contract",
      status: "pass",
      detail: "pnpm run release:schema-diff",
    });

    const schemaDiffJson = join(options.outputDir, "schema-diff.json");
    const versionArgs = [
      "run",
      "release:version-bump",
      "--",
      "--schema-diff",
      schemaDiffJson,
      "--output",
      join(options.outputDir, "version-bump.json"),
    ];
    if (options.versionLevelOverride) {
      versionArgs.push("--level", options.versionLevelOverride);
    }
    steps.push(runStep("version-bump", pnpmCmd, versionArgs));

    if (!options.matrix && matrixEntries.length > 0) {
      if (options.requireSuites.length === 0) {
        options.requireSuites = matrixEntries.map((entry) => entry.name);
      }
      const matrixPath = join(options.outputDir, "lts-matrix.json");
      writeFileSync(matrixPath, JSON.stringify(matrixEntries, null, 2), "utf8");
      options.matrix = matrixPath;
    }

    const collectItems: CollectItem[] = [];

    if (options.coverage) {
      options.coverage = resolveAndValidate(options.coverage, "coverage 檔案");
      collectItems.push({ label: "coverage-summary.json", path: options.coverage });
    }
    if (options.matrix) {
      options.matrix = resolveAndValidate(options.matrix, "LTS 矩陣檔案");
      collectItems.push({ label: "lts-matrix.json", path: options.matrix });
    }
    options.extraCollect.forEach((item) => {
      const resolved = resolveAndValidate(item.path, `來源 ${item.path}`);
      collectItems.push({ label: item.label, path: resolved });
    });

    if (!options.skipCollect && collectItems.length > 0) {
      steps.push(runStep("collect-artifacts", pnpmCmd, buildCollectArgs(collectItems, options.outputDir)));
    }

    const needVerify = !options.skipVerify && (options.coverage || options.matrix);
    if (needVerify) {
      if (options.coverage && !options.minCoverage) {
        options.minCoverage = 0.8;
      }
      steps.push(runStep("verify-lts", pnpmCmd, buildVerifyArgs(options)));
    }

    console.log("\n[release:auto] 成功完成以下步驟:");
    steps.forEach((step) => console.log(`- ${step.name}`));
    console.log(`輸出目錄: ${options.outputDir}`);
  } catch (error) {
    console.error("[release:auto] 發生錯誤:", (error as Error).message);
    process.exitCode = 1;
  }
}

main();


