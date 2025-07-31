// Mock for @material/material-color-utilities
module.exports = {
  argbFromHex: jest.fn(() => 0xff000000),
  hexFromArgb: jest.fn(() => '#000000'),
  CorePalette: {
    of: jest.fn(() => ({
      primary: { tone: jest.fn(() => 0xff000000) },
      secondary: { tone: jest.fn(() => 0xff000000) },
      tertiary: { tone: jest.fn(() => 0xff000000) },
      neutral: { tone: jest.fn(() => 0xff000000) },
      neutralVariant: { tone: jest.fn(() => 0xff000000) },
      error: { tone: jest.fn(() => 0xff000000) }
    }))
  },
  TonalPalette: {
    fromInt: jest.fn(() => ({
      tone: jest.fn(() => 0xff000000)
    }))
  },
  Scheme: {
    light: jest.fn(() => ({})),
    dark: jest.fn(() => ({}))
  }
};