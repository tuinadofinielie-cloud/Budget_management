import { PropsWithChildren } from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { glassSurfaceStyle, GLASS_BLUR_INTENSITY } from '../../core/theme/glass';

interface GlassCardProps {
  style?: ViewStyle;
  radius?: number;
  opacity?: number;
}

export function GlassCard({ children, style, radius = 24, opacity = 0.6 }: PropsWithChildren<GlassCardProps>) {
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
});
