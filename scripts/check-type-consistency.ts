#!/usr/bin/env ts-node

/**
 * 型別一致性檢查腳本
 * 確保前後端型別定義保持同步
 */

import * as fs from 'fs';
import * as path from 'path';

interface TypeCheckResult {
  isConsistent: boolean;
  errors: string[];
  warnings: string[];
}

class TypeConsistencyChecker {
  private errors: string[] = [];
  private warnings: string[] = [];

  /**
   * 檢查檔案是否存在
   */
  private checkFileExists(filePath: string): boolean {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      this.errors.push(`檔案不存在: ${filePath}`);
      return false;
    }
    return true;
  }

  /**
   * 檢查重複型別定義
   */
  private checkDuplicateTypes(): void {
    const sharedAccountingPath = 'shared/types/accounting.ts';
    const frontendAccountingPath = 'frontend/src/types/accounting.ts';

    if (fs.existsSync(frontendAccountingPath)) {
      this.errors.push(
        `發現重複的型別檔案: ${frontendAccountingPath}\n` +
        `請刪除此檔案，統一使用 ${sharedAccountingPath}`
      );
    }
  }

  /**
   * 檢查匯入路徑
   */
  private checkImportPaths(): void {
    const filesToCheck = [
      'frontend/src/services/accountingService.ts',
      'frontend/src/hooks/useAccountingData.ts',
      'frontend/src/components/accounting/AccountingDataGrid.tsx'
    ];

    filesToCheck.forEach(filePath => {
      if (this.checkFileExists(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // 檢查是否使用了舊的匯入路徑
        if (content.includes("from '../types/accounting'") || 
            content.includes("from './types/accounting'")) {
          this.errors.push(
            `${filePath} 使用了舊的匯入路徑，請更新為 '@pharmacy-pos/shared/types/accounting'`
          );
        }

        // 檢查是否正確使用 shared 型別
        if (content.includes('AccountingItem') && 
            !content.includes('@pharmacy-pos/shared/types')) {
          this.warnings.push(
            `${filePath} 可能需要更新匯入路徑以使用 shared 型別`
          );
        }
      }
    });
  }

  /**
   * 檢查 backend 型別使用
   */
  private checkBackendTypeUsage(): void {
    const backendModelsPath = 'backend/src/types/models.ts';
    
    if (this.checkFileExists(backendModelsPath)) {
      const content = fs.readFileSync(backendModelsPath, 'utf-8');
      
      if (!content.includes('@pharmacy-pos/shared/types')) {
        this.warnings.push(
          `${backendModelsPath} 尚未完全整合 shared 型別，建議進一步統一`
        );
      }
    }
  }

  /**
   * 檢查型別轉換工具
   */
  private checkTypeConverters(): void {
    const converterPath = 'shared/utils/accountingTypeConverters.ts';
    
    if (!this.checkFileExists(converterPath)) {
      this.errors.push(`型別轉換工具不存在: ${converterPath}`);
      return;
    }

    const content = fs.readFileSync(converterPath, 'utf-8');
    
    // 檢查必要的轉換函數
    const requiredFunctions = [
      'toBackendAccountingItem',
      'toFrontendAccountingItem',
      'validateAccountingItem'
    ];

    requiredFunctions.forEach(funcName => {
      if (!content.includes(`export const ${funcName}`)) {
        this.errors.push(`型別轉換工具缺少函數: ${funcName}`);
      }
    });
  }

  /**
   * 檢查 package.json 依賴
   */
  private checkDependencies(): void {
    const backendPackagePath = 'backend/package.json';
    const frontendPackagePath = 'frontend/package.json';

    [backendPackagePath, frontendPackagePath].forEach(packagePath => {
      if (this.checkFileExists(packagePath)) {
        const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
        const deps = { ...packageContent.dependencies, ...packageContent.devDependencies };
        
        if (!deps['@pharmacy-pos/shared']) {
          this.warnings.push(
            `${packagePath} 缺少 @pharmacy-pos/shared 依賴`
          );
        }
      }
    });
  }

  /**
   * 執行所有檢查
   */
  public runAllChecks(): TypeCheckResult {
    console.log('🔍 開始檢查型別一致性...\n');

    this.checkDuplicateTypes();
    this.checkImportPaths();
    this.checkBackendTypeUsage();
    this.checkTypeConverters();
    this.checkDependencies();

    const isConsistent = this.errors.length === 0;

    return {
      isConsistent,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  /**
   * 輸出檢查結果
   */
  public printResults(result: TypeCheckResult): void {
    if (result.isConsistent) {
      console.log('✅ 型別一致性檢查通過！');
    } else {
      console.log('❌ 發現型別一致性問題：');
      result.errors.forEach(error => {
        console.log(`   • ${error}`);
      });
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️  警告：');
      result.warnings.forEach(warning => {
        console.log(`   • ${warning}`);
      });
    }

    console.log(`\n📊 檢查結果: ${result.errors.length} 個錯誤, ${result.warnings.length} 個警告`);
  }
}

// 執行檢查
if (require.main === module) {
  const checker = new TypeConsistencyChecker();
  const result = checker.runAllChecks();
  checker.printResults(result);
  
  // 如果有錯誤，退出碼為 1
  process.exit(result.isConsistent ? 0 : 1);
}

export { TypeConsistencyChecker };