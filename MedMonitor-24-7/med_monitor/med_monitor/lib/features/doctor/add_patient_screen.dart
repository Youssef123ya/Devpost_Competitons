import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../models/user_model.dart';
import '../../providers/doctor_provider.dart';

class AddPatientScreen extends StatefulWidget {
  final UserModel user;
  final Function(UserModel) onUpdate;

  const AddPatientScreen({
    super.key,
    required this.user,
    required this.onUpdate,
  });

  @override
  State<AddPatientScreen> createState() => _AddPatientScreenState();
}

class _AddPatientScreenState extends State<AddPatientScreen> {
  // ✅ الحقول المطلوبة فقط:
  final nameController = TextEditingController();
  final idController = TextEditingController();
  final ageController = TextEditingController();
  final weightController = TextEditingController();
  final illnessController = TextEditingController();
  final companionPhoneController = TextEditingController();

  String? selectedGender; // ✅ Dropdown للنوع
  String? selectedNurseName;
  List<String> nurseNames = [];
  bool _loadingNurses = false;
  bool isLoading = false;

  /// ✅ إرسال طلب الدخول مع جميع البيانات المطلوبة
  Future<void> sendPatientRequest() async {
    // التحقق من البيانات المطلوبة
    if (nameController.text.isEmpty ||
        idController.text.isEmpty ||
        ageController.text.isEmpty ||
        selectedGender == null ||
        weightController.text.isEmpty ||
        illnessController.text.isEmpty ||
        companionPhoneController.text.isEmpty ||
        selectedNurseName == null ||
        selectedNurseName!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please fill in all fields.")),
      );
      return;
    }

    setState(() => isLoading = true);

    try {
      final doctorProvider = Provider.of<DoctorProvider>(context, listen: false);

      // ✅ إرسال جميع البيانات المطلوبة
      bool success = await doctorProvider.createAdmissionRequest(
        doctorId: widget.user.id ?? "1",
        patientName: nameController.text,
        patientId: idController.text,
        age: int.tryParse(ageController.text) ?? 0,
        gender: selectedGender!,
        weight: int.tryParse(weightController.text) ?? 0,
        illness: illnessController.text,
        companionPhone: companionPhoneController.text,
        nurseName: selectedNurseName ?? '',
        status: 0, // Pending
      );

      if (!mounted) return;

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Login request submitted successfully!")),
        );
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Request submission failed. Please try again.")),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("حدث خطأ: $e")),
        );
      }
    } finally {
      if (mounted) {
        setState(() => isLoading = false);
      }
    }
  }

  @override
  void initState() {
    super.initState();
    _fetchNurses();
  }

  Future<void> _fetchNurses() async {
    setState(() => _loadingNurses = true);
    try {
      print('=== FETCHING NURSES DEBUG ===');
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      final doctorProvider = Provider.of<DoctorProvider>(context, listen: false);
      print('API URL: ${doctorProvider.baseUrl}/Users');
      print('Token exists: ${token != null && token.isNotEmpty}');
      print('Token preview: ${token != null && token.length >= 20 ? token.substring(0, 20) + '...' : token ?? 'null'}');
      final nurses = await doctorProvider.fetchNurses();
      print('Fetch nurses returned count: ${nurses.length}');
      if (!mounted) return;
      setState(() {
        nurseNames = nurses
            .map((e) => e.userName ?? e.email ?? '')
            .where((name) => name.isNotEmpty)
            .toList();
      });
      print('Nurse names after mapping: $nurseNames');
      print('=============================');
    } catch (e, stackTrace) {
      print('ERROR fetching nurses: $e');
      print('Stack trace: $stackTrace');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("فشل جلب بيانات الممرضات: $e")),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _loadingNurses = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffE9EEF6),
      appBar: AppBar(
        backgroundColor: const Color(0xff6D8FEF),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        centerTitle: true,
        title: const Text(
          "Add Patient",
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ✅ Name
            buildField("Name", nameController),

            // ✅ ID
            buildField("ID", idController),

            // ✅ Age
            buildField("Age", ageController, isNumber: true),

            // ✅ Gender (ذكر/أنثى)
            Padding(
              padding: const EdgeInsets.only(top: 15),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Gender",
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xff2F4F9F)),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    initialValue: selectedGender,
                    items: const [
                      DropdownMenuItem(value: 'Male', child: Text('Male')),
                      DropdownMenuItem(value: 'Female', child: Text('Female')),
                    ],
                    onChanged: (value) {
                      setState(() => selectedGender = value);
                    },
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(15),
                        borderSide: const BorderSide(color: Color(0xff6D8FEF)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(15),
                        borderSide: const BorderSide(color: Color(0xff6D8FEF)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(15),
                        borderSide: const BorderSide(color: Color(0xff2F4F9F), width: 2),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // ✅ Weight
            buildField("Weight", weightController, isNumber: true),

            // ✅ Illness
            buildField("Illness", illnessController),

            // ✅ Companion Phone
            buildField("Companion Phone", companionPhoneController),

            // ✅ Nurse Name
            Padding(
              padding: const EdgeInsets.only(top: 15),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Nurse Name",
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xff2F4F9F)),
                  ),
                  const SizedBox(height: 8),
                  _loadingNurses
                      ? Container(
                          height: 60,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xff5B8DEF)),
                          ),
                          child: const CircularProgressIndicator(color: Color(0xff5B8DEF)),
                        )
                      : DropdownButtonFormField<String>(
                          initialValue: selectedNurseName,
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: Colors.white,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Color(0xFF5B8DEF)),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Color(0xFF5B8DEF)),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(color: Color(0xFF5B8DEF), width: 2),
                            ),
                          ),
                          hint: Text(nurseNames.isEmpty
                              ? 'No nurses available'
                              : 'Select a nurse'),
                          icon: const Icon(Icons.arrow_drop_down, color: Color(0xFF5B8DEF)),
                          items: nurseNames.map((name) {
                            return DropdownMenuItem<String>(
                              value: name,
                              child: Text(name),
                            );
                          }).toList(),
                          onChanged: nurseNames.isEmpty
                              ? null
                              : (value) {
                                  setState(() => selectedNurseName = value);
                                },
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Please select a nurse';
                            }
                            return null;
                          },
                        ),
                ],
              ),
            ),

            const SizedBox(height: 30),

            // ✅ Send Button
            SizedBox(
              width: double.infinity,
              height: 55,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xff6D8FEF),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                ),
                onPressed: isLoading ? null : sendPatientRequest,
                child: isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text(
                      "Send Request",
                      style: TextStyle(fontSize: 17, color: Colors.white, fontWeight: FontWeight.bold),
                    ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget buildField(String title, TextEditingController controller, {bool isNumber = false}) {
    return Padding(
      padding: const EdgeInsets.only(top: 15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xff2F4F9F))),
          const SizedBox(height: 8),
          TextField(
            controller: controller,
            keyboardType: isNumber ? TextInputType.number : TextInputType.text,
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: const BorderSide(color: Color(0xff6D8FEF))),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: const BorderSide(color: Color(0xff6D8FEF))),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: const BorderSide(color: Color(0xff2F4F9F), width: 2)),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    nameController.dispose();
    idController.dispose();
    ageController.dispose();
    weightController.dispose();
    illnessController.dispose();
    companionPhoneController.dispose();
    super.dispose();
  }
}