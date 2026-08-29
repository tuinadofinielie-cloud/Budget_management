import { PropsWithChildren } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassCard } from '../../../shared/components/GlassCard';
import { Colors } from '../../../core/theme/colors';

interface ProfileSectionProps {
  title: string;
}

export function ProfileSection({ title, children }: PropsWithChildren<ProfileSectionProps>) {
  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <GlassCard style={styles.card}>{children}</GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  card: {
    paddingVertical: 4,
  },
});
