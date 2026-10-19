import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../widgets/recipe_card.dart';
import 'recipe_details_screen.dart';

class RecipeListScreen extends StatefulWidget {
  final String? category;
  final String? value;
  final String? searchQuery;
  final Map<String, dynamic>? filters;
  final List<String>? allergens;

  final List<dynamic>? recipes;
  final String? title;

  const RecipeListScreen({
    super.key,
    this.category,
    this.value,
    this.searchQuery,
    this.filters,
    this.allergens,
    this.recipes,
    this.title,
  });

  @override
  State<RecipeListScreen> createState() =>
      _RecipeListScreenState();
}

class _RecipeListScreenState
    extends State<RecipeListScreen> {
  late Future<List<dynamic>> recipes;

  final ApiService api =
  ApiService();

  @override
  void initState() {
    super.initState();

    if (widget.recipes != null) {
      recipes =
          Future.value(widget.recipes!);

      return;
    }

    if (widget.searchQuery != null &&
        widget.searchQuery!
            .trim()
            .isNotEmpty) {
      recipes =
          api.searchWithFilters(
            query:
            widget.searchQuery,

            skill:
            widget.filters?[
            "skill"],

            diet:
            widget.filters?[
            "diet"],

            meal:
            widget.filters?[
            "meal"],

            time:
            widget.filters?[
            "time"],
          );
    } else {
      recipes =
    api.getRecipesByCategoryAndValue(
      widget.category ?? "",
      widget.value ?? "",
    );
    }
  }

  /// ================= RELOAD =================

  Future<void>
  _reloadRecipes() async {
    setState(() {
      if (widget.recipes !=
          null) {
        recipes =
            Future.value(
              widget.recipes!,
            );
      } else {
       recipes =
    api.getRecipesByCategoryAndValue(
      widget.category ?? "",
      widget.value ?? "",
    );
      }
    });
  }

  /// ================= SAVE / REMOVE =================

  Future<void>
  toggleFavorite(
      String recipeId,
      bool isSaved,
      ) async {
    try {
      if (isSaved) {
        await api
            .removeSavedRecipe(
          recipeId,
        );

        if (!mounted)
          return;

        ScaffoldMessenger.of(
          context,
        ).showSnackBar(
          const SnackBar(
            content: Text(
              "Removed from favorites",
            ),
          ),
        );
      } else {
        await api
            .saveRecipe(
          recipeId,
        );

        if (!mounted)
          return;

        ScaffoldMessenger.of(
          context,
        ).showSnackBar(
          const SnackBar(
            content: Text(
              "Saved to favorites ❤",
            ),
          ),
        );
      }

      await _reloadRecipes();
    } catch (_) {
      if (!mounted)
        return;

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(
        const SnackBar(
          content: Text(
            "Failed to update favorites",
          ),
        ),
      );

      rethrow;
    }
  }

  @override
  Widget build(
      BuildContext context) {
    return Scaffold(
      backgroundColor:
      const Color(
        0xffF8F8F8,
      ),

      appBar: AppBar(
        elevation: 0,

        backgroundColor:
        Colors.white,

        foregroundColor:
        Colors.black,

        centerTitle: true,

        title: Text(
          widget.title ??
              widget.searchQuery ??
              widget.value ??
              "Recipes",

          style:
          const TextStyle(
            fontWeight:
            FontWeight
                .w700,

            fontSize: 20,
          ),
        ),
      ),

      body:
      FutureBuilder<
          List<dynamic>>(
        future: recipes,

        builder:
            (
            context,
            snapshot,
            ) {
          if (snapshot
              .connectionState ==
              ConnectionState
                  .waiting) {
            return const Center(
              child:
              CircularProgressIndicator(),
            );
          }

          if (snapshot
              .hasError) {
            return Center(
              child: Text(
                snapshot.error
                    .toString(),
              ),
            );
          }

          if (!snapshot
              .hasData ||
              snapshot
                  .data!
                  .isEmpty) {
            return const Center(
              child: Text(
                "No recipes found",
              ),
            );
          }

          final data =
          snapshot.data!;

          return GridView
              .builder(
            padding:
            const EdgeInsets
                .all(
              16,
            ),

            itemCount:
            data.length,

            gridDelegate:
            const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount:
              2,

              mainAxisSpacing:
              16,

              crossAxisSpacing:
              16,

              childAspectRatio:
              0.72,
            ),

            itemBuilder:
                (
                context,
                index,
                ) {
              final item =
              data[index];

              final id =
                  item["id"]
                      ?.toString() ??
                      "";

              final saved =
                  item[
                  "isFavorite"] ??
                      false;

              return RecipeCard(
                recipe: item,

                initiallySaved:
                saved,

                onTap: () {
                  if (id
                      .isEmpty) {
                    return;
                  }

                  Navigator.push(
                    context,

                    MaterialPageRoute(
                      builder:
                          (_) =>
                          RecipeDetailsScreen(
                            recipeId:
                            id,
                          ),
                    ),
                  );
                },

                onSave:
                    (
                    id,
                    ) async {
                  if (id
                      .isEmpty) {
                    return;
                  }

                  await toggleFavorite(
                    id,
                    saved,
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}