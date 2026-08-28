import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:finance_app/features/auth/data/auth_repository.dart';
import 'package:finance_app/features/auth/presentation/forgot_password_screen.dart';
import 'package:finance_app/features/auth/providers/auth_providers.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  testWidgets('shows an email validation error before calling the repository', (tester) async {
    final repository = MockAuthRepository();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [authRepositoryProvider.overrideWithValue(repository)],
        child: const MaterialApp(home: ForgotPasswordScreen()),
      ),
    );

    await tester.tap(find.text('Envoyer le lien'));
    await tester.pump();

    expect(find.text('Email invalide'), findsOneWidget);
    verifyNever(() => repository.forgotPassword(any()));
  });

  testWidgets('shows a confirmation after a successful submission', (tester) async {
    final repository = MockAuthRepository();
    when(() => repository.forgotPassword('jackson@example.com')).thenAnswer((_) async {});

    await tester.pumpWidget(
      ProviderScope(
        overrides: [authRepositoryProvider.overrideWithValue(repository)],
        child: const MaterialApp(home: ForgotPasswordScreen()),
      ),
    );

    await tester.enterText(find.byType(TextFormField).first, 'jackson@example.com');
    await tester.tap(find.text('Envoyer le lien'));
    await tester.pumpAndSettle();

    expect(find.text('Un lien de réinitialisation a été envoyé.'), findsOneWidget);
  });
}
