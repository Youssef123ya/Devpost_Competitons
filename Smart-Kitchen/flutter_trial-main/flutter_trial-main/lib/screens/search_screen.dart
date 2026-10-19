import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_trial/screens/add_ingredients_screen.dart';
import 'package:flutter_trial/screens/filters_screen.dart';
import 'package:flutter_trial/services/api_service.dart';
import 'package:flutter_trial/widgets/recipe_card.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _controller = TextEditingController();
  final ApiService apiService = ApiService();

  List<Map<String, dynamic>> results = [];
  List<Map<String, dynamic>> recentSearches = [];

  bool isLoading = false;
  bool isRecentLoading = true;

  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _loadRecentSearches();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  /// ================= SEARCH =================

  Future<void> _searchRecipes(String query) async {
    final trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setState(() {
        results = [];
        isLoading = false;
      });
      return;
    }

    setState(() {
      isLoading = true;
    });

    try {
      final data = await apiService.searchRecipes(
        trimmedQuery,
      );

      if (!mounted) return;

      setState(() {
        results = List<Map<String, dynamic>>.from(data);
      });

    } catch (e) {
      debugPrint("SEARCH ERROR: $e");
      if (!mounted) return;
      setState(() {
        results = [];
      });
    }

    if (!mounted) return;
    setState(() {
      isLoading = false;
    });
  }

  /// ================= RECENT =================

  Future<void> _loadRecentSearches() async {
    try {
      final data = await apiService.getRecentSearches();

      if (!mounted) return;

      setState(() {
        recentSearches = data.map<Map<String, dynamic>>((e) {
          return {
            "id": e,
            "title": e,
            "imageUrl": "",
            "minutes": 20,
            "calories": 0,
            "isFavorite": false,
          };
        }).toList();
      });

    } catch (e) {
      debugPrint("RECENT SEARCH ERROR: $e");
      if (!mounted) return;
      setState(() {
        recentSearches = [];
      });
    }

    if (!mounted) return;
    setState(() {
      isRecentLoading = false;
    });
  }

  void _clearSearch() {
    _controller.clear();
    setState(() {
      results = [];
    });
    _loadRecentSearches();
  }

  /// ================= FAVORITE =================

  Future<void> _toggleFavorite(String recipeId) async {
    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text("Favorites not connected yet"),
      ),
    );
  }

  /// ================= SEARCH BAR =================

  Widget _searchBar() {
    return TextField(
      controller: _controller,
      autofocus: true,
      textInputAction: TextInputAction.search,
      onChanged: (value) {
        setState(() {});
        _debounce?.cancel();
        _debounce = Timer(
          const Duration(milliseconds: 500),
              () {
            _searchRecipes(value);
          },
        );
      },
      decoration: InputDecoration(
        hintText: "Search recipes",
        prefixIcon: const Icon(Icons.search),
        suffixIcon: _controller.text.isNotEmpty
            ? IconButton(
          icon: const Icon(Icons.close),
          onPressed: _clearSearch,
        )
            : null,
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(30),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }

  /// ================= RECENT =================

  Widget _recentSearch() {
    if (isRecentLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 190,
          height: 48,
          child: OutlinedButton.icon(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const AddIngredientsScreen(),
                ),
              );
            },
            icon: const Icon(Icons.add, color: Colors.black),
            label: const Text(
              "Add Ingredients",
              style: TextStyle(color: Colors.black),
            ),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Colors.black),
            ),
          ),
        ),
        const SizedBox(height: 30),
        const Text(
          "RECENT SEARCHES",
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 18),
        Expanded(
          child: recentSearches.isEmpty
              ? const Center(
            child: Text("No recent searches"),
          )
              : GridView.builder(
            itemCount: recentSearches.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 14,
              mainAxisSpacing: 14,
              childAspectRatio: .72,
            ),
            itemBuilder: (context, index) {
              final item = recentSearches[index];
              return RecipeCard(
                recipe: item,
                initiallySaved: false,
                onSave: (id) async {
                  if (id.isEmpty) return;
                  await _toggleFavorite(id);
                },
                onTap: () {
                  final text = item["title"];
                  _controller.text = text;
                  _searchRecipes(text);
                },
              );
            },
          ),
        ),
      ],
    );
  }

  /// ================= RESULTS =================

  Widget _searchResults() {
    if (results.isEmpty) {
      return const Center(
        child: Text("No recipes found"),
      );
    }

    return ListView.separated(
      itemCount: results.length,
      separatorBuilder: (_, __) => const Divider(),
      itemBuilder: (context, index) {
        final recipe = results[index];
        final query = recipe["title"] ?? recipe["name"] ?? "Recipe";

        return ListTile(
          title: Text(query),
          trailing: const Icon(Icons.arrow_forward_ios, size: 16),
          onTap: () async {

            try {
              await apiService.saveRecentSearch(query);
            } catch (e) {
              debugPrint("FAILED TO SAVE SEARCH: $e");
            }

            if (!mounted) return;


            await Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => FiltersScreen(
                  searchQuery: query,
                ),
              ),
            );


            _loadRecentSearches();
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isSearching = _controller.text.isNotEmpty;

    return Scaffold(
      backgroundColor: const Color(0xffF8F8F8),
      appBar: AppBar(
        backgroundColor: const Color(0xffF8F8F8),
        elevation: 0,
        leading: const BackButton(color: Colors.black),
        title: _searchBar(),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: isLoading
            ? const Center(child: CircularProgressIndicator())
            : isSearching
            ? _searchResults()
            : _recentSearch(),
      ),
    );
  }
}