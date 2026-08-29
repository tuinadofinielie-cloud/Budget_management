import { ViewStyle } from 'react-native';
import { Colors } from './colors';

export const GLASS_BLUR_INTENSITY = 40;

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
