// dart:typed_data no longer required; images are served from backend URLs

import 'package:file_selector/file_selector.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/reports_provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/dio_client.dart';
import '../../models/app_models.dart';

class ReportSection {
  final String title;
  bool isExpanded;

  ReportSection({
    required this.title,
    this.isExpanded = false,
  });
}

class PatientReportsScreen extends StatefulWidget {
  final String? patientId;

  const PatientReportsScreen({super.key, this.patientId});

  @override
  State<PatientReportsScreen> createState() => _PatientReportsScreenState();
}

class _PatientReportsScreenState extends State<PatientReportsScreen> {
  static const Color _primaryBlue = Color(0xFF719EFF);
  static const Color _mainBgColor = Color(0xFFEEF0FB);
  static const Color _customTextColor = Color(0xFF626262);

  final List<ReportSection> _sections = [
    ReportSection(title: 'Radiology', isExpanded: true),
    ReportSection(title: 'Laboratory'),
    ReportSection(title: 'Daily Reports'),
  ];

  final TextEditingController _reportController = TextEditingController();
  String? _resolvedPatientGuid;

  String get _patientId {
    final args = ModalRoute.of(context)?.settings.arguments;
    return widget.patientId ?? (args != null ? args.toString() : 'unknown');
  }

  @override
  void dispose() {
    _reportController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _prepareAndFetch();
    });
  }

  Future<void> _prepareAndFetch() async {
    final raw = _patientId;
    _resolvedPatientGuid = await _resolvePatientGuid(raw);
    final userId = _resolvedPatientGuid ?? raw;
    debugPrint('PatientReportsScreen: resolved patientId raw=$raw resolved=${_resolvedPatientGuid}');
    if (userId.isNotEmpty) {
      await context.read<ReportsProvider>().fetchAttachments(userId);
    }
  }

  /// Resolve the Patient GUID to use for backend operations.
  /// If `raw` already looks like a GUID, return it.
  /// Otherwise query admission records to find matching patient and return its PatientId.
  Future<String?> _resolvePatientGuid(String raw) async {
    if (raw.isEmpty) return null;
    final guidRegex = RegExp(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$');
    if (guidRegex.hasMatch(raw)) return raw;

    try {
      final resp = await DioClient.dio.get('/AdmissionRequest/GetAll');
      if (resp.statusCode == 200 && resp.data != null) {
        dynamic rows = resp.data;
        if (rows is Map && rows['rows'] is List) rows = rows['rows'];
        if (rows is Map && rows['data'] is List) rows = rows['data'];
        if (rows is List) {
          for (var it in rows) {
            try {
              final adm = AdmissionRequest.fromJson(it as Map<String, dynamic>);
              if ((adm.patientId ?? '') == raw || (adm.patientName ?? '').toLowerCase() == raw.toLowerCase()) {
                final candidate = adm.patientId ?? '';
                if (guidRegex.hasMatch(candidate)) return candidate;
              }
            } catch (_) {}
          }
        }
      }
    } catch (e) {
      debugPrint('Patient GUID resolution error: $e');
    }

    return null;
  }

  Future<void> _pickImage(String section) async {
    try {
      final file = await openFile(
        acceptedTypeGroups: [
          XTypeGroup(
            label: 'images',
            extensions: ['jpg', 'jpeg', 'png'],
          ),
        ],
      );
      if (file == null) return;

      final bytes = await file.readAsBytes();
      if (bytes.isEmpty) return;
      if (!mounted) return;

      final auth = Provider.of<AuthProvider>(context, listen: false);
      final currentUser = auth.currentUser ?? auth.user;
      final addBy = currentUser?.userName ?? currentUser?.id ?? 'unknown';

      final provider = context.read<ReportsProvider>();
      final key = section.toLowerCase();
      final String fileName = file.name;
      final List<int> fileBytes = bytes;

      final raw = _patientId;
      final userId = _resolvedPatientGuid ?? raw;
      debugPrint('Uploading for userId: $userId (raw=$raw resolved=${_resolvedPatientGuid})');

      bool success = false;
      if (key == 'radiology') {
        success = await provider.uploadImage(
          userId: userId,
          fileBytes: fileBytes,
          fileName: fileName,
          addBy: addBy,
          type: ReportsProvider.TYPE_SCAN,
        );
      } else if (key == 'laboratory') {
        success = await provider.uploadImage(
          userId: userId,
          fileBytes: fileBytes,
          fileName: fileName,
          addBy: addBy,
          type: ReportsProvider.TYPE_ANALYSIS,
        );
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(success ? 'Image uploaded ✅' : 'Upload failed')),
      );
    } catch (e) {
      debugPrint('Pick error: $e');
    }
  }

  void _showImagePreview(BuildContext context, String sectionKey, int index, Map<String, dynamic> attachmentData) {
    final fileUrl = attachmentData['fileUrl'] as String? ?? '';
    final attachmentId = attachmentData['id'] as int? ?? 0;
    
    final previewUrl = Uri.parse(fileUrl).toString();
    showDialog(
      context: context,
      barrierDismissible: true,
      barrierColor: Colors.black87,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: EdgeInsets.zero,
        child: Stack(
          children: [
            GestureDetector(
              onTap: () => Navigator.pop(ctx),
              child: Container(
                width: double.infinity,
                height: double.infinity,
                color: Colors.transparent,
                child: InteractiveViewer(
                  panEnabled: true,
                  scaleEnabled: true,
                  minScale: 0.5,
                  maxScale: 4.0,
                  child: Image.network(
                    previewUrl,
                    fit: BoxFit.contain,
                    loadingBuilder: (c, child, progress) {
                      if (progress == null) return child;
                      return const Center(child: CircularProgressIndicator());
                    },
                    errorBuilder: (c, e, s) => const Center(
                      child: Icon(Icons.broken_image, color: Colors.white, size: 80),
                    ),
                  ),
                ),
              ),
            ),
            Positioned(
              top: 40,
              left: 16,
              child: GestureDetector(
                onTap: () => Navigator.pop(ctx),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.close, color: Colors.white, size: 24),
                ),
              ),
            ),
            Positioned(
              bottom: 60,
              right: 24,
              child: GestureDetector(
                onTap: () async {
                  final confirm = await showDialog<bool>(
                    context: ctx,
                    builder: (c) => AlertDialog(
                      title: const Text('Delete Image'),
                      content: const Text('Are you sure you want to delete this image?'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(c, false),
                          child: const Text('Cancel'),
                        ),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.red,
                          ),
                          onPressed: () => Navigator.pop(c, true),
                          child: const Text(
                            'Delete',
                            style: TextStyle(color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                  );

                  if (confirm == true) {
                    final userId = _resolvedPatientGuid ?? _patientId;
                    final success = await context.read<ReportsProvider>()
                        .deleteAttachment(attachmentId, userId);
                    if (mounted) {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(success ? 'Image deleted ✅' : 'Delete failed')),
                      );
                    }
                  }
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.red,
                    borderRadius: BorderRadius.circular(30),
                    boxShadow: [
                      const BoxShadow(
                        color: Color.fromRGBO(255, 0, 0, 0.4),
                        blurRadius: 10,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: const [
                      Icon(Icons.delete, color: Colors.white, size: 22),
                      SizedBox(width: 8),
                      Text(
                        'Delete',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _addDailyReport() {
    _reportController.clear();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Daily Report'),
        content: TextField(
          controller: _reportController,
          maxLines: 4,
          decoration: const InputDecoration(hintText: 'Write report here...'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              final text = _reportController.text.trim();
              if (text.isEmpty) return;
              context.read<ReportsProvider>().addDailyReport(_patientId, text);
              _reportController.clear();
              Navigator.pop(ctx);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final reportsProvider = context.watch<ReportsProvider>();
    final radiologyImages = reportsProvider.getRadiology(_patientId);
    final labImages = reportsProvider.getLaboratory(_patientId);
    final dailyReports = reportsProvider.getDailyReports(_patientId);

    return Scaffold(
      backgroundColor: _mainBgColor,
      body: Column(
        children: [
          _buildHeader(context),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              itemCount: _sections.length,
              itemBuilder: (context, index) {
                final section = _sections[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: _buildSection(section, radiologyImages, labImages, dailyReports),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      color: _primaryBlue,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              GestureDetector(
                onTap: () => Navigator.maybePop(context),
                child: const Icon(Icons.arrow_back, color: Colors.white, size: 24),
              ),
              const Expanded(
                child: Text(
                  'Patient Reports',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w700),
                ),
              ),
              const SizedBox(width: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSection(
    ReportSection section,
    List<Map<String, dynamic>> radiologyImages,
    List<Map<String, dynamic>> labImages,
    List<String> dailyReports,
  ) {
    Widget content;
    if (section.title == 'Radiology') {
      content = _buildImageSection(radiologyImages, 'No radiology images yet.', 'radiology');
    } else if (section.title == 'Laboratory') {
      content = _buildImageSection(labImages, 'No laboratory images yet.', 'laboratory');
    } else {
      content = _buildDailyReportsSection(dailyReports);
    }

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Column(
          children: [
            InkWell(
              onTap: () => setState(() => section.isExpanded = !section.isExpanded),
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(section.title, style: const TextStyle(fontWeight: FontWeight.w700, color: _customTextColor)),
                    ),
                    Icon(section.isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down, color: _customTextColor),
                  ],
                ),
              ),
            ),
            if (section.isExpanded) ...[
              const Divider(height: 1),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                child: content,
              ),
              _buildActionButton(section),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildImageSection(List<Map<String, dynamic>> images, String emptyMessage, String sectionKey) {
    if (images.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 18),
        child: Text(emptyMessage, style: const TextStyle(color: Colors.grey)),
      );
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: images.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
        childAspectRatio: 1,
      ),
      itemBuilder: (context, index) {
        final attachmentData = images[index];
        final url = attachmentData['fileUrl'] as String? ?? '';
        return GestureDetector(
          onTap: () => _showImagePreview(context, sectionKey, index, attachmentData),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.network(
              Uri.parse(url).toString(),
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => const Icon(Icons.broken_image),
            ),
          ),
        );
      },
    );
  }

  Widget _buildDailyReportsSection(List<String> dailyReports) {
    if (dailyReports.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 18),
        child: Text('No daily reports yet.', style: TextStyle(color: Colors.grey)),
      );
    }

    return Column(
      children: dailyReports.map((report) {
        return Container(
          width: double.infinity,
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFF6F7FF),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE5E9FF)),
          ),
          child: Text(report, style: const TextStyle(color: _customTextColor, fontSize: 14)),
        );
      }).toList(),
    );
  }

  Widget _buildActionButton(ReportSection section) {
    final isDaily = section.title == 'Daily Reports';
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      child: Align(
        alignment: Alignment.centerLeft,
        child: GestureDetector(
          onTap: () => isDaily ? _addDailyReport() : _pickImage(section.title),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(color: _primaryBlue, borderRadius: BorderRadius.circular(20)),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(isDaily ? Icons.note_add : Icons.add_photo_alternate, color: Colors.white, size: 18),
                const SizedBox(width: 6),
                Text(isDaily ? 'Add Report' : 'Add Photo', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
