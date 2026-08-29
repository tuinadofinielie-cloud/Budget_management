import { Tabs } from 'expo-router/js-tabs';
import { AppBottomNav } from '../../src/shared/components/AppBottomNav';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <AppBottomNav {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="statistics" options={{ title: 'Statistiques' }} />
      <Tabs.Screen name="budget" options={{ title: 'Budget' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  );
}
