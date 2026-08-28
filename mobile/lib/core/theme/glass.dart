import 'dart:ui';

import 'package:flutter/material.dart';

import 'app_colors.dart';

class GlassDecoration {
  GlassDecoration._();

  static BoxDecoration surface({double radius = 24, double opacity = 0.6}) {
    return BoxDecoration(
      color: AppColors.surface.withValues(alpha: opacity),
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(color: Colors.white.withValues(alpha: 0.7)),
      boxShadow: [
        BoxShadow(
          color: AppColors.primary.withValues(alpha: 0.08),
          blurRadius: 24,
          offset: const Offset(0, 8),
        ),
      ],
    );
  }

  static final ImageFilter blur = ImageFilter.blur(sigmaX: 20, sigmaY: 20);
}
