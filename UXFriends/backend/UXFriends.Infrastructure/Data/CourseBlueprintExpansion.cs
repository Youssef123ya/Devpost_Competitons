namespace UXFriends.Infrastructure.Data;

internal sealed record ExpansionLessonPlan(
    string Code,
    string TitleAr,
    string TitleEn,
    string FocusAr,
    string FocusEn,
    string VisualKey,
    int DurationMinutes,
    int XpReward
);

internal sealed record ExpansionUnitPlan(
    string Code,
    string TitleAr,
    string TitleEn,
    string DescriptionAr,
    string DescriptionEn,
    int DurationMinutes,
    int XpReward,
    int QuizPassThreshold,
    int QuizXpReward,
    int QuizTimeLimitMinutes,
    IReadOnlyList<ExpansionLessonPlan> Lessons
);

internal sealed record ExpansionProjectPlan(
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
    IReadOnlyList<string> DeliverablesEn
);

internal sealed record ExpansionSectionPlan(
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
    ExpansionProjectPlan Project,
    IReadOnlyList<ExpansionUnitPlan> Units
);

public static class CourseBlueprintExpansion
{
    public static IReadOnlyList<CourseSectionDefinition> Build() =>
    [
        BuildSection(
            new ExpansionSectionPlan(
                "user-centered-research",
                "البحث المتمركز حول المستخدم",
                "User-Centered Research",
                "تعلّم كيف تحدد أسئلة البحث، تختار الطريقة المناسبة، وتحول الملاحظات إلى قرارات تصميم واضحة.",
                "Learn how to frame research questions, choose the right method, and turn observations into design decisions.",
                "🔎",
                "beginner",
                75,
                240,
                22,
                new ExpansionProjectPlan(
                    "user-centered-research-interview-study",
                    "مشروع البحث المبتدئ: دراسة مقابلات مصغرة",
                    "Beginner Research Project: Mini Interview Study",
                    "نفّذ دراسة خفيفة لفهم سلوك المستخدم في مهمة رقمية شائعة ثم حوّل النتائج إلى توصيات تصميم.",
                    "Run a lightweight study to understand user behavior in a common digital task and convert the findings into design recommendations.",
                    "قدّم هدف الدراسة، أسئلة البحث، ملخص ثلاث مقابلات أو ملاحظات، ثم 3 قرارات تصميم مبنية على الأدلة.",
                    "Submit the study goal, research questions, a summary of three interviews or observations, and 3 design decisions grounded in evidence.",
                    5,
                    320,
                    [
                        "ملخص هدف البحث والمستخدم المستهدف",
                        "أسئلة المقابلة أو نقاط الملاحظة",
                        "أهم 5 ملاحظات أو أنماط مكتشفة",
                        "3 توصيات تصميم مرتبطة مباشرة بالأدلة"
                    ],
                    [
                        "A concise research goal and target user",
                        "Interview questions or observation prompts",
                        "The top 5 findings or patterns",
                        "3 design recommendations directly tied to evidence"
                    ]),
                [
                    CreateUnit(
                        "research-planning-foundations",
                        "تخطيط البحث الأساسي",
                        "Research Planning Foundations",
                        "ابدأ من صياغة الأسئلة الصحيحة واختيار الطريقة المناسبة قبل جمع أي ملاحظة.",
                        "Start by shaping the right questions and selecting the right method before collecting any observation.",
                        150,
                        320,
                        "research-planning",
                        [
                            new ExpansionLessonPlan("research-goals-and-scope", "أهداف البحث ونطاقه", "Research Goals and Scope", "تحديد ما يجب أن نعرفه قبل البدء", "defining what the team must learn before starting", "research-brief", 32, 90),
                            new ExpansionLessonPlan("choosing-research-methods", "اختيار طريقة البحث", "Choosing Research Methods", "مقارنة المقابلات والملاحظة والاستبيانات", "comparing interviews, observation, and surveys", "interview-guide", 34, 95),
                            new ExpansionLessonPlan("writing-research-scripts", "كتابة سيناريو البحث", "Writing Research Scripts", "تحويل الأسئلة الفضفاضة إلى سيناريو منظم", "turning vague questions into a structured script", "survey-bias", 36, 100),
                        ]),
                    CreateUnit(
                        "research-synthesis-and-actions",
                        "تحليل البحث وتحويله إلى قرارات",
                        "Research Synthesis and Action",
                        "حوّل البيانات الخام إلى أنماط، فرص، وأولويات تصميم قابلة للتنفيذ.",
                        "Turn raw notes into patterns, opportunities, and executable design priorities.",
                        150,
                        320,
                        "research-synthesis",
                        [
                            new ExpansionLessonPlan("moderating-user-interviews", "إدارة المقابلات مع المستخدمين", "Moderating User Interviews", "الحفاظ على الحياد واستخراج قصص دقيقة", "staying neutral while uncovering reliable stories", "interview-guide", 32, 90),
                            new ExpansionLessonPlan("synthesizing-observations", "تلخيص الملاحظات", "Synthesizing Observations", "تجميع الملاحظات في محاور وأنماط", "grouping observations into themes and patterns", "affinity-wall", 34, 95),
                            new ExpansionLessonPlan("turning-findings-into-decisions", "تحويل النتائج إلى قرارات", "Turning Findings Into Decisions", "ربط الدليل بخطوة تصميم أو أولوية منتج", "connecting evidence to a design move or product priority", "priority-matrix", 36, 100),
                        ]),
                ])),
        BuildSection(
            new ExpansionSectionPlan(
                "typography-color",
                "الطباعة واللون في الواجهات",
                "Typography and Color for Interfaces",
                "ابنِ لغة بصرية تقود الانتباه، تدعم القراءة، وتمنح المنتج شخصية متزنة بدلاً من الزينة العشوائية.",
                "Build a visual language that guides attention, supports reading, and gives the product a balanced personality instead of random decoration.",
                "🎨",
                "beginner",
                75,
                250,
                22,
                new ExpansionProjectPlan(
                    "typography-color-system-board",
                    "مشروع الطباعة واللون: لوحة نظام بصري",
                    "Typography and Color Project: Visual System Board",
                    "ابنِ لوحة أساسية توضح التسلسل الطباعي ولوحة الألوان والأنماط الرئيسية لشاشة منتج.",
                    "Build a core board that shows the type hierarchy, color palette, and key patterns for a product screen.",
                    "قدّم لوحة أنماط فيها مقياس طباعي، لوحة ألوان، أمثلة لحالات الزر والبطاقات، وتفسير بصري قصير.",
                    "Submit a style board with a type scale, a color palette, button and card states, and a short visual rationale.",
                    5,
                    330,
                    [
                        "مقياس طباعي واضح لثلاثة مستويات على الأقل",
                        "لوحة ألوان مع أدوار لكل لون",
                        "مثال لبطاقة وزر وحالة تنبيه",
                        "شرح يوضح لماذا هذا النظام قابل للتوسع"
                    ],
                    [
                        "A clear type scale with at least three levels",
                        "A color palette with a role for each color",
                        "One card, one button, and one feedback state example",
                        "A short rationale for why this system can scale"
                    ]),
                [
                    CreateUnit(
                        "type-hierarchy-and-readability",
                        "التسلسل الطباعي وسهولة القراءة",
                        "Type Hierarchy and Readability",
                        "تعلّم كيف يجعل الحجم والوزن والمسافات المحتوى أسهل في المسح والفهم.",
                        "Learn how size, weight, and spacing make content easier to scan and understand.",
                        150,
                        320,
                        "visual-language",
                        [
                            new ExpansionLessonPlan("type-scale-basics", "أساسيات المقياس الطباعي", "Type Scale Basics", "توزيع الأحجام بما يخدم الأولوية لا الشكل", "distributing sizes to serve priority instead of decoration", "hierarchy-layers", 32, 90),
                            new ExpansionLessonPlan("line-length-and-spacing", "طول السطر والمسافات", "Line Length and Spacing", "تقليل إجهاد القراءة عبر الإيقاع البصري", "reducing reading fatigue through visual rhythm", "spacing-grid", 34, 95),
                            new ExpansionLessonPlan("headline-to-body-balance", "توازن العنوان والنص", "Headline to Body Balance", "إظهار العناوين دون كسر استمرارية المحتوى", "making headings stand out without breaking content flow", "clear-card-hierarchy", 36, 100),
                        ]),
                    CreateUnit(
                        "color-contrast-and-brand-tone",
                        "اللون والتباين ونبرة العلامة",
                        "Color, Contrast, and Brand Tone",
                        "استخدم اللون لتقوية المعنى والتمييز البصري بدل إرباك المستخدم أو إضعاف الوصول.",
                        "Use color to reinforce meaning and visual distinction instead of confusing people or hurting accessibility.",
                        150,
                        320,
                        "color-systems",
                        [
                            new ExpansionLessonPlan("color-roles-and-semantic-usage", "أدوار اللون الدلالية", "Semantic Color Roles", "منح كل لون وظيفة يمكن التنبؤ بها", "giving each color a predictable role", "contrast-system", 32, 90),
                            new ExpansionLessonPlan("contrast-for-actions-and-text", "التباين للنصوص والإجراءات", "Contrast for Text and Actions", "رفع الوضوح في النصوص والأزرار والعناصر المهمة", "raising clarity in text, buttons, and important elements", "color-wheel-harmony-good", 34, 95),
                            new ExpansionLessonPlan("building-a-balanced-palette", "بناء لوحة متزنة", "Building a Balanced Palette", "تنسيق الألوان الأساسية والمساندة بدون ضوضاء", "balancing primary and supporting colors without noise", "color-wheel-compare", 36, 100),
                        ]),
                ])),
        BuildSection(
            new ExpansionSectionPlan(
                "design-tool-mastery",
                "إتقان أدوات التصميم",
                "Design Tool Mastery",
                "حوّل أدوات مثل Figma من مساحة رسم إلى بيئة منظمة للعمل السريع وإدارة المكونات والتسليم.",
                "Turn tools like Figma from a drawing canvas into an organized environment for faster work, reusable components, and handoff.",
                "🛠️",
                "beginner",
                75,
                250,
                20,
                new ExpansionProjectPlan(
                    "design-tool-mastery-component-file",
                    "مشروع الأدوات: ملف تصميم منظم",
                    "Tool Mastery Project: Organized Design File",
                    "أنشئ ملفاً منظماً يحوي صفحات واضحة، مكونات قابلة لإعادة الاستخدام، ومتغيرات أساسية.",
                    "Create a structured file with clear pages, reusable components, and core variables.",
                    "قدّم ملف تصميم فيه naming system، مكونات أساسية، variants، وتعليمات handoff موجزة.",
                    "Submit a design file with a naming system, core components, variants, and brief handoff instructions.",
                    5,
                    330,
                    [
                        "هيكلة صفحات واضحة داخل الملف",
                        "3 مكونات أساسية على الأقل",
                        "متغيرات للألوان أو المسافات أو النص",
                        "ملاحظات handoff مختصرة للمطور"
                    ],
                    [
                        "A clear page structure in the file",
                        "At least 3 core components",
                        "Variables for color, spacing, or text",
                        "Short handoff notes for a developer"
                    ]),
                [
                    CreateUnit(
                        "file-structure-and-workflow",
                        "هيكلة الملف وسير العمل",
                        "File Structure and Workflow",
                        "ابنِ ملف تصميم يسهل قراءته وصيانته مع نمو المشروع.",
                        "Build a design file that stays readable and maintainable as the project grows.",
                        150,
                        320,
                        "file-structure",
                        [
                            new ExpansionLessonPlan("organizing-pages-and-naming", "تنظيم الصفحات والتسمية", "Organizing Pages and Naming", "تقليل الفوضى منذ أول ملف", "reducing chaos from the very first file", "documentation-sheet", 32, 90),
                            new ExpansionLessonPlan("frames-grids-and-constraints", "الإطارات والشبكات والقيود", "Frames, Grids, and Constraints", "تجهيز اللوحات للتعديل السريع والاستجابة", "preparing frames for flexible editing and responsiveness", "responsive-layout", 34, 95),
                            new ExpansionLessonPlan("handoff-ready-annotations", "ملاحظات التسليم للمطور", "Handoff-Ready Annotations", "شرح ما يحتاجه التطوير دون إغراق", "explaining what engineering needs without overload", "documentation-sheet", 36, 100),
                        ]),
                    CreateUnit(
                        "components-variants-and-variables",
                        "المكونات والمتغيرات والنسخ",
                        "Components, Variants, and Variables",
                        "تعلّم كيف تبني مكونات قابلة للتوسع بدل نسخ الشاشات يدوياً.",
                        "Learn how to build scalable components instead of manually duplicating screens.",
                        150,
                        320,
                        "component-systems",
                        [
                            new ExpansionLessonPlan("component-architecture", "بنية المكونات", "Component Architecture", "تقسيم العناصر إلى وحدات قابلة لإعادة الاستخدام", "breaking interfaces into reusable units", "component-states", 32, 90),
                            new ExpansionLessonPlan("using-variants-wisely", "استخدام variants بذكاء", "Using Variants Wisely", "تقليل التكرار وزيادة الاتساق", "reducing duplication while increasing consistency", "tokens-board", 34, 95),
                            new ExpansionLessonPlan("variables-and-design-tokens", "المتغيرات وDesign Tokens", "Variables and Design Tokens", "ربط اللون والمسافة والنص بقواعد قابلة للتحديث", "linking color, spacing, and text to updateable rules", "tokens-board", 36, 100),
                        ]),
                ])),
        BuildSection(
            new ExpansionSectionPlan(
                "personas-journeys",
                "الشخصيات والرحلات",
                "Personas and Journeys",
                "حوّل البيانات إلى شخصيات عملية ورحلات واضحة تساعدك على اتخاذ قرارات تخص الترتيب والمحتوى والدعم.",
                "Turn data into practical personas and clear journeys that inform sequencing, content, and support decisions.",
                "🧍",
                "intermediate",
                78,
                260,
                24,
                new ExpansionProjectPlan(
                    "personas-journeys-service-map",
                    "مشروع الشخصيات والرحلات: خريطة خدمة",
                    "Personas and Journeys Project: Service Map",
                    "أنشئ Persona عملية وخريطة رحلة توضح نقاط الاحتكاك والفرص داخل خدمة رقمية.",
                    "Create a practical persona and journey map that expose friction points and opportunities in a digital service.",
                    "قدّم Persona مبنية على دليل، رحلة من 5 إلى 7 مراحل، وأولويتين لتحسين التجربة.",
                    "Submit an evidence-based persona, a 5 to 7 step journey, and two priorities for improvement.",
                    6,
                    350,
                    [
                        "Persona مرتبطة بسلوك وهدف حقيقي",
                        "Journey map بمراحل ومشاعر وتحديات",
                        "فرصتان واضحتان للتحسين",
                        "تبرير لماذا اختيرت هاتان الأولويتان"
                    ],
                    [
                        "A persona tied to real behavior and goals",
                        "A journey map with stages, emotions, and pain points",
                        "Two clear improvement opportunities",
                        "A rationale for why those priorities matter"
                    ]),
                [
                    CreateUnit(
                        "persona-definition-and-behavior",
                        "بناء الشخصية وسلوكها",
                        "Persona Definition and Behavior",
                        "أنشئ Persona تخدم القرار بدلاً من أن تكون وثيقة تجميلية.",
                        "Create personas that support decisions instead of acting like decorative documents.",
                        165,
                        340,
                        "persona-modeling",
                        [
                            new ExpansionLessonPlan("behavioral-segmentation", "التقسيم السلوكي", "Behavioral Segmentation", "تمييز الشرائح وفق السلوك لا الديموغرافيا فقط", "segmenting people by behavior rather than demographics alone", "persona-board", 34, 95),
                            new ExpansionLessonPlan("writing-useful-personas", "كتابة Persona مفيدة", "Writing Useful Personas", "صياغة Persona تدعم الأولوية والقرار", "writing personas that support prioritization and decisions", "persona-board", 36, 100),
                            new ExpansionLessonPlan("mapping-goals-and-needs", "ربط الأهداف والاحتياجات", "Mapping Goals and Needs", "ترجمة الأهداف إلى توقعات داخل التجربة", "translating goals into expectations inside the experience", "journey-map", 38, 105),
                        ]),
                    CreateUnit(
                        "journey-maps-and-opportunity-areas",
                        "خرائط الرحلة ومناطق الفرص",
                        "Journey Maps and Opportunity Areas",
                        "استخدم الرحلات لتحديد اللحظات الحرجة والقرارات التي تستحق التصميم.",
                        "Use journey maps to identify critical moments and the decisions that deserve design attention.",
                        165,
                        340,
                        "journey-mapping",
                        [
                            new ExpansionLessonPlan("stages-touchpoints-and-emotions", "المراحل ونقاط التلامس والمشاعر", "Stages, Touchpoints, and Emotions", "قراءة التجربة عبر الزمن لا عبر شاشة واحدة", "reading an experience over time instead of through a single screen", "journey-map", 34, 95),
                            new ExpansionLessonPlan("finding-moment-of-truth", "تحديد لحظة الحسم", "Finding the Moment of Truth", "التركيز على الخطوة التي تصنع النجاح أو الفشل", "focusing on the step that defines success or failure", "task-flow", 36, 100),
                            new ExpansionLessonPlan("turning-journeys-into-roadmaps", "تحويل الرحلة إلى خطة تحسين", "Turning Journeys Into Roadmaps", "اختيار التحسينات الأعلى أثراً أولاً", "turning journey insights into prioritized improvements", "priority-matrix", 38, 105),
                        ]),
                ])),
        BuildSection(
            new ExpansionSectionPlan(
                "information-architecture",
                "هندسة المعلومات",
                "Information Architecture",
                "نظّم المحتوى والتنقل بحيث يعرف المستخدم أين هو، إلى أين يذهب، ولماذا هذا الطريق منطقي.",
                "Organize content and navigation so people know where they are, where to go, and why the path makes sense.",
                "🗂️",
                "intermediate",
                78,
                270,
                24,
                new ExpansionProjectPlan(
                    "information-architecture-content-model",
                    "مشروع IA: هيكل محتوى وتنقل",
                    "IA Project: Content Model and Navigation",
                    "ابنِ هيكل محتوى وتنقلاً رئيسياً لخدمة تحتوي على معلومات متشعبة أو وظائف متعددة.",
                    "Build a content model and primary navigation for a service with complex information or multiple jobs to support.",
                    "قدّم sitemap، تسمية أقسام واضحة، وتفسيراً لسبب هذا الهيكل وكيف يسهّل الاستكشاف.",
                    "Submit a sitemap, clear section labels, and an explanation of why this structure improves discovery.",
                    6,
                    360,
                    [
                        "خريطة موقع أو بنية محتوى أساسية",
                        "تسمية منطقية للأقسام والمستويات",
                        "تفسير كيف يصل المستخدم إلى المحتوى بسرعة",
                        "ملاحظة عن افتراضات الهيكل وما يحتاج اختباراً"
                    ],
                    [
                        "A sitemap or core content structure",
                        "Logical labels for sections and levels",
                        "An explanation of how people reach content quickly",
                        "A note on structure assumptions that still need testing"
                    ]),
                [
                    CreateUnit(
                        "content-structure-and-labeling",
                        "هيكلة المحتوى والتسمية",
                        "Content Structure and Labeling",
                        "رتّب المحتوى وفق احتياج المستخدم وقدرته على التنبؤ بالمكان الصحيح.",
                        "Structure content around user needs and predictability.",
                        165,
                        340,
                        "content-architecture",
                        [
                            new ExpansionLessonPlan("content-audits-and-grouping", "جرد المحتوى وتجميعه", "Content Audits and Grouping", "فهم ما يوجد قبل إعادة تنظيمه", "understanding what exists before reorganizing it", "navigation-map", 34, 95),
                            new ExpansionLessonPlan("clear-labeling-systems", "أنظمة التسمية الواضحة", "Clear Labeling Systems", "تسمية تساعد المستخدم على التوقع بسرعة", "labels that help people predict where to click", "navigation-map", 36, 100),
                            new ExpansionLessonPlan("navigation-depth-and-breadth", "عمق التنقل واتساعه", "Navigation Depth and Breadth", "الموازنة بين كثرة المستويات وكثرة الخيارات", "balancing too many levels versus too many choices", "advanced-navigation", 38, 105),
                        ]),
                    CreateUnit(
                        "flows-taxonomies-and-findability",
                        "التدفقات والتصنيفات وإمكانية العثور",
                        "Flows, Taxonomies, and Findability",
                        "اربط IA بالتدفق الفعلي للمهام كي لا يصبح الهيكل نظرياً فقط.",
                        "Connect IA to real task flows so the structure does not remain theoretical.",
                        165,
                        340,
                        "taxonomy-design",
                        [
                            new ExpansionLessonPlan("building-user-taxonomies", "بناء التصنيفات من منظور المستخدم", "Building User Taxonomies", "تنظيم العناصر وفق عقلية المستخدم لا عقلية الفريق", "organizing items around user mental models, not team silos", "navigation-map", 34, 95),
                            new ExpansionLessonPlan("wayfinding-and-orientation", "الإرشاد المكاني داخل المنتج", "Wayfinding and Orientation", "مساعدة المستخدم على معرفة مكانه وخطوته التالية", "helping users stay oriented and understand the next step", "navigation-map-good", 36, 100),
                            new ExpansionLessonPlan("stress-testing-discovery-flows", "اختبار قابلية العثور", "Stress-Testing Discovery Flows", "فحص ما إذا كان الهيكل يصمد في السيناريوهات المعقدة", "checking whether the structure holds up in complex scenarios", "service-blueprint", 38, 105),
                        ]),
                ])),
        BuildSection(
            new ExpansionSectionPlan(
                "usability-responsive",
                "الاختبار والتجاوب والوصول",
                "Usability, Responsive, and Accessibility",
                "اجمع بين قابلية الاستخدام والاستجابة وإمكانية الوصول لصنع تجارب تعمل فعلياً في الظروف المختلفة.",
                "Combine usability, responsiveness, and accessibility to create experiences that hold up in real-world conditions.",
                "📱",
                "intermediate",
                78,
                280,
                24,
                new ExpansionProjectPlan(
                    "usability-responsive-redesign",
                    "مشروع الاختبار والتجاوب: إعادة تصميم مدعومة بالاختبار",
                    "Usability and Responsive Project: Evidence-Based Redesign",
                    "اختر تدفقاً موجوداً ثم حسّنه لسطح المكتب والجوال مع توثيق قرارات الوصول والاختبار.",
                    "Choose an existing flow and improve it for desktop and mobile while documenting the accessibility and testing decisions.",
                    "قدّم قبل/بعد لشاشتين على الأقل، ملاحظات اختبار قصيرة، وشرحاً لقرارات الوصول والتجاوب.",
                    "Submit a before/after for at least two screens, short testing notes, and a rationale for the accessibility and responsive choices.",
                    6,
                    370,
                    [
                        "نسختان للشاشة قبل وبعد التحسين",
                        "تصميم متجاوب لسطح المكتب والجوال",
                        "3 ملاحظات من اختبار قابلية الاستخدام",
                        "شرح لكيفية معالجة الوصول أو الوضوح"
                    ],
                    [
                        "Before and after views for at least two screens",
                        "Responsive desktop and mobile designs",
                        "3 usability testing observations",
                        "A note on how accessibility or clarity was improved"
                    ]),
                [
                    CreateUnit(
                        "usability-testing-and-feedback-loops",
                        "اختبارات القابلية والتغذية الراجعة",
                        "Usability Testing and Feedback Loops",
                        "خطّط لاختبارات صغيرة تلتقط المشاكل السلوكية قبل أن تتحول إلى شكاوى بعد الإطلاق.",
                        "Plan lightweight tests that catch behavioral issues before they turn into post-launch complaints.",
                        165,
                        350,
                        "usability-testing",
                        [
                            new ExpansionLessonPlan("writing-test-tasks", "كتابة مهام الاختبار", "Writing Test Tasks", "صياغة مهام تكشف السلوك بدلاً من تلقين المستخدم", "writing prompts that reveal behavior instead of coaching the participant", "usability-lab", 34, 95),
                            new ExpansionLessonPlan("observing-errors-and-hesitation", "ملاحظة الأخطاء والتردد", "Observing Errors and Hesitation", "التقاط الإشارات الدقيقة قبل أن تتحول إلى فشل كامل", "spotting subtle friction before it becomes total failure", "feedback-states", 36, 100),
                            new ExpansionLessonPlan("prioritizing-fixes-after-testing", "ترتيب الإصلاحات بعد الاختبار", "Prioritizing Fixes After Testing", "اختيار ما يجب إصلاحه الآن وما يمكن تأجيله", "deciding what to fix now and what can wait", "impact-effort", 38, 105),
                        ]),
                    CreateUnit(
                        "responsive-and-accessible-execution",
                        "التنفيذ المتجاوب والميسر",
                        "Responsive and Accessible Execution",
                        "نفّذ قرارات التصميم بحيث تحافظ على الوضوح عبر المقاسات والأدوات المختلفة.",
                        "Execute design decisions so clarity holds across screen sizes and assistive contexts.",
                        165,
                        350,
                        "responsive-accessible",
                        [
                            new ExpansionLessonPlan("responsive-layout-priorities", "أولويات التخطيط المتجاوب", "Responsive Layout Priorities", "معرفة ما يجب أن يبقى وما يجب أن ينضغط أو يتحول", "knowing what should stay, compress, or transform", "responsive-layout", 34, 95),
                            new ExpansionLessonPlan("keyboard-focus-and-reading-order", "التركيز ولوحة المفاتيح وترتيب القراءة", "Keyboard Focus and Reading Order", "مراجعة التجربة خارج مسار الماوس التقليدي", "reviewing the experience beyond the default mouse path", "focus-order", 36, 100),
                            new ExpansionLessonPlan("accessible-forms-and-feedback", "النماذج الميسرة والتغذية الراجعة", "Accessible Forms and Feedback", "بناء نموذج يفهمه الجميع ويعالج الأخطاء بوضوح", "building a form everyone can understand and recover through", "inclusive-form", 38, 105),
                        ]),
                ])),
        BuildSection(
            new ExpansionSectionPlan(
                "ux-strategy-kpis",
                "استراتيجية UX ومؤشرات الأداء",
                "UX Strategy and KPIs",
                "اربط التصميم بالأثر التجاري وبالسلوك القابل للقياس بدلاً من الاكتفاء بتحسينات سطحية.",
                "Connect design to measurable business and behavioral outcomes instead of surface-level polish.",
                "📈",
                "advanced",
                80,
                300,
                26,
                new ExpansionProjectPlan(
                    "ux-strategy-metric-plan",
                    "مشروع الاستراتيجية: خطة أثر وتجربة",
                    "Strategy Project: Experience Impact Plan",
                    "حدّد هدفاً منتجياً، مؤشرات نجاحه، وكيف ستربط التحسينات التصميمية بالأثر المتوقع.",
                    "Define a product goal, its success metrics, and how design improvements connect to the expected impact.",
                    "قدّم هدفاً، 3 KPIs، فرضية تصميم، وآلية متابعة ما بعد الإطلاق.",
                    "Submit one goal, 3 KPIs, a design hypothesis, and a post-launch follow-up plan.",
                    7,
                    400,
                    [
                        "هدف منتجي أو تجاري واضح",
                        "3 مؤشرات أداء قابلة للمتابعة",
                        "فرضية تربط قرار التصميم بالأثر",
                        "خطة متابعة بعد الإطلاق"
                    ],
                    [
                        "One clear product or business goal",
                        "3 trackable KPIs",
                        "A hypothesis linking design to impact",
                        "A post-launch follow-up plan"
                    ]),
                [
                    CreateUnit(
                        "outcomes-metrics-and-hypotheses",
                        "الأهداف والفرضيات والمقاييس",
                        "Outcomes, Metrics, and Hypotheses",
                        "صمّم من أجل نتيجة قابلة للقياس، لا من أجل الواجهة وحدها.",
                        "Design for measurable outcomes, not only for the interface itself.",
                        175,
                        360,
                        "outcome-mapping",
                        [
                            new ExpansionLessonPlan("linking-ux-to-business-goals", "ربط UX بأهداف العمل", "Linking UX to Business Goals", "ترجمة التحسينات إلى قيمة قابلة للتبرير", "translating improvements into justifiable value", "metrics-panel", 36, 100),
                            new ExpansionLessonPlan("north-star-and-supporting-metrics", "المؤشر الشمالي والمقاييس الداعمة", "North Star and Supporting Metrics", "اختيار ما يجب متابعته فعلاً", "choosing what is truly worth tracking", "metrics-panel", 38, 105),
                            new ExpansionLessonPlan("writing-testable-design-hypotheses", "صياغة فرضيات قابلة للاختبار", "Writing Testable Design Hypotheses", "ربط التغيير المتوقع بسلوك يمكن التحقق منه", "linking a design change to a behavior you can validate", "experiment-brief", 40, 110),
                        ]),
                    CreateUnit(
                        "prioritization-and-roadmapping",
                        "الترتيب وصناعة خارطة الطريق",
                        "Prioritization and Roadmapping",
                        "اتخذ قرارات استراتيجية حول ما يجب عمله الآن وما يجب تأجيله.",
                        "Make strategic decisions about what to do now and what to defer.",
                        175,
                        360,
                        "strategic-prioritization",
                        [
                            new ExpansionLessonPlan("impact-vs-effort-evaluation", "تقييم الأثر مقابل الجهد", "Impact vs Effort Evaluation", "تفكيك القرارات إلى قيمة وتكلفة ومخاطرة", "breaking decisions into value, cost, and risk", "impact-effort", 36, 100),
                            new ExpansionLessonPlan("sequencing-roadmap-initiatives", "تسلسل المبادرات", "Sequencing Roadmap Initiatives", "ترتيب العمل بحيث يخلق تعلماً سريعاً", "sequencing work to create fast learning", "service-blueprint", 38, 105),
                            new ExpansionLessonPlan("communicating-strategy-to-stakeholders", "توصيل الاستراتيجية لأصحاب المصلحة", "Communicating Strategy to Stakeholders", "شرح لماذا هذه الأولوية الآن بلغة يفهمها الجميع", "explaining why this priority matters now in language stakeholders understand", "workshop-flow", 40, 110),
                        ]),
                ])),
        BuildSection(
            new ExpansionSectionPlan(
                "psychology-gamification",
                "علم النفس والتلعيب",
                "Psychology and Gamification",
                "افهم الدوافع والعادات وردود الفعل النفسية حتى تصمم تفاعلات تشجع السلوك الجيد دون تلاعب أو إدمان.",
                "Understand motivation, habits, and behavioral responses so you can design interactions that encourage healthy behavior without manipulation.",
                "🧠",
                "advanced",
                80,
                300,
                26,
                new ExpansionProjectPlan(
                    "psychology-gamification-loop",
                    "مشروع التلعيب: حلقة سلوك صحية",
                    "Psychology and Gamification Project: Healthy Behavior Loop",
                    "صمّم آلية تشجيع أو تقدم تساعد المستخدم على الاستمرار بشكل أخلاقي ومفهوم.",
                    "Design a motivation or progress loop that helps people continue in an ethical and understandable way.",
                    "قدّم loop behavior واضح، محفزات، feedback states، ومعايير تمنع سوء الاستخدام أو الضغط المبالغ فيه.",
                    "Submit a clear behavior loop, triggers, feedback states, and guardrails that prevent misuse or excessive pressure.",
                    7,
                    400,
                    [
                        "رسم للحلقة السلوكية أو progression loop",
                        "تفسير المحفزات والمكافآت",
                        "حالات feedback للنجاح والتوقف",
                        "ضوابط أخلاقية أو anti-patterns avoided"
                    ],
                    [
                        "A behavior or progression loop diagram",
                        "An explanation of triggers and rewards",
                        "Feedback states for success and drop-off",
                        "Ethical guardrails or anti-patterns avoided"
                    ]),
                [
                    CreateUnit(
                        "motivation-loops-and-feedback",
                        "الدوافع وحلقات التغذية الراجعة",
                        "Motivation Loops and Feedback",
                        "ميّز بين ما يدفع المستخدم للاستمرار وما يجعله يشعر بالضغط أو الغموض.",
                        "Differentiate between what motivates a person to continue and what creates pressure or ambiguity.",
                        175,
                        360,
                        "motivation-loops",
                        [
                            new ExpansionLessonPlan("understanding-intrinsic-motivation", "فهم الدافع الداخلي", "Understanding Intrinsic Motivation", "بناء التقدم حول معنى حقيقي للمستخدم", "building progression around meaningful value for the user", "microinteraction", 36, 100),
                            new ExpansionLessonPlan("feedback-loops-and-rewards", "حلقات المكافأة والتغذية الراجعة", "Feedback Loops and Rewards", "توقيت التقدير بحيث يعزز السلوك الصحيح", "timing reinforcement so it supports the right behavior", "feedback-good", 38, 105),
                            new ExpansionLessonPlan("avoiding-dark-patterns", "تجنب الأنماط المظلمة", "Avoiding Dark Patterns", "التفريق بين التحفيز الصادق والتلاعب", "separating healthy motivation from manipulative design", "feedback-bad", 40, 110),
                        ]),
                    CreateUnit(
                        "habit-building-and-long-term-engagement",
                        "بناء العادات والاستمرارية",
                        "Habit Building and Long-Term Engagement",
                        "استخدم العادات والمحفزات بشكل متزن لبناء استمرارية طويلة الأمد.",
                        "Use habits and triggers in a balanced way to support long-term engagement.",
                        175,
                        360,
                        "habit-building",
                        [
                            new ExpansionLessonPlan("progress-visibility-and-milestones", "إظهار التقدم والمعالم", "Progress Visibility and Milestones", "تجزيء التقدم إلى لحظات مفهومة ومحفزة", "breaking progress into understandable and motivating milestones", "dashboard-hierarchy-good", 36, 100),
                            new ExpansionLessonPlan("designing-re-entry-experiences", "تصميم العودة بعد الانقطاع", "Designing Re-Entry Experiences", "مساعدة المستخدم على العودة دون شعور بالفشل", "helping people come back without feeling punished", "onboarding-loop", 38, 105),
                            new ExpansionLessonPlan("balancing-engagement-with-wellbeing", "التوازن بين التفاعل والرفاه", "Balancing Engagement with Wellbeing", "ضبط الإيقاع حتى لا يصبح المنتج مرهقاً", "setting a healthy cadence so the product does not become exhausting", "feedback-states", 40, 110),
                        ]),
                ])),
        BuildSection(
            new ExpansionSectionPlan(
                "emerging-tech-career",
                "التقنيات الناشئة والملف المهني",
                "Emerging Tech and Career Growth",
                "استكشف كيف تتغير UX مع الذكاء الاصطناعي والأنظمة الجديدة، وكيف تقدّم نفسك كمصمم قادر على التطور والقيادة.",
                "Explore how UX shifts with AI and new systems, and how to present yourself as a designer who can evolve and lead.",
                "🚀",
                "advanced",
                80,
                310,
                26,
                new ExpansionProjectPlan(
                    "emerging-tech-career-case-study",
                    "مشروع التخرج المتقدم: دراسة حالة جاهزة للتوظيف",
                    "Advanced Graduation Project: Career-Ready Case Study",
                    "ابنِ دراسة حالة متقدمة تبرز التفكير الاستراتيجي، الأنظمة، والوعي بالتقنيات الحديثة داخل مشروع واحد.",
                    "Build an advanced case study that highlights strategic thinking, systems awareness, and modern technology considerations in one project.",
                    "قدّم دراسة حالة كاملة مع المشكلة، العملية، القرارات، القياس، والانعكاس المهني النهائي.",
                    "Submit a complete case study with the problem, process, decisions, measurement, and final career reflection.",
                    8,
                    420,
                    [
                        "Case study مفصلة من البداية للنهاية",
                        "قرارات مدعومة بسبب واضح أو قياس",
                        "قسم يوضح دور الذكاء الاصطناعي أو التقنية الحديثة إن وجدت",
                        "انعكاس مهني يوضح ما الذي تطور في طريقة تفكيرك"
                    ],
                    [
                        "A full case study from start to finish",
                        "Decisions backed by rationale or measurement",
                        "A section covering AI or emerging tech considerations when relevant",
                        "A professional reflection on how your thinking evolved"
                    ]),
                [
                    CreateUnit(
                        "designing-for-ai-and-new-contexts",
                        "التصميم للذكاء الاصطناعي والسياقات الجديدة",
                        "Designing for AI and New Contexts",
                        "صمّم تجارب تحتمل عدم اليقين، التوصيات، والمخرجات المتغيرة التي تقدمها الأنظمة الذكية.",
                        "Design experiences that can handle uncertainty, recommendations, and variable outputs from intelligent systems.",
                        175,
                        370,
                        "emerging-tech",
                        [
                            new ExpansionLessonPlan("ai-transparency-and-trust", "شفافية الذكاء الاصطناعي والثقة", "AI Transparency and Trust", "شرح ما يفعله النظام وما لا يضمنه", "making it clear what the system does and does not guarantee", "feedback-states", 36, 100),
                            new ExpansionLessonPlan("designing-for-uncertain-outputs", "التصميم للمخرجات غير المؤكدة", "Designing for Uncertain Outputs", "تقديم النتائج المتغيرة دون خلق التباس أو وعود زائفة", "presenting variable outputs without confusion or false promises", "feedback-good", 38, 105),
                            new ExpansionLessonPlan("human-control-and-escalation", "التحكم البشري ومسارات التصعيد", "Human Control and Escalation", "حفظ القرار النهائي بيد المستخدم عند الحاجة", "keeping the final decision in the user's hands when needed", "service-blueprint", 40, 110),
                        ]),
                    CreateUnit(
                        "portfolio-storytelling-and-career-growth",
                        "السرد المهني وتطوير المسار",
                        "Portfolio Storytelling and Career Growth",
                        "طوّر قصة مهنية توضّح مستوى تفكيرك، تأثيرك، وما النوع الذي تريد أن تبنيه مستقبلاً.",
                        "Develop a professional narrative that shows your thinking level, your impact, and the kind of work you want to grow into.",
                        175,
                        370,
                        "career-growth",
                        [
                            new ExpansionLessonPlan("crafting-career-positioning", "صياغة التموضع المهني", "Crafting Career Positioning", "شرح من أنت كمصمم وما القيمة التي تضيفها", "clarifying who you are as a designer and the value you bring", "case-study", 36, 100),
                            new ExpansionLessonPlan("turning-projects-into-case-stories", "تحويل المشاريع إلى قصص حالة", "Turning Projects Into Case Stories", "جعل كل مشروع يروي طريقة التفكير وليس فقط النتيجة", "making every project tell the story of the thinking, not only the artifact", "case-study-good", 38, 105),
                            new ExpansionLessonPlan("presenting-work-for-hiring-and-growth", "عرض العمل للتوظيف والنمو", "Presenting Work for Hiring and Growth", "تكييف الحكاية المهنية حسب الفرصة والمستوى", "adapting your story to the opportunity and level you are targeting", "critique-ladder", 40, 110),
                        ]),
                ])),
    ];

    private static CourseSectionDefinition BuildSection(ExpansionSectionPlan plan)
    {
        var units = plan.Units
            .Select(unit => new CourseUnitDefinition(
                unit.Code,
                unit.TitleAr,
                unit.TitleEn,
                unit.DescriptionAr,
                unit.DescriptionEn,
                unit.DurationMinutes,
                unit.XpReward,
                BuildUnitOutcomesAr(plan, unit),
                BuildUnitOutcomesEn(plan, unit),
                unit.QuizPassThreshold,
                unit.QuizXpReward,
                unit.QuizTimeLimitMinutes,
                unit.Lessons.Select(lesson => BuildLesson(plan, unit, lesson)).ToList()))
            .ToList();

        return new CourseSectionDefinition(
            plan.Code,
            plan.TitleAr,
            plan.TitleEn,
            plan.DescriptionAr,
            plan.DescriptionEn,
            plan.Icon,
            plan.Level,
            plan.ExamPassThreshold,
            plan.ExamXpReward,
            plan.ExamTimeLimitMinutes,
            new CourseProjectDefinition(
                plan.Project.Code,
                plan.Project.TitleAr,
                plan.Project.TitleEn,
                plan.Project.DescriptionAr,
                plan.Project.DescriptionEn,
                plan.Project.RequirementsAr,
                plan.Project.RequirementsEn,
                plan.Project.EstimatedHours,
                plan.Project.XpReward,
                plan.Project.DeliverablesAr,
                plan.Project.DeliverablesEn,
                BuildProjectCriteria(plan)),
            units);
    }

    private static ExpansionUnitPlan CreateUnit(
        string code,
        string titleAr,
        string titleEn,
        string descriptionAr,
        string descriptionEn,
        int durationMinutes,
        int xpReward,
        string _quizTheme,
        IReadOnlyList<ExpansionLessonPlan> lessons)
    {
        return new ExpansionUnitPlan(
            code,
            titleAr,
            titleEn,
            descriptionAr,
            descriptionEn,
            durationMinutes + 40,
            xpReward,
            75,
            170 + Math.Max(lessons.Count - 2, 0) * 10,
            _quizTheme.Contains("advanced", StringComparison.OrdinalIgnoreCase) ? 18 : 15,
            lessons);
    }

    private static CourseLessonDefinition BuildLesson(
        ExpansionSectionPlan section,
        ExpansionUnitPlan unit,
        ExpansionLessonPlan lesson)
    {
        return new CourseLessonDefinition(
            lesson.Code,
            lesson.TitleAr,
            lesson.TitleEn,
            $"{lesson.FocusAr} داخل {unit.TitleAr} مع أمثلة عملية من منتجات رقمية حقيقية.",
            $"{lesson.FocusEn} within {unit.TitleEn} using realistic digital product examples.",
            $"في هذا الدرس ستتعلم {lesson.FocusAr}. نبدأ بالمشكلة التي تحاول الواجهة حلها، ثم نفكك القرار التصميمي، وبعدها نراجع كيف نعرف أن الحل فعلاً أوضح وأسهل للمستخدم. الهدف ليس حفظ قاعدة جامدة، بل اكتساب عدسة نقدية تستطيع استخدامها في أي منتج تعمل عليه لاحقاً.",
            $"In this lesson you will learn {lesson.FocusEn}. We start with the problem the interface is trying to solve, then break down the design move behind it, and finally review how to tell whether the solution is actually clearer and easier for people. The goal is not to memorize a rigid rule, but to build a critique lens you can reuse in future product work.",
            [
                $"ابدأ دائماً من مهمة المستخدم قبل اقتراح الشكل النهائي لـ {lesson.TitleAr}.",
                $"راجع كيف يؤثر {lesson.FocusAr} على الوضوح والثقة والسرعة داخل التجربة.",
                "اختبر القرار على سيناريو واقعي قبل اعتباره قاعدة ثابتة."
            ],
            [
                $"Always start from the user task before proposing the final shape of {lesson.TitleEn}.",
                $"Review how {lesson.FocusEn} affects clarity, confidence, and speed in the experience.",
                "Pressure-test the decision in a real scenario before treating it as a rule."
            ],
            $"اختر شاشة أو تدفقاً قريباً من مجال {section.TitleAr}، ثم أعد تقييمه من زاوية {lesson.FocusAr}. سجّل ما الذي يدعم المهمة فعلاً، وما الذي يضيف ضوضاء أو تردداً، ثم اقترح تعديلاً واحداً واضحاً تستطيع تنفيذه مباشرة.",
            $"Pick a screen or flow related to {section.TitleEn}, then re-evaluate it through the lens of {lesson.FocusEn}. Note what truly supports the task, what adds noise or hesitation, and propose one clear change you could implement immediately.",
            $"كلما أصبح {lesson.FocusAr} أوضح داخل الواجهة، أصبح اتخاذ القرار أسرع وأكثر ثقة للمستخدم.",
            $"The clearer {lesson.FocusEn} becomes in the interface, the faster and more confidently a user can make a decision.",
            lesson.DurationMinutes,
            lesson.XpReward,
            lesson.VisualKey,
            $"الشكل التالي يساعدك على مقارنة تنفيذ قوي مقابل تنفيذ مربك في موضوع {lesson.TitleAr}.",
            $"The figure below helps you compare a stronger execution against a more confusing version of {lesson.TitleEn}.",
            BuildReferences(section, lesson),
            [BuildQuestion(section, unit, lesson)]);
    }

    private static IReadOnlyList<string> BuildUnitOutcomesAr(
        ExpansionSectionPlan section,
        ExpansionUnitPlan unit) =>
    [
        $"فهم كيف يخدم {unit.TitleAr} أهداف {section.TitleAr}.",
        $"تحليل القرارات داخل {unit.TitleAr} بلغة المستخدم والنتيجة.",
        $"اختيار خطوة تحسين عملية مبنية على الملاحظة أو التقييم."
    ];

    private static IReadOnlyList<string> BuildUnitOutcomesEn(
        ExpansionSectionPlan section,
        ExpansionUnitPlan unit) =>
    [
        $"Understand how {unit.TitleEn} supports the goals of {section.TitleEn}.",
        $"Analyze decisions inside {unit.TitleEn} in terms of user behavior and outcomes.",
        $"Choose one practical improvement grounded in observation or evaluation."
    ];

    private static IReadOnlyList<CourseReferenceDefinition> BuildReferences(
        ExpansionSectionPlan section,
        ExpansionLessonPlan lesson) =>
    [
        new CourseReferenceDefinition(
            $"مرجع متخصص حول {lesson.TitleAr}",
            $"{lesson.TitleEn} reference"),
        new CourseReferenceDefinition(
            $"مراجعة تطبيقية لمسار {section.TitleAr}",
            $"{section.TitleEn} applied review")
    ];

    private static CourseQuizQuestionDefinition BuildQuestion(
        ExpansionSectionPlan section,
        ExpansionUnitPlan unit,
        ExpansionLessonPlan lesson)
    {
        return new CourseQuizQuestionDefinition(
            $"{lesson.Code}-q1",
            $"ما القرار الأقرب لتطبيق {lesson.TitleAr} بشكل صحيح؟",
            $"Which decision most closely applies {lesson.TitleEn} well?",
            [
                $"ربط {lesson.FocusAr} بهدف المستخدم والخطوة التالية بوضوح",
                $"بدء التنفيذ قبل تحديد الهدف أو الدليل الكافي",
                "إعطاء كل العناصر نفس الأولوية البصرية",
                "تأجيل الاختبار أو المراجعة حتى نهاية العمل بالكامل"
            ],
            [
                $"Connect {lesson.FocusEn} to the user goal and the next step clearly",
                "Start execution before clarifying the goal or evidence",
                "Give every element the same visual priority",
                "Delay testing or review until the very end of the work"
            ],
            0,
            $"ابحث عن الخيار الذي يربط القرار بهدف المستخدم داخل {unit.TitleAr}.",
            $"Look for the option that links the decision back to the user goal inside {unit.TitleEn}.",
            $"القرار الأقوى في {lesson.TitleAr} هو الذي يوضح المهمة ويقلل التردد ويجعل الخطوة التالية مفهومة.",
            $"The strongest decision in {lesson.TitleEn} is the one that clarifies the task, reduces hesitation, and makes the next step understandable.",
            lesson.Code);
    }

    private static IReadOnlyList<CourseProjectCriterionDefinition> BuildProjectCriteria(
        ExpansionSectionPlan plan) =>
    [
        new CourseProjectCriterionDefinition("وضوح المشكلة", "Problem clarity", 20),
        new CourseProjectCriterionDefinition("جودة العملية", "Process quality", 30),
        new CourseProjectCriterionDefinition("قوة القرار التصميمي", "Design decision quality", 30),
        new CourseProjectCriterionDefinition("وضوح العرض والتبرير", "Communication and rationale", 20)
    ];
}
