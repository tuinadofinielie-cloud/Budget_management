import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:finance_app/features/auth/presentation/register_screen.dart';

void main() {
  testWidgets('shows a validation error when passwords do not match', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: MaterialApp(home: RegisterScreen())));

    await tester.enterText(find.byType(TextFormField).at(0), 'Jackson');
    await tester.enterText(find.byType(TextFormField).at(1), 'jackson@example.com');
    await tester.enterText(find.byType(TextFormField).at(2), 'password123');
    await tester.enterText(find.byType(TextFormField).at(3), 'different');
    await tester.tap(find.text('Créer mon compte'));
    await tester.pump();

    expect(find.text('Les mots de passe ne correspondent pas'), findsOneWidget);
  });

  testWidgets('requires a non-empty name', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: MaterialApp(home: RegisterScreen())));

    await tester.tap(find.text('Créer mon compte'));
    await tester.pump();

    expect(find.text('Nom requis'), findsOneWidget);
  });
}
