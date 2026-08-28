import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../auth/domain/auth_state.dart';
import '../../auth/providers/auth_providers.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _redirect());
  }

  Future<void> _redirect() async {
    final authState = await ref.read(authControllerProvider.future);
    if (!mounted) return;

    if (authState is AuthAuthenticated) {
      context.go('/home');
      return;
    }

    final storage = ref.read(secureStorageServiceProvider);
    final hasSeenOnboarding = await storage.hasCompletedOnboarding();
    if (!mounted) return;

    context.go(hasSeenOnboarding ? '/login' : '/onboarding');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primary,
      body: const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.account_balance_wallet_rounded, color: Colors.white, size: 64),
            SizedBox(height: 16),
            Text(
              'Finance App',
              style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}
