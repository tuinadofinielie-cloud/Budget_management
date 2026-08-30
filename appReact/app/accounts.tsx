import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../src/core/theme/colors';
import { Typography } from '../src/core/theme/typography';
import { LoadingState } from '../src/shared/components/LoadingState';
import { ErrorState } from '../src/shared/components/ErrorState';
import { EmptyState } from '../src/shared/components/EmptyState';
import { useAccountsStore } from '../src/features/accounts/state/accountsStoreInstance';
import { AccountListItem } from '../src/features/accounts/components/AccountListItem';

export default function AccountsScreen() {
  const accounts = useAccountsStore((state) => state.accounts);
  const loadCached = useAccountsStore((state) => state.loadCached);
  const refresh = useAccountsStore((state) => state.refresh);
  const remove = useAccountsStore((state) => state.remove);
  const clearError = useAccountsStore((state) => state.clearError);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAll = useCallback(
    async (isPullToRefresh: boolean) => {
      if (isPullToRefresh) setIsRefreshing(true);
      try {
        await refresh();
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Impossible de synchroniser vos données.');
      } finally {
        if (isPullToRefresh) setIsRefreshing(false);
      }
    },
    [refresh]
  );

  useEffect(() => {
    loadCached()
      .then(() => setIsLoading(false))
      .then(() => refreshAll(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDelete(accountId: number, name: string) {
    Alert.alert('Supprimer ce compte ?', `"${name}" sera définitivement supprimé.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          clearError();
          try {
            await remove(accountId);
          } catch {
            const message = useAccountsStore.getState().error ?? 'Impossible de supprimer ce compte.';
            Alert.alert('Suppression impossible', message);
          }
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingState message="Chargement de vos comptes..." />
      </SafeAreaView>
    );
  }

  if (error && accounts.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState message={error} onRetry={() => refreshAll(true)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Retour">
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={Typography.titleLarge}>Comptes</Text>
        <Pressable onPress={() => router.push('/create-account')} accessibilityLabel="Créer un compte">
          <Ionicons name="add" size={26} color={Colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => refreshAll(true)} tintColor={Colors.primary} />}
      >
        {accounts.length === 0 ? (
          <EmptyState
            title="Aucun compte"
            message="Créez votre premier compte pour commencer à suivre vos finances."
            actionLabel="Créer un compte"
            onAction={() => router.push('/create-account')}
          />
        ) : (
          accounts.map((account) => (
            <AccountListItem
              key={account.id}
              account={account}
              onEdit={() => router.push(`/create-account?id=${account.id}`)}
              onDelete={() => handleDelete(account.id, account.name)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  content: {
    padding: 20,
    paddingTop: 4,
    paddingBottom: 140,
  },
});
