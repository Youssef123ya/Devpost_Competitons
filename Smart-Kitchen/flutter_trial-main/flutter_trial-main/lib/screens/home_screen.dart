import 'package:flutter/material.dart';

// widgets
import 'package:flutter_trial/widgets/recipe_card.dart';
import 'package:flutter_trial/widgets/search_bar.dart';
import 'package:flutter_trial/widgets/section_title.dart';

// screens
import 'package:flutter_trial/screens/profile_screen.dart';
import 'package:flutter_trial/screens/category_screen.dart';
import 'package:flutter_trial/screens/sensors_screen.dart';
import 'package:flutter_trial/screens/chat_screen.dart';
import 'package:flutter_trial/screens/search_screen.dart';
import 'package:flutter_trial/screens/recipe_details_screen.dart';

// services
import 'package:flutter_trial/services/storage_service.dart';
import 'package:flutter_trial/services/api_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  late final List<Widget> _screens;

  bool _isInitialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();

    if (!_isInitialized) {
      _screens = [
        _homeContent(),
        const CategoryScreen(),
        const ProfileScreen(),
        const SensorsScreen(),
      ];

      _isInitialized = true;
    }
  }

  void _onTap(int index) {
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF8F8F8),
      body: _screens[_currentIndex],

      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        type: BottomNavigationBarType.fixed,
        onTap: _onTap,
        backgroundColor: Colors.white,
        selectedItemColor: Colors.black,
        unselectedItemColor: Colors.grey.shade500,
        elevation: 10,
        selectedLabelStyle: const TextStyle(
          fontWeight: FontWeight.w600,
        ),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: "Home",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.grid_view_rounded),
            label: "Categories",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            label: "Profile",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.sensors),
            label: "Sensors",
          ),
        ],
      ),

      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => const ChatScreen(),
            ),
          );
        },
        backgroundColor: Colors.transparent,
        elevation: 0,

        child: Padding(
          padding: const EdgeInsets.all(4),
          child: Image.asset(
            "assets/images/icons/chat.png",
            width: 48,
            height: 48,
            fit: BoxFit.contain,
          ),
        ),
      ),
    );
  }

  /// ================= HOME CONTENT =================
  Widget _homeContent() {
    return FutureBuilder<Map<String, dynamic>>(
      future: ApiService().getProfile(),
      builder: (context, snapshot) {
        final user = snapshot.data ?? {};

        return SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 12,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _header(user),

                const SizedBox(height: 24),

                GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const SearchScreen(),
                      ),
                    ).then((_) {
                      setState(() {});
                    });
                  },
                  child: AbsorbPointer(
                    child: HomeSearchBar(
                      onFilterTap: () {},
                    ),
                  ),
                ),

                const SizedBox(height: 28),

                const SectionTitle(title: "Trending Today"),
                const SizedBox(height: 14),

                SizedBox(
                  height: 235,
                  child: FutureBuilder<List<dynamic>>(
                    future: ApiService().getTrendingRecipes(),
                    builder: (context, snapshot) {
                      if (snapshot.connectionState ==
                          ConnectionState.waiting) {
                        return const Center(
                          child: CircularProgressIndicator(),
                        );
                      }

                      final recipes = snapshot.data ?? [];

                      return ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: recipes.length,
                        separatorBuilder: (_, _) =>
                        const SizedBox(width: 14),
                        itemBuilder: (context, index) {
                          final item = recipes[index];

                          return GestureDetector(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => RecipeDetailsScreen(
                                    recipeId: item["id"].toString(),
                                  ),
                                ),
                              );
                            },
                            child: SizedBox(
                              width: 165,
                              child: RecipeCard(
                                recipe: {
                                  "id": item["id"]?.toString() ?? "",
                                  "title": item["name"] ?? "No Name",
                                  "image": item["imageUrl"],
                                  "time": item["minutes"] ?? "0",
                                  "calories": item["calories"] ?? "0",
                                },

                                initiallySaved: item["isFavorite"] ?? false,

                                onSave: (id) async {
                                  final api = ApiService();

                                  final currentlySaved =
                                      item["isFavorite"] ?? false;

                                  if (currentlySaved) {
                                    await api.removeSavedRecipe(id);
                                  } else {
                                    await api.saveRecipe(id);
                                  }

                                  setState(() {
                                    item["isFavorite"] =
                                    !currentlySaved;
                                  });
                                },
                              ),
                            ),
                          );
                        },
                      );
                    },
                  ),
                ),

                const SizedBox(height: 28),

                const SectionTitle(title: "Suggested for you"),
                const SizedBox(height: 14),

                FutureBuilder<List<dynamic>>(
                  future: ApiService().getSuggestedRecipes(),
                  builder: (context, snapshot) {
                    final recipes = snapshot.data ?? [];

                    return GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: recipes.length,
                      gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 14,
                        mainAxisSpacing: 14,
                        childAspectRatio: 0.72,
                      ),
                      itemBuilder: (context, index) {
                        final item = recipes[index];

                        return GestureDetector(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => RecipeDetailsScreen(
                                  recipeId: item["id"].toString(),
                                ),
                              ),
                            );
                          },
                          child: RecipeCard(
                            recipe: {
                              "id": item["id"]?.toString() ?? "",
                              "title": item["name"] ?? "No Name",
                              "image": item["imageUrl"],
                              "time": item["minutes"] ?? "0",
                              "calories": item["calories"] ?? "0",
                            },

                            initiallySaved: item["isFavorite"] ?? false,

                            onSave: (id) async {
                              final api = ApiService();

                              final currentlySaved =
                                  item["isFavorite"] ?? false;

                              if (currentlySaved) {
                                await api.removeSavedRecipe(id);
                              } else {
                                await api.saveRecipe(id);
                              }

                              setState(() {
                                item["isFavorite"] =
                                !currentlySaved;
                              });
                            },
                          ),
                        );
                      },
                    );
                  },
                ),

                const SizedBox(height: 28),

                const SectionTitle(title: "Season's Special"),
                const SizedBox(height: 14),

                FutureBuilder<List<dynamic>>(
                  future: ApiService().getSeasonalRecipes(),
                  builder: (context, snapshot) {
                    final recipes = snapshot.data ?? [];

                    return GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: recipes.length,
                      gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 14,
                        mainAxisSpacing: 14,
                        childAspectRatio: 0.72,
                      ),
                      itemBuilder: (context, index) {
                        final item = recipes[index];

                        return GestureDetector(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => RecipeDetailsScreen(
                                  recipeId: item["id"].toString(),
                                ),
                              ),
                            );
                          },
                          child: RecipeCard(
                            recipe: {
                              "id": item["id"]?.toString() ?? "",
                              "title": item["name"] ?? "No Name",
                              "image": item["imageUrl"],
                              "time": item["minutes"] ?? "0",
                              "calories": item["calories"] ?? "0",
                            },

                            initiallySaved: item["isFavorite"] ?? false,

                            onSave: (id) async {
                              final api = ApiService();

                              final currentlySaved =
                                  item["isFavorite"] ?? false;

                              if (currentlySaved) {
                                await api.removeSavedRecipe(id);
                              } else {
                                await api.saveRecipe(id);
                              }

                              setState(() {
                                item["isFavorite"] =
                                !currentlySaved;
                              });
                            },
                          ),
                        );
                      },
                    );
                  },
                ),

                const SizedBox(height: 20),
              ],
            ),
          ),
        );
      },
    );
  }

  /// ================= HEADER =================
  Widget _header(Map<String, dynamic>? user) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Hello, ${user?['name'] ?? 'User'}!",
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                "What would you like to cook today?",
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade600,
                  fontWeight: FontWeight.w400,
                ),
              ),
            ],
          ),
        ),
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            image: const DecorationImage(
              image: AssetImage("assets/images/profile.png"),
              fit: BoxFit.cover,
            ),
          ),
        ),
      ],
    );
  }
}