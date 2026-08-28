import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:mocktail/mocktail.dart';
import 'package:finance_app/core/services/secure_storage_service.dart';
import 'package:finance_app/features/auth/providers/auth_providers.dart';
import 'package:finance_app/features/onboarding/presentation/onboarding_screen.dart';

class _MockSecureStorage extends Mock implements FlutterSecureStorage {}

void main() {
  testWidgets('shows the three onboarding titles when swiping through', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(child: MaterialApp(home: OnboardingScreen())),
    );

    expect(find.text('Prenez le contrôle de votre argent'), findsOneWidget);

    await tester.drag(find.byType(PageView), const Offset(-400, 0));
    await tester.pumpAndSettle();
    expect(find.text('Comprenez où va votre argent'), findsOneWidget);

    await tester.drag(find.byType(PageView), const Offset(-400, 0));
    await tester.pumpAndSettle();
    expect(find.text('Atteignez vos objectifs'), findsOneWidget);
    expect(find.text('Commencer'), findsOneWidget);
  });

  testWidgets('tapping Passer marks onboarding complete and navigates to login', (tester) async {
    final mockStorage = _MockSecureStorage();
    when(() => mockStorage.write(key: any(named: 'key'), value: any(named: 'value')))
        .thenAnswer((_) async {});

    final router = GoRouter(
      initialLocation: '/onboarding',
      routes: [
        GoRoute(path: '/onboarding', builder: (context, state) => const OnboardingScreen()),
        GoRoute(path: '/login', builder: (context, state) => const Scaffold(body: Text('Login page'))),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          secureStorageServiceProvider.overrideWithValue(SecureStorageService(storage: mockStorage)),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );

    await tester.tap(find.text('Passer'));
    await tester.pumpAndSettle();

    expect(find.text('Login page'), findsOneWidget);
    verify(() => mockStorage.write(key: 'onboarding_complete', value: 'true')).called(1);
  });
}
