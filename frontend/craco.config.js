const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // 配置模組解析
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
        modules: [
          path.resolve(__dirname, 'src'),
          'node_modules'
        ],
        alias: {
          ...webpackConfig.resolve.alias,
          '@': path.resolve(__dirname, 'src'),
        }
      };

      // 配置 TypeScript 和 JavaScript 檔案的處理
      const tsRule = webpackConfig.module.rules.find(rule => 
        rule.test && rule.test.toString().includes('tsx')
      );
      
      if (tsRule) {
        // 確保 TypeScript loader 能處理 .js 檔案中的 TypeScript 引用
        tsRule.test = /\.(js|mjs|jsx|ts|tsx)$/;
        tsRule.include = path.resolve(__dirname, 'src');
      }

      // 添加對混合 JS/TS 專案的支援
      webpackConfig.module.rules.push({
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false, // 允許不完整的模組說明符
        },
      });

      return webpackConfig;
    },
  },
  // 開發伺服器配置
  devServer: {
    port: 3000,
    open: true,
    hot: true,
  },
  // TypeScript 配置
  typescript: {
    enableTypeChecking: true,
  },
};