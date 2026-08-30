import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Typography } from '../../../core/theme/typography';
import { EmptyState } from '../../../shared/components/EmptyState';
import { AppAccount } from '../../../shared/models/appAccount';
import { AccountCard } from './AccountCard';

interface AccountsSectionProps {
  accounts: AppAccount[];
  onCreateAccount: () => void;
}

export function AccountsSection({ accounts, onCreateAccount }: AccountsSectionProps) {
  return (
    <View>
      <Text style={[Typography.titleLarge, styles.title]}>Comptes</Text>
      {accounts.length === 0 ? (
        <EmptyState
          title="Aucun compte"
          message="Ajoutez un compte pour voir vos soldes ici."
          actionLabel="Créer un compte"
          onAction={onCreateAccount}
        />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 12,
  },
  list: {
    gap: 12,
    paddingRight: 4,
  },
});
