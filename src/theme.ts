// src/theme.ts
export const Colors = {
  sun: '#df7b3e',        // orange — main accent (buttons, bars)
  sunLight: '#e8965e',   // medium orange
  sunLighter: '#faeee3', // pale orange — pill backgrounds
  sunDark: '#c4622a',    // deep orange — pressed / active
  yolk: '#f5c49a',       // warm peach — logo accent
  cream: '#fdfbf7',      // near-white — page backgrounds
  warm: '#f5ede3',       // soft warm — thumbnail backgrounds
  card: '#FFFFFF',
  border: '#e8ddd5',     // warm light border
  text: '#36312d',       // dark brown
  text2: '#7a6b62',      // medium warm brown
  text3: '#b0a49d',      // light warm brown
  mauve: '#9b4a6a',      // mauve — dietary tags, highlights
  mauveLight: '#f0dde6', // light mauve
  green: '#4CAF50',
  greenLight: '#E8F5E9',
  greenDark: '#2E7D32',
  blue: '#18727d',       // teal — secondary accent
  blueLight: '#d0eaec',  // light teal
  red: '#D32F2F',
  pink: '#f0dde6',       // light mauve
  purple: '#faeee3',     // light orange
  white: '#FFFFFF',
};

export const Fonts = {
  dybbuk: 'Dybbuk-Regular',   // recipe titles (Hebrew)
  gan: 'Gan',                 // main app font (Hebrew)
  chewy: 'Chewy',             // main app font (English)
  grandRainbow: 'GrandRainbow', // recipe template (English)
  scripto: 'Scripto',         // main page header (English)
  system: undefined as string | undefined,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 50,
};

export const Shadow = {
  sm: {
    shadowColor: '#36312d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#36312d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
};
