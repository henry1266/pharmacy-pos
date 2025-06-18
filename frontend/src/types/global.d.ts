/**
 * 全域型別聲明檔案
 * 此檔案包含專案中使用的全域型別定義
 */

// 擴展Window物件
interface Window {
  // 添加全域變數
  __REDUX_DEVTOOLS_EXTENSION__?: any;
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: any;
}

// 全域命名空間
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    REACT_APP_API_URL: string;
    // 添加其他環境變數
  }
}

// 聲明模組
declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.json' {
  const content: any;
  export default content;
}

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// 添加其他全域型別定義