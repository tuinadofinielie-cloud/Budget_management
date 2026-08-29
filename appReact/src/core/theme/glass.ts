import { ViewStyle } from 'react-native';
import { Colors } from './colors';

export const GLASS_BLUR_INTENSITY = 40;

/**
 * Deep violet → electric violet → lavender, used for "hero" surfaces (the
 * balance card, splash background) to read as light passing through
 * translucent purple glass rather than a flat purple fill.
 */
export const HERO_GRADIENT_COLORS = ['#4B2FBF', '#7C5CFF', '#A98CFF'] as const;

export function glassSurfaceStyle(options: { radius?: number; opacity?: number } = {}): ViewStyle {
  const { radius = 24, opacity = 0.6 } = options;
  return {
    backgroundColor: `rgba(255,255,255,${opacity})`,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: Colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    overflow: 'hidden',
  };
}

/** A soft purple glow cast under elevated hero surfaces. */
export function glowStyle(options: { color?: string; opacity?: number; radius?: number } = {}): ViewStyle {
  const { color = Colors.primary, opacity = 0.35, radius = 32 } = options;
  return {
    shadowColor: color,
    shadowOpacity: opacity,
    shadowRadius: radius,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  };
}
