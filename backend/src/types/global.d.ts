// 全域型別聲明檔案

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT?: string;
      MONGODB_URI?: string;
      JWT_SECRET?: string;
      JWT_EXPIRE?: string;
    }
  }
}

// CSV Parser 型別定義 (因為 @types/csv-parser 不存在)
declare module 'csv-parser' {
  import { Transform } from 'stream';
  
  interface Options {
    separator?: string;
    quote?: string;
    escape?: string;
    newline?: string;
    headers?: boolean | string[];
    skipEmptyLines?: boolean;
    skipLinesWithError?: boolean;
    maxRowBytes?: number;
    strict?: boolean;
  }
  
  function csvParser(options?: Options): Transform;
  export = csvParser;
}

// PDFKit 型別擴展
declare module 'pdfkit' {
  interface PDFDocument {
    addPage(options?: any): PDFDocument;
    text(text: string, x?: number, y?: number, options?: any): PDFDocument;
    fontSize(size: number): PDFDocument;
    font(font: string): PDFDocument;
    fillColor(color: string): PDFDocument;
    rect(x: number, y: number, width: number, height: number): PDFDocument;
    stroke(): PDFDocument;
    fill(): PDFDocument;
    end(): void;
  }
}

// Express Request 擴展
declare namespace Express {
  interface Request {
    user?: {
      id: string;
      username: string;
      role: string;
      isAdmin?: boolean;
    };
    file?: Multer.File;
    files?: Multer.File[] | { [fieldname: string]: Multer.File[] };
  }
}

export {};