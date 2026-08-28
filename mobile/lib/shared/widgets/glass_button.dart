import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/glass.dart';

class GlassButton extends StatelessWidget {
  const GlassButton({
    super.key,
    required this.label,
    required this.icon,
    required this.onPressed,
  });

  final String label;
  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: GlassDecoration.surface(radius: 18, opacity: 0.5),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, color: AppColors.primary),
                const SizedBox(height: 4),
                Text(label, style: const TextStyle(fontSize: 12, color: AppColors.text)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
