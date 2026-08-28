import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/forgot_password_screen.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/budgets/presentation/budgets_tab_placeholder.dart';
import '../../features/home/presentation/home_shell.dart';
import '../../features/home/presentation/home_tab_placeholder.dart';
import '../../features/onboarding/presentation/onboarding_screen.dart';
import '../../features/onboarding/presentation/splash_screen.dart';
import '../../features/profile/presentation/profile_tab_placeholder.dart';
import '../../features/statistics/presentation/statistics_tab_placeholder.dart';

GoRouter createAppRouter() {
  final rootNavigatorKey = GlobalKey<NavigatorState>();
  final shellNavigatorKey = GlobalKey<NavigatorState>();

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/splash',
    routes: [
      GoRoute(path: '/splash', builder: (context, state) => const SplashScreen()),
      GoRoute(path: '/onboarding', builder: (context, state) => const OnboardingScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/register', builder: (context, state) => const RegisterScreen()),
      GoRoute(path: '/forgot-password', builder: (context, state) => const ForgotPasswordScreen()),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => HomeShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            navigatorKey: shellNavigatorKey,
            routes: [GoRoute(path: '/home', builder: (context, state) => const HomeTabPlaceholder())],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(path: '/statistics', builder: (context, state) => const StatisticsTabPlaceholder()),
            ],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: '/budgets', builder: (context, state) => const BudgetsTabPlaceholder())],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: '/profile', builder: (context, state) => const ProfileTabPlaceholder())],
          ),
        ],
      ),
    ],
  );
}
