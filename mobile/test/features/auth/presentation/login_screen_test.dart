import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:finance_app/features/auth/presentation/login_screen.dart';

void main() {
  testWidgets('shows validation errors for an invalid email and a short password', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: MaterialApp(home: LoginScreen())));

    await tester.enterText(find.byType(TextFormField).at(0), 'not-an-email');
    await tester.enterText(find.byType(TextFormField).at(1), 'short');
    await tester.tap(find.text('Se connecter'));
    await tester.pump();

    expect(find.text('Email invalide'), findsOneWidget);
    expect(find.text('Minimum 8 caractères'), findsOneWidget);
  });

  testWidgets('has links to register and forgot password', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: MaterialApp(home: LoginScreen())));

    expect(find.text('Créer un compte'), findsOneWidget);
    expect(find.text('Mot de passe oublié ?'), findsOneWidget);
  });
}
