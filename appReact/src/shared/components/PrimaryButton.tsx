import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../../core/theme/colors';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function PrimaryButton({ label, onPress, isLoading = false, disabled = false }: PrimaryButtonProps) {
  return (
    <Pressable
      testID="primary-button"
      style={[styles.button, (disabled || isLoading) && styles.buttonDisabled]}
      disabled={isLoading || disabled}
      onPress={onPress}
    >
      {isLoading ? (
        <ActivityIndicator testID="primary-button-spinner" color="#FFFFFF" />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
