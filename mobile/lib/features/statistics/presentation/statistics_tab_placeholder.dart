import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class StatisticsTabPlaceholder extends StatelessWidget {
  const StatisticsTabPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: Text('Les statistiques arrivent en Phase 4.', style: TextStyle(color: AppColors.secondary)),
        ),
      ),
    );
  }
}
