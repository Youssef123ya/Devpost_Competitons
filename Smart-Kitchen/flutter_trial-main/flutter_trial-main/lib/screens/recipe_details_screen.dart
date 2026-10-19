import 'package:flutter/material.dart';
import 'steps_screen.dart';
import '../services/api_service.dart';

class RecipeDetailsScreen extends StatefulWidget {
  final String recipeId;

  const RecipeDetailsScreen({
    super.key,
    required this.recipeId,
  });

  @override
  State<RecipeDetailsScreen> createState() =>
      _RecipeDetailsScreenState();
}

class _RecipeDetailsScreenState
    extends State<RecipeDetailsScreen> {

  late Future<Map<String, dynamic>> recipe;

  @override
  void initState() {
    super.initState();

    recipe = ApiService().getRecipeDetails(
      widget.recipeId,
    );
  }

  Widget _buildInsightRow(String label, String value) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xfff7f7f7),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade700,
                  fontWeight: FontWeight.w500,
                ),
              ),
              if (value.length < 25)
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Colors.black,
                    fontWeight: FontWeight.bold,
                  ),
                ),
            ],
          ),
          if (value.length >= 25) ...[
            const SizedBox(height: 4),
            Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                color: Colors.black,
                fontWeight: FontWeight.bold,
              ),
            ),
          ]
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {

    return FutureBuilder<Map<String, dynamic>>(
      future: recipe,

      builder: (context, snapshot) {

        if (snapshot.connectionState ==
            ConnectionState.waiting) {

          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }

        if (snapshot.hasError ||
            !snapshot.hasData ||
            snapshot.data!.isEmpty) {

          return const Scaffold(
            body: Center(
              child: Text(
                "Error loading recipe",
              ),
            ),
          );
        }

        final data = snapshot.data!;

        final image =
            data["imageUrl"] ??
                data["image"] ??
                data["thumbnailUrl"] ??
                "";

        final title =
            data["title"] ??
                data["name"] ??
                "";

        final minutes =
        (
            data["cookingTimeMinutes"] ??
                data["minutes"] ??
                data["cookTime"] ??
                data["totalTime"] ??
                0
        ).toString();

        final calories =
        (
            data["calories"] ??
                data["calorie"] ??
                data["caloriesKcal"] ??
                data["nutrition"]?["calories"] ??
                "-"
        ).toString();

        final carbs =
        (
            data["nutrition"]?["carbs"] ??
                "-"
        ).toString();

        final fat =
        (
            data["nutrition"]?["fat"] ??
                "-"
        ).toString();

        final fiber =
        (
            data["nutrition"]?["fiber"] ??
                "-"
        ).toString();

        final ingredients = List<dynamic>.from(
          data["ingredients"] ?? [],
        );

        final insights =
            data["insights"] as Map<String, dynamic>? ?? {};
debugPrint("DATA => $data");
debugPrint("INSIGHTS => $insights");
        final totalIngredients =
            insights["totalIngredients"]?.toString() ?? "-";

        final difficulty =
            insights["difficulty"]?.toString() ?? "-";

        final userCoverage =
            insights["userCoverage"]?.toString() ?? "-";

        final recipeCoverage =
            insights["recipeCoverage"]?.toString() ?? "-";

        final missingIngredientNames =
        (insights["missingIngredientNames"] is List)
            ? List<String>.from(insights["missingIngredientNames"])
            : <String>[];

        final substitutes =
        (insights["substitutes"] is Map)
            ? Map<String, dynamic>.from(insights["substitutes"])
            : <String, dynamic>{};

        return Scaffold(
          backgroundColor: Colors.white,

          body: Column(
            children: [

              Stack(
                children: [

                  image.toString().isNotEmpty

                      ? Image.network(

                    image,

                    height: 280,

                    width: double.infinity,

                    fit: BoxFit.cover,

                    errorBuilder:
                        (
                        context,
                        error,
                        stackTrace,
                        ) {

                      return Container(

                        height: 280,

                        width: double.infinity,

                        color:
                        Colors.grey.shade300,

                        child:
                        const Icon(

                          Icons.broken_image,

                          size: 60,
                        ),
                      );
                    },
                  )

                      : Container(

                    height: 280,

                    width: double.infinity,

                    color:
                    Colors.grey.shade300,

                    child:
                    const Icon(

                      Icons.image_not_supported,

                      size: 60,
                    ),
                  ),

                  Container(

                    height: 280,

                    decoration:
                    BoxDecoration(

                      gradient:
                      LinearGradient(

                        colors: [

                          Colors.black.withValues(
                            alpha: 0.35,
                          ),

                          Colors.transparent,
                        ],

                        begin:
                        Alignment.topCenter,

                        end:
                        Alignment.bottomCenter,
                      ),
                    ),
                  ),

                  Positioned(

                    top: 45,

                    left: 16,

                    child:
                    CircleAvatar(

                      backgroundColor:
                      Colors.white,

                      child:
                      IconButton(

                        icon:
                        const Icon(
                          Icons.arrow_back,
                        ),

                        onPressed:
                            () {

                          Navigator.pop(
                            context,
                          );
                        },
                      ),
                    ),
                  ),

                  Positioned(

                    bottom: 20,

                    left: 16,

                    right: 16,

                    child:
                    Column(

                      crossAxisAlignment:
                      CrossAxisAlignment.start,

                      children: [

                        Text(

                          title,

                          style:
                          const TextStyle(

                            color:
                            Colors.white,

                            fontSize: 24,

                            fontWeight:
                            FontWeight.bold,
                          ),
                        ),

                        const SizedBox(
                          height: 8,
                        ),

                        Row(
                          children: [

                            const Icon(

                              Icons.access_time,

                              color:
                              Colors.white,

                              size: 18,
                            ),

                            const SizedBox(
                              width: 6,
                            ),

                            Text(

                              "$minutes min",

                              style:
                              const TextStyle(

                                color:
                                Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              Expanded(

                child:
                Padding(

                  padding:
                  const EdgeInsets.all(
                    16,
                  ),

                  child:
                  Column(

                    children: [

                      Row(

                        mainAxisAlignment:
                        MainAxisAlignment.spaceBetween,

                        children: [

                          _NutritionItem(
                            "CALORIES",
                            calories,
                          ),

                          _NutritionItem(
                            "CARBS",
                            carbs,
                          ),

                          _NutritionItem(
                            "FAT",
                            fat,
                          ),

                          _NutritionItem(
                            "FIBER",
                            fiber,
                          ),
                        ],
                      ),

                      const SizedBox(
                        height: 24,
                      ),

                      Row(

                        mainAxisAlignment:
                        MainAxisAlignment.spaceBetween,

                        children: [

                          const Text(

                            "Ingredients",

                            style:
                            TextStyle(

                              fontSize: 20,

                              fontWeight:
                              FontWeight.bold,
                            ),
                          ),

                          GestureDetector(

                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => StepsScreen(
                                    recipeId: widget.recipeId,
                                  ),
                                ),
                              );
                            },

                            child:
                            const Text(

                              "Steps",

                              style:
                              TextStyle(

                                decoration:
                                TextDecoration
                                    .underline,

                                fontWeight:
                                FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(
                        height: 12,
                      ),

                      Expanded(
                        child: SingleChildScrollView(
                          child: Padding(
                            padding: const EdgeInsets.only(bottom: 120),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [

                                Card(
                                  elevation: 3,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [

                                        const Text(
                                          "Ingredients",
                                          style: TextStyle(
                                            fontSize: 20,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),

                                        const SizedBox(height: 16),

                                        ingredients.isEmpty
                                            ? const Text("No ingredients found")
                                            : ListView.separated(
                                          shrinkWrap: true,
                                          physics: const NeverScrollableScrollPhysics(),
                                          itemCount: ingredients.length,
                                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                                          itemBuilder: (context, index) {
                                            final item = ingredients[index];

                                            String name = "";
                                            String imageUrl = "";
                                            String amount = "";

                                            if (item is Map<String, dynamic>) {
                                              name = item["name"] ??
                                                  item["ingredientName"] ??
                                                  "";
                                              imageUrl = item["imageUrl"] ??
                                                  item["image"] ??
                                                  "";
                                              amount = item["amount"] ??
                                                  item["quantity"] ??
                                                  item["measure"] ??
                                                  "";
                                            } else {
                                              name = item.toString();
                                            }

                                            return Row(
                                              children: [
                                                CircleAvatar(
                                                  radius: 18,
                                                  backgroundColor: Colors.grey.shade100,
                                                  backgroundImage: imageUrl.isNotEmpty
                                                      ? NetworkImage(imageUrl)
                                                      : null,
                                                  child: imageUrl.isEmpty
                                                      ? const Icon(
                                                    Icons.fastfood,
                                                    size: 16,
                                                    color: Colors.grey,
                                                  )
                                                      : null,
                                                ),
                                                const SizedBox(width: 12),
                                                Expanded(
                                                  child: Text(
                                                    name,
                                                    style: const TextStyle(
                                                      fontSize: 15,
                                                      fontWeight: FontWeight.w500,
                                                      color: Colors.black87,
                                                    ),
                                                  ),
                                                ),
                                                if (amount.isNotEmpty)
                                                  Text(
                                                    amount,
                                                    style: TextStyle(
                                                      fontSize: 14,
                                                      color: Colors.grey.shade600,
                                                      fontWeight: FontWeight.w500,
                                                    ),
                                                  ),
                                              ],
                                            );
                                          },
                                        ),
                                      ],
                                    ),
                                  ),
                                ),

                                const SizedBox(height: 24),

                                Card(
                                  elevation: 3,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [

                                        const Text(
                                          "Insights",
                                          style: TextStyle(
                                            fontSize: 20,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),

                                        const SizedBox(height: 16),

                                        _buildInsightRow("Total Ingredients", "$totalIngredients"),
                                        _buildInsightRow("Difficulty", difficulty),
                                        _buildInsightRow("User Coverage", "$userCoverage%"),
                                        _buildInsightRow("Recipe Coverage", "$recipeCoverage%"),
                                        _buildInsightRow(
                                          "Missing Ingredients",
                                          missingIngredientNames.isNotEmpty
                                              ? missingIngredientNames.join(", ")
                                              : "None",
                                        ),
                                        _buildInsightRow(
                                          "Substitutes",
                                          substitutes.isNotEmpty
                                              ? substitutes.entries
                                              .map((e) => "${e.key} → ${e.value}")
                                              .join(", ")
                                              : "None",
                                        ),
                                      ],
                                    ),
                                  ),
                                ),

                                const SizedBox(height: 50),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _NutritionItem extends StatelessWidget {

  final String title;

  final String value;

  const _NutritionItem(
      this.title,
      this.value,
      {
        super.key,
      });

  @override
  Widget build(BuildContext context) {

    return Column(

      children: [

        Text(

          title,

          style:
          TextStyle(

            color:
            Colors.grey.shade500,

            fontSize: 11,
          ),
        ),

        const SizedBox(
          height: 4,
        ),

        Text(

          value,

          style:
          const TextStyle(

            fontWeight:
            FontWeight.bold,
          ),
        ),
      ],
    );
  }
}

class _IngredientItem extends StatelessWidget {

  final String name;
  final String imageUrl;

  const _IngredientItem(
      this.name,
      this.imageUrl, {
        super.key,
      });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(
        bottom: 10,
      ),
      padding: const EdgeInsets.symmetric(
        horizontal: 14,
        vertical: 14,
      ),
      decoration: BoxDecoration(
        color: const Color(0xfff7f7f7),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: Colors.grey.shade200,
            backgroundImage:
            imageUrl.isNotEmpty
                ? NetworkImage(imageUrl)
                : null,
            child:
            imageUrl.isEmpty
                ? const Icon(Icons.fastfood)
                : null,
          ),

          const SizedBox(width: 12),

          Expanded(
            child: Text(
              name,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}