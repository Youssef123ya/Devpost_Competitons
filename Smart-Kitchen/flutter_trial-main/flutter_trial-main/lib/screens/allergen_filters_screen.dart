import 'package:flutter/material.dart';
import 'recipe_list_screen.dart';
import '../services/api_service.dart';

class AllergenFiltersScreen extends StatefulWidget {
  final String diet;

  const AllergenFiltersScreen({
    super.key,
    required this.diet,
  });

  @override
  State<AllergenFiltersScreen> createState() => _AllergenFiltersScreenState();
}

class _AllergenFiltersScreenState extends State<AllergenFiltersScreen> {
  List<String> selected = [];
  bool noneSelected = false;
  bool isLoading = false;

  final List<Map<String, String>> allergens = [
    {"name": "Dairy", "icon": "assets/images/icons/dairy.png"},
    {"name": "Gluten", "icon": "assets/images/icons/gluten.png"},
    {"name": "Garlic", "icon": "assets/images/icons/garlic.png"},
    {"name": "Onion", "icon": "assets/images/icons/onion.png"},
    {"name": "Egg", "icon": "assets/images/icons/egg.png"},
    {"name": "Soy", "icon": "assets/images/icons/soy.png"},
    {"name": "Fish", "icon": "assets/images/icons/fish.png"},
    {"name": "Seafood", "icon": "assets/images/icons/seafood.png"},
    {"name": "Nuts", "icon": "assets/images/icons/nuts.png"},
    {"name": "Mushroom", "icon": "assets/images/icons/mushroom.png"},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "What ingredients do you avoid?",
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              "We'll take care of your ingredient allergies or intolerances.",
              style: TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 30),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(bottom: 20),
                child: GridView.builder(
                  itemCount: allergens.length,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 14,
                    crossAxisSpacing: 14,
                    childAspectRatio: 2.6,
                  ),
                  itemBuilder: (context, index) {
                    final item = allergens[index];
                    final isSelected = selected.contains(item["name"]);

                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          noneSelected = false;
                          if (isSelected) {
                            selected.remove(item["name"]);
                          } else {
                            selected.add(item["name"]!);
                          }
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isSelected ? Colors.orange : Colors.grey.shade300,
                          ),
                          boxShadow: const [
                            BoxShadow(
                              color: Colors.black12,
                              blurRadius: 6,
                              offset: Offset(0, 2),
                            )
                          ],
                        ),
                        child: Row(
                          children: [
                            Image.asset(
                              item["icon"]!,
                              width: 22,
                              height: 22,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                item["name"]!,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w500,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
            GestureDetector(
              onTap: () {
                setState(() {
                  noneSelected = true;
                  selected.clear();
                });
              },
              child: Container(
                height: 48,
                width: double.infinity,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: noneSelected
                      ? Colors.orange.withOpacity(0.1)
                      : Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: noneSelected ? Colors.orange : Colors.grey.shade300,
                  ),
                ),
                child: Text(
                  "None",
                  style: TextStyle(
                    fontWeight: FontWeight.w500,
                    color: noneSelected ? Colors.orange : Colors.black,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 55,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
                onPressed: isLoading
                    ? null
                    : () async {
                  setState(() => isLoading = true);
                  try {
                    final api = ApiService();


                    final recipesList = await api.filterRecipes(
                      diet: widget.diet,
                      allergen: selected.isEmpty ? null : selected.join(","),
                    );

                    if (!mounted) return;


                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => RecipeListScreen(
                          recipes: recipesList,
                        ),
                      ),
                    );
                  } catch (e) {
                    debugPrint("FILTER ERROR: $e");
                  } finally {
                    if (mounted) {
                      setState(() => isLoading = false);
                    }
                  }
                },
                child: isLoading
                    ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
                    : const Text(
                  "Confirm",
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}