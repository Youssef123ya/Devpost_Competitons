import 'package:flutter/material.dart';
import 'recipe_list_screen.dart';

class CoursesScreen extends StatelessWidget {
  const CoursesScreen({super.key});

  static const Map<String, String> courses = {
    "Appetizers": "appetizers",
    "Breakfast": "breakfast",
    "Lunch": "lunch",
    "Main Dish": "main-dish",
    "Side Dishes": "side-dishes",
    "Salads": "salads",
    "Desserts": "desserts",
    "Snacks": "snacks",
    "Beverages": "beverages",
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF5F5F5),

      appBar: AppBar(
        title: const Text(
          "Courses",
          style: TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: Colors.black,
      ),

      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: courses.length,
        itemBuilder: (context, index) {
          final title = courses.keys.elementAt(index);
          final value = courses.values.elementAt(index);

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: ListTile(
              title: Text(
                title,
                style: const TextStyle(
                  color: Colors.black,
                  fontWeight: FontWeight.w500,
                  fontSize: 16,
                ),
              ),
              trailing: const Icon(
                Icons.arrow_forward_ios,
                size: 16,
                color: Colors.black,
              ),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => RecipeListScreen(
                      category: "Courses",
                      value: value,
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}