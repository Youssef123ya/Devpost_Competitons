import 'package:flutter/material.dart';
import 'recipe_list_screen.dart';

class RecipeTimeScreen extends StatelessWidget {
  const RecipeTimeScreen({super.key});

  static const Map<String, String> options = {
    "15 Minutes Or Less": "15-minutes-or-less",
    "30 Minutes Or Less": "30-minutes-or-less",
    "60 Minutes Or Less": "60-minutes-or-less",
    "4 Hours Or Less": "4-hours-or-less",
    "1 Day Or More": "1-day-or-more",
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF5F5F5),

      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: Colors.black,
        title: const Text(
          "Recipe Time",
          style: TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: options.length,
        itemBuilder: (context, index) {
          final title = options.keys.elementAt(index);
          final value = options.values.elementAt(index);

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
                      category: "Recipe Time",
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