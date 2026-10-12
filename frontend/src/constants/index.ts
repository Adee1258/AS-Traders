import { Platform } from 'react-native';
import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';

// ── Production API URL ─────────────────────────────────────────────────────
const PRODUCTION_API_URL = 'https://as-traders-blue.vercel.app/api';

export const API_BASE_URL = __DEV__
  ? Platform.OS === 'web'
    ? 'http://localhost:5000/api'
    : debuggerHost
      ? `http://${localhost}:5000/api`
      : 'http://10.0.2.2:5000/api'
  : PRODUCTION_API_URL;

// ── AS Traders Color Palette — Deep Emerald Professional ──────────────────
export const COLORS = {
  // Primary — Deep Emerald Green
  primary: '#0A7B5E',   // main brand — deep emerald
  primaryDark: '#075C46',   // darker emerald for pressed states
  primaryDeep: '#043D2E',   // deepest — gradient end
  primaryLight: '#E6F5F1',   // soft mint tint for backgrounds

  // Accent — Warm Amber/Gold
  accent: '#F59E0B',
  accentLight: '#FEF3C7',
  accentDark: '#B45309',

  // Supplier color — deep teal/indigo to distinguish from customers
  supplier: '#7C3AED',   // purple-indigo for supplier
  supplierLight: '#EDE9FE',
  supplierDark: '#5B21B6',

  // Status colors
  success: '#059669',
  successLight: '#D1FAE5',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  warning: '#D97706',
  warningLight: '#FEF3C7',

  // Payable / Receivable
  payable: '#DC2626',   // dena hai — red
  payableLight: '#FEE2E2',
  receivable: '#059669',   // lena hai — green
  receivableLight: '#D1FAE5',

  // Neutral
  white: '#FFFFFF',
  background: '#F0FBF7',   // soft green-tinted background
  card: '#FFFFFF',
  surface: '#F7FDF9',   // slightly green-tinted surface

  border: '#D1E8E0',
  borderLight: '#E6F5F1',

  text: '#0D2A20',   // very deep green-black
  textSecondary: '#3D6B58',
  textMuted: '#8AADA0',

  debit: '#DC2626',
  credit: '#059669',

  // Gradients
  gradientPrimary: ['#0A7B5E', '#075C46', '#043D2E'] as string[],
  gradientAccent: ['#F59E0B', '#D97706'] as string[],
  gradientSuccess: ['#059669', '#047857'] as string[],
  gradientSupplier: ['#7C3AED', '#5B21B6', '#3B0764'] as string[],
  gradientCard: ['#FFFFFF', '#F0FBF7'] as string[],
};

// ── Typography ─────────────────────────────────────────────────────────────
export const FONTS = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
  heavy: 'Poppins-ExtraBold',
};

// ── Spacing ────────────────────────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ── Border Radius ──────────────────────────────────────────────────────────
export const BORDER_RADIUS = {
  sm: 8,
  md: 14,
  lg: 22,
  xl: 32,
  round: 9999,
};

// ── Shadows ────────────────────────────────────────────────────────────────
export const SHADOWS = {
  xs: {
    shadowColor: '#0A7B5E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: '#0A7B5E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#0A7B5E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.11,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: '#0A7B5E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  primary: {
    shadowColor: '#0A7B5E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  accent: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  supplier: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
};

// ── Dark Mode Color Palette ────────────────────────────────────────────────
export const DARK_COLORS = {
  primary: '#22C997',   // brighter emerald for dark bg
  primaryDark: '#1AAD82',
  primaryDeep: '#0A7B5E',
  primaryLight: '#0D3D2E',   // dark tint

  accent: '#FBBF24',
  accentLight: '#451A03',
  accentDark: '#F59E0B',

  supplier: '#A78BFA',
  supplierLight: '#2D1B69',
  supplierDark: '#7C3AED',

  success: '#34D399',
  successLight: '#064E3B',
  danger: '#F87171',
  dangerLight: '#450A0A',
  warning: '#FBBF24',
  warningLight: '#451A03',

  payable: '#F87171',
  payableLight: '#450A0A',
  receivable: '#34D399',
  receivableLight: '#064E3B',

  white: '#1E1E2E',   // "white" surfaces become dark cards
  background: '#111827',   // main dark background
  card: '#1E1E2E',
  surface: '#252535',

  border: '#2D3748',
  borderLight: '#1F2937',

  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  debit: '#F87171',
  credit: '#34D399',

  gradientPrimary: ['#0A7B5E', '#065C46', '#033D2E'] as string[],
  gradientAccent: ['#FBBF24', '#F59E0B'] as string[],
  gradientSuccess: ['#34D399', '#059669'] as string[],
  gradientSupplier: ['#A78BFA', '#7C3AED', '#4C1D95'] as string[],
  gradientCard: ['#1E1E2E', '#252535'] as string[],
};

// ── useColors hook — use this instead of COLORS directly ──────────────────
// Import this in screens that need dark mode support
import { useTheme } from '../context/ThemeContext';

export const useColors = () => {
  const { isDark } = useTheme();
  return isDark ? DARK_COLORS : COLORS;
};
