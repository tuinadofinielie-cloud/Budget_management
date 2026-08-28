import 'package:flutter_test/flutter_test.dart';
import 'package:finance_app/core/routing/app_router.dart';

void main() {
  test('createAppRouter starts at the splash route', () {
    final router = createAppRouter();
    expect(router.routeInformationProvider.value.uri.path, '/splash');
  });
}
