import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';
import { Typography } from '../../../core/theme/typography';

interface HomeHeaderProps {
  name: string;
  avatar: string | null;
}

export function HomeHeader({ name, avatar }: HomeHeaderProps) {
  const firstName = name.trim().split(' ')[0] || name;

  return (
    <View style={styles.container}>
      <View style={styles.identity}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>{firstName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View>
          <Text style={[Typography.titleLarge, styles.greeting]}>Bonjour {firstName} 👋</Text>
          <Text style={[Typography.bodyMedium, styles.subtitle]}>Voici votre situation financière</Text>
        </View>
      </View>
      <Pressable style={styles.notification} accessibilityLabel="Notifications">
        <Ionicons name="notifications-outline" size={20} color={Colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  greeting: {
    marginBottom: 2,
  },
  subtitle: {
    color: Colors.secondary,
  },
  notification: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});
