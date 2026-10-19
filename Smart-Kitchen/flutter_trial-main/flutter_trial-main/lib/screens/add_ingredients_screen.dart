import 'package:flutter/material.dart';
import 'package:flutter_trial/screens/recipe_list_screen.dart';
import '../services/api_service.dart';

class AddIngredientsScreen extends StatefulWidget {
  const AddIngredientsScreen({super.key});

  @override
  State<AddIngredientsScreen> createState() => _AddIngredientsScreenState();
}

class _AddIngredientsScreenState extends State<AddIngredientsScreen> {
  final TextEditingController _controller = TextEditingController();
  final ApiService apiService = ApiService();

  late Future<List<dynamic>> recentIngredients;

  final List<String> popularIngredients = [
    "Milk",
    "Eggs",
    "Bread",
    "Chicken",
    "Onion",
    "Butter",
    "Mushroom",
    "Potato",
    "Tomato",
    "Cheese",
    "Curd",
  ];

  final List<String> selectedIngredients = [];
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadRecent();
  }

  void _loadRecent() {
    setState(() {
      recentIngredients = apiService.getRecentIngredients();
    });
  }

  /// ================= UI LOGIC: ADD INGREDIENT =================
  Future<void> _addIngredient() async {
    final text = _controller.text.trim();

    if (text.isEmpty) return;

    if (!selectedIngredients.contains(text)) {
      setState(() {
        selectedIngredients.add(text);
      });

      try {

        await apiService.saveRecentIngredient({
          "name": text,
          "imageUrl": "",
        });

        if (!mounted) return;
        _controller.clear();
        _loadRecent();


        await _generateRecipes();

      } catch (e) {
        debugPrint("UI ERROR (addIngredient): $e");
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Failed to save ingredient")),
        );
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Ingredient already added")),
      );
    }
  }

  /// ================= UI LOGIC: DELETE INGREDIENT =================
  Future<void> _deleteRecentIngredient(dynamic e, String text) async {
    final id = e is Map ? (e["id"] ?? e["_id"] ?? e["name"] ?? "") : e.toString();

    try {
      setState(() {
        selectedIngredients.remove(text);
      });


      await apiService.removeRecentIngredient(id);

      _loadRecent();
    } catch (err) {
      debugPrint("UI ERROR (deleteRecent): $err");
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Failed to delete recent ingredient")),
      );
    }
  }

  /// ================= UI LOGIC: GENERATE RECIPES =================
  Future<void> _generateRecipes() async {
    if (selectedIngredients.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please add ingredients first")),
      );
      return;
    }

    setState(() {
      isLoading = true;
    });

    try {
      final currentRecentList = await recentIngredients;
      final recentNames = currentRecentList.map((e) {
        return e is Map ? (e["name"] ?? "") : e.toString();
      }).toList();

      final newToSave = selectedIngredients
          .where((ing) => !recentNames.contains(ing))
          .toList();


      if (newToSave.isNotEmpty) {
        await Future.wait(newToSave.map((ingredient) {
          return apiService.saveRecentIngredient({
            "name": ingredient,
            "imageUrl": "",
          }).catchError((err) {
            debugPrint("Failed to auto-save $ingredient: $err");
          });
        }));
      }

      final recipes = await apiService.getRecipesByIngredients(selectedIngredients);

      if (!mounted) return;
      _loadRecent();

      if (recipes.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("No recipes found")),
        );
        setState(() {
          isLoading = false;
        });
        return;
      }

      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => RecipeListScreen(
            searchQuery: selectedIngredients.join(", "),
            filters: {
              "recipes": recipes,
            },
          ),
        ),
      );

    } catch (e) {
      debugPrint("UI ERROR (generateRecipes): $e");
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    }

    if (!mounted) return;
    setState(() {
      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF8F8F8),
      appBar: AppBar(
        backgroundColor: const Color(0xffF8F8F8),
        elevation: 0,
        title: const Text(
          "Add Ingredients",
          style: TextStyle(
            color: Colors.black,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(18),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                height: 52,
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: Colors.grey.shade300,
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _controller,
                        decoration: const InputDecoration(
                          hintText: "Add ingredient",
                          border: InputBorder.none,
                        ),
                        onSubmitted: (_) => _addIngredient(),
                      ),
                    ),
                    GestureDetector(
                      onTap: _addIngredient,
                      child: const Icon(Icons.add),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 25),

              const Text(
                "RECENT",
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 10),

              FutureBuilder<List<dynamic>>(
                future: recentIngredients,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(
                      child: CircularProgressIndicator(),
                    );
                  }

                  final recent = snapshot.data ?? [];

                  if (recent.isEmpty) {
                    return const Text(
                      "No recent ingredients",
                      style: TextStyle(color: Colors.grey),
                    );
                  }

                  return Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: recent.map((e) {
                      final text = e is String ? e : e["name"] ?? "";

                      return Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xffEFEAE6),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(text),
                            const SizedBox(width: 8),
                            GestureDetector(
                              onTap: () => _deleteRecentIngredient(e, text),
                              child: const Icon(
                                Icons.close,
                                size: 18,
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  );
                },
              ),
              const SizedBox(height: 25),

              const Text(
                "POPULAR",
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 10),

              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: popularIngredients.map(_ingredientChip).toList(),
              ),
              const SizedBox(height: 35),

              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: isLoading ? null : _generateRecipes,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                  ),
                  child: isLoading
                      ? const CircularProgressIndicator(
                    color: Colors.white,
                  )
                      : const Text(
                    "Generate Recipe",
                    style: TextStyle(
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _ingredientChip(String text) {
    final isSelected = selectedIngredients.contains(text);

    return GestureDetector(
      onTap: () {
        setState(() {
          if (isSelected) {
            selectedIngredients.remove(text);
          } else {
            selectedIngredients.add(text);
          }
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 10,
        ),
        decoration: BoxDecoration(
          color: isSelected ? Colors.black : const Color(0xffEFEAE6),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Text(
          text,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.black,
          ),
        ),
      ),
    );
  }
}