class Recipe {
  final String id;
  final String title;
  final String image;

  Recipe({
    required this.id,
    required this.title,
    required this.image,
  });

  factory Recipe.fromJson(Map<String, dynamic> json) {
    return Recipe(
      id: json['id'].toString(),
      title: json['title'] ?? '',
      image: json['image'] ?? '',
    );
  }
}



