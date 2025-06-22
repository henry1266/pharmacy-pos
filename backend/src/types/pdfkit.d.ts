declare module 'pdfkit' {
  import { Readable } from 'stream';

  interface PDFDocumentOptions {
    size?: string | [number, number];
    margin?: number | { top?: number; left?: number; bottom?: number; right?: number };
    bufferPages?: boolean;
    autoFirstPage?: boolean;
    layout?: 'portrait' | 'landscape';
    info?: {
      Title?: string;
      Author?: string;
      Subject?: string;
      Keywords?: string;
      CreationDate?: Date;
      ModDate?: Date;
    };
    pdfVersion?: string;
    compress?: boolean;
    userPassword?: string;
    ownerPassword?: string;
    permissions?: {
      printing?: string;
      modifying?: boolean;
      copying?: boolean;
      annotating?: boolean;
      fillingForms?: boolean;
      contentAccessibility?: boolean;
      documentAssembly?: boolean;
    };
  }

  class PDFDocument {
    constructor(options?: PDFDocumentOptions);
    
    // 頁面管理
    addPage(options?: PDFDocumentOptions): this;
    bufferedPageRange(): { start: number; count: number };
    switchToPage(pageNumber: number): this;
    flushPages(): this;
    end(): this;
    
    // 流操作
    pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean }): T;
    
    // 繪圖操作
    save(): this;
    restore(): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    stroke(): this;
    fill(color?: string): this;
    fillAndStroke(fillColor?: string, strokeColor?: string): this;
    
    // 形狀繪製
    rect(x: number, y: number, width: number, height: number): this;
    roundedRect(x: number, y: number, width: number, height: number, radius: number): this;
    circle(x: number, y: number, radius: number): this;
    
    // 文字操作
    font(font: string): this;
    fontSize(size: number): this;
    text(text: string, x?: number, y?: number, options?: {
      align?: 'left' | 'center' | 'right' | 'justify';
      width?: number;
      height?: number;
      continued?: boolean;
      indent?: number;
      paragraphGap?: number;
      lineGap?: number;
      columns?: number;
      columnGap?: number;
      wordSpacing?: number;
      characterSpacing?: number;
      fill?: boolean;
      stroke?: boolean;
      underline?: boolean;
      link?: string;
      goTo?: string;
      destination?: string;
    }): this;
    
    // 位置操作
    moveDown(lines?: number): this;
    moveUp(lines?: number): this;
    
    // 圖片操作
    image(src: string | Buffer, x?: number, y?: number, options?: {
      width?: number;
      height?: number;
      scale?: number;
      fit?: [number, number];
      align?: 'left' | 'center' | 'right';
      valign?: 'top' | 'center' | 'bottom';
    }): this;
    
    // 字體操作
    registerFont(name: string, src: string | Buffer, family?: string): this;
    
    // 線條樣式
    lineWidth(width: number): this;
    lineCap(cap: string): this;
    lineJoin(join: string): this;
    strokeColor(color: string): this;
    fillColor(color: string): this;
    
    // 頁面屬性
    page: {
      width: number;
      height: number;
      margins?: {
        top: number;
        left: number;
        bottom: number;
        right: number;
      };
    };
    
    // 當前位置
    y: number;
    x: number;
  }

  export default PDFDocument;
}