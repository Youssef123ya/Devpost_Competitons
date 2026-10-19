import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import 'activity_log_screen.dart';
import 'settings_screen.dart';
import 'edit_profile_screen.dart';
import 'saved_recipes_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late Future<Map<String, dynamic>> profileFuture;

  @override
  void initState() {
    super.initState();
    profileFuture = ApiService().getProfile();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF5F5F5),
      body: SafeArea(
        child: FutureBuilder<Map<String, dynamic>>(
          future: profileFuture,
          builder: (context, snapshot) {
            /// Loading
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: CircularProgressIndicator(),
              );
            }

            /// Error
            if (snapshot.hasError) {
              return Center(
                child: Text(
                  snapshot.error.toString(),
                ),
              );
            }

            /// Data
            final userData = snapshot.data!;

            final name = userData['name'] ?? 'No Name';
            final email = userData['email'] ?? 'No Email';
            final image = userData['image'];

            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [

                  /// Profile Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.grey.shade300,
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        )
                      ],
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment:
                            CrossAxisAlignment.start,
                            children: [
                              Text(
                                "Hello, $name",
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                email,
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey,
                                ),
                              ),
                            ],
                          ),
                        ),

                        /// Profile Image
                        CircleAvatar(
                          radius: 35,
                          backgroundImage: image != null
                              ? NetworkImage(image)
                              : const AssetImage(
                              'assets/images/profile.png')
                          as ImageProvider,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 30),

                  /// Saved Recipes
                  _item(
                    iconPath: 'assets/images/icons/saved.png',
                    text: 'Saved Recipes',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) =>
                          const SavedRecipesPage(),
                        ),
                      );
                    },
                  ),

                  /// Activity Log
                  _item(
                    iconPath:
                    'assets/images/icons/activity.png',
                    text: 'Activity Log',
                    subtitle: 'View system activity',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const ActivityLogScreen(),
                        ),
                      );
                    },
                  ),

                  /// Edit Profile
                  _item(
                    iconPath: 'assets/images/icons/manage.png',
                    text: 'Edit Profile',
                    subtitle: 'Edit your account details',
                    onTap: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const EditProfileScreen(),
                        ),
                      );



                      setState(() {
                        profileFuture = ApiService().getProfile();
                      });
                    },
                  ),

                  /// Settings
                  _item(
                    iconPath:
                    'assets/images/icons/settings.png',
                    text: 'Settings',
                    subtitle: 'Manage Notifications',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) =>
                          const SettingsScreen(),
                        ),
                      );
                    },
                  ),


                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _item({
    required String iconPath,
    required String text,
    String? subtitle,
    VoidCallback? onTap,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.symmetric(
        vertical: 14,
        horizontal: 12,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        contentPadding: EdgeInsets.zero,
        leading: Image.asset(
          iconPath,
          width: 24,
          height: 24,
        ),
        title: Text(
          text,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
        subtitle: subtitle != null
            ? Text(
          subtitle,
          style: const TextStyle(fontSize: 12),
        )
            : null,
        trailing: const Icon(
          Icons.arrow_forward_ios,
          size: 16,
        ),
        onTap: onTap,
      ),
    );
  }
}