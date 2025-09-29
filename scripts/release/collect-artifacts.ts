import { existsSync, mkdirSync, statSync, cpSync, writeFileSync } from "fs";
import { resolve, join, basename } from "path";

interface InputItem {
  label: string;
  source: string;
}

interface CliOptions {
  outputDir: string;
  batchName?: string;
  inputs: InputItem[];
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    outputDir: "artifacts/release",
    inputs: [],
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if ((arg === "--input" || arg === "-i") && argv[i + 1]) {
      const value = argv[++i];
      const [label, path] = value.includes("=") ? value.split("=") : ["", value];
      options.inputs.push({
        label: label || basename(path),
        source: path,
      });
    } else if (arg === "--output" && argv[i + 1]) {
      options.outputDir = argv[++i];
    } else if (arg === "--batch" && argv[i + 1]) {
      options.batchName = argv[++i];
    } else if (arg === "--help") {
      printHelp();
      process.exit(0);
    }
  }

  if (options.inputs.length === 0) {
    throw new Error("請透過 --input 指定至少一個來源 (格式: [label=]path)");
  }

  return options;
}

function printHelp(): void {
  console.log(`使用方式: ts-node scripts/release/collect-artifacts.ts --input report=path/to/report.json [其他選項]\n\n` +
    `選項:\n` +
    `  --input, -i <label=path>  指定要收集的檔案或目錄，可重複使用\n` +
    `  --output <dir>            指定輸出根目錄 (預設 artifacts/release)\n` +
    `  --batch <name>            指定批次目錄名稱 (預設使用時間戳)\n` +
    `  --help                    顯示說明\n`);
}

function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function createBatchDir(root: string, batchName?: string): string {
  const name = batchName ?? new Date().toISOString().replace(/[:]/g, "-");
  const full = resolve(join(root, name));
  ensureDir(full);
  return full;
}

function copyItem(targetDir: string, item: InputItem): { label: string; source: string; destination: string; type: string } {
  const sourcePath = resolve(item.source);
  if (!existsSync(sourcePath)) {
    throw new Error(`來源不存在: ${sourcePath}`);
  }

  const stats = statSync(sourcePath);
  const destination = resolve(join(targetDir, item.label));
  ensureDir(resolve(join(destination, "..")));

  cpSync(sourcePath, destination, { recursive: true, force: true });

  return {
    label: item.label,
    source: sourcePath,
    destination,
    type: stats.isDirectory() ? "directory" : "file",
  };
}

function main(): void {
  const options = parseArgs(process.argv);
  ensureDir(options.outputDir);
  const batchDir = createBatchDir(options.outputDir, options.batchName);

  const manifestEntries = options.inputs.map((input) => copyItem(batchDir, input));

  const manifestPath = join(batchDir, "manifest.json");
  writeFileSync(manifestPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    items: manifestEntries,
  }, null, 2), "utf8");

  console.log(`已收集 ${manifestEntries.length} 項產物至: ${batchDir}`);
  manifestEntries.forEach((entry) => {
    console.log(`- ${entry.label}: ${entry.destination}`);
  });
  console.log(`清單: ${manifestPath}`);
}

main();
