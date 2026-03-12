// ─────────────────────────────────────────────────────
// Design Tokens — Premium Minimalist
// ─────────────────────────────────────────────────────

export const C = {
  // Backgrounds
  bg:        '#0D0F1C',   // main app bg — deep navy-black
  surface:   '#161929',   // card bg
  surface2:  '#1E2240',   // elevated (modals, inputs)

  // Accent — single premium indigo
  accent:    '#6366F1',
  accentDim: 'rgba(99,102,241,0.14)',

  // Status
  success:    '#22C55E',
  successDim: 'rgba(34,197,94,0.12)',
  warning:    '#FBBF24',
  warningDim: 'rgba(251,191,36,0.12)',
  danger:     '#F87171',
  dangerDim:  'rgba(248,113,113,0.12)',

  // Text
  text:    '#FFFFFF',
  textMed: 'rgba(255,255,255,0.55)',
  textLow: 'rgba(255,255,255,0.28)',

  // Borders
  border:      'rgba(255,255,255,0.07)',
  borderStrong:'rgba(255,255,255,0.15)',

  // Gradients (only for primary CTAs)
  grad:        ['#5855F4', '#7C79F7'] as const,
  gradSuccess: ['#16A34A', '#22C55E'] as const,
  gradDanger:  ['#9B1C1C', '#DC2626'] as const,
  gradAmber:   ['#B45309', '#FBBF24'] as const,
};

export const R = 16;   // base border radius
export const R_SM = 10;
export const R_LG = 24;

export const shadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 16,
  elevation: 8,
};

export const shadowSm = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 4,
};
