import 'package:flutter/material.dart';
import 'package:flutter_trial/screens/search_screen.dart';

class HomeSearchBar extends StatelessWidget {

  final VoidCallback onFilterTap;

  const HomeSearchBar({
    super.key,
    required this.onFilterTap,
  });

  @override
  Widget build(BuildContext context) {

    return GestureDetector(

      onTap: () {

        Navigator.push(
          context,

          MaterialPageRoute(
            builder: (_) => const SearchScreen(),
          ),
        );
      },

      child: Container(

        height: 56,

        padding: const EdgeInsets.symmetric(
          horizontal: 18,
        ),

        decoration: BoxDecoration(
          color: Colors.white,

          borderRadius:
          BorderRadius.circular(18),

          border: Border.all(
            color: Colors.grey.shade300,
          ),

          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(8),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),

        child: Row(
          children: [

            Icon(
              Icons.search,
              color: Colors.grey.shade500,
              size: 24,
            ),

            const SizedBox(width: 12),

            Expanded(

              child: Text(
                "Search recipe name here",

                style: TextStyle(
                  color: Colors.grey.shade500,
                  fontSize: 14,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}