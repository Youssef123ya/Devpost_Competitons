namespace UXFriends.Infrastructure.Data;

public sealed record CourseReferenceDefinition(
    string LabelAr,
    string LabelEn
);

public sealed record CourseQuizQuestionDefinition(
    string Code,
    string PromptAr,
    string PromptEn,
    IReadOnlyList<string> OptionsAr,
    IReadOnlyList<string> OptionsEn,
    int CorrectOptionIndex,
    string HintAr,
    string HintEn,
    string ExplanationAr,
    string ExplanationEn,
    string? RelatedLessonCode = null,
    string QuestionType = "single",
    IReadOnlyList<string>? OptionVisualKeys = null
);

public sealed record CourseLessonDefinition(
    string Code,
    string TitleAr,
    string TitleEn,
    string DescriptionAr,
    string DescriptionEn,
    string OverviewAr,
    string OverviewEn,
    IReadOnlyList<string> KeyPointsAr,
    IReadOnlyList<string> KeyPointsEn,
    string PracticeAr,
    string PracticeEn,
    string TakeawayAr,
    string TakeawayEn,
    int DurationMinutes,
    int XpReward,
    string VisualKey,
    string VisualCaptionAr,
    string VisualCaptionEn,
    IReadOnlyList<CourseReferenceDefinition> References,
    IReadOnlyList<CourseQuizQuestionDefinition> QuizQuestions
);

public sealed record CourseUnitDefinition(
    string Code,
    string TitleAr,
    string TitleEn,
    string DescriptionAr,
    string DescriptionEn,
    int DurationMinutes,
    int XpReward,
    IReadOnlyList<string> OutcomesAr,
    IReadOnlyList<string> OutcomesEn,
    int QuizPassThreshold,
    int QuizXpReward,
    int QuizTimeLimitMinutes,
    IReadOnlyList<CourseLessonDefinition> Lessons
);

public sealed record CourseProjectCriterionDefinition(
    string LabelAr,
    string LabelEn,
    int Weight
);

public sealed record CourseProjectDefinition(
    string Code,
    string TitleAr,
    string TitleEn,
    string DescriptionAr,
    string DescriptionEn,
    string RequirementsAr,
    string RequirementsEn,
    int EstimatedHours,
    int XpReward,
    IReadOnlyList<string> DeliverablesAr,
    IReadOnlyList<string> DeliverablesEn,
    IReadOnlyList<CourseProjectCriterionDefinition> Criteria
);

public sealed record CourseSectionDefinition(
    string Code,
    string TitleAr,
    string TitleEn,
    string DescriptionAr,
    string DescriptionEn,
    string Icon,
    string Level,
    int ExamPassThreshold,
    int ExamXpReward,
    int ExamTimeLimitMinutes,
    CourseProjectDefinition Project,
    IReadOnlyList<CourseUnitDefinition> Units
);

public static class CourseBlueprintCatalog
{
    private static readonly IReadOnlyList<CourseSectionDefinition> SeedSections =
    [
        new(
            "ux-foundations",
            "أساسيات التفكير في UX",
            "UX Foundations",
            "ابدأ من طريقة التفكير الصحيحة: فهم المستخدم، صياغة المشكلة، ورسم الرحلة قبل أي شاشة.",
            "Start with the right mindset: understand users, frame problems, and map journeys before drawing screens.",
            "🧭",
            "beginner",
            75,
            220,
            18,
            new CourseProjectDefinition(
                "ux-foundations-mobile-onboarding",
                "مشروع المستوى المبتدئ: رحلة تسجيل موجهة",
                "Beginner Capstone: Guided Onboarding Flow",
                "صمّم رحلة تسجيل واختيار اهتمامات لتطبيق جديد مع توضيح كيف خففت التردد ورفعت الوضوح في كل خطوة.",
                "Design a signup and preference-selection flow for a new product, and explain how each step reduces hesitation and improves clarity.",
                "قدّم خريطة رحلة مختصرة، وتدفق المستخدم، و3 إلى 5 شاشات low-fi مع شرح القرارات الأساسية.",
                "Submit a short journey map, a task flow, and 3 to 5 low-fidelity screens with a rationale for the core decisions.",
                5,
                320,
                [
                    "خريطة رحلة من 4 إلى 6 خطوات",
                    "تدفق مستخدم واضح مع نقطة دخول وخروج",
                    "3 إلى 5 شاشات low-fi",
                    "شرح من 150 إلى 250 كلمة لقرارات UX"
                ],
                [
                    "A 4 to 6 step journey map",
                    "A clear user flow with an entry and exit point",
                    "3 to 5 low-fidelity screens",
                    "A 150 to 250 word UX rationale"
                ],
                [
                    new CourseProjectCriterionDefinition("وضوح المشكلة", "Problem clarity", 25),
                    new CourseProjectCriterionDefinition("تسلسل الرحلة", "Journey sequencing", 30),
                    new CourseProjectCriterionDefinition("بساطة الشاشات", "Screen simplicity", 20),
                    new CourseProjectCriterionDefinition("تبرير القرارات", "Decision rationale", 25)
                ]),
            [
                new CourseUnitDefinition(
                    "ux-mindset",
                    "عقلية المصمم المتمركز حول المستخدم",
                    "The User-Centered Mindset",
                    "افهم لماذا يبدأ UX من سلوك الناس ونتائجهم وليس من الذوق البصري فقط.",
                    "Understand why UX starts from human behavior and outcomes, not visual taste alone.",
                    56,
                    260,
                    [
                        "تمييز الفرق بين حاجة المستخدم والواجهة التي تلبيها.",
                        "ربط القيمة بين المستخدم والمنتج والعمل.",
                        "استخدام عدسات بسيطة لاكتشاف الاحتكاك مبكراً."
                    ],
                    [
                        "Differentiate between a user need and the interface that serves it.",
                        "Connect value across user, product, and business goals.",
                        "Use simple lenses to spot friction early."
                    ],
                    70,
                    140,
                    8,
                    [
                        new CourseLessonDefinition(
                            "human-centered-lens",
                            "عدسة الإنسان قبل الشاشة",
                            "Start With Humans, Not Screens",
                            "كيف تحوّل هدف المستخدم إلى قرار تصميم واضح.",
                            "How to translate a user goal into a clear design decision.",
                            "المنتجات الناجحة لا تبدأ بسؤال: كيف ستبدو الشاشة؟ بل تبدأ بسؤال: ما الذي يحاول الشخص إنجازه؟ عندما تفهم المهمة، يصبح ترتيب المعلومات والحركة داخل الواجهة أسهل بكثير.",
                            "Strong products do not start with “what should the screen look like?” They start with “what is the person trying to achieve?” Once the task is clear, the layout and flow become much easier to shape.",
                            [
                                "اكتب المهمة الأساسية بعبارة فعلية مثل: العثور، الحجز، الإرسال، أو المقارنة.",
                                "افصل بين ما يحتاجه المستخدم فعلاً وما يريده الفريق أن يراه أولاً.",
                                "كل قرار واجهة يجب أن يخدم تقليل الخطوات أو تقليل الشك."
                            ],
                            [
                                "Write the core task as a verb: find, book, send, compare.",
                                "Separate what users truly need from what the team wants to promote first.",
                                "Every interface decision should reduce steps or reduce doubt."
                            ],
                            "اختر تطبيقاً تستخدمه كثيراً، ثم اكتب هدفاً واحداً فقط يحاول المستخدم الوصول إليه في أول 30 ثانية. بعد ذلك حدّد عنصراً واحداً في الواجهة يساعده وعنصراً آخر يشتته.",
                            "Pick a product you use often and write one goal a person tries to reach in the first 30 seconds. Then identify one interface element that helps and one that distracts.",
                            "المهمة تسبق الشاشة دائماً. إذا فهمت المهمة، يصبح التصميم أكثر موضوعية وأقل اعتماداً على الذوق.",
                            "The task always comes before the screen. When the task is clear, design becomes more objective and less taste-driven.",
                            18,
                            80,
                            "task-lens",
                            "اربط دائماً بين هدف المستخدم والقرار الظاهر في الواجهة.",
                            "Always connect a visible interface decision back to a user goal.",
                            [
                                new CourseReferenceDefinition("Don Norman - The Design of Everyday Things", "Don Norman - The Design of Everyday Things"),
                                new CourseReferenceDefinition("Nielsen Norman Group - UX Basics", "Nielsen Norman Group - UX Basics")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "human-centered-lens-q1",
                                    "ما أفضل نقطة بداية لتصميم تدفق جديد؟",
                                    "What is the best starting point for a new flow?",
                                    [
                                        "اختيار لون أساسي جذاب للواجهة",
                                        "فهم المهمة التي يريد المستخدم إنجازها",
                                        "إضافة أكبر عدد من المزايا في الشاشة الأولى",
                                        "نسخ شاشة منافس سريعاً"
                                    ],
                                    [
                                        "Choose an attractive primary color",
                                        "Understand the task the user wants to complete",
                                        "Add as many features as possible to the first screen",
                                        "Quickly copy a competitor screen"
                                    ],
                                    1,
                                    "ابدأ من الفعل أو النتيجة التي يسعى إليها المستخدم.",
                                    "Start from the action or outcome the user is seeking.",
                                    "الفهم الصحيح للمهمة هو ما يوجّه التسلسل والمحتوى والأولوية داخل الواجهة.",
                                    "A clear understanding of the task is what guides sequence, content, and priority in the interface.",
                                    "human-centered-lens"
                                )
                            ]),
                        new CourseLessonDefinition(
                            "jobs-pains-gains",
                            "المهمة والاحتكاك والمكسب",
                            "Jobs, Friction, and Gains",
                            "طريقة بسيطة لتفكيك ما يريده المستخدم وما يزعجه وما يقنعه بالاستمرار.",
                            "A simple way to break down what people want, what slows them down, and what keeps them engaged.",
                            "كل تجربة يمكن قراءتها من ثلاث زوايا: المهمة التي يحاول المستخدم إنهاءها، الاحتكاك الذي يبطئه، والمكسب الذي يجعله يشعر بأن المنتج يستحق الاستمرار. هذه العدسة تمنعنا من تصميم حلول سطحية.",
                            "You can read any experience through three lenses: the job someone is trying to complete, the friction slowing them down, and the gain that makes the product feel worth it. That lens keeps us from designing shallow solutions.",
                            [
                                "المهمة توضح النتيجة النهائية المطلوبة.",
                                "الاحتكاك يصف ما يجعل المهمة أصعب أو أبطأ.",
                                "المكسب يوضح ما الذي سيجعل النجاح ملموساً للمستخدم."
                            ],
                            [
                                "The job defines the desired outcome.",
                                "Friction describes what makes the job slower or harder.",
                                "The gain captures what makes success feel valuable."
                            ],
                            "حلّل تجربة طلب طعام أو حجز موعد: اكتب المهمة، ثم ثلاثة احتكاكات محتملة، ثم مكسبين يشعر بهما المستخدم إذا نجح التدفق.",
                            "Analyze a food-ordering or appointment-booking experience: write the job, then three likely friction points, then two gains a person would feel if the flow succeeds.",
                            "التحسين الحقيقي لا يحدث عند إزالة خطوة فقط، بل عند إزالة الاحتكاك في الخطوة الأهم.",
                            "Real improvement does not come from removing any step. It comes from removing friction in the most important step.",
                            18,
                            85,
                            "friction-map",
                            "حين تعرف الاحتكاك الحقيقي، يصبح الحل أقصر وأكثر إقناعاً.",
                            "Once the real friction is clear, the solution becomes shorter and more convincing.",
                            [
                                new CourseReferenceDefinition("Jobs To Be Done - Clayton Christensen", "Jobs To Be Done - Clayton Christensen"),
                                new CourseReferenceDefinition("Product Friction Mapping Notes", "Product Friction Mapping Notes")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "jobs-pains-gains-q1",
                                    "أي خيار يعبّر عن الاحتكاك وليس عن المهمة؟",
                                    "Which option describes friction instead of the job?",
                                    [
                                        "يريد المستخدم تأكيد الحجز سريعاً",
                                        "يبحث المستخدم عن أفضل موعد متاح",
                                        "النموذج يطلب حقولاً كثيرة قبل الحجز",
                                        "يريد المستخدم إنهاء العملية بثقة"
                                    ],
                                    [
                                        "The user wants to confirm the booking quickly",
                                        "The user is trying to find the best available slot",
                                        "The form asks for too many fields before booking",
                                        "The user wants to complete the flow with confidence"
                                    ],
                                    2,
                                    "الاحتكاك هو الشيء الذي يبطئ المهمة أو يرفع الجهد.",
                                    "Friction is what slows the task down or increases effort.",
                                    "طلب معلومات كثيرة قبل اللحظة المناسبة يزيد الاحتكاك ويؤخر الوصول إلى الهدف.",
                                    "Requesting too much information too early increases friction and delays the goal.",
                                    "jobs-pains-gains"
                                )
                            ]),
                        new CourseLessonDefinition(
                            "clarity-friction-signals",
                            "إشارات الوضوح والارتباك",
                            "Signals of Clarity and Confusion",
                            "كيف تلتقط مؤشرات مبكرة تدل على تجربة سهلة أو مربكة.",
                            "How to spot early indicators of a clear or confusing experience.",
                            "قبل أن نملك أرقاماً كاملة، يمكننا التقاط مؤشرات سريعة: هل يعرف المستخدم أين يبدأ؟ هل يفهم ما الذي سيحدث بعد الضغط؟ هل الرسائل مطمئنة أم مبهمة؟ هذه الإشارات تقود النقد المبكر.",
                            "Before you have full analytics, you can still spot useful signals: do people know where to start, understand what happens after clicking, and feel reassured by the copy? Those signals make early critique much sharper.",
                            [
                                "الوضوح يظهر عندما يفهم المستخدم البداية والخطوة التالية بلا شرح إضافي.",
                                "الارتباك يظهر عند التردد أو العودة أو تجاهل العنصر الأهم.",
                                "النسخ القصيرة الواضحة تقلل العبء الذهني أكثر من الشروحات الطويلة."
                            ],
                            [
                                "Clarity appears when users understand the start and the next step without extra explanation.",
                                "Confusion appears as hesitation, backtracking, or missing the primary action.",
                                "Short clear copy reduces mental effort more than long explanations."
                            ],
                            "راجع شاشة رئيسية أو شاشة دفع، ثم سجّل ثلاث إشارات وضوح وثلاث إشارات ارتباك محتملة قبل أن تسأل أي مستخدم عنها.",
                            "Review a home or checkout screen and capture three signs of clarity and three signs of possible confusion before asking a single user.",
                            "الوضوح لا يعني البساطة البصرية فقط، بل وضوح النية والنتيجة أيضاً.",
                            "Clarity is not only visual simplicity. It is also clarity of intent and outcome.",
                            20,
                            95,
                            "clarity-check",
                            "راقب البداية، التوقع، والطمأنينة: هذه ثلاث إشارات تكشف جودة التجربة سريعاً.",
                            "Watch for start, expectation, and reassurance. Those three signals reveal experience quality quickly.",
                            [
                                new CourseReferenceDefinition("Nielsen Norman Group - Usability Heuristics", "Nielsen Norman Group - Usability Heuristics"),
                                new CourseReferenceDefinition("Designing Interfaces - Jenifer Tidwell", "Designing Interfaces - Jenifer Tidwell")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "clarity-friction-signals-q1",
                                    "أي علامة تشير غالباً إلى أن الصفحة مربكة؟",
                                    "Which sign usually indicates that a page is confusing?",
                                    [
                                        "وجود عنوان واضح وزر أساسي واحد",
                                        "قدرة المستخدم على توقع ما سيحدث بعد الضغط",
                                        "تساوي العناصر كلها في القوة البصرية والاهتمام",
                                        "وجود شرح قصير للحالة الحالية"
                                    ],
                                    [
                                        "A clear heading and one primary CTA",
                                        "People can predict what happens after clicking",
                                        "Everything on the page competes with equal visual force",
                                        "A short explanation of the current state"
                                    ],
                                    2,
                                    "اسأل نفسك: هل هناك عنصر واحد يقود الانتباه أم أن كل شيء يصرخ في الوقت نفسه؟",
                                    "Ask yourself whether one element leads attention or everything is shouting at once.",
                                    "عندما تتنافس العناصر بنفس القوة، يصبح اتخاذ القرار أبطأ ويظهر الارتباك سريعاً.",
                                    "When everything competes with equal force, decisions slow down and confusion rises quickly.",
                                    "clarity-friction-signals",
                                    "visual",
                                    ["clear-card-hierarchy", "predictable-cta", "competing-card-hierarchy", "supportive-status"]
                                )
                            ])
                    ]),
                new CourseUnitDefinition(
                    "problem-framing",
                    "صياغة المشكلة ورسم الرحلة",
                    "Problem Framing and Journey Mapping",
                    "حوّل الملاحظات العامة إلى مشكلة محددة يمكن حلها ورحلة واضحة يمكن اختبارها.",
                    "Turn broad observations into a problem you can solve and a journey you can test.",
                    62,
                    280,
                    [
                        "تفكيك المهمة إلى خطوات ومخاطر ونقاط قرار.",
                        "رسم رحلة مستخدم مرتبطة بهدف واضح.",
                        "تحويل الملاحظة إلى مشكلة تصميم قابلة للقياس."
                    ],
                    [
                        "Break a task into steps, risks, and decision moments.",
                        "Map a journey around a clear goal.",
                        "Turn an observation into a measurable design problem."
                    ],
                    70,
                    150,
                    8,
                    [
                        new CourseLessonDefinition(
                            "task-analysis",
                            "تحليل المهمة خطوة بخطوة",
                            "Task Analysis Step by Step",
                            "قسّم المهمة الكبيرة إلى قرارات صغيرة يمكن تحسينها.",
                            "Break a large task into smaller decisions you can improve.",
                            "تحليل المهمة يساعدك على رؤية أين يبدأ المستخدم، ما القرار الذي يتخذه، وما الذي قد يمنعه من إكمال التدفق. بدون هذا التحليل تصبح التحسينات سطحية أو عشوائية.",
                            "Task analysis helps you see where someone starts, what decisions they make, and what might block them from finishing the flow. Without it, improvements stay shallow or random.",
                            [
                                "حدّد نقطة البداية والنهاية أولاً.",
                                "ضع القرارات المهمة بينهما بترتيب منطقي.",
                                "اكتب المخاطر أو الترددات عند كل خطوة مهمة."
                            ],
                            [
                                "Define the start and end point first.",
                                "Place the important decisions between them in a logical sequence.",
                                "Write down likely risks or hesitations at each key step."
                            ],
                            "حلّل مهمة مثل دفع فاتورة أو رفع ملف: قسّمها إلى 5 خطوات، ثم حدّد الخطوة التي تحمل أعلى احتمال تردد.",
                            "Analyze a task like paying a bill or uploading a file: split it into five steps, then identify the step with the highest chance of hesitation.",
                            "أفضل التدفقات ليست الأقصر دائماً، بل الأوضح عند نقاط القرار.",
                            "The best flows are not always the shortest. They are the clearest at decision moments.",
                            19,
                            85,
                            "task-flow",
                            "إذا كنت لا ترى القرار داخل الخطوة، فالتدفق ما زال غامضاً.",
                            "If you cannot see the decision inside a step, the flow is still too vague.",
                            [
                                new CourseReferenceDefinition("Task Analysis for Interaction Design", "Task Analysis for Interaction Design"),
                                new CourseReferenceDefinition("UX Mapping Methods Overview", "UX Mapping Methods Overview")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "task-analysis-q1",
                                    "ما أول شيء يجب تحديده في تحليل المهمة؟",
                                    "What should be defined first in a task analysis?",
                                    [
                                        "ألوان الشاشة الرئيسية",
                                        "بداية المهمة ونهايتها",
                                        "صياغة رسالة الخطأ الأخيرة",
                                        "شكل الأيقونات المستخدمة"
                                    ],
                                    [
                                        "The colors of the main screen",
                                        "The beginning and the end of the task",
                                        "The wording of the final error message",
                                        "The icon style"
                                    ],
                                    1,
                                    "تحليل المهمة يعتمد على معرفة المسار الكامل أولاً.",
                                    "Task analysis depends on knowing the full path first.",
                                    "حين تعرف نقطة البداية والنهاية، يصبح ترتيب القرارات والاحتكاك بينهما أسهل بكثير.",
                                    "Once the start and end are clear, ordering decisions and friction between them becomes much easier.",
                                    "task-analysis"
                                )
                            ]),
                        new CourseLessonDefinition(
                            "journey-mapping",
                            "خريطة الرحلة",
                            "Journey Mapping",
                            "حوّل التسلسل إلى تجربة زمنية فيها توقعات ومشاعر ونقاط ألم.",
                            "Turn a sequence into a time-based experience with expectations, emotions, and pain points.",
                            "خريطة الرحلة تضيف طبقة إنسانية فوق التدفق. فهي لا تكتفي بما يحدث، بل تشرح كيف يشعر المستخدم وماذا يتوقع وأين ينهار إحساسه بالثقة أو السرعة.",
                            "A journey map adds a human layer on top of the flow. It does not only show what happens. It explains how people feel, what they expect, and where confidence or momentum breaks.",
                            [
                                "اربط كل خطوة بهدف واضح أو سؤال عند المستخدم.",
                                "أضف مشاعر أو مؤشرات ثقة عند اللحظات المهمة.",
                                "التغيّر العاطفي مهم بقدر تغيّر الشاشة."
                            ],
                            [
                                "Link every step to a clear user goal or question.",
                                "Add emotions or confidence signals to important moments.",
                                "The emotional shift matters as much as the screen change."
                            ],
                            "ارسم رحلة قصيرة لتجربة دفع: قبل الدفع، أثناءه، وبعده. ما اللحظة التي يحتاج فيها المستخدم أكبر قدر من الطمأنينة؟",
                            "Sketch a short journey for a payment flow: before, during, and after the payment. At what moment does the user need the most reassurance?",
                            "الرحلة القوية لا تصف الشاشة فقط، بل تصف ما يتوقعه الشخص من الشاشة التالية.",
                            "A strong journey map does not only describe screens. It describes what people expect from the next one.",
                            20,
                            95,
                            "journey-map",
                            "أضف طبقة الشعور والتوقع، وستصبح الرحلة أكثر فائدة من مجرد تسلسل خطوات.",
                            "Add emotion and expectation, and the map becomes more useful than a simple sequence.",
                            [
                                new CourseReferenceDefinition("Customer Journey Mapping Notes", "Customer Journey Mapping Notes"),
                                new CourseReferenceDefinition("This Is Service Design Thinking", "This Is Service Design Thinking")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "journey-mapping-q1",
                                    "ما الذي يميز خريطة الرحلة عن التدفق فقط؟",
                                    "What makes a journey map different from a simple flow?",
                                    [
                                        "أنها تستخدم ألواناً أكثر",
                                        "أنها تضيف مشاعر المستخدم وتوقعاته",
                                        "أنها تستغني عن الخطوات نهائياً",
                                        "أنها مخصصة للمطورين فقط"
                                    ],
                                    [
                                        "It uses more colors",
                                        "It adds the user's emotions and expectations",
                                        "It removes steps completely",
                                        "It is only for developers"
                                    ],
                                    1,
                                    "اسأل نفسك: ماذا تضيف الرحلة غير التسلسل الزمني؟",
                                    "Ask what a journey adds beyond the ordered steps.",
                                    "خريطة الرحلة تضيف طبقة التوقع والمشاعر، وهذا ما يجعلها أداة UX وليست مخطط خطوات فقط.",
                                    "A journey map adds expectation and emotion, which is what makes it a UX tool instead of only a step diagram.",
                                    "journey-mapping"
                                )
                            ]),
                        new CourseLessonDefinition(
                            "problem-statements",
                            "صياغة المشكلة التصميمية",
                            "Writing Better Problem Statements",
                            "حوّل الملاحظة العامة إلى مشكلة محددة تعرف كيف ستقيس تحسنها.",
                            "Turn a broad observation into a specific problem with a measurable improvement target.",
                            "صياغة المشكلة الجيدة تربط بين من يتأثر، وما الذي يواجهه، ولماذا يهم، وكيف سنعرف أن الوضع أصبح أفضل. هذه الصياغة تمنع التوهان داخل الحلول المبكرة.",
                            "A good problem statement connects who is affected, what they face, why it matters, and how you will know the situation improved. That framing prevents teams from rushing into premature solutions.",
                            [
                                "اذكر نوع المستخدم أو الموقف بوضوح.",
                                "سمِّ العائق الحالي وتأثيره على النتيجة.",
                                "أضف علامة نجاح قابلة للملاحظة أو القياس."
                            ],
                            [
                                "Name the user type or context clearly.",
                                "State the current obstacle and its impact on the outcome.",
                                "Add a sign of success you can observe or measure."
                            ],
                            "اكتب مشكلة لتجربة رفع ملف كبير: من المتأثر، ما المشكلة، لماذا تهم، وما المؤشر الذي سيقول إن الحل تحسن؟",
                            "Write a problem statement for a large file upload flow: who is affected, what the problem is, why it matters, and what signal would show improvement.",
                            "الصياغة الجيدة لا تقترح الحل؛ هي فقط تجعل اختيار الحل أكثر دقة.",
                            "A strong problem statement does not prescribe the solution. It makes solution choices sharper.",
                            23,
                            100,
                            "problem-frame",
                            "إذا كانت الجملة تبدو كحل، فأعد كتابتها كمشكلة أولاً.",
                            "If the sentence sounds like a solution, rewrite it as a problem first.",
                            [
                                new CourseReferenceDefinition("Problem Framing in Product Design", "Problem Framing in Product Design"),
                                new CourseReferenceDefinition("Lean UX - Problem Statements", "Lean UX - Problem Statements")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "problem-statements-q1",
                                    "أي صياغة تُعد مشكلة تصميمية أفضل؟",
                                    "Which option is the strongest design problem statement?",
                                    [
                                        "نحتاج شاشة أجمل وأكبر",
                                        "سنضيف زر بنفسجي كبير في الأعلى",
                                        "المستخدمون الجدد يتوقفون عند خطوة التحقق لأن سبب الطلب غير واضح، ونريد رفع الإكمال إلى 80%",
                                        "التطبيق يجب أن يكون عصرياً"
                                    ],
                                    [
                                        "We need a prettier and larger screen",
                                        "We will add a large purple button at the top",
                                        "New users drop at verification because the reason for the request is unclear, and we want completion to reach 80%",
                                        "The app should feel modern"
                                    ],
                                    2,
                                    "ابحث عن من، ماذا، لماذا، ومؤشر نجاح.",
                                    "Look for who, what, why, and a sign of success.",
                                    "الصياغة القوية تصف المستخدم والعائق والأثر وهدف التحسن بدلاً من اقتراح حل مباشر.",
                                    "A strong statement describes the user, obstacle, impact, and improvement goal instead of proposing a direct solution.",
                                    "problem-statements"
                                )
                            ])
                    ])
            ]),

        new(
            "ui-core",
            "أساسيات تصميم الواجهات",
            "Core UI Design",
            "ابنِ أساساً بصرياً متماسكاً: هرمية واضحة، شبكة نظيفة، مكونات متوقعة، ونسخ دقيقة.",
            "Build a solid visual foundation: clear hierarchy, clean grids, predictable components, and precise copy.",
            "🎨",
            "beginner",
            75,
            240,
            18,
            new CourseProjectDefinition(
                "ui-core-checkout-refresh",
                "مشروع الواجهة: تحسين صفحة دفع",
                "UI Project: Checkout Refresh",
                "أعد تصميم شاشة أو خطوتين من صفحة دفع تعاني من فوضى بصرية أو رسائل غير واضحة.",
                "Redesign one or two checkout screens that suffer from visual clutter or unclear messaging.",
                "قدّم before/after، ونظام هرمية بصري مبسط، وحالات feedback واضحة، وشرحاً قصيراً للتعديلات.",
                "Submit before-and-after states, a simplified hierarchy system, clear feedback states, and a short explanation of the changes.",
                6,
                340,
                [
                    "شاشة before وشاشة after",
                    "تعريف سريع للهرمية البصرية أو الشبكة المستخدمة",
                    "حالات feedback للنجاح أو الخطأ أو الانتظار",
                    "شرح 3 قرارات تصميم رئيسية"
                ],
                [
                    "A before screen and an after screen",
                    "A short note on the hierarchy or grid you used",
                    "Feedback states for success, error, or loading",
                    "An explanation of 3 major design decisions"
                ],
                [
                    new CourseProjectCriterionDefinition("الوضوح البصري", "Visual clarity", 30),
                    new CourseProjectCriterionDefinition("استخدام الشبكة", "Grid and spacing", 20),
                    new CourseProjectCriterionDefinition("جودة الحالات", "State quality", 25),
                    new CourseProjectCriterionDefinition("منطق القرارات", "Decision logic", 25)
                ]),
            [
                new CourseUnitDefinition(
                    "hierarchy-layout",
                    "الهرمية والتخطيط",
                    "Hierarchy and Layout",
                    "تعلّم كيف تجعل الشاشة تُقرأ بوضوح من أول نظرة.",
                    "Learn how to make a screen readable at first glance.",
                    60,
                    270,
                    [
                        "بناء أولوية بصرية واضحة.",
                        "استخدام الشبكة والمسافات لصنع إيقاع مستقر.",
                        "اختيار ألوان تدعم القراءة لا التشتت."
                    ],
                    [
                        "Build clear visual priority.",
                        "Use grids and spacing to create a stable rhythm.",
                        "Choose colors that support reading instead of distraction."
                    ],
                    70,
                    150,
                    9,
                    [
                        new CourseLessonDefinition(
                            "visual-hierarchy-essentials",
                            "الهرمية البصرية العملية",
                            "Practical Visual Hierarchy",
                            "من أين تبدأ العين؟ وكيف تقودها إلى القرار الأهم؟",
                            "Where does the eye start, and how do you guide it to the primary decision?",
                            "الهرمية البصرية ليست مجرد أحجام خطوط. هي علاقة متكاملة بين الحجم، اللون، التباين، والمسافة. عندما تعمل هذه العناصر معاً، يعرف المستخدم ما الذي يجب أن يقرأه أولاً وما الذي يمكن تجاهله مؤقتاً.",
                            "Visual hierarchy is more than type size. It is the combined relationship between size, color, contrast, and space. When they work together, people know what to read first and what can wait.",
                            [
                                "اختر هدفاً بصرياً واحداً للشاشة قبل توزيع العناصر.",
                                "قلّل عدد العناصر ذات القوة العالية حتى لا تتنافس.",
                                "اختبر الشاشة بسؤال بسيط: ماذا ترى أولاً خلال ثلاث ثوان؟"
                            ],
                            [
                                "Choose one visual goal for the screen before placing elements.",
                                "Limit the number of high-emphasis elements so they do not compete.",
                                "Test the screen with a simple question: what do you notice first within three seconds?"
                            ],
                            "اختر شاشة Landing أو Dashboard وحاول إعادة ترتيبها بحيث يوجد عنوان رئيسي واحد، هدف ثانوي واحد، وفعل أساسي واحد فقط.",
                            "Take a landing or dashboard screen and rearrange it so there is one primary heading, one secondary goal, and only one dominant action.",
                            "إذا احتاجت الشاشة إلى شرح طويل لفهم أولويتها، فالهرمية لم تنجح بعد.",
                            "If a screen needs a long explanation to reveal its priority, the hierarchy has not succeeded yet.",
                            20,
                            90,
                            "hierarchy-layers",
                            "اجعل الأولوية مرئية لا مشروحة.",
                            "Make priority visible instead of explained.",
                            [
                                new CourseReferenceDefinition("Refactoring UI - Hierarchy", "Refactoring UI - Hierarchy"),
                                new CourseReferenceDefinition("Nielsen Norman Group - Visual Hierarchy", "Nielsen Norman Group - Visual Hierarchy")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "visual-hierarchy-essentials-q1",
                                    "أي اختيار يخدم الهرمية البصرية الأفضل؟",
                                    "Which choice supports stronger visual hierarchy?",
                                    [
                                        "إعطاء جميع العناوين نفس الحجم والوزن",
                                        "استخدام CTA واحد بارز وتقليل العناصر المنافسة",
                                        "استخدام لون لافت لكل عنصر مهم",
                                        "تكبير جميع الأزرار حتى تجذب الانتباه"
                                    ],
                                    [
                                        "Give every heading the same size and weight",
                                        "Use one prominent CTA and reduce competing elements",
                                        "Use a loud color for every important element",
                                        "Make all buttons larger to attract attention"
                                    ],
                                    1,
                                    "الأولوية تحتاج قائداً واضحاً، لا مجموعة قادة.",
                                    "Priority needs one clear leader, not a group of leaders.",
                                    "وجود CTA واحد بارز مع تقليل العناصر المتنافسة يجعل القرار أسهل ويزيد الوضوح.",
                                    "One prominent CTA with fewer competing elements makes decisions easier and improves clarity.",
                                    "visual-hierarchy-essentials",
                                    "visual",
                                    ["competing-card-hierarchy", "clear-card-hierarchy", "overcolored-panel", "oversized-actions"]
                                )
                            ]),
                        new CourseLessonDefinition(
                            "spacing-and-grids",
                            "المسافات والشبكات",
                            "Spacing and Grids",
                            "رتّب الشاشة بنظام يجعل العناصر تبدو مرتبطة أو منفصلة بوضوح.",
                            "Organize the screen with a system that makes relationships between elements obvious.",
                            "المسافات ليست فراغاً ضائعاً. هي وسيلة لشرح العلاقة بين العناصر. الشبكة الجيدة تساعدك على محاذاة المحتوى وصنع إيقاع بصري ثابت يسهّل الفهم والمراجعة.",
                            "Spacing is not wasted emptiness. It explains the relationship between elements. A good grid helps align content and create a stable visual rhythm that supports comprehension and review.",
                            [
                                "العناصر المتقاربة تُقرأ كمجموعة واحدة.",
                                "استخدم نظام مسافات متكرر بدلاً من قيم عشوائية.",
                                "الشبكة تساعدك على الحفاظ على المحاذاة عند زيادة المحتوى."
                            ],
                            [
                                "Elements placed close together are read as one group.",
                                "Use a repeated spacing system instead of random values.",
                                "Grids help preserve alignment as content grows."
                            ],
                            "خذ شاشة إعدادات أو صفحة منتج، ثم أعد تنظيمها باستخدام 8px spacing scale ومجموعات واضحة للعناصر المرتبطة.",
                            "Take a settings or product page and reorganize it using an 8px spacing scale and clearer element grouping.",
                            "حين تصبح المسافات منهجية، يقل الجهد المطلوب لفهم الصفحة بالكامل.",
                            "When spacing becomes systematic, the effort needed to understand the page drops sharply.",
                            20,
                            85,
                            "spacing-grid",
                            "المسافة تشرح العلاقة قبل أن يقرأ المستخدم النص نفسه.",
                            "Spacing explains relationships before people even read the content.",
                            [
                                new CourseReferenceDefinition("Gestalt Principles for UI", "Gestalt Principles for UI"),
                                new CourseReferenceDefinition("Layout Grids - Material Design", "Layout Grids - Material Design")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "spacing-and-grids-q1",
                                    "لماذا تعتبر المسافة بين العناصر مهمة في UI؟",
                                    "Why is spacing important in UI?",
                                    [
                                        "لأنها تجعل الصفحة أكبر فقط",
                                        "لأنها تشرح العلاقة بين العناصر وتقلل الفوضى",
                                        "لأنها بديل عن العناوين",
                                        "لأنها تستخدم لإخفاء الأخطاء"
                                    ],
                                    [
                                        "Because it only makes the page larger",
                                        "Because it explains relationships and reduces noise",
                                        "Because it replaces headings",
                                        "Because it is used to hide mistakes"
                                    ],
                                    1,
                                    "المسافات تؤثر على الفهم قبل القراءة.",
                                    "Spacing affects understanding before reading.",
                                    "المسافات المنظمة تساعد المستخدم على رؤية المجموعات والمنطق داخل الصفحة بسرعة.",
                                    "Structured spacing helps people see grouping and logic on the page quickly.",
                                    "spacing-and-grids"
                                )
                            ]),
                        new CourseLessonDefinition(
                            "color-and-contrast",
                            "اللون والتباين الوظيفي",
                            "Functional Color and Contrast",
                            "استخدم اللون لشرح الحالة والاتجاه، لا للزينة فقط.",
                            "Use color to explain state and direction, not just decoration.",
                            "اللون الناجح في الواجهة ليس الأكثر جاذبية فقط، بل الأكثر قدرة على توصيل المعنى بدون إرباك. التباين يضمن أن يظل المحتوى مقروءاً والحالات مفهومة عبر أجهزة وظروف مختلفة.",
                            "Great interface color is not only attractive. It communicates meaning without confusion. Contrast keeps content readable and states understandable across devices and conditions.",
                            [
                                "خصص ألواناً واضحة للحالات المهمة مثل الخطأ والنجاح.",
                                "تأكد أن النصوص الأساسية تحافظ على تباين جيد.",
                                "لا تجعل اللون هو الإشارة الوحيدة للحالة."
                            ],
                            [
                                "Reserve clear colors for important states like error and success.",
                                "Ensure primary text maintains strong contrast.",
                                "Do not rely on color as the only state signal."
                            ],
                            "راجع شاشة تحتوي على تحذير أو خطأ، ثم حدّد هل اللون وحده يشرح الحالة أم أن هناك نصاً وأيقونة أيضاً.",
                            "Review a screen with a warning or error and ask whether color alone explains the state or whether text and iconography help too.",
                            "اللون الممتاز يرفع الفهم، لكنه لا يجب أن يكون الناقل الوحيد للمعنى.",
                            "Excellent color improves understanding, but it should not carry meaning alone.",
                            20,
                            95,
                            "contrast-system",
                            "كل حالة تحتاج معنى يمكن إدراكه حتى لو غاب اللون.",
                            "Every state needs meaning that survives even when color is missed.",
                            [
                                new CourseReferenceDefinition("WCAG Contrast Guidance", "WCAG Contrast Guidance"),
                                new CourseReferenceDefinition("Material Design - Color Roles", "Material Design - Color Roles")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "color-and-contrast-q1",
                                    "ما أفضل استخدام وظيفي للون في UI؟",
                                    "What is the strongest functional use of color in UI?",
                                    [
                                        "إضافة لون مختلف لكل بطاقة مهما كانت وظيفتها",
                                        "استخدامه لتوضيح الحالة والأولوية مع تباين مقروء",
                                        "الاعتماد على اللون وحده لتوضيح الأخطاء",
                                        "اختيار ألوان كثيرة لإظهار التنوع"
                                    ],
                                    [
                                        "Use a different color for every card regardless of function",
                                        "Use it to show state and priority with readable contrast",
                                        "Rely on color alone to communicate errors",
                                        "Choose many colors to show variety"
                                    ],
                                    1,
                                    "اسأل: هل اللون يضيف معنى واضحاً أم يضيف ضوضاء فقط؟",
                                    "Ask whether color adds meaning or only adds noise.",
                                    "أفضل استخدام للون هو دعم الحالة والأولوية مع الحفاظ على القراءة الواضحة.",
                                    "The strongest use of color is to support state and priority while keeping text readable.",
                                    "color-and-contrast"
                                )
                            ])
                    ]),
                new CourseUnitDefinition(
                    "components-and-copy",
                    "المكونات والنسخ",
                    "Components and UI Copy",
                    "صمّم عناصر الواجهة ورسائلها بطريقة تقلل الأخطاء وتبني الثقة.",
                    "Design interface elements and their messages in a way that reduces mistakes and builds trust.",
                    63,
                    280,
                    [
                        "تصميم عناصر إدخال يسهل استخدامها.",
                        "بناء حالات feedback واضحة ومطمئنة.",
                        "كتابة نسخ قصيرة تساعد على اتخاذ القرار."
                    ],
                    [
                        "Design input components that are easy to use.",
                        "Build feedback states that are clear and reassuring.",
                        "Write short UI copy that supports decisions."
                    ],
                    70,
                    150,
                    9,
                    [
                        new CourseLessonDefinition(
                            "forms-and-controls",
                            "النماذج والعناصر التفاعلية",
                            "Forms and Controls",
                            "كيف تجعل الإدخال أسرع وأقل عرضة للخطأ.",
                            "How to make input faster and less error-prone.",
                            "النماذج القوية تقلل الجهد الذهني من خلال ترتيب منطقي، تسميات واضحة، ومساعدة في اللحظة المناسبة. الهدف ليس فقط جمع البيانات، بل مساعدة المستخدم على إنهاء المهمة بثقة.",
                            "Strong forms reduce mental effort through logical order, clear labels, and help at the right moment. The goal is not only to collect data, but to help people finish confidently.",
                            [
                                "اسأل فقط عن المعلومات الضرورية في هذه الخطوة.",
                                "اجعل التسميات أوضح من الـ placeholder.",
                                "قدّم المساعدة قبل وقوع الخطأ متى أمكن."
                            ],
                            [
                                "Ask only for information that is necessary at this step.",
                                "Make labels clearer than placeholders.",
                                "Offer guidance before the error happens whenever possible."
                            ],
                            "أعد تصميم نموذج تسجيل بسيط: احذف حقلاً غير ضروري، وغيّر placeholder غامضاً إلى label واضح، وأضف مساعدة استباقية لحقل واحد.",
                            "Redesign a simple signup form: remove one unnecessary field, turn a vague placeholder into a clear label, and add proactive guidance to one field.",
                            "أفضل نموذج هو الذي يشعر المستخدم أنه يقوده، لا الذي يختبر صبره.",
                            "The best form feels like guidance, not a patience test.",
                            21,
                            90,
                            "form-patterns",
                            "قلّل الحقول ووضّح النية، وسينخفض الخطأ تلقائياً.",
                            "Reduce fields and clarify intent, and errors usually drop on their own.",
                            [
                                new CourseReferenceDefinition("Luke Wroblewski - Web Form Design", "Luke Wroblewski - Web Form Design"),
                                new CourseReferenceDefinition("GOV.UK Design System - Form Patterns", "GOV.UK Design System - Form Patterns")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "forms-and-controls-q1",
                                    "أي قرار يحسن النموذج غالباً؟",
                                    "Which decision usually improves a form?",
                                    [
                                        "إخفاء التسميات والاعتماد على placeholders فقط",
                                        "جمع كل البيانات الممكنة من أول شاشة",
                                        "ترتيب الحقول حسب منطق المستخدم وإضافة مساعدة مبكرة",
                                        "إظهار رسالة خطأ بعد الإرسال فقط"
                                    ],
                                    [
                                        "Hide labels and rely only on placeholders",
                                        "Collect every possible detail on the first screen",
                                        "Arrange fields around user logic and add early guidance",
                                        "Show an error only after final submission"
                                    ],
                                    2,
                                    "اسأل: ما القرار الذي يقلل الجهد قبل وقوع الخطأ؟",
                                    "Ask which choice reduces effort before the error happens.",
                                    "ترتيب الحقول بناءً على منطق المستخدم مع مساعدة مبكرة يقلل الارتباك ويزيد الإكمال.",
                                    "Arranging fields around user logic with early guidance reduces confusion and improves completion.",
                                    "forms-and-controls",
                                    "visual",
                                    ["broken-form", "crowded-form", "accessible-form", "late-error-form"]
                                )
                            ]),
                        new CourseLessonDefinition(
                            "feedback-and-states",
                            "الحالات ورسائل التغذية الراجعة",
                            "Feedback and State Design",
                            "أخبر المستخدم بما يحدث الآن وماذا يفعل بعد ذلك.",
                            "Tell people what is happening now and what to do next.",
                            "عندما يضغط المستخدم زرّاً أو يرسل نموذجاً، يحتاج إلى فهم الحالة الحالية: هل العملية نجحت؟ هل ما زالت جارية؟ هل حدث خطأ؟ التصميم الجيد يشرح هذا بوضوح وسرعة.",
                            "When people tap a button or submit a form, they need to understand the current state: did it work, is it loading, or did something fail? Strong UI communicates that quickly and clearly.",
                            [
                                "فرّق بوضوح بين loading وsuccess وerror.",
                                "اجعل الرسالة تشرح الحالة والخطوة التالية.",
                                "استخدم tone مطمئناً لا يحمّل المستخدم اللوم."
                            ],
                            [
                                "Differentiate clearly between loading, success, and error.",
                                "Make each message explain both the state and the next step.",
                                "Use a reassuring tone instead of blaming the user."
                            ],
                            "راجع رسالة خطأ في منتج تعرفه: هل تشرح سبب المشكلة والخطوة التالية؟ إن لم تفعل، أعد كتابتها في جملتين قصيرتين.",
                            "Review an error message in a product you know: does it explain the issue and the next step? If not, rewrite it in two short sentences.",
                            "الرسالة الجيدة لا تقول فقط ماذا فشل، بل تساعد على التعافي.",
                            "A strong message does not only describe failure. It helps recovery.",
                            21,
                            95,
                            "feedback-states",
                            "الحالة الجيدة تقلل القلق وتعيد الثقة بسرعة.",
                            "Good state design lowers anxiety and restores confidence quickly.",
                            [
                                new CourseReferenceDefinition("Writing for Interfaces - Feedback States", "Writing for Interfaces - Feedback States"),
                                new CourseReferenceDefinition("Ant Design - Feedback Patterns", "Ant Design - Feedback Patterns")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "feedback-and-states-q1",
                                    "ما أفضل رسالة خطأ؟",
                                    "Which is the strongest error message?",
                                    [
                                        "حدث خطأ",
                                        "فشل الطلب. حاول لاحقاً",
                                        "تعذر حفظ البطاقة لأن الرمز البريدي ناقص. أكمله ثم أعد المحاولة",
                                        "النظام لا يعمل"
                                    ],
                                    [
                                        "An error occurred",
                                        "Request failed. Try later",
                                        "We could not save the card because the ZIP code is missing. Add it and try again",
                                        "The system is not working"
                                    ],
                                    2,
                                    "أفضل الرسائل تشرح السبب والخطوة التالية معاً.",
                                    "The strongest messages explain both the reason and the next step.",
                                    "الرسالة الدقيقة القابلة للتصرف تساعد المستخدم على التعافي بدلاً من تركه مع غموض عام.",
                                    "A specific actionable message helps people recover instead of leaving them with vague failure.",
                                    "feedback-and-states"
                                )
                            ]),
                        new CourseLessonDefinition(
                            "ux-writing-basics",
                            "مبادئ UX Writing",
                            "UX Writing Basics",
                            "اكتب نسخاً قصيرة ودافعة للفعل بدون غموض أو ثرثرة.",
                            "Write short action-oriented copy without vagueness or fluff.",
                            "نسخ الواجهة الجيدة تشرح للفرد أين هو، ماذا يحتاج أن يفعل، وما الذي سيحدث بعد ذلك. كل كلمة يجب أن تدعم القرار أو تقلل التردد أو تطمئن المستخدم.",
                            "Good interface copy tells people where they are, what they need to do, and what happens next. Every word should support a decision, reduce hesitation, or provide reassurance.",
                            [
                                "استخدم أفعالاً واضحة داخل CTA.",
                                "تجنب المصطلحات العامة عندما يكون السياق يحتاج تحديداً.",
                                "اكتب بما يخدم اللحظة، لا بما يبدو تسويقياً فقط."
                            ],
                            [
                                "Use clear verbs inside CTAs.",
                                "Avoid vague language when the context needs precision.",
                                "Write for the moment, not only for marketing polish."
                            ],
                            "أعد كتابة ثلاثة أزرار أو رسائل قصيرة من منتج تعرفه بحيث تصبح أكثر تحديداً لما سيحدث بعد النقر.",
                            "Rewrite three buttons or short messages from a product you know so they describe the outcome more precisely.",
                            "النسخة الصغيرة تغيّر الإيقاع الكامل للتجربة حين تكون في اللحظة الحرجة الصحيحة.",
                            "Small copy changes can shift the whole experience when they appear at the critical moment.",
                            21,
                            95,
                            "copy-cues",
                            "كل كلمة في الواجهة إما تساعد القرار أو تشتته.",
                            "Every interface word either supports a decision or distracts from it.",
                            [
                                new CourseReferenceDefinition("Strategic Writing for UX", "Strategic Writing for UX"),
                                new CourseReferenceDefinition("Content Design London - Microcopy Basics", "Content Design London - Microcopy Basics")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "ux-writing-basics-q1",
                                    "أي CTA أوضح للمستخدم؟",
                                    "Which CTA is clearer for users?",
                                    [
                                        "استمر",
                                        "إرسال",
                                        "حفظ البطاقة والعودة للدفع",
                                        "نعم"
                                    ],
                                    [
                                        "Continue",
                                        "Submit",
                                        "Save card and return to checkout",
                                        "Yes"
                                    ],
                                    2,
                                    "ابحث عن الزر الذي يشرح النتيجة التالية بوضوح.",
                                    "Look for the label that explains the next outcome clearly.",
                                    "الـ CTA الأقوى يوضح ما الذي سيحدث بعد الضغط، وليس فقط أن هناك خطوة عامة قادمة.",
                                    "The strongest CTA explains what happens next instead of signaling a generic next step.",
                                    "ux-writing-basics"
                                )
                            ])
                    ])
            ]),

        new(
            "research-validation",
            "البحث والتحقق",
            "Research and Validation",
            "اجمع أدلة حقيقية، اختبر الفرضيات، وحوّل الملاحظات إلى قرارات قابلة للتنفيذ.",
            "Gather real evidence, test assumptions, and turn observations into actionable decisions.",
            "🔎",
            "intermediate",
            75,
            260,
            20,
            new CourseProjectDefinition(
                "research-validation-usability-audit",
                "مشروع البحث: مراجعة واختبار قابلية الاستخدام",
                "Research Project: Usability Audit",
                "اختر تدفقاً رقمياً قائماً، ثم حدّد أسئلة البحث، ونفّذ اختباراً سريعاً، وخرج بتوصيات مرتبة.",
                "Choose an existing digital flow, define research questions, run a quick usability test, and produce prioritized recommendations.",
                "سلّم هدف البحث، وسيناريو الاختبار، و3 ملاحظات أساسية، و2 توصية مرتبة حسب الأثر.",
                "Submit the research goal, a test scenario, 3 major observations, and 2 recommendations prioritized by impact.",
                7,
                360,
                [
                    "هدف بحث واضح أو سؤال رئيسي",
                    "سيناريو اختبار أو دليل مقابلة مختصر",
                    "3 ملاحظات رئيسية موثقة",
                    "2 توصيتان مرتبتان حسب الأثر"
                ],
                [
                    "A clear research objective or main question",
                    "A short usability script or interview guide",
                    "3 documented findings",
                    "2 recommendations ordered by impact"
                ],
                [
                    new CourseProjectCriterionDefinition("وضوح السؤال البحثي", "Research question clarity", 20),
                    new CourseProjectCriterionDefinition("جودة الملاحظة", "Observation quality", 30),
                    new CourseProjectCriterionDefinition("ترتيب الأولويات", "Prioritization", 25),
                    new CourseProjectCriterionDefinition("قابلية التنفيذ", "Actionability", 25)
                ]),
            [
                new CourseUnitDefinition(
                    "research-planning",
                    "تخطيط البحث",
                    "Research Planning",
                    "اختر الطريقة المناسبة وحدد كيف ستجمع أدلة مفيدة لا مجرد آراء عامة.",
                    "Choose the right method and decide how to gather evidence, not just opinions.",
                    63,
                    290,
                    [
                        "تحديد سؤال بحث واضح.",
                        "اختيار الطريقة الأنسب للمرحلة والسياق.",
                        "إعداد مقابلات أو استبيانات تقلل التحيز."
                    ],
                    [
                        "Define a clear research question.",
                        "Choose the right method for the stage and context.",
                        "Prepare interviews or surveys that reduce bias."
                    ],
                    70,
                    155,
                    10,
                    [
                        new CourseLessonDefinition(
                            "research-goals",
                            "تحديد هدف البحث",
                            "Defining Research Goals",
                            "فرّق بين سؤال المنتج وسؤال البحث وسؤال التصميم.",
                            "Separate the product question, the research question, and the design question.",
                            "كثير من الأبحاث تصبح عامة وضعيفة لأن السؤال غير واضح. عندما تحدد ما الذي تحتاج أن تتعلمه بالضبط، يصبح اختيار المشاركين والطريقة والأسئلة أسهل وأكثر دقة.",
                            "Research often becomes vague because the question is vague. Once you define exactly what you need to learn, choosing participants, methods, and prompts becomes easier and more precise.",
                            [
                                "اجعل السؤال قابلاً للتعلّم لا قابلاً للدفاع فقط.",
                                "اختصر الهدف في جملة واحدة قبل إعداد أي أداة.",
                                "اربط السؤال بقرار تصميم أو منتج قادم."
                            ],
                            [
                                "Make the question learnable, not just defendable.",
                                "Reduce the goal to one sentence before preparing any tool.",
                                "Connect the question to a real product or design decision."
                            ],
                            "اكتب ثلاثة أسئلة لمنتج تعليمي: واحد عام جداً، وواحد جيد، وواحد ممتاز مرتبط بقرار محدد. ثم اختر الأفضل واشرح لماذا.",
                            "Write three questions for a learning product: one too broad, one good, and one excellent because it supports a specific decision. Then pick the best and explain why.",
                            "كل بحث جيد يبدأ بسؤال محدد بما يكفي ليقود قراراً، لا نقاشاً مفتوحاً فقط.",
                            "Every strong research effort starts with a question focused enough to guide a decision, not just a discussion.",
                            21,
                            95,
                            "research-brief",
                            "السؤال الواضح يوفر نصف الطريق قبل أن تبدأ الجلسة.",
                            "A clear question wins half the work before the session even starts.",
                            [
                                new CourseReferenceDefinition("Research Ops - Study Planning", "Research Ops - Study Planning"),
                                new CourseReferenceDefinition("Just Enough Research - Erika Hall", "Just Enough Research - Erika Hall")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "research-goals-q1",
                                    "ما أفضل سؤال بحث؟",
                                    "Which is the strongest research question?",
                                    [
                                        "هل التطبيق جميل؟",
                                        "ما رأيك في كل شيء داخل المنتج؟",
                                        "ما الذي يجعل المستخدمين يترددون عند اختيار الخطة قبل الدفع؟",
                                        "هل نحتاج إعادة تصميم كاملة؟"
                                    ],
                                    [
                                        "Is the app beautiful?",
                                        "What do you think of everything in the product?",
                                        "What causes people to hesitate when choosing a plan before checkout?",
                                        "Do we need a full redesign?"
                                    ],
                                    2,
                                    "أفضل الأسئلة تركّز على موقف واحد وقرار واحد.",
                                    "The strongest questions focus on one situation and one decision.",
                                    "السؤال المحدد حول التردد قبل اختيار الخطة سيقود ملاحظات قابلة للتنفيذ أكثر من الأسئلة العامة.",
                                    "A targeted question about hesitation before plan selection will lead to more actionable insight than broad opinion prompts.",
                                    "research-goals"
                                )
                            ]),
                        new CourseLessonDefinition(
                            "interview-guides",
                            "إعداد دليل المقابلة",
                            "Building Better Interview Guides",
                            "صغ أسئلة تكشف السلوك والسياق بدلاً من دفع المستخدم إلى إجابة متوقعة.",
                            "Write prompts that reveal behavior and context instead of leading people toward a preferred answer.",
                            "المقابلة الجيدة تعتمد على أسئلة مفتوحة، ترتيب منطقي، ومتابعة ذكية. الهدف ليس الحصول على موافقة على فكرتك، بل فهم ما حدث فعلاً وما معنى ذلك للمستخدم.",
                            "A strong interview relies on open questions, logical sequencing, and smart follow-ups. The goal is not to earn agreement with your idea, but to understand what truly happened and what it meant to the participant.",
                            [
                                "ابدأ بالأسئلة السياقية قبل التفاصيل الدقيقة.",
                                "اسأل عن أحداث حقيقية حدثت بالفعل.",
                                "تجنب الأسئلة التي توحي بالإجابة الصحيحة."
                            ],
                            [
                                "Start with contextual questions before detailed ones.",
                                "Ask about real events that already happened.",
                                "Avoid prompts that suggest the ‘right’ answer."
                            ],
                            "أعد كتابة سؤال موجه مثل: هل أعجبك النموذج؟ إلى سؤال يفتح السلوك مثل: احكِ لي كيف أكملت هذه الخطوة آخر مرة.",
                            "Rewrite a leading prompt like “did you like the form?” into a behavior-based question such as “walk me through how you completed this step last time.”",
                            "المقابلة الممتازة تجعل الشخص يصف قراراته، لا أن يقيّم واجهتك فقط.",
                            "Great interviews help people describe their decisions, not only rate your interface.",
                            21,
                            95,
                            "interview-guide",
                            "كل سؤال يلمّح إلى جواب يسرق منك الحقيقة.",
                            "Every leading question steals a little truth from the session.",
                            [
                                new CourseReferenceDefinition("Interviewing Users - Steve Portigal", "Interviewing Users - Steve Portigal"),
                                new CourseReferenceDefinition("Nielsen Norman Group - Interview Tips", "Nielsen Norman Group - Interview Tips")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "interview-guides-q1",
                                    "أي سؤال أقل تحيزاً؟",
                                    "Which question is less biased?",
                                    [
                                        "هل أعجبك تدفق التسجيل الجديد؟",
                                        "ألا تعتقد أن الخطوة الثانية كانت واضحة؟",
                                        "احكِ لي كيف أنهيت التسجيل آخر مرة وما الذي أبطأك",
                                        "هل توافق أن التصميم الجديد أفضل؟"
                                    ],
                                    [
                                        "Did you like the new signup flow?",
                                        "Don't you think the second step was clear?",
                                        "Walk me through how you completed signup last time and what slowed you down",
                                        "Do you agree the new design is better?"
                                    ],
                                    2,
                                    "السؤال الأقوى يستدعي سلوكاً حقيقياً بدلاً من رأي موجّه.",
                                    "The strongest question invites real behavior instead of a guided opinion.",
                                    "طلب وصف تجربة حقيقية يعطيك بيانات أغنى بكثير من سؤال تقييمي موجّه.",
                                    "Asking for a real past behavior gives much richer data than a guided evaluation question.",
                                    "interview-guides"
                                )
                            ]),
                        new CourseLessonDefinition(
                            "survey-bias",
                            "تحيزات الاستبيانات",
                            "Survey Bias and Better Questions",
                            "تعرف على كيف يمكن لسؤال واحد سيئ الصياغة أن يشوه النتائج بالكامل.",
                            "Learn how one poorly phrased survey question can distort the full result set.",
                            "الاستبيانات مفيدة عندما تحتاج اتجاهاً واسعاً، لكنها خطيرة عندما تكون الأسئلة غير دقيقة أو الخيارات ناقصة أو اللغة منحازة. جودة السؤال أهم من عدد الإجابات.",
                            "Surveys are useful when you need broad directional input, but they become dangerous when wording is unclear, choices are incomplete, or language is biased. Question quality matters more than response count.",
                            [
                                "اجعل الخيارات متوازنة وشاملة بقدر الإمكان.",
                                "تجنب الكلمات التي تحمل حكماً مسبقاً.",
                                "اختبر السؤال على شخص واحد قبل نشره على نطاق واسع."
                            ],
                            [
                                "Make the answer choices balanced and reasonably complete.",
                                "Avoid words that carry a built-in judgment.",
                                "Test the question with one person before sending it widely."
                            ],
                            "خذ سؤالاً استبيانياً من نوع: ما مدى حبك للتحديث الجديد؟ ثم أعد كتابته بشكل محايد مع مقياس متوازن.",
                            "Take a survey question like “how much do you love the new update?” and rewrite it into neutral wording with a balanced scale.",
                            "الاستبيان القوي لا يطلب الإعجاب، بل يلتقط الموقف بإنصاف.",
                            "A strong survey does not ask for affection. It captures sentiment fairly.",
                            21,
                            100,
                            "survey-bias",
                            "إذا كانت صياغة السؤال تدفع نحو جواب معين، فالنتيجة لن تكون بحثاً بل تأكيداً.",
                            "If the question pushes toward a preferred answer, the result is not research. It is confirmation.",
                            [
                                new CourseReferenceDefinition("MeasuringU - Survey Design Basics", "MeasuringU - Survey Design Basics"),
                                new CourseReferenceDefinition("Questionnaire Design Notes", "Questionnaire Design Notes")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "survey-bias-q1",
                                    "أي سؤال استبيان أكثر حياداً؟",
                                    "Which survey question is more neutral?",
                                    [
                                        "ما مدى حبك لتحديثنا الرائع؟",
                                        "هل توافق أن واجهتنا الحديثة أفضل بكثير؟",
                                        "كيف تصف تجربتك مع التحديث الأخير؟",
                                        "أليس من الواضح أن التصميم الجديد أسرع؟"
                                    ],
                                    [
                                        "How much do you love our amazing update?",
                                        "Do you agree that our modern interface is much better?",
                                        "How would you describe your experience with the latest update?",
                                        "Isn't it obvious that the new design is faster?"
                                    ],
                                    2,
                                    "ابحث عن السؤال الذي لا يلمّح إلى الإجابة.",
                                    "Look for the question that does not hint at the answer.",
                                    "السؤال المحايد يسمح للمستخدم بوصف تجربته بدون ضغط لغوي أو حكم مسبق.",
                                    "A neutral question lets people describe their experience without linguistic pressure or built-in judgment.",
                                    "survey-bias"
                                )
                            ])
                    ]),
                new CourseUnitDefinition(
                    "testing-synthesis",
                    "الاختبار والتحليل",
                    "Testing and Synthesis",
                    "نفّذ اختباراً سريعاً ثم حوّل ملاحظاته إلى قرارات مرتبة.",
                    "Run a quick test and convert the observations into ordered decisions.",
                    66,
                    300,
                    [
                        "إعداد اختبار استخدام بسيط وفعّال.",
                        "تنظيم الملاحظات في Themes.",
                        "ترتيب النتائج حسب الأثر والجهد."
                    ],
                    [
                        "Prepare a simple but effective usability test.",
                        "Organize notes into themes.",
                        "Prioritize findings by impact and effort."
                    ],
                    70,
                    160,
                    10,
                    [
                        new CourseLessonDefinition(
                            "usability-testing-practice",
                            "اختبار الاستخدام العملي",
                            "Practical Usability Testing",
                            "كيف تلاحظ الاحتكاك الحقيقي بدون سيناريو معقّد.",
                            "How to observe real friction without an overly complex test setup.",
                            "اختبار الاستخدام الناجح يبدأ بمهمة واقعية واحدة، بيئة هادئة، ومراقبة دقيقة لعلامات التردد أو الخطأ أو التوقع المكسور. لا تحتاج مختبراً ضخماً لتتعلم شيئاً مهماً.",
                            "Successful usability testing starts with one realistic task, a calm environment, and careful observation of hesitation, errors, or broken expectations. You do not need a giant lab to learn something important.",
                            [
                                "اجعل السيناريو قريباً من الاستخدام الحقيقي.",
                                "راقب التردد والصمت والرجوع كإشارات مهمة.",
                                "دوّن ما حدث قبل أن تفسره."
                            ],
                            [
                                "Keep the scenario close to real use.",
                                "Watch hesitation, silence, and backtracking as meaningful signals.",
                                "Write down what happened before interpreting it."
                            ],
                            "اصنع سيناريو اختبار واحد لعملية تسجيل أو دفع، ثم اكتب ثلاث ملاحظات فقط ستبحث عنها أثناء المراقبة.",
                            "Create one usability scenario for signup or checkout, then write the three signals you will actively watch during the session.",
                            "الاختبار الممتاز لا يحتاج عشر مهام. يحتاج مهمة مهمة واحدة وملاحظة جيدة.",
                            "A great test does not need ten tasks. It needs one important task and careful observation.",
                            22,
                            95,
                            "usability-lab",
                            "ابحث عن لحظة التوقف قبل أن تبحث عن الرأي.",
                            "Look for the pause before you look for the opinion.",
                            [
                                new CourseReferenceDefinition("Rocket Surgery Made Easy", "Rocket Surgery Made Easy"),
                                new CourseReferenceDefinition("Nielsen Norman Group - Usability Testing 101", "Nielsen Norman Group - Usability Testing 101")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "usability-testing-practice-q1",
                                    "ما الذي يجب ملاحظته أولاً أثناء اختبار الاستخدام؟",
                                    "What should you notice first in a usability test?",
                                    [
                                        "هل يمدح المستخدم الألوان",
                                        "هل هناك لحظة تردد أو خطأ أو رجوع",
                                        "كم مرة يبتسم المستخدم",
                                        "هل يحب اسم المنتج"
                                    ],
                                    [
                                        "Whether the participant compliments the colors",
                                        "Whether there is hesitation, error, or backtracking",
                                        "How often the participant smiles",
                                        "Whether they like the product name"
                                    ],
                                    1,
                                    "السلوك أثناء المهمة أهم من الانطباع السريع.",
                                    "Behavior during the task matters more than instant opinion.",
                                    "التردد والخطأ والرجوع تكشف الاحتكاك الحقيقي داخل التدفق.",
                                    "Hesitation, errors, and backtracking reveal the real friction inside the flow.",
                                    "usability-testing-practice"
                                )
                            ]),
                        new CourseLessonDefinition(
                            "affinity-mapping-practice",
                            "تنظيم الملاحظات في Themes",
                            "Affinity Mapping in Practice",
                            "اجمع ملاحظات متفرقة في أنماط يمكن للفريق العمل عليها.",
                            "Turn scattered observations into themes the team can act on.",
                            "بعد الجلسات، تبدأ الفوضى: ملاحظات كثيرة، اقتباسات، وشكاوى متناثرة. التصنيف الجيد يجمع ما يتكرر، يوضح العلاقات، ويمنعك من القفز إلى التوصية قبل رؤية النمط.",
                            "After the sessions comes the mess: many notes, quotes, and scattered complaints. Good synthesis groups recurring observations, reveals relationships, and stops you from jumping to recommendations before seeing the pattern.",
                            [
                                "اجمع الملاحظات المتشابهة أولاً ثم سمِّ النمط.",
                                "لا تكتب التوصية قبل أن ترى التكرار.",
                                "استخدم عناوين قصيرة تعبّر عن المعنى لا عن الأعراض فقط."
                            ],
                            [
                                "Cluster similar observations first, then name the pattern.",
                                "Do not write the recommendation before you see recurrence.",
                                "Use short headings that express meaning, not only symptoms."
                            ],
                            "خذ خمس ملاحظات خام عن اختبار استخدام ورتبها في مجموعتين أو ثلاث، ثم سمِّ كل مجموعة بعنوان يدل على معنى المشكلة.",
                            "Take five raw usability notes, group them into two or three clusters, then label each cluster with a title that explains the meaning of the issue.",
                            "التحليل القوي يحوّل الضجيج إلى قصة يمكن أن يصدقها الفريق ويعمل عليها.",
                            "Strong synthesis turns noise into a story the team can believe and act on.",
                            22,
                            100,
                            "affinity-wall",
                            "سمِّ النمط بوضوح، وسيصبح القرار التالي أسهل بكثير.",
                            "Name the pattern clearly, and the next decision becomes much easier.",
                            [
                                new CourseReferenceDefinition("Affinity Mapping Notes", "Affinity Mapping Notes"),
                                new CourseReferenceDefinition("Making Sense of Research Data", "Making Sense of Research Data")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "affinity-mapping-practice-q1",
                                    "ما الهدف الأول من الـ affinity mapping؟",
                                    "What is the first goal of affinity mapping?",
                                    [
                                        "كتابة حلول نهائية مباشرة",
                                        "ترتيب الألوان داخل التقرير",
                                        "اكتشاف الأنماط المتكررة بين الملاحظات",
                                        "اختيار أفضل خط للعرض"
                                    ],
                                    [
                                        "Write final solutions immediately",
                                        "Organize colors inside the report",
                                        "Discover recurring patterns across observations",
                                        "Choose the best presentation font"
                                    ],
                                    2,
                                    "التحليل يبدأ برؤية التكرار قبل اقتراح العلاج.",
                                    "Synthesis starts by spotting repetition before prescribing a fix.",
                                    "جمع الملاحظات في Themes متكررة هو الخطوة الأولى قبل صياغة التوصيات.",
                                    "Grouping observations into recurring themes is the first step before recommendations.",
                                    "affinity-mapping-practice"
                                )
                            ]),
                        new CourseLessonDefinition(
                            "insight-prioritization",
                            "ترتيب النتائج والتوصيات",
                            "Prioritizing Findings and Recommendations",
                            "اختر ما يستحق التنفيذ أولاً بناءً على الأثر والتكلفة.",
                            "Choose what deserves action first based on impact and effort.",
                            "ليست كل المشاكل متساوية. بعض النتائج تؤثر بقوة على المهمة الأساسية، وبعضها ثانوي أو مكلف جداً. الترتيب الجيد للتوصيات يحمي الفريق من مطاردة تفاصيل لامعة وترك المشاكل المهمة دون حل.",
                            "Not every issue is equal. Some findings strongly affect the core task, while others are secondary or expensive. Good prioritization protects the team from chasing shiny details while the most important problems remain unsolved.",
                            [
                                "اسأل عن أثر المشكلة على المهمة الأساسية أولاً.",
                                "وازن بين قيمة الحل وسهولة تنفيذه.",
                                "قدّم التوصية بصيغة تساعد الفريق على اتخاذ قرار سريع."
                            ],
                            [
                                "Ask how much the issue harms the core task first.",
                                "Balance the value of the fix against its effort.",
                                "Write the recommendation in a way that helps the team decide quickly."
                            ],
                            "رتّب ثلاث نتائج بحثية وفق الأثر والجهد، ثم فسّر لماذا اخترت التوصية الأولى كأفضل نقطة بداية.",
                            "Rank three research findings by impact and effort, then explain why the first recommendation is the best starting point.",
                            "الأولوية ليست لمن يصرخ أعلى، بل لما يحرّك النتيجة الأهم بوضوح.",
                            "Priority does not go to the loudest issue. It goes to the one that most clearly shifts the outcome that matters.",
                            22,
                            105,
                            "priority-matrix",
                            "اجعل القرار التالي واضحاً للفريق، لا مجرد قائمة مشاكل طويلة.",
                            "Make the next decision clear for the team, not just the list of problems.",
                            [
                                new CourseReferenceDefinition("Impact vs Effort Prioritization", "Impact vs Effort Prioritization"),
                                new CourseReferenceDefinition("Product Discovery Prioritization Notes", "Product Discovery Prioritization Notes")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "insight-prioritization-q1",
                                    "أي نتيجة تستحق أولوية أعلى غالباً؟",
                                    "Which finding usually deserves a higher priority?",
                                    [
                                        "خلل لوني بسيط في صفحة نادرة",
                                        "احتكاك يمنع إكمال المهمة الأساسية لعدد كبير من المستخدمين",
                                        "ملاحظة على صورة ثانوية",
                                        "اقتراح تجميلي بلا أثر على القرار"
                                    ],
                                    [
                                        "A small color issue on a rarely used page",
                                        "A friction point blocking the core task for many users",
                                        "A note about a secondary illustration",
                                        "A cosmetic suggestion with no effect on decisions"
                                    ],
                                    1,
                                    "ابدأ بالمشكلة التي تضرب المهمة الأساسية مباشرة.",
                                    "Start with the problem that hits the core task directly.",
                                    "النتائج التي تمنع إكمال المهمة الأساسية تستحق أولوية أعلى من التحسينات التجميلية.",
                                    "Findings that block the core task deserve higher priority than cosmetic refinements.",
                                    "insight-prioritization"
                                )
                            ])
                    ])
            ]),

        new(
            "systems-product",
            "الأنظمة وقرارات المنتج",
            "Systems and Product Decisions",
            "انقل العمل من شاشات منفصلة إلى نظام واجهة وقرارات منتج يمكن أن يتوسع بثبات.",
            "Move from isolated screens to an interface system and product decisions that can scale consistently.",
            "🧩",
            "intermediate",
            75,
            280,
            20,
            new CourseProjectDefinition(
                "systems-product-dashboard-library",
                "مشروع النظام: مكتبة واجهة ولوحة مؤشرات",
                "Systems Project: Dashboard UI Kit",
                "صمّم جزءاً من نظام واجهة لمنتج SaaS مع شاشة dashboard مرتبطة به.",
                "Design a small interface system for a SaaS product and a dashboard screen that uses it.",
                "سلّم tokens أو قواعد أساسية، و3 مكونات موثقة، وشاشة dashboard تطبقها مع شرح trade-offs الأساسية.",
                "Submit basic tokens or rules, 3 documented components, and a dashboard screen that applies them with the key trade-offs explained.",
                8,
                390,
                [
                    "تعريف tokens أو قواعد أساسية للنوع والمسافات والألوان",
                    "توثيق 3 مكونات مع حالات مختلفة",
                    "شاشة dashboard واحدة تطبق النظام",
                    "شرح موجز للقرارات والتنازلات"
                ],
                [
                    "Foundational tokens or rules for type, spacing, and color",
                    "Documentation for 3 components with state variations",
                    "One dashboard screen using the system",
                    "A short explanation of the decisions and trade-offs"
                ],
                [
                    new CourseProjectCriterionDefinition("تماسك النظام", "System coherence", 30),
                    new CourseProjectCriterionDefinition("قابلية التوسع", "Scalability", 25),
                    new CourseProjectCriterionDefinition("تطبيق المكونات", "Component application", 25),
                    new CourseProjectCriterionDefinition("وضوح التبرير", "Rationale clarity", 20)
                ]),
            [
                new CourseUnitDefinition(
                    "system-foundations",
                    "أسس النظام التصميمي",
                    "Design System Foundations",
                    "حوّل الأنماط المتكررة إلى قواعد ومكونات قابلة لإعادة الاستخدام.",
                    "Turn recurring patterns into reusable rules and components.",
                    66,
                    300,
                    [
                        "فهم دور tokens والخصائص المشتركة.",
                        "تحديد سلوك المكونات عبر الحالات.",
                        "توثيق النظام بطريقة تساعد الفريق."
                    ],
                    [
                        "Understand the role of tokens and shared properties.",
                        "Define component behavior across states.",
                        "Document the system in a way the team can use."
                    ],
                    70,
                    160,
                    10,
                    [
                        new CourseLessonDefinition(
                            "tokens-and-variables",
                            "الـ Tokens والمتغيرات",
                            "Tokens and Variables",
                            "كيف تبني طبقة أساسية تمنع الفوضى مع نمو المنتج.",
                            "How to build a foundation layer that prevents chaos as the product grows.",
                            "الـ tokens توحّد القرارات الصغيرة: الألوان، المسافات، الخطوط، والظلال. بدلاً من تكرار القيم يدوياً، تجعل التغييرات أسهل والاتساق أعلى عبر المنتج.",
                            "Tokens unify small decisions: colors, spacing, typography, and shadows. Instead of repeating values manually, they make change easier and consistency stronger across the product.",
                            [
                                "ابدأ بما يتكرر كثيراً ويصعب التحكم فيه يدوياً.",
                                "سمِّ القيم حسب الدور لا حسب اللون أو الرقم فقط.",
                                "اجعل الـ tokens قابلة للقراءة من المصممين والمطورين معاً."
                            ],
                            [
                                "Start with what repeats often and is painful to manage manually.",
                                "Name values by role, not only by color or number.",
                                "Make tokens understandable for both designers and developers."
                            ],
                            "أنشئ مجموعة صغيرة من tokens تشمل لوناً أساسياً، سلمين للمسافة، ونوعين من النصوص. ثم جرّب تطبيقها على مكونين مختلفين.",
                            "Create a small token set including a primary color, a spacing scale, and two text roles. Then apply it to two different components.",
                            "كل token جيد يقلل نقاشاً متكرراً في المستقبل.",
                            "Every good token removes a repeated argument in the future.",
                            22,
                            100,
                            "tokens-board",
                            "سمِّ الدور، لا الشكل فقط.",
                            "Name the role, not only the visual value.",
                            [
                                new CourseReferenceDefinition("Design Tokens Community Group", "Design Tokens Community Group"),
                                new CourseReferenceDefinition("Material 3 - Design Tokens", "Material 3 - Design Tokens")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "tokens-and-variables-q1",
                                    "أي تسمية token أفضل عادة؟",
                                    "Which token name is usually stronger?",
                                    [
                                        "blue-500",
                                        "big-margin",
                                        "color-action-primary",
                                        "shadow-thing"
                                    ],
                                    [
                                        "blue-500",
                                        "big-margin",
                                        "color-action-primary",
                                        "shadow-thing"
                                    ],
                                    2,
                                    "ابحث عن اسم يصف الوظيفة لا مجرد القيمة.",
                                    "Look for the name that describes the role, not only the raw value.",
                                    "الأسماء الدلالية مثل color-action-primary تصمد أكثر حين تتغير الألوان أو السمات لاحقاً.",
                                    "Semantic names like color-action-primary age better when themes or colors change later.",
                                    "tokens-and-variables"
                                )
                            ]),
                        new CourseLessonDefinition(
                            "component-behavior",
                            "سلوك المكونات",
                            "Component Behavior and States",
                            "لا يكفي أن يبدو المكون جيداً، بل يجب أن يتصرف بشكل متوقع في كل حالة.",
                            "A component is not successful because it looks good. It must also behave predictably across states.",
                            "الأزرار، الحقول، القوائم، والبطاقات تحتاج تعريفاً واضحاً للحالات: افتراضي، hover، focus، disabled، error، success. توثيق السلوك يقلل التضارب عند التوسع أو التعاون.",
                            "Buttons, fields, menus, and cards need clear state definitions: default, hover, focus, disabled, error, success. Documenting behavior reduces inconsistency as the product and team grow.",
                            [
                                "حدد الحالات المهمة قبل التجميل النهائي.",
                                "اربط كل حالة بتوقع واضح عند المستخدم.",
                                "اختبر الحالات الأقل شيوعاً مثل الخطأ أو التعطيل."
                            ],
                            [
                                "Define critical states before final polish.",
                                "Connect each state to a clear user expectation.",
                                "Test the less common states like error or disabled."
                            ],
                            "اختر مكوناً واحداً مثل زر أو حقل إدخال، ثم ارسم ست حالات مختلفة له مع شرح متى تظهر كل حالة ولماذا.",
                            "Choose one component, such as a button or input, then sketch six different states and explain when each one appears and why.",
                            "المكون الجيد لا يفاجئ المستخدم عندما تتغير حالته.",
                            "A strong component does not surprise the user when its state changes.",
                            22,
                            100,
                            "component-states",
                            "الحالة ليست تفصيلاً ثانوياً؛ هي جزء أساسي من الفهم.",
                            "State is not a secondary detail. It is a core part of comprehension.",
                            [
                                new CourseReferenceDefinition("Component States Reference", "Component States Reference"),
                                new CourseReferenceDefinition("Design Systems Handbook", "Design Systems Handbook")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "component-behavior-q1",
                                    "ما الحالة التي غالباً يتم نسيانها رغم أهميتها؟",
                                    "Which state is often forgotten despite its importance?",
                                    [
                                        "الحالة الافتراضية",
                                        "حالة التركيز أو الخطأ",
                                        "عنوان المكون",
                                        "حجم الشاشة"
                                    ],
                                    [
                                        "The default state",
                                        "The focus or error state",
                                        "The component title",
                                        "The screen size"
                                    ],
                                    1,
                                    "الحالات الأقل تكراراً غالباً هي الأكثر حساسية.",
                                    "The less frequent states are often the most sensitive ones.",
                                    "حالات التركيز والخطأ تكشف جودة النظام لأنها تؤثر مباشرة على الفهم والوصول والثقة.",
                                    "Focus and error states reveal system quality because they directly affect comprehension, accessibility, and trust.",
                                    "component-behavior"
                                )
                            ]),
                        new CourseLessonDefinition(
                            "documentation-patterns",
                            "توثيق الأنماط",
                            "Documenting Patterns Clearly",
                            "حوّل النظام من معرفة في رأسك إلى مرجع يمكن للفريق البناء عليه.",
                            "Turn the system from knowledge in your head into a reference the team can build on.",
                            "التوثيق الجيد يشرح متى نستخدم المكون، متى لا نستخدمه، كيف يتصرف، وما الأمثلة الصحيحة والخاطئة. هذا يقلل إعادة العمل ويقصر الوقت بين القرار والتنفيذ.",
                            "Good documentation explains when to use a component, when not to use it, how it behaves, and what right and wrong examples look like. That reduces rework and shortens the gap between decision and implementation.",
                            [
                                "ابدأ بمتى نستخدم ومتى لا نستخدم.",
                                "أضف أمثلة صحيحة وأخرى تسبب لبساً.",
                                "اجعل التوثيق عملياً لا نظرياً فقط."
                            ],
                            [
                                "Start with when to use and when not to use.",
                                "Add both correct and misleading examples.",
                                "Make documentation practical, not only theoretical."
                            ],
                            "اكتب صفحة توثيق قصيرة لمكون Tabs أو Alert تتضمن الاستخدام الصحيح والخاطئ وحالتين مختلفتين على الأقل.",
                            "Write a short documentation page for a Tabs or Alert component that includes proper and improper use and at least two states.",
                            "إذا كان الفريق لا يعرف متى يستخدم المكون، فالمشكلة ليست في الفريق بل في التوثيق.",
                            "If the team does not know when to use a component, the problem is not the team. It is the documentation.",
                            22,
                            100,
                            "documentation-sheet",
                            "أوضح متى لا يُستخدم المكون بقدر ما توضح متى يُستخدم.",
                            "Clarify when not to use the component as much as when to use it.",
                            [
                                new CourseReferenceDefinition("Design System Documentation Patterns", "Design System Documentation Patterns"),
                                new CourseReferenceDefinition("Atlassian Design System Content", "Atlassian Design System Content")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "documentation-patterns-q1",
                                    "ما العنصر الأكثر قيمة في توثيق المكون؟",
                                    "What is one of the most valuable parts of component documentation?",
                                    [
                                        "عدد الصور فقط",
                                        "اسم المصمم الذي أنشأه",
                                        "متى نستخدمه ومتى لا نستخدمه مع أمثلة",
                                        "لون الخلفية في الصفحة"
                                    ],
                                    [
                                        "Only the number of screenshots",
                                        "The name of the designer who created it",
                                        "When to use it and when not to, with examples",
                                        "The page background color"
                                    ],
                                    2,
                                    "التوثيق الجيد يقلل الحيرة العملية داخل الفريق.",
                                    "Good documentation reduces practical confusion inside the team.",
                                    "فهم سياق الاستخدام الصحيح والخاطئ يجعل المكون أداة واضحة لا مجرد شكل جميل.",
                                    "Understanding correct and incorrect usage turns a component into a clear tool, not just a nice shape.",
                                    "documentation-patterns"
                                )
                            ])
                    ]),
                new CourseUnitDefinition(
                    "product-decisions",
                    "قرارات المنتج",
                    "Product UX Decisions",
                    "اربط بين تجربة الواجهة والنتائج التي يريدها المنتج والنمو.",
                    "Connect interface experience to the outcomes the product and business actually need.",
                    64,
                    300,
                    [
                        "تحديد مؤشرات مهمة للتجربة.",
                        "ترتيب فرص التحسين حسب أثرها.",
                        "صياغة تجربة أو فرضية يمكن اختبارها."
                    ],
                    [
                        "Define experience-relevant metrics.",
                        "Prioritize improvement opportunities by impact.",
                        "Write experiments or hypotheses that can be tested."
                    ],
                    70,
                    160,
                    10,
                    [
                        new CourseLessonDefinition(
                            "north-star-metrics",
                            "المؤشرات التي تهم التجربة",
                            "Metrics That Matter for UX",
                            "اختر مؤشرات تقيس جودة التجربة لا مجرد النشاط العام.",
                            "Choose metrics that reflect experience quality, not only generic activity.",
                            "ليس كل رقم مفيداً لفرق UX. المؤشر الجيد يصف ما إذا كانت التجربة تساعد المستخدم على الوصول إلى نتيجة ذات معنى بوضوح وسرعة وثقة.",
                            "Not every number is useful for UX work. A strong metric reflects whether the experience helps people reach a meaningful outcome with clarity, speed, and confidence.",
                            [
                                "اربط المؤشر بالمهمة الأساسية لا بالضوضاء المحيطة.",
                                "استخدم مؤشرات leading وlagging معاً عند الإمكان.",
                                "اقرأ الأرقام مع السياق النوعي لا بشكل منفصل."
                            ],
                            [
                                "Tie the metric to the core task, not surrounding noise.",
                                "Use leading and lagging indicators together when possible.",
                                "Read metrics with qualitative context, not in isolation."
                            ],
                            "اختر تجربة مثل التسجيل أو رفع ملف، ثم حدّد مؤشراً رئيسياً ومؤشرين داعمين يشرحان جودة التجربة بشكل أفضل من page views العامة.",
                            "Take a flow like signup or file upload and define one main metric and two supporting metrics that explain experience quality better than generic page views.",
                            "أفضل مؤشرات UX تشرح النجاح الحقيقي لا مجرد الوجود داخل المنتج.",
                            "The best UX metrics describe meaningful success, not only presence inside the product.",
                            21,
                            100,
                            "metrics-panel",
                            "إذا لم يرتبط الرقم بمهمة حقيقية، فلن يقود قراراً UX جيداً.",
                            "If the number is not tied to a real task, it will not guide a strong UX decision.",
                            [
                                new CourseReferenceDefinition("Product Metrics for UX", "Product Metrics for UX"),
                                new CourseReferenceDefinition("Lean Analytics", "Lean Analytics")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "north-star-metrics-q1",
                                    "أي مؤشر أقرب لقياس جودة تجربة الدفع؟",
                                    "Which metric is closer to measuring checkout experience quality?",
                                    [
                                        "عدد مرات فتح الصفحة الرئيسية",
                                        "مدة بقاء المستخدم داخل التطبيق عموماً",
                                        "نسبة إتمام الدفع بعد بدء العملية",
                                        "عدد الألوان المستخدمة في الصفحة"
                                    ],
                                    [
                                        "Number of home page visits",
                                        "Overall time spent in the app",
                                        "Checkout completion rate after the process starts",
                                        "Number of colors used on the screen"
                                    ],
                                    2,
                                    "ابحث عن الرقم الأقرب للمهمة الأساسية نفسها.",
                                    "Look for the number closest to the core task itself.",
                                    "نسبة إتمام الدفع بعد البداية تقيس نجاح المهمة الفعلية بشكل مباشر أكثر من الأرقام العامة.",
                                    "Checkout completion after the process starts measures the actual task outcome far more directly than broad activity metrics.",
                                    "north-star-metrics"
                                )
                            ]),
                        new CourseLessonDefinition(
                            "impact-effort-prioritization",
                            "الأثر مقابل الجهد",
                            "Impact vs Effort Prioritization",
                            "رتّب أفكار التحسين بطريقة تحميك من مطاردة التحسينات اللامعة.",
                            "Rank improvement ideas in a way that protects you from chasing shiny but low-value work.",
                            "عندما تتراكم الأفكار، يصبح التحدي هو اختيار ما يستحق التنفيذ أولاً. مصفوفة الأثر والجهد لا تعطيك الحقيقة المطلقة، لكنها تمنحك إطاراً عملياً لمناقشة القرارات بوضوح.",
                            "When ideas pile up, the challenge becomes choosing what deserves action first. An impact-versus-effort matrix does not give absolute truth, but it provides a practical frame for clearer decision-making.",
                            [
                                "اسأل عن أثر كل فكرة على المهمة الأساسية.",
                                "ميّز بين الجهد التقني وجهد التغيير على المستخدم.",
                                "استخدم الإطار لبدء النقاش لا لإنهائه."
                            ],
                            [
                                "Ask how each idea affects the core task.",
                                "Separate technical effort from user change effort.",
                                "Use the frame to start the conversation, not to end it."
                            ],
                            "اختر أربع أفكار تحسين لتجربة دفع أو إعدادات، ثم ضعها على مصفوفة أثر/جهد مع مبرر مختصر لكل واحدة.",
                            "Pick four improvement ideas for checkout or settings and place them on an impact/effort matrix with a short rationale for each.",
                            "الترتيب الجيد يصنع تركيزاً، لا مجرد ترتيب شكلي داخل جدول.",
                            "Good prioritization creates focus, not just tidy sorting inside a table.",
                            21,
                            100,
                            "impact-effort",
                            "الإطار الجيد لا يختار عنك، لكنه يجعل الاختيار أوضح.",
                            "A good frame does not choose for you. It makes the choice clearer.",
                            [
                                new CourseReferenceDefinition("Impact Effort Matrix", "Impact Effort Matrix"),
                                new CourseReferenceDefinition("Product Prioritization Notes", "Product Prioritization Notes")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "impact-effort-prioritization-q1",
                                    "أي فكرة غالباً تبدأ بها؟",
                                    "Which idea would you usually start with?",
                                    [
                                        "أثر منخفض وجهد عالٍ",
                                        "أثر عالٍ وجهد معقول",
                                        "أثر غير واضح وجهد عالٍ",
                                        "فكرة جذابة لكن لا تخدم المهمة الأساسية"
                                    ],
                                    [
                                        "Low impact and high effort",
                                        "High impact and reasonable effort",
                                        "Unclear impact and high effort",
                                        "A shiny idea that does not support the core task"
                                    ],
                                    1,
                                    "ابدأ بما يغيّر النتيجة المهمة بتكلفة منطقية.",
                                    "Start with the idea that shifts the important outcome at a sensible cost.",
                                    "الأفكار ذات الأثر العالي والجهد المعقول غالباً تمنح أفضل عائد مبكر للفريق والمنتج.",
                                    "Ideas with high impact and reasonable effort usually give the best early return for the team and product.",
                                    "impact-effort-prioritization"
                                )
                            ]),
                        new CourseLessonDefinition(
                            "experiment-briefs",
                            "صياغة تجربة أو فرضية",
                            "Writing Better Experiment Briefs",
                            "حوّل فكرة التحسين إلى فرضية قابلة للاختبار والتعلم.",
                            "Turn an improvement idea into a hypothesis you can test and learn from.",
                            "التجربة الجيدة تبدأ بفرضية تقول: إذا غيّرنا هذا الشيء لهؤلاء المستخدمين، فنتوقع أثراً محدداً لأننا نؤمن بسبب محدد. هذه البنية تجعل التعلم من النتيجة أسرع وأكثر فائدة.",
                            "A strong experiment starts with a hypothesis: if we change this thing for these users, we expect this outcome because we believe this reason. That structure makes learning from the result much faster and more useful.",
                            [
                                "حدّد من يتأثر بالتجربة بوضوح.",
                                "صف التغيير المطلوب بدون غموض.",
                                "أضف النتيجة المتوقعة ومؤشر القياس."
                            ],
                            [
                                "Define who is affected by the experiment clearly.",
                                "Describe the change without ambiguity.",
                                "Add the expected outcome and the measurement signal."
                            ],
                            "حوّل فكرة مثل: نجعل الصفحة أوضح إلى فرضية كاملة تتضمن الجمهور والتغيير والنتيجة المتوقعة والمقياس.",
                            "Turn an idea like “make the page clearer” into a full hypothesis that includes the audience, the change, the expected outcome, and the metric.",
                            "الفرضية الجيدة تجعل الفشل مفيداً بقدر النجاح لأنها تكشف سبباً محتملاً.",
                            "A strong hypothesis makes failure as useful as success because it reveals a likely cause.",
                            22,
                            100,
                            "experiment-brief",
                            "اكتب التغيير والنتيجة والسبب، لا الفكرة العامة فقط.",
                            "Write the change, the outcome, and the reason, not just the idea.",
                            [
                                new CourseReferenceDefinition("Experiment Briefing Basics", "Experiment Briefing Basics"),
                                new CourseReferenceDefinition("Product Experimentation Notes", "Product Experimentation Notes")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "experiment-briefs-q1",
                                    "ما الذي يجعل الفرضية أقوى؟",
                                    "What makes a hypothesis stronger?",
                                    [
                                        "أن تكون عامة ويمكن تفسيرها بعدة طرق",
                                        "أن تحدد الجمهور والتغيير والنتيجة والمقياس",
                                        "أن تصف التصميم بأنه جميل",
                                        "أن تتجاهل السبب المتوقع"
                                    ],
                                    [
                                        "It stays broad and open to many interpretations",
                                        "It defines the audience, change, outcome, and metric",
                                        "It says the design will look beautiful",
                                        "It ignores the expected reason"
                                    ],
                                    1,
                                    "الفرضية القوية تجعل التعلّم قابلاً للقياس.",
                                    "A strong hypothesis makes learning measurable.",
                                    "كلما كانت الفرضية أوضح في من يتأثر وما التغيير وما النتيجة، زادت قيمة الاختبار.",
                                    "The clearer the hypothesis is about who is affected, what changes, and what outcome is expected, the more valuable the experiment becomes.",
                                    "experiment-briefs"
                                )
                            ])
                    ])
            ]),

        new(
            "accessibility-interaction",
            "الإتاحة وجودة التفاعل",
            "Accessibility and Interaction Quality",
            "صمّم تجارب شاملة وسريعة الفهم حتى في الحالات الصعبة أو المتقدمة.",
            "Design experiences that stay inclusive and understandable even in advanced or demanding situations.",
            "♿",
            "advanced",
            80,
            320,
            22,
            new CourseProjectDefinition(
                "accessibility-interaction-accessible-flow",
                "مشروع الإتاحة: تدفق شامل ومتفاعل",
                "Accessibility Project: Inclusive Interaction Flow",
                "صمّم تدفقاً أساسياً مثل تسجيل أو دفع مع معالجة واضحة للتركيز، القراءة، والحالات الصعبة.",
                "Design a core flow such as signup or checkout with clear handling for focus, readability, and edge states.",
                "سلّم شاشات high-fi أو mid-fi، وتعريفاً لحالات focus وerror وloading، ومراجعة وصول قصيرة وفق مبادئ WCAG.",
                "Submit mid- or high-fidelity screens, explicit focus/error/loading states, and a short accessibility review against WCAG principles.",
                8,
                420,
                [
                    "تدفق من 3 إلى 5 شاشات",
                    "حالات focus وerror وloading موضحة",
                    "مراجعة وصول قصيرة من 5 نقاط",
                    "شرح لكيفية دعم المستخدمين المختلفين"
                ],
                [
                    "A 3 to 5 screen flow",
                    "Clear focus, error, and loading states",
                    "A 5-point accessibility review",
                    "An explanation of how the flow supports different users"
                ],
                [
                    new CourseProjectCriterionDefinition("الوضوح الشامل", "Inclusive clarity", 25),
                    new CourseProjectCriterionDefinition("جودة الحالات", "State quality", 25),
                    new CourseProjectCriterionDefinition("دعم الوصول", "Accessibility support", 30),
                    new CourseProjectCriterionDefinition("المنطق التفاعلي", "Interaction logic", 20)
                ]),
            [
                new CourseUnitDefinition(
                    "inclusive-design",
                    "التصميم الشامل",
                    "Inclusive Design",
                    "اجعل التجربة قابلة للاستخدام من طيف أوسع من الناس والظروف.",
                    "Make the experience usable across a wider range of people and contexts.",
                    68,
                    320,
                    [
                        "فهم أساسيات الإتاحة العملية.",
                        "تصميم تدفقات ولوحات تحترم التنقل ولوحات المفاتيح والوضوح.",
                        "تقليل الإقصاء غير المقصود داخل النماذج والمحتوى."
                    ],
                    [
                        "Understand practical accessibility fundamentals.",
                        "Design flows that respect keyboard navigation and clarity.",
                        "Reduce accidental exclusion in forms and content."
                    ],
                    75,
                    170,
                    10,
                    [
                        new CourseLessonDefinition(
                            "wcag-basics",
                            "مبادئ WCAG العملية",
                            "Practical WCAG Basics",
                            "تعرّف على المبادئ التي تمنع أخطاء وصول شائعة جداً في المنتجات الرقمية.",
                            "Learn the principles that prevent very common accessibility failures in digital products.",
                            "الإتاحة ليست قائمة تحقق منفصلة عن الجودة، بل جزء من جودة التجربة نفسها. مبادئ WCAG تساعدك على مراجعة الوضوح، التباين، التنقل، والقدرة على الفهم عبر حالات مختلفة.",
                            "Accessibility is not a checklist detached from quality. It is part of experience quality itself. WCAG principles help you review clarity, contrast, navigation, and understandability across different situations.",
                            [
                                "قابلية الإدراك تعني أن المحتوى يمكن رؤيته أو سماعه بوضوح.",
                                "قابلية التشغيل تعني أن التحكم لا يعتمد على نمط واحد فقط.",
                                "قابلية الفهم تعني أن النصوص والسلوك متوقعان."
                            ],
                            [
                                "Perceivable means content can be seen or heard clearly.",
                                "Operable means control does not rely on only one interaction mode.",
                                "Understandable means copy and behavior are predictable."
                            ],
                            "راجع شاشة واحدة في منتجك وضع ملاحظات قصيرة تحت ثلاثة عناوين: إدراك، تشغيل، فهم.",
                            "Review one screen in your product and place short notes under three headings: perceivable, operable, understandable.",
                            "الإتاحة القوية ترفع الجودة للجميع، لا لفئة محددة فقط.",
                            "Strong accessibility raises quality for everyone, not only for one group.",
                            22,
                            105,
                            "wcag-grid",
                            "تعامل مع الإتاحة كمعيار جودة شامل لا كإضافة لاحقة.",
                            "Treat accessibility as a quality bar, not a late add-on.",
                            [
                                new CourseReferenceDefinition("WCAG Overview", "WCAG Overview"),
                                new CourseReferenceDefinition("Inclusive Design Principles", "Inclusive Design Principles")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "wcag-basics-q1",
                                    "أي فكرة تعكس الإتاحة بشكل أفضل؟",
                                    "Which idea reflects accessibility best?",
                                    [
                                        "هي إضافة لاحقة بعد اكتمال التصميم",
                                        "هي جزء من جودة التجربة نفسها",
                                        "هي فقط زيادة حجم الخط",
                                        "هي تخص ذوي الإعاقة فقط"
                                    ],
                                    [
                                        "It is a late add-on after design is done",
                                        "It is part of the experience quality itself",
                                        "It only means increasing font size",
                                        "It only concerns disabled users"
                                    ],
                                    1,
                                    "فكر في الإتاحة كجودة أساسية لا خيار ثانوي.",
                                    "Think of accessibility as a core quality bar, not a secondary option.",
                                    "الإتاحة الجيدة تحسن الوضوح والتشغيل والفهم لمجموعة أوسع من المستخدمين.",
                                    "Good accessibility improves clarity, operation, and comprehension for a wider group of users.",
                                    "wcag-basics"
                                )
                            ]),
                        new CourseLessonDefinition(
                            "keyboard-and-screenreader",
                            "التنقل ولوحات المفاتيح وقارئات الشاشة",
                            "Keyboard and Screen Reader Flow",
                            "افحص ما إذا كان التدفق ما زال منطقياً بدون الماوس أو الرؤية الكاملة.",
                            "Check whether the flow still makes sense without a mouse or full visual access.",
                            "كثير من الواجهات تبدو جيدة بصرياً لكنها تنهار عند التنقل بلوحة المفاتيح أو قارئ الشاشة. مراجعة الترتيب، التركيز، والعناوين تكشف هذه المشكلة بسرعة.",
                            "Many interfaces look polished visually but break down when used with keyboard navigation or a screen reader. Reviewing order, focus, and headings reveals that quickly.",
                            [
                                "التسلسل المنطقي مهم بقدر ترتيب العناصر البصري.",
                                "حالة focus يجب أن تكون مرئية وواضحة.",
                                "العناوين والأسماء الوصفية تساعد التقنيات المساندة."
                            ],
                            [
                                "Logical sequence matters as much as visual layout.",
                                "Focus states must be visible and clear.",
                                "Headings and descriptive names help assistive technologies."
                            ],
                            "جرّب التنقل بين عناصر نموذج أو شاشة إعدادات باستخدام Tab فقط، ثم دوّن أول ثلاث مشكلات تظهر لك.",
                            "Try navigating a form or settings screen using only Tab, then document the first three issues you notice.",
                            "إذا لم تستطع متابعة الرحلة بالترتيب المنطقي، فالتجربة تحتاج إعادة ضبط.",
                            "If you cannot follow the journey in a logical order, the experience needs to be reworked.",
                            22,
                            105,
                            "focus-order",
                            "الترتيب المنطقي جزء أساسي من فهم الواجهة.",
                            "Logical order is a core part of interface comprehension.",
                            [
                                new CourseReferenceDefinition("WAI Keyboard Accessibility", "WAI Keyboard Accessibility"),
                                new CourseReferenceDefinition("Screen Reader Support Notes", "Screen Reader Support Notes")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "keyboard-and-screenreader-q1",
                                    "ما أهم شيء يجب التأكد منه عند التنقل بلوحة المفاتيح؟",
                                    "What is one of the most important things to verify for keyboard navigation?",
                                    [
                                        "أن يكون كل زر بلون مختلف",
                                        "أن يكون ترتيب التركيز منطقياً ومرئياً",
                                        "أن تكون الأيقونات ثلاثية الأبعاد",
                                        "أن تكون الصفحة أطول"
                                    ],
                                    [
                                        "Every button has a different color",
                                        "Focus order is logical and visible",
                                        "Icons are three-dimensional",
                                        "The page is longer"
                                    ],
                                    1,
                                    "انظر إلى إمكانية متابعة الرحلة بدون ماوس.",
                                    "Focus on whether the journey can be followed without a mouse.",
                                    "إذا كان ترتيب التركيز غير منطقي أو غير مرئي، فإن التجربة تصبح صعبة على شريحة واسعة من المستخدمين.",
                                    "If focus order is illogical or invisible, the experience becomes difficult for a wide range of users.",
                                    "keyboard-and-screenreader"
                                )
                            ]),
                        new CourseLessonDefinition(
                            "inclusive-forms",
                            "النماذج الشاملة",
                            "Inclusive Forms",
                            "صمّم نماذج تراعي الإدخال المختلف وتخفض الخوف من الخطأ.",
                            "Design forms that respect different input needs and lower the fear of mistakes.",
                            "النماذج الشاملة تراعي الوضوح، التسميات، المساعدة، وطريقة التعافي من الخطأ. كما تتجنب الافتراضات غير الضرورية حول الاسم أو الهوية أو طريقة الاستخدام.",
                            "Inclusive forms care about clarity, labels, guidance, and error recovery. They also avoid unnecessary assumptions about names, identity, or the way people interact.",
                            [
                                "استخدم حقولاً وتلميحات تحترم تنوع المستخدمين.",
                                "اجعل الرسائل تعالج الخطأ بدون لوم.",
                                "فكر في الحالات التي تحتاج مرونة بدلاً من فرض تنسيق واحد."
                            ],
                            [
                                "Use fields and hints that respect user diversity.",
                                "Write messages that address errors without blame.",
                                "Think about cases that need flexibility instead of a single rigid format."
                            ],
                            "راجع نموذج إنشاء حساب واكتب تعديلين يجعلان الحقول أو الرسائل أكثر شمولاً ووضوحاً.",
                            "Review an account creation form and write two adjustments that would make the fields or messages more inclusive and clear.",
                            "الشمولية تظهر في التفاصيل الصغيرة التي تجعل المهمة أسهل لعدد أكبر من الناس.",
                            "Inclusivity often shows up in the small details that make the task easier for more people.",
                            22,
                            110,
                            "inclusive-form",
                            "أزل الافتراضات غير الضرورية، وستصبح الرحلة أرحب وأكثر وضوحاً.",
                            "Remove unnecessary assumptions and the flow becomes more open and clearer.",
                            [
                                new CourseReferenceDefinition("Inclusive Form Design Patterns", "Inclusive Form Design Patterns"),
                                new CourseReferenceDefinition("Inclusive Components", "Inclusive Components")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "inclusive-forms-q1",
                                    "ما الذي يجعل النموذج أكثر شمولاً؟",
                                    "What makes a form more inclusive?",
                                    [
                                        "فرض تنسيق واحد صارم للاسم والهوية",
                                        "رسائل خطأ قصيرة تلوم المستخدم",
                                        "تسميات واضحة ومساعدة مرنة وحالات تعافٍ جيدة",
                                        "إخفاء سبب طلب البيانات"
                                    ],
                                    [
                                        "Forcing one rigid format for names and identity",
                                        "Short error messages that blame the user",
                                        "Clear labels, flexible help, and strong recovery states",
                                        "Hiding why data is being requested"
                                    ],
                                    2,
                                    "الشمولية تحتاج وضوحاً ومرونة وتعافياً جيداً.",
                                    "Inclusivity needs clarity, flexibility, and good recovery.",
                                    "التسميات الواضحة والمساعدة المرنة وحالات التعافي الجيدة تجعل النماذج أكثر شمولاً وأسهل استخداماً.",
                                    "Clear labels, flexible guidance, and strong recovery states make forms more inclusive and easier to use.",
                                    "inclusive-forms"
                                )
                            ])
                    ]),
                new CourseUnitDefinition(
                    "interaction-craft",
                    "صياغة التفاعل",
                    "Interaction Craft",
                    "اجعل الحركة والتنقل والاستجابة أكثر ذكاءً بدون إثقال التجربة.",
                    "Make motion, navigation, and responsiveness smarter without overloading the experience.",
                    67,
                    320,
                    [
                        "استخدام الحركة لدعم الفهم لا التشتيت.",
                        "تنظيم التنقل في تجارب أكثر تعقيداً.",
                        "تكييف الواجهة مع شاشات وسياقات متعددة."
                    ],
                    [
                        "Use motion to support understanding instead of distraction.",
                        "Organize navigation in more complex experiences.",
                        "Adapt interfaces across screens and contexts."
                    ],
                    75,
                    170,
                    10,
                    [
                        new CourseLessonDefinition(
                            "microinteractions",
                            "الـ Microinteractions الهادفة",
                            "Purposeful Microinteractions",
                            "استخدم الحركة الصغيرة لإعطاء معنى وتغذية راجعة لا لمجرد الإبهار.",
                            "Use small moments of motion to provide meaning and feedback, not just flair.",
                            "الحركة الجيدة تشرح التغيير أو تؤكد النتيجة أو توجّه الانتباه. الحركة الضعيفة تضيف وقتاً أو ضوضاء. لذلك يجب أن تبدأ من الوظيفة قبل الجمال.",
                            "Good motion explains change, confirms an outcome, or guides attention. Weak motion adds delay or noise. That is why motion must start from function before style.",
                            [
                                "اجعل الحركة قصيرة ومتصلة بالسبب.",
                                "استخدمها لتأكيد حالة أو انتقال مهم.",
                                "تجنب الحركة التي تؤخر الإجراء الأساسي."
                            ],
                            [
                                "Keep motion short and tied to a reason.",
                                "Use it to confirm a state or important transition.",
                                "Avoid motion that delays the primary action."
                            ],
                            "راجع تفاعلاً مثل إضافة عنصر للعربة أو حفظ إعداد، ثم صف كيف يمكن لحركة صغيرة أن تؤكد النتيجة بدون تشتيت.",
                            "Review an interaction like adding to cart or saving a setting and describe how a small motion cue could confirm the outcome without distraction.",
                            "الحركة الجيدة تُشعر المستخدم بأن النظام فهمه واستجاب له فوراً.",
                            "Good motion makes the system feel like it understood and responded immediately.",
                            22,
                            105,
                            "microinteraction",
                            "إذا لم تضف الحركة معنى، فغالباً لا تحتاجها.",
                            "If the motion adds no meaning, you probably do not need it.",
                            [
                                new CourseReferenceDefinition("Microinteractions - Dan Saffer", "Microinteractions - Dan Saffer"),
                                new CourseReferenceDefinition("Material Motion Principles", "Material Motion Principles")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "microinteractions-q1",
                                    "متى تكون الحركة مفيدة في UI؟",
                                    "When is motion useful in UI?",
                                    [
                                        "عندما تضيف تأخيراً يلفت الانتباه فقط",
                                        "عندما تؤكد حالة أو انتقالاً مهماً",
                                        "عندما تتحرك كل العناصر دائماً",
                                        "عندما تستبدل النص التوضيحي"
                                    ],
                                    [
                                        "When it only adds delay to attract attention",
                                        "When it confirms an important state or transition",
                                        "When every element is always moving",
                                        "When it replaces explanatory text"
                                    ],
                                    1,
                                    "فكر في الوظيفة التي تؤديها الحركة.",
                                    "Think about the job the motion is doing.",
                                    "الحركة المفيدة توضح انتقالاً أو تؤكد نتيجة، لا تضيف ضوضاء زمنية بلا معنى.",
                                    "Useful motion clarifies a transition or confirms a result instead of adding meaningless time noise.",
                                    "microinteractions"
                                )
                            ]),
                        new CourseLessonDefinition(
                            "advanced-navigation",
                            "التنقل في الواجهات المعقدة",
                            "Navigation in Complex Interfaces",
                            "وازن بين الوصول السريع وكثرة الخيارات في المنتجات الكبيرة.",
                            "Balance fast access with many options inside larger products.",
                            "كلما زاد تعقيد المنتج، أصبحت بنية التنقل أكثر حساسية. المطلوب هو مساعدة المستخدم على فهم أين هو، ما الذي يمكنه فعله، وكيف يعود أو ينتقل بسرعة بدون ضياع.",
                            "As products grow more complex, navigation structure becomes more sensitive. The goal is to help people understand where they are, what they can do, and how to return or move quickly without getting lost.",
                            [
                                "احرص على وضوح الموقع الحالي داخل المنتج.",
                                "اجعل المسارات المتكررة أقصر وأسهل وصولاً.",
                                "قلّل العمق غير الضروري إذا كان يربك المستخدم."
                            ],
                            [
                                "Keep the current location inside the product obvious.",
                                "Make frequent paths shorter and easier to reach.",
                                "Reduce unnecessary depth if it confuses people."
                            ],
                            "حلّل منتجاً يحتوي على sidebar أو tabs متعددة، ثم اكتب أين يمكن أن يضيع المستخدم وما الإشارة التي ستعيده للمسار الصحيح.",
                            "Analyze a product with a sidebar or many tabs and write where people could get lost and which cue would guide them back to the right path.",
                            "التنقل الجيد يخفّض العبء المعرفي حتى عندما يزيد عدد الخيارات.",
                            "Good navigation reduces cognitive load even when the number of options grows.",
                            22,
                            105,
                            "navigation-map",
                            "أوضح للمستخدم أين هو الآن قبل أن تشرح أين يمكنه الذهاب.",
                            "Show people where they are now before showing where they can go.",
                            [
                                new CourseReferenceDefinition("Information Architecture for the Web", "Information Architecture for the Web"),
                                new CourseReferenceDefinition("Complex Navigation Patterns", "Complex Navigation Patterns")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "advanced-navigation-q1",
                                    "ما العنصر الأكثر أهمية داخل تنقل معقّد؟",
                                    "What is one of the most important parts of complex navigation?",
                                    [
                                        "أن تكون كل الروابط بنفس القوة",
                                        "وضوح الموقع الحالي والمسار التالي",
                                        "إخفاء الخيارات المهمة داخل قوائم عميقة",
                                        "إضافة أقسام كثيرة في الصفحة نفسها"
                                    ],
                                    [
                                        "Making every link equally strong",
                                        "Clearly showing current location and next path",
                                        "Hiding important options deep in menus",
                                        "Adding many sections to the same screen"
                                    ],
                                    1,
                                    "فكر في حاجة المستخدم إلى الاتجاه لا إلى الكثافة.",
                                    "Think about the need for orientation, not density.",
                                    "التنقل المعقد ينجح عندما يعرف المستخدم مكانه الحالي وما الطريق المنطقي التالي.",
                                    "Complex navigation works when people know where they are and what the next logical path is.",
                                    "advanced-navigation"
                                )
                            ]),
                        new CourseLessonDefinition(
                            "responsive-adaptation",
                            "التكيف مع الشاشات والسياقات",
                            "Responsive Adaptation",
                            "انقل الأولويات نفسها بين الهاتف والتابلت والويب بدون فقدان المعنى.",
                            "Carry the same priorities across mobile, tablet, and web without losing meaning.",
                            "التجاوب ليس فقط تصغير العناصر. هو إعادة توزيع للأولوية والمحتوى والحركة حسب الشاشة والسياق. ما يظهر أولاً على الهاتف ليس بالضرورة ما يظهر أولاً على سطح المكتب، لكن المهمة يجب أن تبقى واضحة.",
                            "Responsiveness is not only shrinking elements. It is redistributing priority, content, and motion based on screen and context. What appears first on mobile may differ from desktop, but the task must stay clear.",
                            [
                                "ابدأ من المهمة الأساسية على كل شاشة.",
                                "غيّر الترتيب لا المعنى.",
                                "اختبر اللحظات الحرجة مثل الإدخال والقراءة والمراجعة."
                            ],
                            [
                                "Start from the primary task on each screen.",
                                "Change the order, not the meaning.",
                                "Test critical moments like input, reading, and review."
                            ],
                            "اختر شاشة dashboard أو checkout ثم اكتب كيف ستعيد ترتيبها على الهاتف مع الحفاظ على القرار الأساسي نفسه.",
                            "Choose a dashboard or checkout screen and describe how you would reorder it on mobile while preserving the same primary decision.",
                            "التجاوب الجيد يحافظ على المنطق حتى عندما يتغير الترتيب البصري.",
                            "Strong responsive design preserves logic even when the visual order changes.",
                            23,
                            110,
                            "responsive-layout",
                            "حرّك الأولوية مع الشاشة، لكن لا تحرّك المعنى.",
                            "Move priority with the screen, but do not move the meaning.",
                            [
                                new CourseReferenceDefinition("Responsive Web Design Principles", "Responsive Web Design Principles"),
                                new CourseReferenceDefinition("Adaptive Layout Patterns", "Adaptive Layout Patterns")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "responsive-adaptation-q1",
                                    "ما المبدأ الأصح في التصميم المتجاوب؟",
                                    "Which principle is strongest in responsive design?",
                                    [
                                        "تقليص كل شيء فقط بنفس النسبة",
                                        "الحفاظ على المهمة الأساسية حتى لو تغير ترتيب العناصر",
                                        "إخفاء المحتوى المهم على الهاتف دائماً",
                                        "نقل جميع عناصر سطح المكتب كما هي"
                                    ],
                                    [
                                        "Shrink everything by the same ratio",
                                        "Preserve the core task even if the element order changes",
                                        "Always hide important content on mobile",
                                        "Copy every desktop element exactly as it is"
                                    ],
                                    1,
                                    "فكر في المهمة أولاً ثم الترتيب.",
                                    "Think about the task first, then the order.",
                                    "التجاوب القوي يحافظ على الهدف الأساسي ويعيد ترتيب المحتوى بما يناسب السياق الجديد.",
                                    "Strong responsive design preserves the main goal and rearranges content for the new context.",
                                    "responsive-adaptation"
                                )
                            ])
                    ])
            ]),

        new(
            "strategy-leadership",
            "الاستراتيجية والقيادة المهنية",
            "Strategy and Design Leadership",
            "انتقل من التنفيذ الجيد إلى التفكير الاستراتيجي، النقد، والتواصل الذي يجعل العمل مقنعاً وقابلاً للنمو.",
            "Move from solid execution to strategic thinking, critique, and communication that makes design work persuasive and scalable.",
            "🧠",
            "advanced",
            80,
            360,
            24,
            new CourseProjectDefinition(
                "strategy-leadership-case-study",
                "المشروع النهائي: دراسة حالة UX/UI متقدمة",
                "Final Capstone: Advanced UX/UI Case Study",
                "ابنِ دراسة حالة كاملة لمشكلة منتج حقيقية أو افتراضية من الاكتشاف إلى القرار النهائي.",
                "Build a full case study for a real or hypothetical product problem from discovery to final decision.",
                "سلّم تعريف المشكلة، ومسوّغ البحث، ومسار القرار، ولقطات نهائية، ومؤشرات النجاح المتوقعة، وسرداً قصيراً يصلح للبورتفوليو.",
                "Submit the problem framing, research rationale, decision path, final screens, expected success metrics, and a concise narrative suitable for a portfolio case study.",
                10,
                480,
                [
                    "تعريف مشكلة واضح ومقياس نجاح",
                    "ملخص بحث أو افتراضات مدعومة",
                    "تطور الحل من low-fi إلى final",
                    "سرد قصير صالح للبورتفوليو"
                ],
                [
                    "A clear problem statement and success metric",
                    "A short research summary or evidence-backed assumptions",
                    "The solution evolution from low-fi to final",
                    "A concise portfolio-ready narrative"
                ],
                [
                    new CourseProjectCriterionDefinition("عمق التفكير", "Depth of thinking", 25),
                    new CourseProjectCriterionDefinition("المنطق الاستراتيجي", "Strategic logic", 25),
                    new CourseProjectCriterionDefinition("جودة العرض", "Presentation quality", 25),
                    new CourseProjectCriterionDefinition("وضوح الحجة", "Argument clarity", 25)
                ]),
            [
                new CourseUnitDefinition(
                    "service-and-systems",
                    "المنتجات المعقدة والخدمات",
                    "Service and System Thinking",
                    "اربط الواجهة بسياق الخدمة الكاملة عبر القنوات والمراحل المختلفة.",
                    "Connect the interface to the broader service across channels and stages.",
                    70,
                    330,
                    [
                        "قراءة المنتج كمنظومة لا كسلسلة شاشات فقط.",
                        "الحفاظ على الاتساق عبر القنوات.",
                        "فهم العلاقة بين onboarding والاحتفاظ."
                    ],
                    [
                        "Read the product as a system, not only a sequence of screens.",
                        "Maintain consistency across channels.",
                        "Understand the relationship between onboarding and retention."
                    ],
                    75,
                    180,
                    10,
                    [
                        new CourseLessonDefinition(
                            "service-blueprints",
                            "مخطط الخدمة",
                            "Service Blueprints",
                            "اكشف ما يحدث خلف الشاشة وكيف يؤثر على التجربة الأمامية.",
                            "Reveal what happens behind the screen and how it affects the visible experience.",
                            "بعض مشاكل UX لا يمكن حلها داخل الواجهة وحدها. مخطط الخدمة يساعدك على رؤية نقاط التماس، العمليات الخلفية، وأين ينكسر الوعد بين ما يراه المستخدم وما يحدث فعلياً.",
                            "Some UX problems cannot be solved in the interface alone. A service blueprint helps you see touchpoints, backstage processes, and where the promise between the frontstage and backstage breaks down.",
                            [
                                "ارسم نقاط التماس الأمامية أولاً.",
                                "أضف العمليات الخلفية التي تؤثر على كل نقطة.",
                                "ابحث عن لحظات الانقطاع بين الوعد والتنفيذ."
                            ],
                            [
                                "Map frontstage touchpoints first.",
                                "Add the backstage processes affecting each touchpoint.",
                                "Look for moments where promise and delivery break apart."
                            ],
                            "اختر خدمة مثل حجز موعد أو توصيل طلب، ثم ارسم ثلاث نقاط تماس أمامية وثلاث عمليات خلفية تدعمها.",
                            "Pick a service such as appointment booking or delivery, then map three frontstage touchpoints and three backstage processes behind them.",
                            "حين ترى الخدمة كاملة، تصبح قرارات الواجهة أكثر واقعية وأقل سطحية.",
                            "When you can see the whole service, interface decisions become more realistic and less superficial.",
                            23,
                            110,
                            "service-blueprint",
                            "بعض أفضل قرارات UX تبدأ خارج الشاشة نفسها.",
                            "Some of the best UX decisions start outside the screen itself.",
                            [
                                new CourseReferenceDefinition("This Is Service Design Doing", "This Is Service Design Doing"),
                                new CourseReferenceDefinition("Service Blueprinting Basics", "Service Blueprinting Basics")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "service-blueprints-q1",
                                    "ما الذي يضيفه مخطط الخدمة فوق تدفق الواجهة؟",
                                    "What does a service blueprint add beyond the interface flow?",
                                    [
                                        "ألواناً أكثر",
                                        "العمليات الخلفية ونقاط التماس الكاملة",
                                        "حجم خطوط أكبر",
                                        "تأثيرات حركة إضافية"
                                    ],
                                    [
                                        "More colors",
                                        "Backstage processes and the full touchpoint system",
                                        "Larger type sizes",
                                        "Extra motion effects"
                                    ],
                                    1,
                                    "ابحث عما يحدث خلف الواجهة لا داخلها فقط.",
                                    "Look for what happens behind the interface, not only within it.",
                                    "مخطط الخدمة يضيف العمليات الخلفية والجهات الداعمة التي تؤثر على التجربة الظاهرة للمستخدم.",
                                    "A service blueprint adds backstage processes and supporting actors that shape the visible user experience.",
                                    "service-blueprints"
                                )
                            ]),
                        new CourseLessonDefinition(
                            "cross-channel-consistency",
                            "الاتساق بين القنوات",
                            "Cross-Channel Consistency",
                            "كيف تحافظ على الثقة عندما ينتقل المستخدم بين الهاتف والبريد والويب والدعم.",
                            "How to preserve trust when people move between mobile, email, web, and support.",
                            "التجربة لا تنتهي عند شاشة واحدة. في المنتجات الحقيقية ينتقل المستخدم بين قنوات متعددة، وكل اختلاف في اللغة أو التوقع أو الحالة قد يهز الثقة ويزيد العبء.",
                            "The experience does not end on a single screen. In real products, people move between channels, and every mismatch in language, expectation, or state can shake trust and increase effort.",
                            [
                                "ثبّت اللغة الأساسية بين القنوات.",
                                "اجعل الحالة الحالية مفهومة أينما عاد المستخدم.",
                                "تجنب الرسائل المتناقضة بين البريد والمنتج والواجهة."
                            ],
                            [
                                "Keep the core language consistent across channels.",
                                "Make the current state understandable wherever the user returns.",
                                "Avoid contradictory messages between email, product, and support."
                            ],
                            "اختر تجربة تشمل إشعار بريد أو SMS ثم راجع هل اللغة والحالة والموعد النهائي متسقة مع ما يظهر داخل المنتج.",
                            "Choose a flow that includes email or SMS and review whether the language, state, and deadline stay consistent with the product itself.",
                            "الثقة تُبنى عندما يشعر المستخدم أن النظام كله يتحدث اللغة نفسها.",
                            "Trust grows when the whole system feels like it speaks the same language.",
                            23,
                            110,
                            "cross-channel",
                            "الاتساق ليس تشابهاً شكلياً فقط؛ هو استقرار في المعنى أيضاً.",
                            "Consistency is not only visual sameness. It is stability of meaning too.",
                            [
                                new CourseReferenceDefinition("Omnichannel UX Notes", "Omnichannel UX Notes"),
                                new CourseReferenceDefinition("Service Experience Consistency", "Service Experience Consistency")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "cross-channel-consistency-q1",
                                    "ما الذي يرفع الثقة عبر القنوات المختلفة؟",
                                    "What increases trust across channels?",
                                    [
                                        "أن تتغير التسمية حسب كل قناة",
                                        "أن تبقى الحالة واللغة الأساسية متسقتين",
                                        "أن تكون كل رسالة مستقلة تماماً",
                                        "أن تختلف المواعيد والرسائل حسب المنصة"
                                    ],
                                    [
                                        "Changing labels on each channel",
                                        "Keeping state and core language consistent",
                                        "Making every message completely independent",
                                        "Letting deadlines and messages vary by platform"
                                    ],
                                    1,
                                    "الاتساق في المعنى والحالة أهم من التنويع الشكلي.",
                                    "Consistency in meaning and state matters more than decorative variation.",
                                    "حين تتسق اللغة والحالة بين القنوات، يشعر المستخدم بأن النظام موثوق ويمكن التنبؤ به.",
                                    "When language and state remain consistent across channels, the system feels trustworthy and predictable.",
                                    "cross-channel-consistency"
                                )
                            ]),
                        new CourseLessonDefinition(
                            "onboarding-and-retention",
                            "التهيئة والاحتفاظ",
                            "Onboarding and Retention",
                            "حوّل البداية من شرح طويل إلى قيمة أولى سريعة تعيد المستخدم لاحقاً.",
                            "Turn onboarding from long explanation into fast first value that brings people back later.",
                            "أفضل onboarding لا يشرح المنتج بالكامل في البداية، بل يقود المستخدم إلى قيمة أولى صغيرة بسرعة، ثم يبني عليها لاحقاً. هذه اللحظة الأولى ترتبط مباشرة بالاحتفاظ والعودة.",
                            "The best onboarding does not explain the whole product upfront. It guides people to a small first value quickly, then builds from there. That first moment is directly tied to retention and return.",
                            [
                                "ابحث عن أقصر طريق إلى القيمة الأولى.",
                                "قلّل الشرح ورفّع التجربة الفعلية.",
                                "اربط الخطوات التالية بما حققه المستخدم فعلاً."
                            ],
                            [
                                "Look for the shortest path to first value.",
                                "Reduce explanation and increase actual experience.",
                                "Tie next steps to what the person already accomplished."
                            ],
                            "حلّل onboarding لتطبيق إنتاجية أو تعليمي: أين تظهر القيمة الأولى؟ وهل تأتي قبل الطلبات الطويلة أم بعدها؟",
                            "Analyze onboarding for a productivity or learning app: where does first value appear, and does it come before long requests or after them?",
                            "حين يصل المستخدم إلى قيمة مبكرة، يصبح أكثر استعداداً للتعلم والعودة.",
                            "When people reach value early, they become more willing to learn and return.",
                            24,
                            115,
                            "onboarding-loop",
                            "القيمة الأولى أهم من الشرح الأول.",
                            "First value matters more than first explanation.",
                            [
                                new CourseReferenceDefinition("Onboarding Patterns", "Onboarding Patterns"),
                                new CourseReferenceDefinition("Retention UX Notes", "Retention UX Notes")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "onboarding-and-retention-q1",
                                    "ما الفكرة الأقوى في onboarding الجيد؟",
                                    "What is the strongest idea behind good onboarding?",
                                    [
                                        "شرح كل ميزة من البداية",
                                        "إيصال المستخدم إلى قيمة أولى بسرعة",
                                        "طلب كل الأذونات أولاً",
                                        "إجبار المستخدم على قراءة كل التعليمات"
                                    ],
                                    [
                                        "Explain every feature at the start",
                                        "Get the user to first value quickly",
                                        "Ask for every permission first",
                                        "Force the user to read every instruction"
                                    ],
                                    1,
                                    "اسأل: هل جرب المستخدم شيئاً مفيداً سريعاً أم استمع فقط إلى الشرح؟",
                                    "Ask whether the user experienced value quickly or only listened to explanations.",
                                    "الـ onboarding القوي يدفع المستخدم إلى قيمة ملموسة بسرعة لأن ذلك يدعم الفهم والعودة لاحقاً.",
                                    "Strong onboarding moves people to concrete value quickly because that supports both understanding and return behavior.",
                                    "onboarding-and-retention"
                                )
                            ])
                    ]),
                new CourseUnitDefinition(
                    "storytelling-leadership",
                    "النقد والسرد والقيادة",
                    "Critique, Storytelling, and Leadership",
                    "قدّم العمل وناقشه وعلّمه للآخرين بطريقة تبني الثقة والنضج المهني.",
                    "Present, critique, and teach design work in a way that builds trust and professional maturity.",
                    71,
                    340,
                    [
                        "إجراء نقد تصميمي منظم.",
                        "تسهيل جلسات العمل واتخاذ القرار.",
                        "بناء دراسة حالة تقنع المتلقي."
                    ],
                    [
                        "Run structured design critiques.",
                        "Facilitate workshops and decision-making sessions.",
                        "Build a case study that persuades the audience."
                    ],
                    75,
                    180,
                    10,
                    [
                        new CourseLessonDefinition(
                            "design-critiques",
                            "النقد التصميمي البنّاء",
                            "Constructive Design Critique",
                            "حوّل المراجعة من ذوق شخصي إلى نقاش حول الهدف والأثر.",
                            "Turn review from personal taste into a discussion about goals and impact.",
                            "النقد القوي يبدأ بالسياق والهدف ثم يربط الملاحظة بأثرها على المستخدم أو المنتج. بهذه الطريقة يصبح النقاش عملياً ومحترماً وقابلاً للتنفيذ.",
                            "Strong critique starts with context and goal, then ties each observation to its impact on the user or product. That makes the discussion practical, respectful, and actionable.",
                            [
                                "ابدأ بما يحاول التصميم تحقيقه.",
                                "صغ الملاحظة حول أثر واضح لا ذوق شخصي.",
                                "اقترح سؤالاً أو تجربة، لا حكماً نهائياً فقط."
                            ],
                            [
                                "Start with what the design is trying to achieve.",
                                "Frame the feedback around a clear impact instead of personal taste.",
                                "Offer a question or experiment, not only a final judgment."
                            ],
                            "راجع شاشة لزميل أو مثال عام، ثم اكتب ثلاثة تعليقات نقدية كل واحدة تربط الملاحظة بهدف أو نتيجة أو مخاطرة.",
                            "Review a peer screen or public example and write three critique comments, each tied to a goal, outcome, or risk.",
                            "النقد الجيد يفتح العمل للأمام بدلاً من إغلاقه بحكم سريع.",
                            "Good critique opens the work forward instead of shutting it down with a quick verdict.",
                            24,
                            115,
                            "critique-ladder",
                            "اربط الملاحظة بهدف واضح لتجعل النقد أكثر عدلاً وفائدة.",
                            "Connect feedback to a clear goal to make critique fairer and more useful.",
                            [
                                new CourseReferenceDefinition("Design Critique Frameworks", "Design Critique Frameworks"),
                                new CourseReferenceDefinition("Giving Effective Feedback", "Giving Effective Feedback")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "design-critiques-q1",
                                    "أي تعليق نقدي أقوى؟",
                                    "Which critique comment is stronger?",
                                    [
                                        "أنا لا أحب هذا التصميم",
                                        "اللون غريب جداً",
                                        "الهرمية الحالية تجعل CTA الثانوي ينافس الأساسي، وقد يبطئ القرار",
                                        "الواجهة مملة"
                                    ],
                                    [
                                        "I do not like this design",
                                        "The color is weird",
                                        "The current hierarchy makes the secondary CTA compete with the primary one, which may slow decisions",
                                        "The interface is boring"
                                    ],
                                    2,
                                    "ابحث عن التعليق الذي يربط بين الملاحظة والأثر.",
                                    "Look for the comment that links the observation to an effect.",
                                    "التعليق الأقوى يفسر كيف تؤثر الملاحظة على سلوك المستخدم أو نتيجة المنتج.",
                                    "The strongest comment explains how the observation affects user behavior or product outcome.",
                                    "design-critiques"
                                )
                            ]),
                        new CourseLessonDefinition(
                            "facilitation-workshops",
                            "تسهيل الورش واتخاذ القرار",
                            "Facilitating Workshops and Decisions",
                            "نظّم النقاش بحيث يخرج الفريق بقرار واضح لا بمجرد آراء متفرقة.",
                            "Structure discussions so the team leaves with a clear decision, not scattered opinions.",
                            "التسهيل الجيد يعني ترتيب الوقت، تعريف الهدف، توضيح المخرجات، وإدارة الأصوات المختلفة داخل الغرفة. هذا مهم خصوصاً عندما تكون القرارات التصميمية مشتركة بين عدة تخصصات.",
                            "Good facilitation means structuring the time, defining the goal, clarifying outputs, and managing different voices in the room. This matters especially when design decisions involve multiple disciplines.",
                            [
                                "ابدأ بتعريف الهدف والمخرج المطلوب للجلسة.",
                                "قسّم النقاش إلى مراحل قصيرة وواضحة.",
                                "اختم دائماً بقرار أو خطوة تالية ومسؤول واضح."
                            ],
                            [
                                "Start by defining the goal and the expected output of the session.",
                                "Break the discussion into short clear stages.",
                                "Always end with a decision or next step and a clear owner."
                            ],
                            "اكتب أجندة قصيرة لورشة 30 دقيقة هدفها تحسين تدفق تسجيل جديد. ما المخرج النهائي؟ ومن المسؤول عنه؟",
                            "Write a short agenda for a 30-minute workshop aimed at improving a new signup flow. What is the final output and who owns it?",
                            "الورشة الجيدة لا تستهلك الوقت؛ هي تضغطه في قرار واضح.",
                            "A strong workshop does not consume time. It compresses time into a clear decision.",
                            23,
                            110,
                            "workshop-flow",
                            "إن لم يكن المخرج واضحاً قبل الجلسة، فلن يصبح واضحاً داخلها.",
                            "If the output is not clear before the session, it will not become clear during it.",
                            [
                                new CourseReferenceDefinition("Facilitating Design Workshops", "Facilitating Design Workshops"),
                                new CourseReferenceDefinition("Decision-Making in Product Teams", "Decision-Making in Product Teams")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "facilitation-workshops-q1",
                                    "ما أول شيء يجب توضيحه في ورشة تصميم؟",
                                    "What should be clarified first in a design workshop?",
                                    [
                                        "الموسيقى في الغرفة",
                                        "الهدف والمخرج المطلوب",
                                        "ألوان الشرائح",
                                        "عدد الصور المستخدمة"
                                    ],
                                    [
                                        "The music in the room",
                                        "The goal and the expected output",
                                        "The slide colors",
                                        "The number of images used"
                                    ],
                                    1,
                                    "ابدأ بما سيخرج به الفريق في النهاية.",
                                    "Start with what the team should leave with.",
                                    "تعريف الهدف والمخرج المطلوب يجعل النقاش مركزاً وقابلاً للقيادة.",
                                    "Defining the goal and expected output keeps the discussion focused and facilitatable.",
                                    "facilitation-workshops"
                                )
                            ]),
                        new CourseLessonDefinition(
                            "portfolio-case-study",
                            "بناء دراسة حالة مقنعة",
                            "Building a Persuasive Case Study",
                            "احكِ القصة من المشكلة إلى القرار إلى النتيجة بدون ضياع في التفاصيل الثانوية.",
                            "Tell the story from problem to decision to outcome without getting lost in secondary detail.",
                            "أفضل دراسات الحالة لا تعرض لقطات جميلة فقط. هي تشرح السياق، المشكلة، البدائل، الاختيارات، وما تعلمته من النتيجة. القارئ يريد أن يرى كيف تفكر بقدر ما يريد أن يرى ما صممته.",
                            "The best case studies do not only show polished visuals. They explain context, problem, alternatives, choices, and what you learned from the outcome. Readers want to see how you think as much as what you designed.",
                            [
                                "ابدأ بمشكلة أو فرصة واضحة.",
                                "اعرض القرار والمنطق وراءه لا النتيجة فقط.",
                                "اختم بما تعلمته أو ما كنت ستطوره لاحقاً."
                            ],
                            [
                                "Start with a clear problem or opportunity.",
                                "Show the decision and reasoning behind it, not only the result.",
                                "End with what you learned or what you would improve next."
                            ],
                            "اختر مشروعاً سابقاً ثم اكتب له قصة مختصرة من 5 فقرات: السياق، المشكلة، العملية، القرار، والنتيجة أو التعلم.",
                            "Choose a past project and write a five-part story: context, problem, process, decision, and outcome or learning.",
                            "دراسة الحالة القوية تجعل القارئ يثق في طريقة تفكيرك، لا في اللقطات النهائية فقط.",
                            "A strong case study makes readers trust your thinking, not only your final screens.",
                            24,
                            115,
                            "case-study",
                            "أظهر كيف وصلت إلى القرار، لا ماذا كان القرار فقط.",
                            "Show how you reached the decision, not only what the decision was.",
                            [
                                new CourseReferenceDefinition("Portfolio Case Study Writing", "Portfolio Case Study Writing"),
                                new CourseReferenceDefinition("Presenting UX Work", "Presenting UX Work")
                            ],
                            [
                                new CourseQuizQuestionDefinition(
                                    "portfolio-case-study-q1",
                                    "ما الذي يجعل دراسة الحالة أقوى؟",
                                    "What makes a case study stronger?",
                                    [
                                        "عرض الصور النهائية فقط",
                                        "شرح المشكلة والقرارات والتعلم الناتج",
                                        "إخفاء المراحل الوسيطة",
                                        "التركيز على الألوان فقط"
                                    ],
                                    [
                                        "Only showing final polished screens",
                                        "Explaining the problem, decisions, and resulting learning",
                                        "Hiding the middle stages",
                                        "Focusing only on color choices"
                                    ],
                                    1,
                                    "أفضل دراسة حالة تكشف طريقة التفكير لا النتيجة فقط.",
                                    "The best case study reveals the thinking, not only the result.",
                                    "حين تشرح المشكلة والقرار والتعلم، يصبح العمل أكثر إقناعاً بكثير من عرض الصور النهائية وحدها.",
                                    "When you explain the problem, decisions, and learning, the work becomes far more persuasive than polished screens alone.",
                                    "portfolio-case-study"
                                )
                            ])
                    ])
            ])
    ];

    public static readonly IReadOnlyList<CourseSectionDefinition> Sections = SeedSections
        .Concat(CourseBlueprintExpansion.Build())
        .ToList();

    private static readonly IReadOnlyDictionary<string, CourseSectionDefinition> SectionLookup =
        Sections.ToDictionary(item => item.Code, StringComparer.OrdinalIgnoreCase);

    private static readonly IReadOnlyDictionary<string, CourseUnitDefinition> UnitLookup =
        Sections.SelectMany(item => item.Units)
            .ToDictionary(item => item.Code, StringComparer.OrdinalIgnoreCase);

    private static readonly IReadOnlyDictionary<string, CourseLessonDefinition> LessonLookup =
        Sections.SelectMany(section => section.Units)
            .SelectMany(unit => unit.Lessons)
            .ToDictionary(item => item.Code, StringComparer.OrdinalIgnoreCase);

    private static readonly IReadOnlyDictionary<string, CourseProjectDefinition> ProjectLookup =
        Sections.ToDictionary(item => item.Project.Code, item => item.Project, StringComparer.OrdinalIgnoreCase);

    public static CourseSectionDefinition? FindSection(string code) =>
        SectionLookup.GetValueOrDefault(code);

    public static CourseUnitDefinition? FindUnit(string code) =>
        UnitLookup.GetValueOrDefault(code);

    public static CourseLessonDefinition? FindLesson(string code) =>
        LessonLookup.GetValueOrDefault(code);

    public static CourseProjectDefinition? FindProject(string code) =>
        ProjectLookup.GetValueOrDefault(code);

    public static CourseSectionDefinition? FindSectionByProject(string projectCode) =>
        Sections.FirstOrDefault(item => string.Equals(item.Project.Code, projectCode, StringComparison.OrdinalIgnoreCase));
}
