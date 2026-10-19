import 'package:flutter/material.dart';
import 'package:flutter_trial/screens/add_ingredients_screen.dart';

class AddIngredientsButton extends StatelessWidget {
  const AddIngredientsButton({super.key});

  @override
  Widget build(BuildContext context) {
    return ElevatedButton.icon(
      onPressed: () {
        debugPrint("BUTTON PRESSED");

        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) =>
            const AddIngredientsScreen(),
          ),
        );
      },

      icon: const Icon(Icons.add),

      label: const Text("Add Ingredients"),

      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,

        elevation: 0,

        side: const BorderSide(
          color: Colors.black,
        ),

        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
        ),
      ),
    );
  }
}