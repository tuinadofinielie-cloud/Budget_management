import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors } from '../../../core/theme/colors';
import { AppCategory } from '../../../shared/models/appCategory';

interface CategoryPickerProps {
  categories: AppCategory[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function CategoryPicker({ categories, selectedId, onSelect }: CategoryPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Catégorie</Text>
      <View style={styles.wrap}>
        {categories.map((category) => {
          const selected = category.id === selectedId;
          return (
            <Pressable
              key={category.id}
              style={[styles.chip, selected && { backgroundColor: category.color }]}
              onPress={() => onSelect(category.id)}
            >
              <Text style={styles.emoji}>{category.icon}</Text>
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{category.name}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: Colors.secondary,
    marginBottom: 8,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: Colors.surface,
  },
  emoji: {
    fontSize: 15,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  chipLabelSelected: {
    color: '#FFFFFF',
  },
});
