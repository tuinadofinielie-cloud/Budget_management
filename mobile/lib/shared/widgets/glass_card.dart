import 'package:flutter/material.dart';

import '../../core/theme/glass.dart';

class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.borderRadius = 24,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: BackdropFilter(
        filter: GlassDecoration.blur,
        child: Container(
          padding: padding,
          decoration: GlassDecoration.surface(radius: borderRadius),
          child: child,
        ),
      ),
    );
  }
}
