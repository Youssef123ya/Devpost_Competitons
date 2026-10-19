import 'package:flutter/material.dart';

import '../services/api_service.dart';

class ActivityLogScreen extends StatefulWidget {
  const ActivityLogScreen({super.key});

  @override
  State<ActivityLogScreen> createState() =>
      _ActivityLogScreenState();
}

class _ActivityLogScreenState
    extends State<ActivityLogScreen> {

  final ApiService apiService =
  ApiService();

  /// ================= FILTER =================

  String selectedFilter = "All";

  /// ================= STATES =================

  bool isLoading = true;

  List<dynamic> logs = [];

  @override
  void initState() {
    super.initState();

    loadLogs();
  }

  /// ================= LOAD LOGS =================

  Future<void> loadLogs() async {

    try {

      final data =
      await apiService.getActivityLog(
        selectedFilter,
      );

      if (!mounted) return;

      setState(() {

        logs = data;
      });

    } catch (e) {

      debugPrint(
        "ERROR LOADING LOGS: $e",
      );

    } finally {

      if (!mounted) return;

      setState(() {

        isLoading = false;
      });
    }
  }

  /// ================= FILTER =================

  void openFilter() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(24),
        ),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 20,
              bottom: MediaQuery.of(context).viewInsets.bottom + 20,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                /// handle bar
                Container(
                  width: 45,
                  height: 5,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),

                const SizedBox(height: 20),

                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "Filter",
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Icon(Icons.keyboard_arrow_down),
                  ],
                ),

                const SizedBox(height: 20),

                buildFilterTile("Today"),
                buildFilterTile("Yesterday"),
                buildFilterTile("Last 7 days"),
                buildFilterTile("All"),
              ],
            ),
          ),
        );
      },
    );
  }

  /// ================= FILTER TILE =================

  Widget buildFilterTile(String value) {
    final selected = selectedFilter == value;

    return InkWell(
      onTap: () async {
        setState(() {
          selectedFilter = value;
          isLoading = true;
        });

        Navigator.pop(context);

        await loadLogs();
      },
      child: Padding(
        padding: const EdgeInsets.only(bottom: 18),
        child: Row(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: selected
                      ? const Color(0xff4A90E2)
                      : Colors.grey.shade400,
                  width: 2,
                ),
              ),
              child: selected
                  ? Center(
                child: Container(
                  width: 14,
                  height: 14,
                  decoration: const BoxDecoration(
                    color: Color(0xff4A90E2),
                    shape: BoxShape.circle,
                  ),
                ),
              )
                  : null,
            ),
            const SizedBox(width: 12),
            Text(
              value,
              style: const TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// ================= ICON =================

  IconData getIcon(String type) {

    switch (type.toLowerCase()) {

      case "safe":
        return Icons.check_circle;

      case "warning":
        return Icons.warning_amber_rounded;

      case "danger":
        return Icons.error;

      case "critical":
        return Icons.dangerous;

      case "shutdown":
        return Icons.power_settings_new;

      case "restart":
        return Icons.refresh;

      default:
        return Icons.info;
    }
  }

  /// ================= COLOR =================

  Color getColor(String type) {

    switch (type.toLowerCase()) {

      case "safe":
        return Colors.green;

      case "warning":
        return Colors.orange;

      case "danger":
        return Colors.red;

      case "critical":
        return Colors.redAccent;

      case "shutdown":
        return Colors.red;

      case "restart":
        return Colors.blue;

      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(

      backgroundColor:
      const Color(0xffF8F8F8),

      appBar: AppBar(

        backgroundColor:
        Colors.white,

        elevation: 0,

        foregroundColor:
        Colors.black,

        titleSpacing: 0,

        title: const Text(

          "Activity Log",

          style: TextStyle(

            fontSize: 20,

            fontWeight:
            FontWeight.w600,
          ),
        ),

        actions: [

          Padding(

            padding:
            const EdgeInsets.only(
              right: 16,
            ),

            child: GestureDetector(

              onTap: openFilter,

              child: Container(

                padding:
                const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),

                decoration:
                BoxDecoration(

                  color: Colors.white,

                  border: Border.all(
                    color:
                    Colors.grey.shade300,
                  ),

                  borderRadius:
                  BorderRadius.circular(10),
                ),

                child: Row(

                  children: [

                    Text(
                      selectedFilter,
                      style: const TextStyle(
                        fontWeight: FontWeight.w500,
                      ),
                    ),

                    const SizedBox(width: 4),

                    const Icon(
                      Icons.keyboard_arrow_down,
                      size: 18,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),

      body: isLoading

          ? const Center(
        child:
        CircularProgressIndicator(),
      )

          : logs.isEmpty

          ? const Center(
        child: Text(
          "No Activity Found",
        ),
      )

          : ListView.builder(

        padding:
        const EdgeInsets.all(16),

        itemCount:
        logs.length,

        itemBuilder:
            (context, index) {

          final log =
          logs[index];

          final title =
              log["title"] ?? "";

          final description =
              log["description"] ?? "";

          final time =
              log["time"] ?? "";

          final type =
              log["severityIconType"] ?? "";

          return Container(
            constraints: const BoxConstraints(
              minHeight: 110,
            ),
            margin: const EdgeInsets.only(bottom: 14),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: Color(0xffEAEAEA),
              ),
            ),

            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [

                /// TIME + ICON
                SizedBox(
                  width: 60,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    mainAxisAlignment: MainAxisAlignment.start,
                    children: [

                      Text(
                        time.toString(),
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),

                      const SizedBox(height: 10),

                      Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: getColor(type)
                              .withValues(alpha: 0.12),
                          borderRadius:
                          BorderRadius.circular(8),
                        ),
                        child: Icon(
                          getIcon(type),
                          color: getColor(type),
                          size: 18,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(width: 14),

                /// TITLE + DESCRIPTION
                Expanded(
                  child: Column(
                    crossAxisAlignment:
                    CrossAxisAlignment.start,
                    children: [

                      Text(
                        title,
                        maxLines: 1,
                        overflow:
                        TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontWeight:
                          FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),

                      const SizedBox(height: 4),

                      Text(
                        description,
                        maxLines: 2,
                        overflow:
                        TextOverflow.ellipsis,
                        style: TextStyle(
                          color:
                          Colors.grey.shade600,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}