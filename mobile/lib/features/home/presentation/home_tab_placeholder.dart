import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class HomeTabPlaceholder extends StatelessWidget {
  const HomeTabPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: Text('Le tableau de bord arrive en Phase 2.', style: TextStyle(color: AppColors.secondary)),
        ),
      ),
    );
  }
}
