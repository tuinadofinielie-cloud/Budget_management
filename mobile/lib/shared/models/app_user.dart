class AppUser {
  const AppUser({
    required this.id,
    required this.name,
    required this.email,
    required this.currency,
    this.avatar,
  });

  final int id;
  final String name;
  final String email;
  final String currency;
  final String? avatar;

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'] as int,
      name: json['name'] as String,
      email: json['email'] as String,
      currency: json['currency'] as String,
      avatar: json['avatar'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'name': name, 'email': email, 'currency': currency, 'avatar': avatar};
  }
}
