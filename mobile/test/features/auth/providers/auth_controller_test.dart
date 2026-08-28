import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:finance_app/features/auth/data/auth_api.dart';
import 'package:finance_app/features/auth/data/auth_repository.dart';
import 'package:finance_app/features/auth/domain/auth_state.dart';
import 'package:finance_app/features/auth/providers/auth_providers.dart';
import 'package:finance_app/shared/models/app_user.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late MockAuthRepository repository;
  late ProviderContainer container;

  const user = AppUser(id: 1, name: 'Jackson', email: 'jackson@example.com', currency: 'XOF');

  setUp(() {
    repository = MockAuthRepository();
    container = ProviderContainer(
      overrides: [authRepositoryProvider.overrideWithValue(repository)],
    );
    addTearDown(container.dispose);

    when(() => repository.hasValidSession()).thenAnswer((_) async => true);
    when(() => repository.cachedUser()).thenAnswer((_) async => user);
  });

  test(
    'logout sets state to AuthUnauthenticated even when the repository call throws',
    () async {
      // Let build() resolve first so the controller starts as authenticated.
      final initial = await container.read(authControllerProvider.future);
      expect(initial, isA<AuthAuthenticated>());

      when(() => repository.logout()).thenThrow(AuthApiException('network error'));

      await expectLater(
        container.read(authControllerProvider.notifier).logout(),
        throwsA(isA<AuthApiException>()),
      );

      final state = container.read(authControllerProvider);
      expect(state.value, isA<AuthUnauthenticated>());
    },
  );
}
