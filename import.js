// generate-import-usage.js
const madge = require('madge');
const fs = require('fs');
const path = require('path');

const ENTRY_DIR = path.join(__dirname, 'frontend/src/components'); // 修改為你的 src 目錄

madge(ENTRY_DIR, {
    fileExtensions: ['js', 'jsx', 'ts', 'tsx'],
    includeNpm: false
  })
    .then((res) => res.obj())
    .then((dependencyGraph) => {
      // 建立反向依賴圖
      const inverseDeps = {};
  
      for (const [file, deps] of Object.entries(dependencyGraph)) {
        deps.forEach((dep) => {
          if (!inverseDeps[dep]) {
            inverseDeps[dep] = [];
          }
          inverseDeps[dep].push(file);
        });
      }
  
      const lines = [];
  
      Object.keys(inverseDeps).forEach((file) => {
        const importers = inverseDeps[file];
        lines.push(`📄 ${file} 被以下檔案引用:`);
        importers.forEach((i) => lines.push(`   └── ${i}`));
        lines.push('');
      });
  
      const output = lines.join('\n');
      fs.writeFileSync('開發指南/component-usage-report.txt', output, 'utf8');
      console.log('✅ 元件引用清單已儲存為 component-usage-report.txt');
    })
    .catch((err) => {
      console.error('❌ 發生錯誤：', err);
    });