import 'package:flutter/material.dart';

import 'skill_level_screen.dart';
import 'recipe_time_screen.dart';
import 'diet_screen.dart';
import 'cuisine_screen.dart';
import 'courses_screen.dart';
import 'healthy_eating_screen.dart';
import 'smart_appliances_screen.dart';
import 'beverages_screen.dart';
import 'seasonal_screen.dart';
import 'soups_stews_screen.dart';

class CategoryScreen extends StatelessWidget {
  const CategoryScreen({super.key});

  static const List<String> categories = [
    "Skill Level",
    "Recipe Time",
    "Diet",
    "Cuisine",
    "Courses",
    "Healthy Eating",
    "Smart Appliances",
    "Beverages",
    "Seasonal",
    "Soups & Stews",
  ];

  void _navigate(BuildContext context, String category) {

    Widget screen;

    switch (category) {

      case "Skill Level":
        screen = const SkillLevelScreen();
        break;

      case "Recipe Time":
        screen = const RecipeTimeScreen();
        break;

      case "Diet":
        screen = const DietScreen();
        break;

      case "Cuisine":
        screen = const CuisineScreen();
        break;

      case "Courses":
        screen = const CoursesScreen();
        break;

      case "Healthy Eating":
        screen = const HealthyEatingScreen();
        break;

      case "Smart Appliances":
        screen = const SmartAppliancesScreen();
        break;

      case "Beverages":
        screen = const BeveragesScreen();
        break;

      case "Seasonal":
        screen = const SeasonalScreen();
        break;

      case "Soups & Stews":
        screen = const SoupsStewsScreen();
        break;

      default:
        return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => screen,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(

      backgroundColor: const Color(0xffF5F5F5),

      appBar: AppBar(
        title: const Text(
          "Categories",
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

        itemCount: categories.length,

        itemBuilder: (context, index) {

          final category = categories[index];

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
                category,
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

              onTap: () => _navigate(context, category),
            ),
          );
        },
      ),
    );
  }
}