import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../auth/providers/auth_providers.dart';

class _OnboardingPageData {
  const _OnboardingPageData({required this.icon, required this.title, required this.subtitle});

  final IconData icon;
  final String title;
  final String subtitle;
}

const _pages = [
  _OnboardingPageData(
    icon: Icons.account_balance_wallet_rounded,
    title: 'Prenez le contrôle de votre argent',
    subtitle: 'Suivez facilement vos revenus et vos dépenses.',
  ),
  _OnboardingPageData(
    icon: Icons.donut_large_rounded,
    title: 'Comprenez où va votre argent',
    subtitle: 'Visualisez vos habitudes de dépenses grâce à des statistiques simples.',
  ),
  _OnboardingPageData(
    icon: Icons.flag_rounded,
    title: 'Atteignez vos objectifs',
    subtitle: "Épargnez intelligemment et gardez toujours une longueur d'avance.",
  ),
];

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _controller = PageController();
  int _index = 0;

  Future<void> _finish() async {
    await ref.read(secureStorageServiceProvider).markOnboardingComplete();
    if (!mounted) return;
    context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    final isLast = _index == _pages.length - 1;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.topRight,
              child: TextButton(onPressed: _finish, child: const Text('Passer')),
            ),
            Expanded(
              child: PageView.builder(
                controller: _controller,
                itemCount: _pages.length,
                onPageChanged: (value) => setState(() => _index = value),
                itemBuilder: (context, index) {
                  final page = _pages[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(page.icon, size: 96, color: AppColors.primary),
                        const SizedBox(height: 32),
                        Text(
                          page.title,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w700,
                            color: AppColors.text,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          page.subtitle,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 15, color: AppColors.secondary),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    if (isLast) {
                      _finish();
                    } else {
                      _controller.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
                    }
                  },
                  child: Text(isLast ? 'Commencer' : 'Continuer'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
