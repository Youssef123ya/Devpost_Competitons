import 'package:flutter/material.dart';

class RecipeCard extends StatefulWidget {
  final Map<String, dynamic> recipe;

  final VoidCallback? onTap;

  final Future<void> Function(String recipeId)? onSave;

  final bool initiallySaved;

  const RecipeCard({
    super.key,
    required this.recipe,
    this.onTap,
    this.onSave,
    this.initiallySaved = false,
  });

  @override
  State<RecipeCard> createState() => _RecipeCardState();
}

class _RecipeCardState extends State<RecipeCard> {
  late bool isSaved;

  @override
  void initState() {
    super.initState();

    isSaved =
        widget.recipe["isFavorite"] ??
            widget.initiallySaved;
  }

  @override
  void didUpdateWidget(
      covariant RecipeCard oldWidget,
      ) {
    super.didUpdateWidget(oldWidget);

    if (oldWidget.recipe != widget.recipe) {
      isSaved =
          widget.recipe["isFavorite"] ??
              widget.initiallySaved;
    }
  }

  @override
  Widget build(BuildContext context) {
    final imageUrl =
        widget.recipe['image']?.toString() ??
            widget.recipe['imageUrl']?.toString() ??
            "";

    final title =
        widget.recipe['title']?.toString() ??
            widget.recipe['name']?.toString() ??
            "Recipe";

    final calories =
        widget.recipe['calories']?.toString() ?? "0 kcal";

    final time =
        widget.recipe['time']?.toString() ?? "0 min";

    final recipeId =
        widget.recipe['id']?.toString() ??
            "";

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius:
        BorderRadius.circular(22),

        onTap: widget.onTap,

        child: Container(
          width: 165,

          decoration: BoxDecoration(
            color: Colors.white,

            borderRadius:
            BorderRadius.circular(22),

            boxShadow: [
              BoxShadow(
                color: Colors.black
                    .withValues(
                  alpha: 0.06,
                ),

                blurRadius: 14,

                offset:
                const Offset(0, 6),
              ),
            ],
          ),

          child: Column(
            crossAxisAlignment:
            CrossAxisAlignment.start,

            children: [
              /// IMAGE
              ClipRRect(
                borderRadius:
                const BorderRadius
                    .vertical(
                  top:
                  Radius.circular(
                    22,
                  ),
                ),

                child: Image.network(
                  imageUrl,

                  height: 125,

                  width:
                  double.infinity,

                  fit: BoxFit.cover,

                  errorBuilder:
                      (
                      context,
                      error,
                      stackTrace,
                      ) {
                    return Container(
                      height: 125,

                      color:
                      Colors.grey[
                      300],

                      child:
                      const Center(
                        child: Icon(
                          Icons
                              .broken_image,
                        ),
                      ),
                    );
                  },
                ),
              ),

              /// CONTENT
              Expanded(
                child: Padding(
                  padding:
                  const EdgeInsets
                      .symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),

                  child: Column(
                    crossAxisAlignment:
                    CrossAxisAlignment
                        .start,

                    children: [
                      /// TITLE + SAVE
                      Row(
                        crossAxisAlignment:
                        CrossAxisAlignment
                            .start,

                        children: [
                          Expanded(
                            child: Text(
                              title,

                              maxLines: 2,

                              overflow:
                              TextOverflow
                                  .ellipsis,

                              style:
                              const TextStyle(
                                fontSize:
                                15,

                                fontWeight:
                                FontWeight
                                    .w700,
                              ),
                            ),
                          ),

                          const SizedBox(
                            width: 6,
                          ),

                          InkWell(
                            borderRadius:
                            BorderRadius
                                .circular(
                              20,
                            ),

                            onTap:
                                () async {
                              final oldValue =
                                  isSaved;

                              setState(() {
                                isSaved =
                                !isSaved;
                              });

                              try {
                                if (widget
                                    .onSave !=
                                    null) {
                                  await widget
                                      .onSave!(
                                    recipeId,
                                  );
                                }
                              } catch (e) {
                                setState(() {
                                  isSaved =
                                      oldValue;
                                });
                              }
                            },

                            child:
                            Padding(
                              padding:
                              const EdgeInsets
                                  .all(
                                2,
                              ),

                              child:
                              AnimatedSwitcher(
                                duration:
                                const Duration(
                                  milliseconds:
                                  200,
                                ),

                                child:
                                Icon(
                                  isSaved
                                      ? Icons
                                      .bookmark
                                      : Icons
                                      .bookmark_border_rounded,

                                  key:
                                  ValueKey(
                                    isSaved,
                                  ),

                                  size:
                                  22,

                                  color: isSaved
                                      ? Colors
                                      .black
                                      : Colors
                                      .grey
                                      .shade500,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),

                      const Spacer(),

                      /// INFO
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              "$calories kcal",

                              overflow:
                              TextOverflow
                                  .ellipsis,

                              style:
                              TextStyle(
                                fontSize:
                                11,

                                color: Colors
                                    .grey
                                    .shade600,

                                fontWeight:
                                FontWeight
                                    .w500,
                              ),
                            ),
                          ),

                          const SizedBox(
                            width: 8,
                          ),

                          Container(
                            width: 1,

                            height: 12,

                            color:
                            Colors
                                .grey
                                .shade400,
                          ),

                          const SizedBox(
                            width: 8,
                          ),

                          Expanded(
                            child: Text(
                              time,

                              overflow:
                              TextOverflow
                                  .ellipsis,

                              style:
                              TextStyle(
                                fontSize:
                                11,

                                color: Colors
                                    .grey
                                    .shade600,

                                fontWeight:
                                FontWeight
                                    .w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
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