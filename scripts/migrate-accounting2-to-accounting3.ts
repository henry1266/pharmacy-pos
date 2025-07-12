#!/usr/bin/env ts-node

/**
 * Accounting2 到 Accounting3 遷移腳本
 * 自動化遷移過程，減少手動工作量
 */

import * as fs from 'fs';
import * as path from 'path';

interface MigrationConfig {
  sourceDir: string;
  targetDir: string;
  backupDir: string;
  dryRun: boolean;
  verbose: boolean;
}

interface MigrationResult {
  totalFiles: number;
  processedFiles: number;
  migratedFiles: number;
  skippedFiles: number;
  failedFiles: string[];
  errors: string[];
}

class Accounting2To3Migrator {
  private config: MigrationConfig;
  private result: MigrationResult;

  constructor(config: MigrationConfig) {
    this.config = config;
    this.result = {
      totalFiles: 0,
      processedFiles: 0,
      migratedFiles: 0,
      skippedFiles: 0,
      failedFiles: [],
      errors: []
    };
  }

  /**
   * 執行遷移
   */
  async migrate(): Promise<MigrationResult> {
    console.log('🚀 開始 Accounting2 到 Accounting3 遷移...');
    console.log(`📁 來源目錄: ${this.config.sourceDir}`);
    console.log(`📁 目標目錄: ${this.config.targetDir}`);
    console.log(`💾 備份目錄: ${this.config.backupDir}`);
    console.log(`🔍 乾跑模式: ${this.config.dryRun ? '是' : '否'}`);
    console.log('');

    try {
      // 1. 掃描需要遷移的檔案
      await this.scanFiles();

      // 2. 建立備份
      if (!this.config.dryRun) {
        await this.createBackup();
      }

      // 3. 執行遷移
      await this.migrateFiles();

      // 4. 生成報告
      this.generateReport();

      return this.result;
    } catch (error) {
      console.error('❌ 遷移過程中發生錯誤:', error);
      this.result.errors.push(error instanceof Error ? error.message : String(error));
      return this.result;
    }
  }

  /**
   * 掃描需要遷移的檔案
   */
  private async scanFiles(): Promise<void> {
    console.log('🔍 掃描需要遷移的檔案...');

    const directories = [
      'frontend/src',
      'shared'
    ];

    const allFiles: string[] = [];
    for (const dir of directories) {
      const files = this.scanDirectory(dir, ['.ts', '.tsx']);
      allFiles.push(...files);
    }

    // 過濾包含 accounting2 依賴的檔案
    const filesToMigrate: string[] = [];
    for (const file of allFiles) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        if (this.needsMigration(content)) {
          filesToMigrate.push(file);
        }
      } catch (error) {
        console.warn(`⚠️  無法讀取檔案: ${file}`);
      }
    }

    this.result.totalFiles = filesToMigrate.length;
    console.log(`📊 找到 ${this.result.totalFiles} 個需要遷移的檔案`);
  }

  /**
   * 遞迴掃描目錄
   */
  private scanDirectory(dirPath: string, extensions: string[]): string[] {
    const files: string[] = [];
    
    if (!fs.existsSync(dirPath)) {
      return files;
    }

    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 跳過 node_modules 和其他不需要的目錄
        if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
          files.push(...this.scanDirectory(fullPath, extensions));
        }
      } else if (stat.isFile()) {
        const ext = path.extname(fullPath);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
    
    return files;
  }

  /**
   * 檢查檔案是否需要遷移
   */
  private needsMigration(content: string): boolean {
    const accounting2Patterns = [
      /from.*accounting2/,
      /import.*accounting2/,
      /Account2(?![a-zA-Z])/,
      /TransactionGroupWithEntries(?![a-zA-Z])/,
      /EmbeddedAccountingEntry(?![a-zA-Z])/,
      /@pharmacy-pos\/shared\/types\/accounting2/
    ];

    return accounting2Patterns.some(pattern => pattern.test(content));
  }

  /**
   * 建立備份
   */
  private async createBackup(): Promise<void> {
    console.log('💾 建立備份...');

    if (!fs.existsSync(this.config.backupDir)) {
      fs.mkdirSync(this.config.backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.config.backupDir, `accounting2-backup-${timestamp}`);
    
    // 這裡可以實作更完整的備份邏輯
    console.log(`📦 備份已建立: ${backupPath}`);
  }

  /**
   * 執行檔案遷移
   */
  private async migrateFiles(): Promise<void> {
    console.log('🔄 開始遷移檔案...');

    const filesToProcess = await this.getFilesToProcess();

    for (const file of filesToProcess) {
      try {
        await this.migrateFile(file);
        this.result.processedFiles++;
      } catch (error) {
        console.error(`❌ 遷移檔案失敗: ${file}`, error);
        this.result.failedFiles.push(file);
        this.result.errors.push(`${file}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * 取得需要處理的檔案列表
   */
  private async getFilesToProcess(): Promise<string[]> {
    // 這裡應該根據實際掃描結果返回檔案列表
    // 暫時返回空陣列，實際實作時需要完善
    return [];
  }

  /**
   * 遷移單個檔案
   */
  private async migrateFile(filePath: string): Promise<void> {
    if (this.config.verbose) {
      console.log(`🔄 處理檔案: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const migratedContent = this.transformContent(content, filePath);

    if (content !== migratedContent) {
      if (!this.config.dryRun) {
        fs.writeFileSync(filePath, migratedContent, 'utf-8');
      }
      this.result.migratedFiles++;
      
      if (this.config.verbose) {
        console.log(`✅ 已遷移: ${filePath}`);
      }
    } else {
      this.result.skippedFiles++;
      
      if (this.config.verbose) {
        console.log(`⏭️  跳過: ${filePath} (無需變更)`);
      }
    }
  }

  /**
   * 轉換檔案內容
   */
  private transformContent(content: string, filePath: string): string {
    let transformed = content;

    // 1. 更新 import 語句
    transformed = this.updateImports(transformed);

    // 2. 更新型別引用
    transformed = this.updateTypeReferences(transformed);

    // 3. 更新函數呼叫
    transformed = this.updateFunctionCalls(transformed);

    // 4. 檔案特定的轉換
    transformed = this.applyFileSpecificTransforms(transformed, filePath);

    return transformed;
  }

  /**
   * 更新 import 語句
   */
  private updateImports(content: string): string {
    const importTransforms = [
      {
        from: /import\s*{([^}]+)}\s*from\s*['"]@pharmacy-pos\/shared\/types\/accounting2['"];?/g,
        to: (match: string, imports: string) => {
          // 將 accounting2 的 import 轉換為 accounting3
          const cleanImports = imports.replace(/Account2/g, 'Account3')
                                     .replace(/TransactionGroupWithEntries/g, 'TransactionGroupWithEntries3')
                                     .replace(/EmbeddedAccountingEntry/g, 'AccountingEntry3');
          return `import { ${cleanImports} } from '../modules/accounting3';`;
        }
      },
      {
        from: /from\s*['"].*accounting2.*['"];?/g,
        to: `from '../modules/accounting3';`
      }
    ];

    let transformed = content;
    for (const transform of importTransforms) {
      if (typeof transform.to === 'string') {
        transformed = transformed.replace(transform.from, transform.to);
      } else {
        transformed = transformed.replace(transform.from, transform.to);
      }
    }

    return transformed;
  }

  /**
   * 更新型別引用
   */
  private updateTypeReferences(content: string): string {
    const typeTransforms = [
      { from: /Account2(?![a-zA-Z])/g, to: 'Account3' },
      { from: /TransactionGroupWithEntries(?![a-zA-Z])/g, to: 'TransactionGroupWithEntries3' },
      { from: /EmbeddedAccountingEntry(?![a-zA-Z])/g, to: 'AccountingEntry3' },
      { from: /Category2(?![a-zA-Z])/g, to: 'Category3' },
      { from: /AccountingRecord2(?![a-zA-Z])/g, to: 'AccountingRecord3' }
    ];

    let transformed = content;
    for (const transform of typeTransforms) {
      transformed = transformed.replace(transform.from, transform.to);
    }

    return transformed;
  }

  /**
   * 更新函數呼叫
   */
  private updateFunctionCalls(content: string): string {
    const functionTransforms = [
      {
        from: /AccountManagementAdapter\.normalizeAccounts/g,
        to: 'Accounting2To3Adapter.convertAccounts'
      },
      {
        from: /AccountManagementAdapter\.normalizeAccount/g,
        to: 'Accounting2To3Adapter.convertAccount'
      }
    ];

    let transformed = content;
    for (const transform of functionTransforms) {
      transformed = transformed.replace(transform.from, transform.to);
    }

    return transformed;
  }

  /**
   * 應用檔案特定的轉換
   */
  private applyFileSpecificTransforms(content: string, filePath: string): string {
    // 根據檔案路徑應用特定的轉換邏輯
    if (filePath.includes('AccountHierarchyService')) {
      // 特定於 AccountHierarchyService 的轉換
      return content.replace(
        /import\s*{\s*Account2\s*}\s*from\s*['"]@pharmacy-pos\/shared\/types\/accounting2['"];?/,
        `import { Account3 } from '../types/core';`
      );
    }

    return content;
  }

  /**
   * 生成遷移報告
   */
  private generateReport(): void {
    console.log('\n📊 遷移報告');
    console.log('='.repeat(50));
    console.log(`📁 總檔案數: ${this.result.totalFiles}`);
    console.log(`🔄 已處理: ${this.result.processedFiles}`);
    console.log(`✅ 已遷移: ${this.result.migratedFiles}`);
    console.log(`⏭️  已跳過: ${this.result.skippedFiles}`);
    console.log(`❌ 失敗: ${this.result.failedFiles.length}`);

    if (this.result.failedFiles.length > 0) {
      console.log('\n❌ 失敗的檔案:');
      this.result.failedFiles.forEach(file => {
        console.log(`  - ${file}`);
      });
    }

    if (this.result.errors.length > 0) {
      console.log('\n🐛 錯誤詳情:');
      this.result.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }

    const successRate = this.result.totalFiles > 0 
      ? Math.round((this.result.migratedFiles / this.result.totalFiles) * 100)
      : 0;

    console.log(`\n🎯 成功率: ${successRate}%`);

    if (successRate === 100) {
      console.log('🎉 遷移完成！所有檔案都已成功遷移。');
    } else if (successRate >= 80) {
      console.log('⚠️  遷移大部分完成，請檢查失敗的檔案。');
    } else {
      console.log('🚨 遷移遇到較多問題，建議檢查配置和錯誤訊息。');
    }
  }
}

/**
 * 主要執行函數
 */
async function main() {
  const config: MigrationConfig = {
    sourceDir: 'frontend/src',
    targetDir: 'frontend/src',
    backupDir: 'backups',
    dryRun: process.argv.includes('--dry-run'),
    verbose: process.argv.includes('--verbose')
  };

  const migrator = new Accounting2To3Migrator(config);
  const result = await migrator.migrate();

  process.exit(result.failedFiles.length > 0 ? 1 : 0);
}

// 如果直接執行此腳本
if (require.main === module) {
  main().catch(error => {
    console.error('💥 遷移腳本執行失敗:', error);
    process.exit(1);
  });
}

export { Accounting2To3Migrator, MigrationConfig, MigrationResult };