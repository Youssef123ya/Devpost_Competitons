import 'package:flutter/material.dart';

class Welcome1Screen extends StatelessWidget {
  const Welcome1Screen({super.key});

  @override
  Widget build(BuildContext context) {
    // حساب أبعاد الشاشة عشان التصميم يكون متناسق على كل الموبايلات
    final double screenHeight = MediaQuery.of(context).size.height;
    final double screenWidth = MediaQuery.of(context).size.width;

    return Scaffold(
      backgroundColor: const Color(0xFFEDF3FF),
      body: Stack(
        children: [
          /// 1. صورة الدكاترة (الخلفية العلويّة)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: screenHeight * 0.65, // الصورة بتاخد 65% من طول الشاشة عشان تفرش تحت الكارد
            child: Image.asset(
              "assets/welcome_1.jpg",
              fit: BoxFit.cover, // أهم سطر: بيخلي الصورة تملأ العرض بالكامل وتلمس الحواف
              alignment: Alignment.topCenter,
            ),
          ),

          /// 2. سهم التنقل (موجود فوق الصورة في أقصى اليمين)
          SafeArea(
            child: Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: const EdgeInsets.only(top: 10, right: 10),
                child: IconButton(
                  onPressed: () => Navigator.pushNamed(context, '/welcome2'),
                  icon: const Icon(
                    Icons.arrow_forward_ios,
                    color: Color(0xFFFFFFFF),
                    size: 28,
                  ),
                ),
              ),
            ),
          ),

          /// 3. الكارد الأزرق اللي تحت
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              width: screenWidth,
              height: screenHeight * 0.45, // الكارد بياخد 45% من الشاشة عشان يغطي طرف الصورة
              padding: const EdgeInsets.fromLTRB(24, 35, 24, 20),
              decoration: const BoxDecoration(
                color: Color(0xFFDBE7FF),
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(50),
                  topRight: Radius.circular(50),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 10,
                    offset: Offset(0, -5),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // اللوجو
                  Image.asset(
                    "assets/logo.png",
                    height: 65,
                  ),

                  const SizedBox(height: 25),

                  // النص التوضيحي
                  const Text(
                    "Group of doctor and nurse for quick and easy connect in ICU",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 19,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF2E55A7),
                      height: 1.3,
                    ),
                  ),

                  const Spacer(),

                  // زرار Next
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF719EFF),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(15),
                        ),
                      ),
                      onPressed: () => Navigator.pushNamed(context, '/welcome2'),
                      child: const Text(
                        "Next",
                        style: TextStyle(
                          fontSize: 18,
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 25),

                  // مؤشر الصفحات (Dots)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildDot(true),
                      const SizedBox(width: 6),
                      _buildDot(false),
                      const SizedBox(width: 6),
                      _buildDot(false),
                    ],
                  ),
                  const SizedBox(height: 10),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ميثود مساعدة لرسم النقط (Dots)
  Widget _buildDot(bool isActive) {
    return Container(
      width: 40,
      height: 6,
      decoration: BoxDecoration(
        color: isActive ? const Color(0xFF2E55A7) : Colors.white,
        borderRadius: BorderRadius.circular(10),
      ),
    );
  }
}