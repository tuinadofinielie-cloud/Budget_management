import { View, Text, StyleSheet } from 'react-native';
import { GlassCard } from '../../../shared/components/GlassCard';
import { EmptyState } from '../../../shared/components/EmptyState';
import { Typography } from '../../../core/theme/typography';
import { AppBudget } from '../../../shared/models/appBudget';
import { AppTransaction } from '../../../shared/models/appTransaction';
import { BudgetCard } from '../../budgets/components/BudgetCard';

interface BudgetSummaryProps {
  budget: AppBudget | null;
  transactions: AppTransaction[];
  referenceDate: Date;
  onCreateBudget: () => void;
  onEditBudget: () => void;
}

export function BudgetSummary({ budget, transactions, referenceDate, onCreateBudget, onEditBudget }: BudgetSummaryProps) {
  return (
    <View>
      <Text style={[Typography.titleLarge, styles.title]}>Budget</Text>
      {!budget ? (
        <GlassCard>
          <EmptyState
            title="Aucun budget défini"
            message="Fixez une limite de dépenses pour suivre votre progression."
            actionLabel="Définir un budget"
            onAction={onCreateBudget}
          />
        </GlassCard>
      ) : (
        <BudgetCard
          title="Budget du mois"
          budget={budget}
          transactions={transactions}
          referenceDate={referenceDate}
          onPress={onEditBudget}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 12,
  },
});
