import { useState } from 'react';
import { View, Pressable, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BottomTabBarProps } from 'expo-router/js-tabs';
import { Colors } from '../../core/theme/colors';
import { glassSurfaceStyle } from '../../core/theme/glass';

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  home: 'home',
  statistics: 'stats-chart',
  budget: 'wallet',
  profile: 'person',
};

const TAB_LABELS: Record<string, string> = {
  home: 'Accueil',
  statistics: 'Statistiques',
  budget: 'Budget',
  profile: 'Profil',
};

interface SpeedDialAction {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
}

const ACTIONS: SpeedDialAction[] = [
  { key: 'income', label: 'Revenu', icon: 'arrow-down', route: '/add-transaction?type=income' },
  { key: 'expense', label: 'Dépense', icon: 'arrow-up', route: '/add-transaction?type=expense' },
];

const ACTION_SPACING = 64;
const FAB_TOP = -28;

export function AppBottomNav({ state, navigation }: BottomTabBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [animation] = useState(() => new Animated.Value(0));

  function setOpen(next: boolean) {
    setIsOpen(next);
    Animated.spring(animation, {
      toValue: next ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 60,
    }).start();
  }

  function handleActionPress(action: SpeedDialAction) {
    setOpen(false);
    router.push(action.route as Parameters<typeof router.push>[0]);
  }

  const rotate = animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  return (
    <View style={styles.container}>
      <View style={[glassSurfaceStyle({ radius: 28, opacity: 0.85 }), styles.bar]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const icon = TAB_ICONS[route.name] ?? 'ellipse';
          const label = TAB_LABELS[route.name] ?? route.name;
          return (
            <Pressable key={route.key} style={styles.tab} onPress={() => navigation.navigate(route.name)}>
              <Ionicons name={icon} size={22} color={focused ? Colors.primary : Colors.secondary} />
              <Text style={[styles.label, { color: focused ? Colors.primary : Colors.secondary }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {ACTIONS.map((action, index) => {
        const translateY = animation.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
        const scale = animation.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
        return (
          <Animated.View
            key={action.key}
            pointerEvents={isOpen ? 'auto' : 'none'}
            style={[
              styles.actionWrapper,
              { top: FAB_TOP - ACTION_SPACING * (index + 1), opacity: animation, transform: [{ translateY }, { scale }] },
            ]}
          >
            <Pressable style={styles.actionRow} onPress={() => handleActionPress(action)}>
              <View style={styles.actionLabelPill}>
                <Text style={styles.actionLabelText}>{action.label}</Text>
              </View>
              <View style={styles.actionCircle}>
                <Ionicons name={action.icon} size={18} color={Colors.primary} />
              </View>
            </Pressable>
          </Animated.View>
        );
      })}

      <Pressable
        style={styles.fab}
        onPress={() => setOpen(!isOpen)}
        accessibilityLabel={isOpen ? 'Fermer les actions rapides' : 'Ouvrir les actions rapides'}
      >
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 10,
    justifyContent: 'space-around',
  },
  tab: {
    alignItems: 'center',
    gap: 2,
    minWidth: 56,
  },
  label: {
    fontSize: 11,
  },
  fab: {
    position: 'absolute',
    top: FAB_TOP,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  actionWrapper: {
    position: 'absolute',
  },
  actionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  actionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  actionLabelPill: {
    backgroundColor: Colors.text,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  actionLabelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
