import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../widgets/recipe_card.dart';
import 'recipe_details_screen.dart';

class SavedRecipesPage extends StatefulWidget {
  const SavedRecipesPage({super.key});

  @override
  State<SavedRecipesPage> createState() => _SavedRecipesPageState();
}

class _SavedRecipesPageState extends State<SavedRecipesPage> {
  final ApiService apiService = ApiService();

  String selectedCategory = "All";

  final List<String> categories = [
    "All",
    "Easy",
    "Breakfast",
    "Non-Veg",
    "Lunch",
  ];

  List<Map<String, dynamic>> recipes = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    loadSavedRecipes();
  }

  /// ================= LOAD =================
  Future<void> loadSavedRecipes() async {
  try {
    String filter = "all";

    switch (selectedCategory) {
      case "Easy":
        filter = "easy";
        break;

      case "Breakfast":
        filter = "breakfast";
        break;

      case "Lunch":
        filter = "lunch";
        break;

      case "Non-Veg":
        filter = "non-veg";
        break;
    }

    final data = await apiService.getSavedRecipes(
      filter: filter,
    );

    if (!mounted) return;

    setState(() {
      recipes = data;
    });
  } catch (e) {
    debugPrint("ERROR LOADING SAVED RECIPES: $e");
  } finally {
    if (!mounted) return;

    setState(() {
      isLoading = false;
    });
  }
}

  /// ================= REMOVE =================
  Future<void> removeSavedRecipe(String recipeId) async {
    try {
      await apiService.removeSavedRecipe(recipeId);

      if (!mounted) return;

      setState(() {
        recipes.removeWhere(
              (e) => e["id"].toString() == recipeId,
        );
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Removed from favorites"),
        ),
      );
    } catch (e) {
      debugPrint("REMOVE ERROR: $e");
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Failed to remove"),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text(
          "Saved Recipes",
          style: TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: Colors.white,
        iconTheme: const IconThemeData(
          color: Colors.black,
        ),
        elevation: 0,
      ),
      body: Column(
        children: [
          const SizedBox(height: 10),

          /// CATEGORY HORIZONTAL LIST
          SizedBox(
            height: 45,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: categories.length,
              itemBuilder: (context, index) {
                final category = categories[index];
                final isSelected = selectedCategory == category;

                return GestureDetector(
                  onTap: () async {
                    setState(() {
                      selectedCategory = category;
                      isLoading = true;
                    });
                    await loadSavedRecipes();
                  },
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 18),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? Colors.black
                          : Colors.grey.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      category,
                      style: TextStyle(
                        color: isSelected ? Colors.white : Colors.black,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 10),


          Expanded(
            child: isLoading
                ? const Center(
              child: CircularProgressIndicator(),
            )
                : recipes.isEmpty
                ? const Center(
              child: Text("No Saved Recipes"),
            )
                : GridView.builder(
              padding: const EdgeInsets.all(12),
              gridDelegate:
              const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.78,
              ),
              itemCount: recipes.length,
              itemBuilder: (context, index) {
                final recipe = recipes[index];

                return RecipeCard(
                  recipe: {
                    "id": recipe["id"],
                    "title": recipe["name"] ?? recipe["title"],
                    "name": recipe["name"] ?? recipe["title"],
                    "image": recipe["imageUrl"],
                    "imageUrl": recipe["imageUrl"],
                    "time": "${recipe["minutes"] ?? 0} min",
                    "minutes": recipe["minutes"],
                    "calories": recipe["calories"],
                    "isFavorite": true,
                  },
                  initiallySaved: true,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => RecipeDetailsScreen(
                          recipeId: recipe["id"].toString(),
                        ),
                      ),
                    );
                  },
                  onSave: (recipeId) async {
                    if (recipeId.isEmpty) return;
                    await removeSavedRecipe(recipeId);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}