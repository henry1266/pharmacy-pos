/**
 * Markdown 工具函數
 */

/**
 * 將文字中的換行符號轉換為 Markdown 的硬換行
 * @param text 原始文字
 * @returns 處理後的文字
 */
export const convertNewlinesToMarkdown = (text: string): string => {
  if (!text) return text;
  
  // 將單純的換行符號轉換為 Markdown 的硬換行（兩個空格 + 換行）
  // 但要避免重複處理已經是硬換行的情況
  return text
    .replace(/(?<!  )\n(?!\n)/g, '  \n') // 單個換行前加兩個空格（如果前面沒有兩個空格的話）
    .replace(/\n\n/g, '\n\n'); // 保持段落分隔（雙換行）不變
};

/**
 * 將 Markdown 硬換行轉換回普通換行（用於編輯時）
 * @param text Markdown 文字
 * @returns 處理後的文字
 */
export const convertMarkdownToNewlines = (text: string): string => {
  if (!text) return text;
  
  // 將 Markdown 硬換行轉換回普通換行
  return text.replace(/  \n/g, '\n');
};

/**
 * 處理超連結，使其使用粗斜體樣式
 * @param text 包含超連結的文字
 * @returns 處理後的文字
 */
export const processLinksForDisplay = (text: string): string => {
  if (!text) return text;
  
  // 處理 Markdown 格式的超連結 [文字](URL)
  // 將其轉換為粗斜體樣式的 Markdown 語法
  return text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '***[$1]($2)***'
  );
};

/**
 * 為顯示準備 Markdown 文字（確保換行正確顯示並處理超連結）
 * @param text 原始文字
 * @returns 準備好顯示的 Markdown 文字
 */
export const prepareMarkdownForDisplay = (text: string): string => {
  if (!text) return text;
  
  // 先處理換行，再處理超連結
  let processedText = convertNewlinesToMarkdown(text);
  processedText = processLinksForDisplay(processedText);
  
  return processedText;
};