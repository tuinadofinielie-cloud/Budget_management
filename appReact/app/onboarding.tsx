import { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import PagerView from 'react-native-pager-view';
import { router } from 'expo-router';
import { Colors } from '../src/core/theme/colors';
import { Typography } from '../src/core/theme/typography';
import { PrimaryButton } from '../src/shared/components/PrimaryButton';
import { secureStorageService } from '../src/features/auth/state/authStoreInstance';

const PAGES = [
  { title: 'Prenez le contrôle de votre argent', subtitle: 'Suivez facilement vos revenus et vos dépenses.' },
  {
    title: 'Comprenez où va votre argent',
    subtitle: 'Visualisez vos habitudes de dépenses grâce à des statistiques simples.',
  },
  {
    title: 'Atteignez vos objectifs',
    subtitle: 'Épargnez intelligemment et gardez toujours une longueur d’avance.',
  },
];

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const pagerRef = useRef<PagerView>(null);
  const [page, setPage] = useState(0);
  const isLastPage = page === PAGES.length - 1;

  async function finish() {
    await secureStorageService.markOnboardingComplete();
    router.replace('/login');
  }

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setPage(e.nativeEvent.position)}
      >
        {PAGES.map((item) => (
          <View key={item.title} style={styles.page}>
            <View style={styles.illustration} />
            <Text style={[Typography.headlineMedium, styles.title]}>{item.title}</Text>
            <Text style={[Typography.bodyLarge, styles.subtitle]}>{item.subtitle}</Text>
          </View>
        ))}
      </PagerView>

      <View style={styles.dots}>
        {PAGES.map((item, index) => (
          <View key={item.title} style={[styles.dot, index === page && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        {!isLastPage ? (
          <Text style={styles.skip} onPress={finish}>
            Passer
          </Text>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}
        <View style={styles.primaryAction}>
          <PrimaryButton
            label={isLastPage ? 'Commencer' : 'Continuer'}
            onPress={() => {
              if (isLastPage) {
                finish();
              } else {
                pagerRef.current?.setPage(page + 1);
              }
            }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  pager: { flex: 1 },
  page: { width, alignItems: 'center', justifyContent: 'center', padding: 32 },
  illustration: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primaryLight,
    opacity: 0.3,
    marginBottom: 32,
  },
  title: { textAlign: 'center', marginBottom: 12 },
  subtitle: { textAlign: 'center', color: Colors.secondary },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primaryLight },
  dotActive: { backgroundColor: Colors.primary, width: 20 },
  actions: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 32, gap: 16 },
  skip: { color: Colors.secondary, fontSize: 16, minWidth: 60 },
  skipPlaceholder: { minWidth: 60 },
  primaryAction: { flex: 1 },
});
