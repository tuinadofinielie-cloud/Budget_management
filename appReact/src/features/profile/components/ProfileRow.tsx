import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';

interface ProfileRowProps {
  label: string;
  value?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  tone?: 'default' | 'danger';
  isLast?: boolean;
}

export function ProfileRow({ label, value, icon, onPress, tone = 'default', isLast = false }: ProfileRowProps) {
  const labelColor = tone === 'danger' ? Colors.danger : Colors.text;
  const iconColor = tone === 'danger' ? Colors.danger : Colors.primary;

  const content = (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      {icon ? <Ionicons name={icon} size={18} color={iconColor} style={styles.icon} /> : null}
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {onPress && tone !== 'danger' ? <Ionicons name="chevron-forward" size={16} color={Colors.secondary} /> : null}
    </View>
  );

  if (!onPress) return content;

  return <Pressable onPress={onPress}>{content}</Pressable>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124,92,255,0.08)',
  },
  icon: {
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    fontSize: 13,
    color: Colors.secondary,
  },
});
