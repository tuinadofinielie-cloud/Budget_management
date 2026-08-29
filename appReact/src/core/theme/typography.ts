import { TextStyle } from 'react-native';
import { Colors } from './colors';

const FONT_FAMILY = 'Inter_400Regular';
const FONT_FAMILY_SEMIBOLD = 'Inter_600SemiBold';
const FONT_FAMILY_BOLD = 'Inter_700Bold';

export const Typography: Record<string, TextStyle> = {
  displayLarge: {
    fontFamily: FONT_FAMILY_BOLD,
    fontSize: 36,
    fontWeight: '700',
    color: Colors.text,
  },
  headlineMedium: {
    fontFamily: FONT_FAMILY_BOLD,
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  titleLarge: {
    fontFamily: FONT_FAMILY_SEMIBOLD,
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  bodyLarge: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    color: Colors.text,
  },
  bodyMedium: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    color: Colors.text,
  },
  labelSmall: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    color: Colors.secondary,
  },
};

export const INTER_FONT_FAMILIES = {
  regular: FONT_FAMILY,
  semibold: FONT_FAMILY_SEMIBOLD,
  bold: FONT_FAMILY_BOLD,
};
