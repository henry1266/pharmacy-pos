const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // 禁用 ModuleScopePlugin 以允許匯入 src 目錄外的檔案
      webpackConfig.resolve.plugins = webpackConfig.resolve.plugins.filter(
        plugin => plugin.constructor.name !== 'ModuleScopePlugin'
      );

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
          '@components': path.resolve(__dirname, 'src/components'),
          '@pages': path.resolve(__dirname, 'src/pages'),
          '@services': path.resolve(__dirname, 'src/services'),
          '@utils': path.resolve(__dirname, 'src/utils'),
          '@types': path.resolve(__dirname, 'src/types'),
          '@redux': path.resolve(__dirname, 'src/redux'),
          '@accounting2': path.resolve(__dirname, 'src/modules/accounting2'),
          '@accounting2/components': path.resolve(__dirname, 'src/modules/accounting2/components'),
          '@accounting2/pages': path.resolve(__dirname, 'src/modules/accounting2/components/pages'),
          '@accounting2/features': path.resolve(__dirname, 'src/modules/accounting2/components/features'),
          '@accounting2/ui': path.resolve(__dirname, 'src/modules/accounting2/components/ui'),
          '@accounting2/core': path.resolve(__dirname, 'src/modules/accounting2/core'),
          '@accounting2/types': path.resolve(__dirname, 'src/modules/accounting2/types'),
          '@accounting2/utils': path.resolve(__dirname, 'src/modules/accounting2/utils'),
          '@pharmacy-pos/shared': path.resolve(__dirname, '../shared')
        }
      };

      // 配置 TypeScript 和 JavaScript 檔案的處理
      const tsRule = webpackConfig.module.rules.find(rule =>
        rule.test && rule.test.toString().includes('tsx')
      );
      
      if (tsRule) {
        // 確保 TypeScript loader 能處理 .js 檔案中的 TypeScript 引用
        tsRule.test = /\.(js|mjs|jsx|ts|tsx)$/;
        tsRule.include = [
          path.resolve(__dirname, 'src'),
          path.resolve(__dirname, '../shared')
        ];
      }

      // 添加 Babel loader 來處理 shared 目錄中的 TypeScript 文件
      webpackConfig.module.rules.push({
        test: /\.(ts|tsx)$/,
        include: [
          path.resolve(__dirname, '../shared')
        ],
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    browsers: ['last 2 versions', 'ie >= 11']
                  }
                }],
                ['@babel/preset-react', {
                  runtime: 'automatic'
                }],
                '@babel/preset-typescript'
              ]
            }
          }
        ]
      });

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