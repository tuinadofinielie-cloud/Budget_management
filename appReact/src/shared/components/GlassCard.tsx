import { PropsWithChildren } from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { glassSurfaceStyle, glowStyle, GLASS_BLUR_INTENSITY, HERO_GRADIENT_COLORS } from '../../core/theme/glass';

interface GlassCardProps {
  style?: ViewStyle;
  radius?: number;
  opacity?: number;
  /**
   * 'light' (default): the usual frosted-white glass card.
   * 'hero': a deep-violet-to-lavender gradient surface with a soft glow and
   * a white corner highlight — for the balance card and other focal
   * surfaces, so purple reads as light through glass, not a flat fill.
   */
  variant?: 'light' | 'hero';
}

export function GlassCard({
  children,
  style,
  radius = 24,
  opacity = 0.6,
  variant = 'light',
}: PropsWithChildren<GlassCardProps>) {
  if (variant === 'hero') {
    return (
      <View style={[{ borderRadius: radius }, glowStyle({ radius: 28 }), style]}>
        <LinearGradient
          colors={HERO_GRADIENT_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroSurface, { borderRadius: radius }]}
        >
          <View style={styles.heroHighlight} pointerEvents="none" />
          <View style={styles.content}>{children}</View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden' }, style]}>
      <BlurView intensity={GLASS_BLUR_INTENSITY} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[glassSurfaceStyle({ radius, opacity }), styles.content]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  heroSurface: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroHighlight: {
    position: 'absolute',
    top: -50,
    left: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
});
