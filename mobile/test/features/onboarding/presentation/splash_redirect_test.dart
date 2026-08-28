import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:finance_app/core/routing/app_router.dart';
import 'package:finance_app/core/services/secure_storage_service.dart';
import 'package:finance_app/features/auth/domain/auth_state.dart';
import 'package:finance_app/features/auth/providers/auth_providers.dart';
import 'package:finance_app/shared/models/app_user.dart';

class _MockSecureStorage extends Mock implements FlutterSecureStorage {}

class _FakeAuthenticatedController extends AuthController {
  @override
  Future<AuthState> build() async => const AuthAuthenticated(
        AppUser(id: 1, name: 'Jackson', email: 'jackson@example.com', currency: 'XOF'),
      );
}

class _FakeUnauthenticatedController extends AuthController {
  @override
  Future<AuthState> build() async => const AuthUnauthenticated();
}

void main() {
  testWidgets('redirects to login when unauthenticated and onboarding is already done', (tester) async {
    final mockStorage = _MockSecureStorage();
    when(() => mockStorage.read(key: any(named: 'key'))).thenAnswer((_) async => 'true');

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authControllerProvider.overrideWith(_FakeUnauthenticatedController.new),
          secureStorageServiceProvider.overrideWithValue(SecureStorageService(storage: mockStorage)),
        ],
        child: MaterialApp.router(routerConfig: createAppRouter()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Bon retour'), findsOneWidget);
  });

  testWidgets('redirects straight to the home shell when already authenticated', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [authControllerProvider.overrideWith(_FakeAuthenticatedController.new)],
        child: MaterialApp.router(routerConfig: createAppRouter()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.byIcon(Icons.add), findsOneWidget);
    expect(find.text('Accueil'), findsOneWidget);
  });
}
