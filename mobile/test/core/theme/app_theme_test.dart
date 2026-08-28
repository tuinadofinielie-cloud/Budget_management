import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:finance_app/core/theme/app_colors.dart';
import 'package:finance_app/core/theme/app_theme.dart';

void main() {
  test('light theme uses the brand primary purple', () {
    final theme = AppTheme.light;
    expect(theme.colorScheme.primary, AppColors.primary);
  });

  test('brand purple matches the spec value and is not green', () {
    expect(AppColors.primary, const Color(0xFF7C5CFF));
  });
}
