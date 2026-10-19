import 'package:flutter/material.dart';

class Welcome2Screen extends StatelessWidget {
  const Welcome2Screen({super.key});

  @override
  Widget build(BuildContext context) {
    // حساب أبعاد الشاشة للتجاوب
    final double screenHeight = MediaQuery.of(context).size.height;
    final double screenWidth = MediaQuery.of(context).size.width;

    return Scaffold(
      backgroundColor: const Color(0xFFEDF3FF),
      body: Stack(
        children: [
          /// 1. الصورة الكبيرة في الخلفية
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: screenHeight * 0.65, // تاخد 65% من الشاشة عشان تنزل تحت الكارد
            child: Image.asset(
              "assets/welcome2.jpg",
              fit: BoxFit.cover, // عشان تملأ العرض بالكامل
              alignment: Alignment.center,
            ),
          ),

          /// 2. أزرار التنقل (الرجوع والتالي) عايمة فوق الصورة
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.arrow_back_ios, color: Color(0xFFFFFFFF), size: 28),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pushNamed(context, '/welcome3'),
                    icon: const Icon(Icons.arrow_forward_ios, color: Color(0xFFFFFFFF), size: 28),
                  ),
                ],
              ),
            ),
          ),

          /// 3. الكارد الأزرق السفلي
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              width: screenWidth,
              height: screenHeight * 0.45, // يغطي 45% من أسفل الشاشة
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

                  // النص
                  const Text(
                    "Choose a task, complete it, and track your progress effortlessly!",
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
                      onPressed: () => Navigator.pushNamed(context, '/welcome3'),
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

                  // مؤشر الصفحات (الـ Dot الثانية هي النشطة)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildDot(false),
                      const SizedBox(width: 6),
                      _buildDot(true),
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

  // رسم النقطة (Dot)
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