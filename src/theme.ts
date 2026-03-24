// src/theme.ts
export const Colors = {
  sun: '#C2698A',        // dusty rose — main accent (buttons, bars)
  sunLight: '#D98FAD',   // medium rose
  sunLighter: '#FAE8F1', // pale blush — pill backgrounds
  sunDark: '#A34E6F',    // deep rose — pressed / active
  yolk: '#E8B4CC',       // baby pink (was yellow)
  cream: '#FDF5F9',      // near-white with blush tint — page backgrounds
  warm: '#F8EEF4',       // soft pink warm — thumbnail backgrounds
  card: '#FFFFFF',
  border: '#F0C6DA',     // soft rose border
  text: '#2D1020',       // very dark plum (was dark brown)
  text2: '#7A3558',      // medium mauve
  text3: '#BA8FA4',      // light dusty mauve
  green: '#4CAF50',
  greenLight: '#E8F5E9',
  greenDark: '#2E7D32',
  blue: '#1565C0',
  blueLight: '#E3F2FD',
  red: '#D32F2F',
  pink: '#FCE4EC',
  purple: '#F3E5F5',
  white: '#FFFFFF',
};

export const Fonts = {
  dybbuk: 'Dybbuk-Regular',   // recipe titles
  gan: 'Gan',                 // main app font everywhere
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
    shadowColor: '#2D1B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#2D1B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
};
