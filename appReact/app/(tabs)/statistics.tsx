import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../src/core/theme/colors';
import { Typography } from '../../src/core/theme/typography';

export default function StatisticsScreen() {
  return (
    <View style={styles.container}>
      <Text style={Typography.headlineMedium}>Statistiques</Text>
      <Text style={[Typography.bodyMedium, styles.hint]}>Les statistiques arrivent dans une prochaine phase.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 24, paddingTop: 72 },
  hint: { marginTop: 8 },
});
