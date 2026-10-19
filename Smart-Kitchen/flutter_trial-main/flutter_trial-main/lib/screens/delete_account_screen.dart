import 'package:flutter/material.dart';
import '../services/api_service.dart';

class DeleteAccountScreen extends StatefulWidget {
  const DeleteAccountScreen({super.key});

  @override
  State<DeleteAccountScreen> createState() =>
      _DeleteAccountScreenState();
}

class _DeleteAccountScreenState
    extends State<DeleteAccountScreen> {

  bool isDeleting = false;

  final ApiService apiService = ApiService();

  Future<void> _deleteAccount() async {

    setState(() {
      isDeleting = true;
    });

    try {

      await apiService.deleteAccount();

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            "Account deleted successfully",
          ),
        ),
      );


      Navigator.pushNamedAndRemoveUntil(
        context,
        "/login",
            (route) => false,
      );

    } catch (e) {

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            e.toString(),
          ),
        ),
      );

    } finally {

      if (mounted) {
        setState(() {
          isDeleting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(

      backgroundColor: Colors.white,

      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,

        title: const Text(
          'Delete Account',
          style: TextStyle(
            color: Colors.black,
          ),
        ),

        iconTheme:
        const IconThemeData(
          color: Colors.black,
        ),
      ),

      body: SingleChildScrollView(

        padding:
        const EdgeInsets.all(
          24,
        ),

        child: Center(

          child: Column(

            mainAxisSize:
            MainAxisSize.min,

            children: [

              const Icon(
                Icons.delete,
                color: Colors.red,
                size: 80,
              ),

              const SizedBox(
                height: 20,
              ),

              const Text(
                'Are you sure you want to delete your account?',
                style: TextStyle(
                  fontSize: 20,
                  color: Colors.black,
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(
                height: 30,
              ),

              /// YES DELETE
              SizedBox(

                width: double.infinity,
                height: 50,

                child: ElevatedButton(

                  style:
                  ElevatedButton.styleFrom(

                    backgroundColor:
                    isDeleting
                        ? Colors.red
                        : Colors.white,

                    side:
                    const BorderSide(
                      color: Colors.black,
                    ),

                    elevation: 0,
                  ),

                  onPressed:
                  isDeleting
                      ? null
                      : _deleteAccount,

                  child:
                  isDeleting

                      ? const SizedBox(
                    width: 22,
                    height: 22,

                    child:
                    CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )

                      : const Text(

                    'Yes, Delete',

                    style:
                    TextStyle(
                      color: Colors.black,
                    ),
                  ),
                ),
              ),

              const SizedBox(
                height: 10,
              ),

              /// KEEP ACCOUNT
              SizedBox(

                width: double.infinity,
                height: 50,

                child: OutlinedButton(

                  style:
                  OutlinedButton.styleFrom(

                    backgroundColor:
                    Colors.white,

                    side:
                    const BorderSide(
                      color: Colors.black,
                    ),
                  ),

                  onPressed:
                  isDeleting
                      ? null
                      : () =>
                      Navigator.pop(
                        context,
                      ),

                  child:
                  const Text(

                    'Keep Account',

                    style:
                    TextStyle(
                      color: Colors.black,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}