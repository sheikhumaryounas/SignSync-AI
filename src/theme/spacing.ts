// One spacing scale for the whole app: 4 / 8 / 12 / 16, screen gutter 16.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const radius = {
  sm: 10,
  md: 13,
  lg: 16,
  xl: 22,
  pill: 999,
};

// boxShadow strings (React Native 0.76+), matching the blueprint's card shadows.
export const shadow = {
  card: '0px 1px 2px rgba(0, 35, 88, 0.06), 0px 4px 14px rgba(0, 35, 88, 0.06)',
  raised: '0px 10px 24px -12px rgba(0, 35, 88, 0.25)',
  fab: '0px 10px 22px -8px rgba(0, 124, 136, 0.6)',
  bar: '0px -1px 0px #E3E9F2, 0px -6px 18px rgba(0, 35, 88, 0.05)',
};

// Minimum touch target (WCAG 2.5.5 / Android guidance).
export const touchTarget = 44;
