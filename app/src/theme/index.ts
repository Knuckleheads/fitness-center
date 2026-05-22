export const colors = {
  // Neutrals — warm off-white base (from design)
  bg: '#f4f2ee',
  surface: '#ffffff',
  surface2: '#f7f5f1',
  surface3: '#ebe8e1',
  ink: '#0e0e0c',
  ink2: '#3a3a36',
  ink3: '#7a7872',
  ink4: '#b4b1a8',
  line: '#e4e1d8',
  line2: '#d4d0c5',

  // Accent — electric lime/chartreuse
  accent: '#d1ff3a',
  accentInk: '#0e0e0c',
  accentDark: '#a8d400',

  // Semantic
  danger: '#e14d3c',
  ok: '#3a7a4a',

  // Aliases for backward compat
  paper: '#f4f2ee',
  paperCard: '#ffffff',
  paperAlt: '#ebe8e1',
  dark: '#0e0e0c',
  darkMid: '#3a3a36',
  ink3_: '#7a7872',
  accentSoft: '#eaffa0',
  success: '#3a7a4a',
  warning: '#d1ff3a',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const typography = {
  display: { fontFamily: 'System', fontWeight: '500' as const, letterSpacing: 0 },
  h1: { fontSize: 28, fontWeight: '500' as const, color: colors.ink, letterSpacing: 0 },
  h2: { fontSize: 22, fontWeight: '500' as const, color: colors.ink, letterSpacing: 0 },
  h3: { fontSize: 17, fontWeight: '600' as const, color: colors.ink },
  body: { fontSize: 14, color: colors.ink },
  sub: { fontSize: 12, color: colors.ink3 },
  mono: { fontSize: 11, color: colors.ink3, letterSpacing: 0.8 },
  eyebrow: { fontSize: 10, color: colors.ink3, letterSpacing: 1.2, textTransform: 'uppercase' as const },
};

export const shadow = {
  sm: {
    shadowColor: '#0e0e0c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0e0e0c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
};
