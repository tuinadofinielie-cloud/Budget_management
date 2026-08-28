class AppConstants {
  AppConstants._();

  // Android emulator reaches the host machine's localhost via 10.0.2.2.
  // Use http://localhost:8000/api for the iOS simulator, or your LAN IP for a physical device.
  static const String apiBaseUrl = 'http://10.0.2.2:8000/api';

  static const String secureStorageTokenKey = 'auth_token';
  static const String secureStorageOnboardingKey = 'onboarding_complete';
}
