import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../core/theme/colors';
import { glassSurfaceStyle } from '../../core/theme/glass';

interface GlassButtonProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

export function GlassButton({ label, icon, onPress }: GlassButtonProps) {
  return (
    <Pressable onPress={onPress} style={[glassSurfaceStyle({ radius: 18, opacity: 0.5 }), styles.container]}>
      <View style={styles.inner}>
        <Ionicons name={icon} size={22} color={Colors.primary} />
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inner: {
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: Colors.text,
  },
});
