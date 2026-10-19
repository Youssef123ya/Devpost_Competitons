import 'package:flutter/material.dart';

import '../services/api_service.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() =>
      _ChatScreenState();
}

class _ChatScreenState
    extends State<ChatScreen> {

  final TextEditingController controller =
  TextEditingController();

  final ScrollController scrollController =
  ScrollController();

  final ApiService apiService =
  ApiService();

  bool isLoading = false;

  List<Map<String, dynamic>> messages = [

    {
      "text": "How can i assist you?",
      "isUser": false,
    }
  ];

  /// ================= SEND MESSAGE =================
  Future<void> sendMessage() async {

    final message =
    controller.text.trim();

    if (message.isEmpty) return;

    setState(() {

      messages.add({

        "text": message,
        "isUser": true,
      });

      isLoading = true;
    });

    controller.clear();

    scrollToBottom();

    try {

      final reply =
      await apiService.sendMessage(
        message,
      );

      setState(() {

        messages.add({

          "text": reply,
          "isUser": false,
        });
      });

    } catch (e) {

      setState(() {

        messages.add({

          "text":
          "Connection error",

          "isUser": false,
        });
      });
    }

    setState(() {

      isLoading = false;
    });

    scrollToBottom();
  }

  /// ================= AUTO SCROLL =================
  void scrollToBottom() {

    Future.delayed(
      const Duration(milliseconds: 300),
          () {

        if (scrollController.hasClients) {

          scrollController.animateTo(

            scrollController
                .position
                .maxScrollExtent,

            duration:
            const Duration(
              milliseconds: 300,
            ),

            curve: Curves.easeOut,
          );
        }
      },
    );
  }

  /// ================= CHAT BUBBLE =================
  Widget chatBubble(
      String text,
      bool isUser,
      ) {

    return Padding(

      padding:
      const EdgeInsets.only(
        bottom: 14,
      ),

      child: Row(

        crossAxisAlignment:
        CrossAxisAlignment.start,

        mainAxisAlignment:
        isUser
            ? MainAxisAlignment.end
            : MainAxisAlignment.start,

        children: [

          /// AI ICON
          if (!isUser)
            Container(

              margin:
              const EdgeInsets.only(
                right: 8,
                top: 2,
              ),

              child: Image.asset(

                "assets/images/icons/ai.png",

                width: 22,
                height: 22,
              ),
            ),

          /// MESSAGE
          Flexible(

            child: Container(

              padding:
              const EdgeInsets.symmetric(

                horizontal: 14,
                vertical: 12,
              ),

              constraints: BoxConstraints(

                maxWidth:
                MediaQuery.of(context)
                    .size
                    .width *
                    0.68,
              ),

              decoration: BoxDecoration(

                color: isUser
                    ? const Color(
                  0xff1E63D5,
                )
                    : const Color(
                  0xffEEF2F5,
                ),

                borderRadius:
                BorderRadius.only(

                  topLeft:
                  const Radius.circular(12),

                  topRight:
                  const Radius.circular(12),

                  bottomLeft:
                  Radius.circular(
                    isUser ? 12 : 4,
                  ),

                  bottomRight:
                  Radius.circular(
                    isUser ? 4 : 12,
                  ),
                ),
              ),

              child: Text(

                text,

                style: TextStyle(

                  color: isUser
                      ? Colors.white
                      : Colors.black87,

                  fontSize: 13,

                  height: 1.4,

                  fontWeight:
                  FontWeight.w400,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(

      backgroundColor: Colors.white,

      /// ================= APP BAR =================
      appBar: AppBar(

        backgroundColor: Colors.white,

        elevation: 0,

        centerTitle: true,

        leading: IconButton(

          onPressed: () {

            Navigator.pop(context);
          },

          icon: const Icon(

            Icons.arrow_back_ios_new,

            color: Colors.black,

            size: 18,
          ),
        ),

        title: const Text(

          "Ai assistant",

          style: TextStyle(

            color: Colors.black,

            fontSize: 16,

            fontWeight:
            FontWeight.w500,
          ),
        ),
      ),

      /// ================= BODY =================
      body: SafeArea(

        child: Column(

          children: [

            /// CHAT LIST
            Expanded(

              child: ListView.builder(

                controller:
                scrollController,

                padding:
                const EdgeInsets.symmetric(

                  horizontal: 16,
                  vertical: 14,
                ),

                itemCount:
                messages.length,

                itemBuilder:
                    (context, index) {

                  return chatBubble(

                    messages[index]["text"],

                    messages[index]["isUser"],
                  );
                },
              ),
            ),

            /// LOADING
            if (isLoading)
              const Padding(

                padding:
                EdgeInsets.only(
                  bottom: 10,
                ),

                child:
                CircularProgressIndicator(
                  strokeWidth: 2,
                ),
              ),

            /// INPUT FIELD
            Container(

              padding:
              const EdgeInsets.fromLTRB(
                16,
                6,
                16,
                16,
              ),

              color: Colors.white,

              child: Row(

                children: [

                  /// TEXT FIELD
                  Expanded(

                    child: Container(

                      height: 48,

                      padding:
                      const EdgeInsets.symmetric(
                        horizontal: 14,
                      ),

                      decoration: BoxDecoration(

                        borderRadius:
                        BorderRadius.circular(
                          14,
                        ),

                        border: Border.all(

                          color:
                          const Color(
                            0xffD9D9D9,
                          ),
                        ),
                      ),

                      alignment:
                      Alignment.center,

                      child: TextField(

                        controller:
                        controller,

                        onSubmitted: (_) {

                          sendMessage();
                        },

                        decoration:
                        const InputDecoration(

                          border:
                          InputBorder.none,

                          hintText:
                          "Type a message",

                          hintStyle:
                          TextStyle(

                            fontSize: 13,

                            color:
                            Colors.grey,
                          ),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(
                    width: 10,
                  ),

                  /// SEND BUTTON
                  GestureDetector(

                    onTap:
                    sendMessage,

                    child: Container(

                      width: 42,
                      height: 42,

                      decoration:
                      const BoxDecoration(

                        color:
                        Color(
                          0xff1E63D5,
                        ),

                        shape:
                        BoxShape.circle,
                      ),

                      child: const Icon(

                        Icons.send_rounded,

                        color:
                        Colors.white,

                        size: 20,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}