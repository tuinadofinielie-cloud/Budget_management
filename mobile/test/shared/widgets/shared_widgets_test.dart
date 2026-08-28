import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:finance_app/shared/widgets/empty_state.dart';
import 'package:finance_app/shared/widgets/error_state.dart';
import 'package:finance_app/shared/widgets/glass_card.dart';
import 'package:finance_app/shared/widgets/loading_state.dart';
import 'package:finance_app/shared/widgets/primary_button.dart';

void main() {
  testWidgets('GlassCard renders its child', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: Scaffold(body: GlassCard(child: Text('hello')))),
    );
    expect(find.text('hello'), findsOneWidget);
  });

  testWidgets('PrimaryButton shows a spinner and hides its label while loading', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: PrimaryButton(label: 'Go', isLoading: true, onPressed: () {}),
        ),
      ),
    );
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    expect(find.text('Go'), findsNothing);
  });

  testWidgets('PrimaryButton is disabled while loading', (tester) async {
    var tapped = false;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: PrimaryButton(label: 'Go', isLoading: true, onPressed: () => tapped = true),
        ),
      ),
    );
    await tester.tap(find.byType(ElevatedButton), warnIfMissed: false);
    expect(tapped, isFalse);
  });

  testWidgets('LoadingState shows an optional message', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: Scaffold(body: LoadingState(message: 'Chargement...'))),
    );
    expect(find.text('Chargement...'), findsOneWidget);
  });

  testWidgets('ErrorState shows the message and calls onRetry when tapped', (tester) async {
    var tapped = false;
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(body: ErrorState(message: 'Oops', onRetry: () => tapped = true)),
      ),
    );
    expect(find.text('Oops'), findsOneWidget);
    await tester.tap(find.text('Réessayer'));
    expect(tapped, isTrue);
  });

  testWidgets('EmptyState shows an action button when provided', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: EmptyState(
            title: 'Rien ici',
            message: 'Ajoutez quelque chose',
            actionLabel: 'Ajouter',
            onAction: () {},
          ),
        ),
      ),
    );
    expect(find.text('Rien ici'), findsOneWidget);
    expect(find.text('Ajouter'), findsOneWidget);
  });
}
