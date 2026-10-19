import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/user_model.dart';
import '../../models/app_models.dart';
import '../../providers/admission_provider.dart';

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
  // Controllers for all fields
  final nameController = TextEditingController();
  final idController = TextEditingController();
  final ageController = TextEditingController();
  final weightController = TextEditingController();
  final illnessController = TextEditingController();
  final phoneController = TextEditingController();
  final nurseNameController = TextEditingController();

  String selectedGender = "Male";
  bool isLoading = false;

  Future<void> sendPatientRequest() async {
    if (nameController.text.isEmpty || ageController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("الرجاء ملء الاسم والعمر")),
      );
      return;
    }

    setState(() => isLoading = true);

    try {
      final admissionProvider = Provider.of<AdmissionProvider>(context, listen: false);

      // Create admission request with all fields
      final request = AdmissionRequest(
        doctorName: widget.user.userName ?? "Unknown Doctor",
        doctorId: widget.user.id ?? "1",
        patientName: nameController.text,
        patientId: idController.text,  // ✅ إرسال كما هو (حتى لو فارغ)
        age: ageController.text,
        companionPhone: phoneController.text,  // ✅ إرسال كما هو
        gender: selectedGender,
        weight: weightController.text,  // ✅ إرسال كما هو
        illness: illnessController.text,  // ✅ إرسال كما هو
        nurseName: nurseNameController.text,  // ✅ إرسال كما هو
        status: "pending",
        timeSent: DateTime.now().toIso8601String(),
      );

      // Send request via provider
      bool success = await admissionProvider.createAdmissionRequest(request);

      if (!mounted) return;

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("تم إرسال طلب الدخول بنجاح!")),
        );
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("فشل إرسال الطلب. الرجاء المحاولة مرة أخرى.")),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("خطأ: $e")),
      );
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  void dispose() {
    nameController.dispose();
    idController.dispose();
    ageController.dispose();
    weightController.dispose();
    illnessController.dispose();
    phoneController.dispose();
    nurseNameController.dispose();
    super.dispose();
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
          "Add patient",
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            buildField("Name", nameController),
            buildField("ID", idController),
            buildField("Age", ageController, isNumber: true),
            _buildGenderField(),
            buildField("weight", weightController),
            buildField("Illness", illnessController),
            buildField("Companion Phone", phoneController),
            buildField("Nurse Name", nurseNameController),
            const SizedBox(height: 30),
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
          Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xff2F4F9F))),
          const SizedBox(height: 8),
          TextField(
            controller: controller,
            keyboardType: isNumber ? TextInputType.number : TextInputType.text,
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xff6D8FEF))),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xff6D8FEF))),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xff2F4F9F), width: 2)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGenderField() {
    return Padding(
      padding: const EdgeInsets.only(top: 15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Gender", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xff2F4F9F))),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Row(
                  children: [
                    Checkbox(
                      value: selectedGender == "Male",
                      onChanged: (val) => setState(() => selectedGender = "Male"),
                    ),
                    const Text("Male", style: TextStyle(fontSize: 14)),
                  ],
                ),
              ),
              Expanded(
                child: Row(
                  children: [
                    Checkbox(
                      value: selectedGender == "Female",
                      onChanged: (val) => setState(() => selectedGender = "Female"),
                    ),
                    const Text("Female", style: TextStyle(fontSize: 14)),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
