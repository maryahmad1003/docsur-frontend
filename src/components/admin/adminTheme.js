export const adminPalette = {
  primary: '#16A34A',
  primarySoft: '#0ED2A0',
  info: '#38BDF8',
  warning: '#FBBF24',
  violet: '#A78BFA',
  danger: '#F87171',
  text: '#111827',
  textMuted: '#6B7280',
  textSubtle: '#9CA3AF',
  border: '#E5E7EB',
  borderSoft: '#D1FAE5',
  surface: '#FFFFFF',
  surfaceAlt: '#F9FAFB',
  surfaceSoft: '#F0FDF4',
  overlay: 'rgba(15, 23, 42, 0.58)',
};

export const adminTitleStyle = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 26,
  fontWeight: 800,
  color: adminPalette.text,
  letterSpacing: '-0.5px',
};

export const adminSubStyle = {
  fontSize: 13,
  color: adminPalette.textMuted,
  marginTop: 4,
};

export const adminPrimaryButton = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '11px 20px',
  borderRadius: 10,
  background: 'linear-gradient(135deg, #16A34A, #0ED2A0)',
  color: '#fff',
  fontSize: 14,
  fontWeight: 700,
  fontFamily: "'Outfit', sans-serif",
  border: 'none',
  cursor: 'pointer',
  boxShadow: '0 10px 24px rgba(22, 163, 74, 0.18)',
  transition: 'all 0.2s ease',
};

export const adminSecondaryButton = {
  padding: '11px 20px',
  borderRadius: 10,
  border: `1px solid ${adminPalette.border}`,
  background: adminPalette.surfaceAlt,
  color: adminPalette.textMuted,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

export const adminDangerButton = {
  padding: '11px 20px',
  borderRadius: 10,
  border: 'none',
  background: 'linear-gradient(135deg, #EF4444, #DC2626)',
  color: '#fff',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 10px 24px rgba(239, 68, 68, 0.18)',
};

export const adminRefreshButton = {
  width: 40,
  height: 40,
  borderRadius: 10,
  border: `1px solid ${adminPalette.border}`,
  background: adminPalette.surface,
  color: adminPalette.textMuted,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)',
};

export const adminSearchWrap = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  background: adminPalette.surface,
  border: `1px solid ${adminPalette.border}`,
  borderRadius: 12,
  padding: '11px 16px',
  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)',
};

export const adminSearchInput = {
  flex: 1,
  background: 'none',
  border: 'none',
  outline: 'none',
  fontSize: 14,
  color: adminPalette.text,
};

export const adminCard = {
  background: adminPalette.surface,
  border: `1px solid ${adminPalette.border}`,
  borderRadius: 20,
  boxShadow: '0 14px 32px rgba(15, 23, 42, 0.05)',
};

export const adminTableCard = {
  ...adminCard,
  overflow: 'hidden',
};

export const adminTableHead = {
  padding: '14px 16px',
  fontSize: 11,
  fontWeight: 700,
  color: adminPalette.textMuted,
  textTransform: 'uppercase',
  letterSpacing: '0.7px',
  borderBottom: `1px solid ${adminPalette.border}`,
  background: '#F8FAFC',
  textAlign: 'left',
};

export const adminTableCell = {
  padding: '14px 16px',
  fontSize: 14,
  color: adminPalette.text,
  borderBottom: '1px solid #F1F5F9',
};

export const adminEmptyState = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '72px 20px',
  color: adminPalette.textMuted,
};

export const adminSpinner = {
  width: 36,
  height: 36,
  border: '3px solid #DCFCE7',
  borderTopColor: adminPalette.primary,
  borderRadius: '50%',
  animation: 'spin 0.8s linear infinite',
};

export const adminOverlay = {
  position: 'fixed',
  inset: 0,
  background: adminPalette.overlay,
  backdropFilter: 'blur(6px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 24,
};

export const adminModalBox = {
  background: adminPalette.surface,
  border: `1px solid ${adminPalette.border}`,
  borderRadius: 22,
  padding: '30px 34px',
  width: '100%',
  maxWidth: 560,
  maxHeight: '88vh',
  overflowY: 'auto',
  boxShadow: '0 30px 80px rgba(15, 23, 42, 0.22)',
};

export const adminModalHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 24,
};

export const adminModalTitle = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 20,
  fontWeight: 800,
  color: adminPalette.text,
};

export const adminCloseButton = {
  width: 32,
  height: 32,
  borderRadius: 8,
  border: `1px solid ${adminPalette.border}`,
  background: adminPalette.surfaceAlt,
  color: adminPalette.textMuted,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

export const adminLabel = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: adminPalette.textMuted,
  textTransform: 'uppercase',
  letterSpacing: '0.8px',
  marginBottom: 8,
};

export const adminInput = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: `1.5px solid ${adminPalette.border}`,
  background: adminPalette.surfaceAlt,
  fontSize: 14,
  color: adminPalette.text,
  outline: 'none',
  transition: 'all 0.2s ease',
};

export const adminSectionPanel = {
  ...adminCard,
  padding: '24px 26px',
};

export const adminChartPanel = {
  ...adminCard,
  padding: '20px 22px',
};

export const makeSoftBadge = (color) => ({
  display: 'inline-block',
  padding: '3px 10px',
  borderRadius: 20,
  fontSize: 11,
  fontWeight: 700,
  border: `1px solid ${color}33`,
  background: `${color}12`,
  color,
});

export const makeIconButton = (color) => ({
  width: 32,
  height: 32,
  borderRadius: 9,
  border: `1px solid ${color}2A`,
  background: `${color}12`,
  color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
});

export const makeFilterTab = (active, color = adminPalette.primary) => ({
  padding: '8px 13px',
  borderRadius: 10,
  border: `1px solid ${active ? `${color}40` : adminPalette.border}`,
  background: active ? `${color}12` : adminPalette.surface,
  color: active ? color : adminPalette.textMuted,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: 5,
});
