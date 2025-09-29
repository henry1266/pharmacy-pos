import { execSync } from "child_process";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, resolve } from "path";

type OutputFormat = "markdown" | "json";

interface CliOptions {
  baseRef: string;
  headRef: string;
  outputDir: string;
  formats: Set<OutputFormat>;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    baseRef: "",
    headRef: "HEAD",
    outputDir: "artifacts/release",
    formats: new Set<OutputFormat>(["markdown", "json"]),
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--base" && argv[i + 1]) {
      options.baseRef = argv[++i];
    } else if (arg === "--head" && argv[i + 1]) {
      options.headRef = argv[++i];
    } else if (arg === "--output" && argv[i + 1]) {
      options.outputDir = argv[++i];
    } else if (arg === "--format" && argv[i + 1]) {
      options.formats = new Set<OutputFormat>();
      const formats = argv[++i].split(/[\s,]+/).map((f) => f.trim().toLowerCase()).filter(Boolean);
      formats.forEach((format) => {
        if (format === "markdown" || format === "json") {
          options.formats.add(format as OutputFormat);
        } else {
          throw new Error(`不支援的格式: ${format}`);
        }
      });
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

function printHelp(): void {
  console.log(`使用方式: ts-node scripts/release/schema-diff.ts [選項]\n\n` +
    `選項:\n` +
    `  --base <ref>     指定差異基準 (預設為最近標籤或 HEAD~1)\n` +
    `  --head <ref>     指定比對目標 (預設 HEAD)\n` +
    `  --output <dir>   指定輸出目錄 (預設 artifacts/release)\n` +
    `  --format <list>  指定輸出格式 (markdown,json；可逗號分隔)\n` +
    `  --help           顯示說明\n`);
}

interface FileDiff {
  path: string;
  status: string;
  diff: string;
}

interface DiffResult {
  baseRef: string;
  headRef: string;
  generatedAt: string;
  files: FileDiff[];
}

function collectDiffs(baseRef: string, headRef: string): DiffResult {
  let namesRaw: string;
  try {
    namesRaw = execSync(
      `git diff --name-status ${baseRef} ${headRef} -- shared openapi`,
      { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
    );
  } catch (error) {
    throw new Error(`無法取得檔案列表，請確認 git 參照: ${(error as Error).message}`);
  }

  const files: FileDiff[] = [];

  namesRaw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const [status, ...rest] = line.split(/\s+/);
      const filePath = rest.join(" ");
      if (!filePath) {
        return;
      }
      const diff = execSync(
        `git diff ${baseRef} ${headRef} -- ${filePath}`,
        { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
      );
      files.push({ path: filePath, status, diff });
    });

  return {
    baseRef,
    headRef,
    generatedAt: new Date().toISOString(),
    files,
  };
}

function ensureDir(targetDir: string): void {
  const resolved = resolve(targetDir);
  if (!existsSync(resolved)) {
    mkdirSync(resolved, { recursive: true });
  }
}

function writeMarkdown(result: DiffResult, outputDir: string): void {
  const lines: string[] = [];
  lines.push(`# Schema Diff 報告`);
  lines.push("");
  lines.push(`- 基準 (base): ${result.baseRef}`);
  lines.push(`- 目標 (head): ${result.headRef}`);
  lines.push(`- 產出時間: ${result.generatedAt}`);
  lines.push("");

  if (result.files.length === 0) {
    lines.push("本次 shared/openapi 無差異。");
  } else {
    lines.push(`共發現 ${result.files.length} 個檔案變更：`);
    lines.push("");
    result.files.forEach((file) => {
      lines.push(`## ${file.path} (${file.status})`);
      lines.push("````diff");
      lines.push(file.diff || "(無差異內容)");
      lines.push("````");
      lines.push("");
    });
  }

  const target = join(outputDir, "schema-diff.md");
  writeFileSync(target, lines.join("\n"), "utf8");
  console.log(`已輸出 Markdown 差異: ${target}`);
}

function writeJson(result: DiffResult, outputDir: string): void {
  const target = join(outputDir, "schema-diff.json");
  writeFileSync(target, JSON.stringify(result, null, 2), "utf8");
  console.log(`已輸出 JSON 差異: ${target}`);
}

function main(): void {
  const options = parseArgs(process.argv);
  const diff = collectDiffs(options.baseRef, options.headRef);
  ensureDir(options.outputDir);

  if (options.formats.has("markdown")) {
    writeMarkdown(diff, options.outputDir);
  }
  if (options.formats.has("json")) {
    writeJson(diff, options.outputDir);
  }
}

main();

