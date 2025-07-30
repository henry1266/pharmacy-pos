/**
 * Markdown 工具函數
 */

import axios from 'axios';

// 連結快取，避免重複請求
const linkCache = new Map<string, { displayText: string; url: string }>();

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
 * 根據 displayText 獲取連結資訊
 * @param displayText 顯示文字
 * @returns 連結資訊或 null
 */
const getLinkByDisplayText = async (displayText: string): Promise<{ displayText: string; url: string } | null> => {
  // 檢查快取
  if (linkCache.has(displayText)) {
    return linkCache.get(displayText)!;
  }

  try {
    const response = await axios.get('/api/link-references', {
      params: {
        search: displayText,
        exact: true // 精確匹配
      }
    });

    if (response.data.success && response.data.data.links.length > 0) {
      const link = response.data.data.links.find((l: any) => l.displayText === displayText);
      if (link) {
        const linkInfo = { displayText: link.displayText, url: link.url };
        linkCache.set(displayText, linkInfo);
        return linkInfo;
      }
    }
  } catch (error) {
    console.error('獲取連結資訊失敗:', error);
  }

  return null;
};

/**
 * 處理連結引用，將 {{linkRef:displayText}} 轉換為實際連結
 * @param text 包含連結引用的文字
 * @returns 處理後的文字（Promise）
 */
export const processLinkReferences = async (text: string): Promise<string> => {
  if (!text) return text;

  // 找到所有連結引用
  const linkRefPattern = /\{\{linkRef:([^}]+)\}\}/g;
  const matches = Array.from(text.matchAll(linkRefPattern));

  if (matches.length === 0) {
    return text;
  }

  let processedText = text;

  // 處理每個連結引用
  for (const match of matches) {
    const [fullMatch, displayText] = match;
    const linkInfo = await getLinkByDisplayText(displayText);

    if (linkInfo) {
      // 替換為 Markdown 連結格式
      const markdownLink = `[${linkInfo.displayText}](${linkInfo.url})`;
      processedText = processedText.replace(fullMatch, markdownLink);
    } else {
      // 如果找不到連結，保持原樣或顯示錯誤
      processedText = processedText.replace(fullMatch, `[${displayText}](#連結不存在)`);
    }
  }

  return processedText;
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
 * @returns 準備好顯示的 Markdown 文字（Promise）
 */
export const prepareMarkdownForDisplay = async (text: string): Promise<string> => {
  if (!text) return text;
  
  // 先處理換行
  let processedText = convertNewlinesToMarkdown(text);
  
  // 處理連結引用
  processedText = await processLinkReferences(processedText);
  
  // 最後處理超連結樣式
  processedText = processLinksForDisplay(processedText);
  
  return processedText;
};

/**
 * 同步版本的顯示準備函數（不處理連結引用）
 * @param text 原始文字
 * @returns 準備好顯示的 Markdown 文字
 */
export const prepareMarkdownForDisplaySync = (text: string): string => {
  if (!text) return text;
  
  // 先處理換行，再處理超連結
  let processedText = convertNewlinesToMarkdown(text);
  processedText = processLinksForDisplay(processedText);
  
  return processedText;
};