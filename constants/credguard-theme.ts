export const CredGuardColors = {
  background: '#F7F6F2',
  primary: '#1A3A2A',
  active: '#2D7A4F',
  lightAccentSurface: '#E8F5EE',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  warningBackground: '#FEF3E0',
  warningText: '#7A4A00',
  dangerBackground: '#FDECEA',
  dangerText: '#7A1A1A',
  cardBackground: '#FFFFFF',
  cardBorder: 'rgba(0,0,0,0.08)',
  pendingBackground: '#F0F0F0',
  pendingText: '#606060',
  mutedLine: 'rgba(0,0,0,0.06)',
  mintText: '#D3F2E1',
};

export const CredGuardTypography = {
  body: 'DM Sans',
  heading: 'DM Serif Display',
  headingFallback: 'Playfair Display',
  mono: 'monospace',
};

export const commonCardStyle = {
  borderRadius: 14,
  borderWidth: 0.5,
  borderColor: CredGuardColors.cardBorder,
  backgroundColor: CredGuardColors.cardBackground,
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 2,
  elevation: 1,
} as const;
