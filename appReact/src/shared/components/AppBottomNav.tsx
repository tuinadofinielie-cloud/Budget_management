import { View, Pressable, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from 'expo-router/js-tabs';
import { Colors } from '../../core/theme/colors';
import { glassSurfaceStyle } from '../../core/theme/glass';

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  home: 'home',
  statistics: 'stats-chart',
  budget: 'people',
  profile: 'person',
};

const TAB_LABELS: Record<string, string> = {
  home: 'Accueil',
  statistics: 'Statistiques',
  budget: 'Budget',
  profile: 'Profil',
};

export function AppBottomNav({ state, navigation }: BottomTabBarProps) {
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
      <Pressable
        style={styles.fab}
        onPress={() =>
          Alert.alert('Actions rapides', 'Dépense / Revenu / Transfert', [
            { text: 'Dépense', onPress: () => Alert.alert('Bientôt disponible', 'Disponible dans une prochaine phase.') },
            { text: 'Revenu', onPress: () => Alert.alert('Bientôt disponible', 'Disponible dans une prochaine phase.') },
            { text: 'Transfert', onPress: () => Alert.alert('Bientôt disponible', 'Disponible dans une prochaine phase.') },
            { text: 'Annuler', style: 'cancel' },
          ])
        }
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
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
    top: -28,
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
});
