import 'package:flutter/material.dart';
import 'package:flutter_trial/screens/recipe_list_screen.dart';

class FiltersScreen extends StatefulWidget {
  final String searchQuery;

  const FiltersScreen({
    super.key,
    required this.searchQuery,
  });

  @override
  State<FiltersScreen> createState() => _FiltersScreenState();
}

class _FiltersScreenState extends State<FiltersScreen> {
  String selectedSkill = "Easy";
  String selectedDiet = "Veg";
  String selectedMeal = "Breakfast";
  String selectedTime = "10 - 20 min";

  Widget filterSection(
      String title,
      List<String> options,
      String selected,
      Function(String) onSelect,
      ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 14),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: options.map((option) {
            final isSelected = option == selected;

            return GestureDetector(
              onTap: () => onSelect(option),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: isSelected ? Colors.black : const Color(0xffF5F5F5),
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(
                    color: isSelected ? Colors.black : Colors.grey.shade300,
                  ),
                ),
                child: Text(
                  option,
                  style: TextStyle(
                    color: isSelected ? Colors.white : Colors.black,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 28),
      ],
    );
  }

  Future<void> _applyFilters() async {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => RecipeListScreen(
          searchQuery: widget.searchQuery,
          filters: {
            "skill": selectedSkill,
            "diet": selectedDiet,
            "meal": selectedMeal,
            "time": selectedTime,
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,

      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: Colors.black,
        titleSpacing: 0,
        leading: const BackButton(),
        title: Text(widget.searchQuery),
      ),

      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Filters",
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 24),

                      filterSection(
                        "Skill Level",
                        ["Easy", "Medium", "Advanced"],
                        selectedSkill,
                            (val) => setState(() => selectedSkill = val),
                      ),

                      filterSection(
                        "Diet",
                        [
                          "Veg",
                          "Non-Veg",
                          "Vegan",
                          "Keto",
                          "Dairy-free",
                          "Gluten-free",
                          "Allergen",
                        ],
                        selectedDiet,
                            (val) => setState(() => selectedDiet = val),
                      ),

                      filterSection(
                        "Meal",
                        [
                          "Appetiser",
                          "Breakfast",
                          "Lunch",
                          "Dinner",
                          "Snack",
                          "Brunch",
                          "Main Course",
                          "Dessert",
                        ],
                        selectedMeal,
                            (val) => setState(() => selectedMeal = val),
                      ),

                      filterSection(
                        "Time",
                        [
                          "5 - 10 min",
                          "10 - 20 min",
                          "20 - 30 min",
                          "30 - 45 min",
                          "45 - 60 min",
                          "> 1 hr",
                        ],
                        selectedTime,
                            (val) => setState(() => selectedTime = val),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 10),

              /// ================= BUTTONS =================
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text("Close"),
                    ),
                  ),
                  const SizedBox(width: 14),

                  Expanded(
                    child: ElevatedButton(
                      onPressed: _applyFilters,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                      ),
                      child: const Text(
                        "Apply",
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}