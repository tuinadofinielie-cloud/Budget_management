import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Typography } from '../../../core/theme/typography';
import { Colors } from '../../../core/theme/colors';
import { EmptyState } from '../../../shared/components/EmptyState';
import { AppAccount } from '../../../shared/models/appAccount';
import { AccountCard } from './AccountCard';

interface AccountsSectionProps {
  accounts: AppAccount[];
  onCreateAccount: () => void;
  onManageAccounts: () => void;
}

export function AccountsSection({ accounts, onCreateAccount, onManageAccounts }: AccountsSectionProps) {
  return (
    <View>
      <View style={styles.header}>
        <Text style={[Typography.titleLarge, styles.title]}>Comptes</Text>
        {accounts.length > 0 && (
          <Pressable onPress={onManageAccounts}>
            <Text style={styles.manageLink}>Gérer</Text>
          </Pressable>
        )}
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    marginBottom: 0,
  },
  manageLink: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  list: {
    gap: 12,
    paddingRight: 4,
  },
});
