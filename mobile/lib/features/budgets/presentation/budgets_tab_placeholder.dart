import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class BudgetsTabPlaceholder extends StatelessWidget {
  const BudgetsTabPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: Text('Les budgets arrivent en Phase 3.', style: TextStyle(color: AppColors.secondary)),
        ),
      ),
    );
  }
}
