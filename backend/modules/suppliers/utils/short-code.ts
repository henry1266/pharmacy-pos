import { normalizeString } from './strings';

export function pickShortCode(name?: string, code?: string, shortCode?: string): string | undefined {
  const normalizedShortCode = normalizeString(shortCode);
  if (normalizedShortCode) {
    return normalizedShortCode.toUpperCase();
  }

  const normalizedCode = normalizeString(code);
  if (normalizedCode) {
    return normalizedCode.toUpperCase();
  }

  const normalizedName = normalizeString(name);
  if (normalizedName) {
    return normalizedName.slice(0, 8).toUpperCase();
  }

  return undefined;
}
