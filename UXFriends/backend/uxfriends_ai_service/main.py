from __future__ import annotations

import json
import logging
import os
from typing import Any, Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from openai import OpenAI
except ImportError:  # pragma: no cover - optional dependency for local setup
    OpenAI = None  # type: ignore[assignment]


logger = logging.getLogger("uxfriends_ai_service")

AI_PROVIDER = os.getenv("AI_PROVIDER", "local").strip().lower()
AI_REASONING_EFFORT = os.getenv("AI_REASONING_EFFORT", "medium")
AI_REQUEST_TIMEOUT_SECONDS = float(os.getenv("AI_REQUEST_TIMEOUT_SECONDS", "30"))
AI_MAX_OUTPUT_TOKENS = int(os.getenv("AI_MAX_OUTPUT_TOKENS", "280"))

LOCAL_AI_BASE_URL = os.getenv("LOCAL_AI_BASE_URL", "http://127.0.0.1:11434/v1")
LOCAL_AI_MODEL = os.getenv("LOCAL_AI_MODEL", "deepseek-r1:1.5b")
LOCAL_AI_FALLBACK_MODELS = [
    model.strip()
    for model in os.getenv(
        "LOCAL_AI_FALLBACK_MODELS",
        "qwen2.5:3b-instruct,llama3.2:3b",
    ).split(",")
    if model.strip()
]
LOCAL_AI_API_KEY = os.getenv("LOCAL_AI_API_KEY", "ollama")

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")


def _create_model_client() -> tuple[Any | None, str, str]:
    if OpenAI is None:
        return None, "heuristic", "heuristic"

    if AI_PROVIDER == "heuristic":
        return None, "heuristic", "heuristic"

    if AI_PROVIDER == "deepseek":
        if not DEEPSEEK_API_KEY:
            logger.warning("DeepSeek provider selected but DEEPSEEK_API_KEY is missing; falling back to heuristic mode.")
            return None, "heuristic", "heuristic"

        return (
            OpenAI(
                api_key=DEEPSEEK_API_KEY,
                base_url=DEEPSEEK_BASE_URL,
                timeout=AI_REQUEST_TIMEOUT_SECONDS,
            ),
            "deepseek",
            DEEPSEEK_MODEL,
        )

    return (
        OpenAI(
            api_key=LOCAL_AI_API_KEY,
            base_url=LOCAL_AI_BASE_URL,
            timeout=AI_REQUEST_TIMEOUT_SECONDS,
        ),
        "local",
        LOCAL_AI_MODEL,
    )


_model_client, _model_mode, _model_name = _create_model_client()


class CoachMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class InsightTopic(BaseModel):
    code: str
    titleAr: str
    titleEn: str
    reasonAr: str
    reasonEn: str
    nextLessonCode: str | None = None
    nextLessonTitleAr: str | None = None
    nextLessonTitleEn: str | None = None


class InsightRecommendation(BaseModel):
    id: str
    type: str
    titleAr: str
    titleEn: str
    descriptionAr: str
    descriptionEn: str


class AICoachOverviewPayload(BaseModel):
    stats: dict[str, Any] = Field(default_factory=dict)
    strengths: list[dict[str, Any]] = Field(default_factory=list)
    weakTopics: list[InsightTopic] = Field(default_factory=list)
    mistakes: list[dict[str, Any]] = Field(default_factory=list)
    recommendedNextStep: InsightRecommendation | None = None
    recommendations: list[InsightRecommendation] = Field(default_factory=list)
    recentActivity: list[dict[str, Any]] = Field(default_factory=list)


class ChatRequest(BaseModel):
    message: str
    language: Literal["ar", "en"] = "ar"
    history: list[CoachMessage] = Field(default_factory=list)
    overview: AICoachOverviewPayload | None = None


class ChatResponse(BaseModel):
    reply: str
    suggestedActions: list[str]


app = FastAPI(title="UXFriends AI Coach", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _pick_primary_weak_topic(overview: AICoachOverviewPayload | None) -> InsightTopic | None:
    if not overview or not overview.weakTopics:
        return None
    return overview.weakTopics[0]


def _pick_primary_strength(overview: AICoachOverviewPayload | None) -> dict[str, Any] | None:
    if not overview or not overview.strengths:
        return None
    return overview.strengths[0]


def _pick_recommendation(overview: AICoachOverviewPayload | None) -> InsightRecommendation | None:
    if not overview:
        return None
    if overview.recommendedNextStep:
        return overview.recommendedNextStep
    if overview.recommendations:
        return overview.recommendations[0]
    return None


def _build_suggested_actions(payload: ChatRequest) -> list[str]:
    is_ar = payload.language == "ar"
    weak = _pick_primary_weak_topic(payload.overview)
    recommendation = _pick_recommendation(payload.overview)
    first_mistake = payload.overview.mistakes[0] if payload.overview and payload.overview.mistakes else None

    actions: list[str] = []
    if first_mistake:
        lesson_title = first_mistake.get("lessonTitleAr") if is_ar else first_mistake.get("lessonTitleEn")
        if lesson_title:
            actions.append(
                f"راجع معي درس {lesson_title}" if is_ar else f"Review lesson {lesson_title} with me"
            )
    if weak:
        actions.append(
            f"راجع معي {weak.titleAr}" if is_ar else f"Review {weak.titleEn} with me"
        )
    if recommendation:
        actions.append(
            f"حوّل {recommendation.titleAr} إلى خطة 20 دقيقة"
            if is_ar
            else f"Turn {recommendation.titleEn} into a 20-minute plan"
        )
    actions.append(
        "لخص أخطائي المتكررة" if is_ar else "Summarize my repeated mistakes"
    )
    actions.append(
        "ساعدني في تحسين مشروعي الحالي"
        if is_ar
        else "Help me improve my current project"
    )
    return actions[:4]


def _build_context_summary(payload: ChatRequest) -> tuple[str | None, str | None, str | None]:
    is_ar = payload.language == "ar"
    weak = _pick_primary_weak_topic(payload.overview)
    strength = _pick_primary_strength(payload.overview)
    recommendation = _pick_recommendation(payload.overview)

    weak_title = None
    strength_title = None
    recommendation_title = None

    if weak:
        weak_title = weak.titleAr if is_ar else weak.titleEn
    if strength:
        strength_title = strength.get("titleAr") if is_ar else strength.get("titleEn")
    if recommendation:
        recommendation_title = recommendation.titleAr if is_ar else recommendation.titleEn

    return weak_title, strength_title, recommendation_title


def _pick_relevant_mistakes(payload: ChatRequest) -> list[dict[str, Any]]:
    mistakes = payload.overview.mistakes if payload.overview else []
    if not mistakes:
        return []

    lowered_message = payload.message.strip().lower()
    if not lowered_message:
        return mistakes[:3]

    matched: list[dict[str, Any]] = []
    for mistake in mistakes:
        searchable_parts = [
            str(mistake.get("promptAr", "")),
            str(mistake.get("promptEn", "")),
            str(mistake.get("lessonTitleAr", "")),
            str(mistake.get("lessonTitleEn", "")),
            str(mistake.get("unitTitleAr", "")),
            str(mistake.get("unitTitleEn", "")),
            str(mistake.get("sectionTitleAr", "")),
            str(mistake.get("sectionTitleEn", "")),
        ]
        searchable_text = " ".join(searchable_parts).lower()
        if lowered_message and lowered_message in searchable_text:
            matched.append(mistake)
            continue

        if any(token and token in searchable_text for token in lowered_message.split()):
            matched.append(mistake)

    return (matched or mistakes)[:3]


def _format_mistake_item(mistake: dict[str, Any], language: Literal["ar", "en"]) -> str:
    is_ar = language == "ar"
    prompt = mistake.get("promptAr") if is_ar else mistake.get("promptEn")
    selected_answer = mistake.get("selectedAnswerAr") if is_ar else mistake.get("selectedAnswerEn")
    correct_answer = mistake.get("correctAnswerAr") if is_ar else mistake.get("correctAnswerEn")
    explanation = mistake.get("explanationAr") if is_ar else mistake.get("explanationEn")
    lesson_title = mistake.get("lessonTitleAr") if is_ar else mistake.get("lessonTitleEn")

    if is_ar:
        return (
            f"- السؤال: {prompt}\n"
            f"  إجابتك: {selected_answer or 'بدون إجابة'}\n"
            f"  الصحيح: {correct_answer}\n"
            f"  راجع: {lesson_title or 'الدرس المرتبط'}\n"
            f"  السبب: {explanation}"
        )

    return (
        f"- Question: {prompt}\n"
        f"  Your answer: {selected_answer or 'No answer selected'}\n"
        f"  Correct answer: {correct_answer}\n"
        f"  Review: {lesson_title or 'the linked lesson'}\n"
        f"  Why: {explanation}"
    )


def _reply_for_mistakes(payload: ChatRequest, weak_title: str | None, recommendation_title: str | None) -> str:
    is_ar = payload.language == "ar"
    relevant_mistakes = _pick_relevant_mistakes(payload)
    if not relevant_mistakes:
        return (
            "لا توجد أخطاء محفوظة حتى الآن. أكمل اختباراً أو جلسة مراجعة وستظهر هنا نقاط الضعف الفعلية."
            if is_ar
            else "There are no saved mistakes yet. Complete a quiz or revision session and your real weak points will appear here."
        )

    header = (
        "هذه أهم الأخطاء الفعلية التي تحتاج مراجعة الآن:"
        if is_ar
        else "These are the real mistakes that need your attention right now:"
    )
    items = "\n".join(_format_mistake_item(mistake, payload.language) for mistake in relevant_mistakes)

    closing_parts: list[str] = []
    if weak_title:
        closing_parts.append(
            f"ابدأ من {weak_title} لأنه الأعلى أولوية." if is_ar else f"Start with {weak_title} because it has the highest priority."
        )
    if recommendation_title:
        closing_parts.append(
            f"ثم انتقل إلى {recommendation_title} كخطوة تالية."
            if is_ar
            else f"Then move into {recommendation_title} as your next step."
        )

    closing = "\n".join(closing_parts)
    return f"{header}\n{items}" + (f"\n{closing}" if closing else "")


def _reply_for_project(payload: ChatRequest, weak_title: str | None, recommendation_title: str | None) -> str:
    is_ar = payload.language == "ar"
    if is_ar:
        lines = [
            "لنحسن المشروع بطريقة عملية وسريعة:",
            "1. ابدأ بتوضيح هدف الشاشة أو التدفق في جملة واحدة.",
            "2. راجع التسلسل البصري: ما العنصر الأول الذي يجب أن يراه المستخدم؟",
            "3. تأكد أن النصوص الرئيسية واضحة ومباشرة، خاصة الأزرار والتنبيهات.",
            "4. اختبر التباعد والمحاذاة والاتساق بين المكونات.",
        ]
        if weak_title:
            lines.append(f"5. انتبه بشكل خاص إلى موضوع \"{weak_title}\" لأنه يظهر كأكثر نقطة تحتاج مراجعة حالياً.")
        if recommendation_title:
            lines.append(f"أفضل خطوة بعد ذلك: حوّل \"{recommendation_title}\" إلى تعديل صغير تنفذه الآن داخل المشروع.")
        return "\n".join(lines)

    lines = [
        "Let’s improve the project in a practical way:",
        "1. Define the screen or flow goal in one sentence.",
        "2. Check the visual hierarchy: what should the user notice first?",
        "3. Make sure the key copy is direct, especially buttons and status messages.",
        "4. Review spacing, alignment, and component consistency.",
    ]
    if weak_title:
        lines.append(f"5. Pay extra attention to \"{weak_title}\" because it is your clearest review area right now.")
    if recommendation_title:
        lines.append(f"Best next step: turn \"{recommendation_title}\" into one concrete change inside the project.")
    return "\n".join(lines)


def _reply_for_revision(payload: ChatRequest, weak_title: str | None, recommendation_title: str | None) -> str:
    is_ar = payload.language == "ar"
    relevant_mistakes = _pick_relevant_mistakes(payload)
    if is_ar:
        lines = [
            "هذه أفضل طريقة للمراجعة الآن:",
            "1. ابدأ بأحدث خطأ حفظه النظام، وليس بالدرس الذي لم تبدأه بعد.",
            "2. راجع السؤال الخاطئ ثم ارجع مباشرة إلى الدرس المرتبط به.",
            "3. أعد صياغة القاعدة الأساسية بكلماتك أنت.",
            "4. اختبر نفسك بسؤال مشابه بعد 10 دقائق.",
        ]
        if relevant_mistakes:
            first_mistake = relevant_mistakes[0]
            lines.append(
                f"أول سؤال ابدأ به الآن: {first_mistake.get('promptAr')}."
            )
            if first_mistake.get("lessonTitleAr"):
                lines.append(
                    f"الدرس الذي يجب مراجعته مباشرة: {first_mistake.get('lessonTitleAr')}."
                )
        if weak_title:
            lines.append(f"ابدأ من \"{weak_title}\" لأنه الأعلى أولوية الآن.")
        if recommendation_title:
            lines.append(f"بعدها انتقل إلى \"{recommendation_title}\" كخطوة تالية.")
        return "\n".join(lines)

    lines = [
        "This is the best review flow for you right now:",
        "1. Start with the latest saved mistake, not an untouched lesson.",
        "2. Revisit the exact question, then open the linked lesson immediately.",
        "3. Rewrite the core rule in your own words.",
        "4. Retest yourself with a similar question after 10 minutes.",
    ]
    if relevant_mistakes:
        first_mistake = relevant_mistakes[0]
        lines.append(f"Start with this question now: {first_mistake.get('promptEn')}.")
        if first_mistake.get("lessonTitleEn"):
            lines.append(f"Then open this lesson directly: {first_mistake.get('lessonTitleEn')}.")
    if weak_title:
        lines.append(f"Start with \"{weak_title}\" because it has the highest review priority.")
    if recommendation_title:
        lines.append(f"Then move into \"{recommendation_title}\" as your next step.")
    return "\n".join(lines)


def _reply_for_explanation(payload: ChatRequest, weak_title: str | None, recommendation_title: str | None) -> str:
    is_ar = payload.language == "ar"
    relevant_mistakes = _pick_relevant_mistakes(payload)
    first_mistake = relevant_mistakes[0] if relevant_mistakes else None
    linked_lesson = None
    if first_mistake:
        linked_lesson = first_mistake.get("lessonTitleAr") if is_ar else first_mistake.get("lessonTitleEn")

    if linked_lesson:
        if is_ar:
            return (
                f"إذا كان قصدك الدرس المرتبط بـ \"{linked_lesson}\" فابدأ بهذه الطريقة: "
                "ما الهدف من الدرس؟ من هو المستخدم؟ وما القرار التصميمي الذي يخدم هذا الهدف؟ "
                "يمكنني أيضاً تلخيص الخطأ المرتبط بهذا الدرس وتحويله إلى شرح أبسط خطوة بخطوة."
            )
        return (
            f"If you mean the lesson linked to \"{linked_lesson}\", start with this frame: "
            "what is the lesson goal, who is the user, and which design decision best supports that goal? "
            "I can also turn the mistake linked to that lesson into a simpler step-by-step explanation."
        )

    target = weak_title or recommendation_title
    if is_ar:
        if target:
            return (
                f"سأبسطها لك بهذه الطريقة: ابدأ من \"{target}\" كفكرة رئيسية، "
                "ثم اسأل نفسك عن الهدف، ثم عن المستخدم، ثم عن القرار التصميمي الذي يخدم هذا الهدف. "
                "إذا أحببت، أستطيع بعد ذلك تحويل هذه الفكرة إلى مثال واجهة أو سؤال تدريبي."
            )
        return (
            "لا أملك داخل هذه الخدمة نص الدرس الكامل أو شرائحه حرفياً بعد، لذلك لن أخمّن شرحاً غير مرتبط. "
            "اذكر اسم الدرس أو افتح الدرس نفسه، وسأحوّل الفكرة إلى شرح أبسط أو أسئلة تدريبية مرتبطة به."
        )

    if target:
        return (
            f"Here is the simplest way to frame it: start from \"{target}\" as the main concept, "
            "then ask about the goal, the user, and the design decision that best supports that goal. "
            "If you want, I can turn that into a UI example or a practice question next."
        )
    return (
        "I do not have the exact lesson text or slides inside this chat service yet, so I should not guess a lesson explanation that might be unrelated. "
        "Tell me the lesson title or open the lesson itself, and I can turn it into a simpler explanation or targeted practice."
    )


def _reply_default(payload: ChatRequest, weak_title: str | None, strength_title: str | None, recommendation_title: str | None) -> str:
    is_ar = payload.language == "ar"
    streak = payload.overview.stats.get("streak") if payload.overview else 0
    level = payload.overview.stats.get("level") if payload.overview else 0
    mistakes_count = len(payload.overview.mistakes) if payload.overview else 0

    if is_ar:
        lines = [
            f"أنا أقرأ تقدمك الحالي من المنصة مباشرة: مستواك {level} وسلسلة التعلم الحالية {streak} يوم.",
        ]
        if strength_title:
            lines.append(f"أقوى نقطة عندك الآن: {strength_title}.")
        if weak_title:
            lines.append(f"أكثر نقطة تحتاج مراجعة: {weak_title}.")
        if recommendation_title:
            lines.append(f"أفضل خطوة تالية لك الآن: {recommendation_title}.")
        if mistakes_count:
            lines.append(f"لديك أيضاً {mistakes_count} أخطاء محفوظة أستطيع تحويلها إلى مراجعة دقيقة سؤالاً بسؤال.")
        lines.append("إذا أردت، أستطيع أن أحول هذا إلى خطة قصيرة، مراجعة مركزة، أو ملاحظات على مشروعك.")
        return "\n".join(lines)

    lines = [
        f"I am reading your current platform progress directly: your level is {level} and your current streak is {streak} days.",
    ]
    if strength_title:
        lines.append(f"Your strongest area right now is {strength_title}.")
    if weak_title:
        lines.append(f"Your clearest review area is {weak_title}.")
    if recommendation_title:
        lines.append(f"Your best next step right now is {recommendation_title}.")
    if mistakes_count:
        lines.append(f"You also have {mistakes_count} saved mistakes that I can turn into a question-by-question review.")
    lines.append("If you want, I can turn that into a short plan, a focused review, or project feedback.")
    return "\n".join(lines)


def _build_context_payload(payload: ChatRequest) -> dict[str, Any]:
    overview = payload.overview
    if not overview:
        return {
            "has_context": False,
        }

    return {
        "has_context": True,
        "stats": overview.stats,
        "strengths": overview.strengths[:3],
        "weak_topics": [topic.model_dump() for topic in overview.weakTopics[:6]],
        "mistakes": [
            {
                "sectionTitleAr": mistake.get("sectionTitleAr"),
                "sectionTitleEn": mistake.get("sectionTitleEn"),
                "unitTitleAr": mistake.get("unitTitleAr"),
                "unitTitleEn": mistake.get("unitTitleEn"),
                "lessonTitleAr": mistake.get("lessonTitleAr"),
                "lessonTitleEn": mistake.get("lessonTitleEn"),
                "promptAr": mistake.get("promptAr"),
                "promptEn": mistake.get("promptEn"),
                "selectedAnswerAr": mistake.get("selectedAnswerAr"),
                "selectedAnswerEn": mistake.get("selectedAnswerEn"),
                "correctAnswerAr": mistake.get("correctAnswerAr"),
                "correctAnswerEn": mistake.get("correctAnswerEn"),
                "explanationAr": mistake.get("explanationAr"),
                "explanationEn": mistake.get("explanationEn"),
                "nextLessonCode": mistake.get("nextLessonCode"),
                "nextLessonTitleAr": mistake.get("nextLessonTitleAr"),
                "nextLessonTitleEn": mistake.get("nextLessonTitleEn"),
            }
            for mistake in overview.mistakes[:8]
        ],
        "recommended_next_step": overview.recommendedNextStep.model_dump() if overview.recommendedNextStep else None,
        "recommendations": [item.model_dump() for item in overview.recommendations[:4]],
        "recent_activity": overview.recentActivity[:4],
    }


def _build_model_instructions(language: Literal["ar", "en"]) -> str:
    if language == "ar":
        return (
            "أنت المساعد الذكي في UXFriends. "
            "قدّم شرحاً عملياً واضحاً ومباشراً يناسب رحلة تعلم UX/UI. "
            "اعتمد على سياق المنصة المرسل لك عندما يتوفر، واذكره كمرجع لحالة المستخدم الحالية. "
            "إذا سأل المستخدم عن درس محدد غير موجود في السياق، اشرح الفكرة بشكل عام واذكر بوضوح أنك لا تقتبس نص الدرس الحرفي. "
            "لا تخترع درجات أو تقدم أو أخطاء غير موجودة في البيانات. "
            "قدّم إجابة عربية طبيعية مع خطوات أو نقاط قصيرة عندما تكون مفيدة."
        )

    return (
        "You are the UXFriends AI coach. "
        "Give clear, practical UX/UI learning guidance. "
        "Use the provided platform context whenever it is available and treat it as the source of truth for the learner's current progress. "
        "If the learner asks about a lesson that is not explicitly present in the context, explain the concept generally and clearly state that you are not quoting the exact lesson text. "
        "Do not invent scores, progress, mistakes, or achievements that are not in the supplied data. "
        "Reply in natural English and prefer concise actionable steps when helpful."
    )


def _build_model_messages(payload: ChatRequest) -> list[dict[str, str]]:
    context_json = json.dumps(
        _build_context_payload(payload),
        ensure_ascii=False,
        indent=2,
    )
    messages: list[dict[str, str]] = [
        {
            "role": "system",
            "content": _build_model_instructions(payload.language),
        },
        {
            "role": "system",
            "content": (
                "Platform context JSON:\n"
                f"{context_json}"
            ),
        },
    ]

    messages.extend(
        {"role": message.role, "content": message.content}
        for message in payload.history[-8:]
        if message.content.strip()
    )
    messages.append({"role": "user", "content": payload.message})
    return messages


def _is_quick_greeting(message: str) -> bool:
    normalized = message.strip().lower()
    if not normalized:
        return True

    quick_greetings = {
        "hi",
        "hello",
        "hey",
        "yo",
        "hola",
        "مرحبا",
        "أهلا",
        "اهلا",
        "السلام عليكم",
        "سلام",
        "هاي",
        "هلا",
    }
    return normalized in quick_greetings


def _build_quick_greeting_reply(payload: ChatRequest) -> str:
    is_ar = payload.language == "ar"
    weak_title, _, recommendation_title = _build_context_summary(payload)
    suggestion = recommendation_title or weak_title

    if is_ar:
        if suggestion:
            return (
                "أهلاً بك. أنا جاهز لمساعدتك بسرعة من غير انتظار طويل. "
                f"يمكننا البدء مباشرة من \"{suggestion}\"، أو يمكنك أن تطلب مني شرح درس، تلخيص أخطائك، أو تجهيز مراجعة قصيرة."
            )

        return (
            "أهلاً بك. أنا جاهز لمساعدتك بسرعة من غير انتظار طويل. "
            "يمكنك أن تطلب مني شرح درس، تلخيص أخطائك، أو تجهيز مراجعة قصيرة لليوم."
        )

    if suggestion:
        return (
            "Hi, I’m ready to help without a long wait. "
            f"We can start with \"{suggestion}\", or you can ask me to explain a lesson, summarize your mistakes, or build a short review session."
        )

    return (
        "Hi, I’m ready to help without a long wait. "
        "Ask me to explain a lesson, summarize your mistakes, or build a short review session for today."
    )


def _normalized_message(message: str) -> str:
    return " ".join(message.strip().lower().split())


def _recent_user_prompts(payload: ChatRequest) -> list[str]:
    prompts: list[str] = []
    current_prompt = payload.message.strip()

    for message in payload.history:
        content = message.content.strip()
        if message.role != "user" or not content:
            continue

        if current_prompt and content == current_prompt:
            continue

        prompts.append(content)

    return prompts


def _is_identity_question(message: str) -> bool:
    normalized = _normalized_message(message)
    identity_patterns = (
        "who are you",
        "what are you",
        "مين انت",
        "من انت",
        "من أنت",
        "انت مين",
        "أنت مين",
        "مين حضرتك",
    )
    return any(pattern in normalized for pattern in identity_patterns)


def _reply_for_identity(payload: ChatRequest) -> str:
    is_ar = payload.language == "ar"
    if is_ar:
        return (
            "أنا المساعد الذكي داخل UXFriends. أساعدك في فهم دروس UX/UI، "
            "تلخيص أخطائك الحقيقية من الاختبارات، تحويل نقاط الضعف إلى خطة مراجعة، "
            "ومراجعة المشاريع بناءً على تقدمك الحالي داخل المنصة."
        )

    return (
        "I am the AI coach inside UXFriends. I help you understand UX/UI lessons, "
        "review your real quiz mistakes, turn weak spots into revision steps, "
        "and give guidance on projects based on your current platform progress."
    )


def _is_chat_memory_question(message: str) -> bool:
    normalized = _normalized_message(message)
    memory_patterns = (
        "what did i ask",
        "what did i say",
        "last prompt",
        "my last prompt",
        "my previous prompt",
        "before in this chat",
        "previous message",
        "last thing i asked",
        "what was my last question",
        "what did i ask you before",
        "what's the last thing i asked",
        "what is the last thing i asked",
        "ايه اخر حاجة",
        "ايه آخر حاجة",
        "اخر حاجة سألتك",
        "آخر حاجة سألتك",
        "اخر سؤال",
        "آخر سؤال",
        "قبل كده في الشات",
        "قبل هذا في الشات",
        "انا سألتك ايه",
        "أنا سألتك ايه",
        "أنا سألتك إيه",
    )
    return any(pattern in normalized for pattern in memory_patterns)


def _reply_for_chat_memory(payload: ChatRequest) -> str:
    is_ar = payload.language == "ar"
    prompts = _recent_user_prompts(payload)

    if not prompts:
        return (
            "هذه أول رسالة واضحة منك في هذه المحادثة، لذلك لا يوجد سؤال سابق أرجع إليه بعد."
            if is_ar
            else "This is the first clear prompt from you in this chat, so there is no earlier question to refer back to yet."
        )

    last_prompt = prompts[-1]
    if is_ar:
        return (
            "آخر طلب منك قبل رسالتك الحالية كان:\n"
            f"\"{last_prompt}\""
        )

    return (
        "Your last prompt before this message was:\n"
        f"\"{last_prompt}\""
    )


def _extract_message_content(content: Any) -> str:
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
                continue

            if isinstance(item, dict):
                text_value = item.get("text")
                if isinstance(text_value, str):
                    parts.append(text_value)
                    continue

                if item.get("type") == "text" and isinstance(item.get("text"), str):
                    parts.append(item["text"])
        return "\n".join(part for part in parts if part).strip()

    return ""


def _request_model_reply(payload: ChatRequest) -> str | None:
    if _model_client is None:
        return None

    if _is_quick_greeting(payload.message):
        return _build_quick_greeting_reply(payload)

    if _is_identity_question(payload.message):
        return _reply_for_identity(payload)

    if _is_chat_memory_question(payload.message):
        return _reply_for_chat_memory(payload)

    try:
        model_attempts = [_model_name]
        if _model_mode == "local":
            for fallback_model in LOCAL_AI_FALLBACK_MODELS:
                if fallback_model not in model_attempts:
                    model_attempts.append(fallback_model)

        for model_name in model_attempts:
            request_kwargs: dict[str, Any] = {
                "model": model_name,
                "messages": _build_model_messages(payload),
                "max_tokens": AI_MAX_OUTPUT_TOKENS,
                "temperature": 0.35,
            }

            if _model_mode == "deepseek":
                request_kwargs["extra_body"] = {
                    "thinking": {"type": "enabled"},
                    "reasoning_effort": AI_REASONING_EFFORT,
                }

            try:
                response = _model_client.chat.completions.create(
                    **request_kwargs,
                )
            except Exception:
                logger.exception("Model attempt failed for %s; trying fallback if available.", model_name)
                continue

            choices = getattr(response, "choices", None) or []
            if not choices:
                continue

            message = getattr(choices[0], "message", None)
            if message is None:
                continue

            content = _extract_message_content(getattr(message, "content", ""))
            if content:
                return content
    except Exception:
        logger.exception("Model-backed coach reply failed; falling back to heuristic response.")

    return None


def _build_fallback_reply(payload: ChatRequest) -> str:
    message = payload.message.strip().lower()
    weak_title, strength_title, recommendation_title = _build_context_summary(payload)

    if _is_identity_question(payload.message):
        return _reply_for_identity(payload)
    if _is_chat_memory_question(payload.message):
        return _reply_for_chat_memory(payload)
    if any(token in message for token in ["mistake", "mistakes", "error", "errors", "wrong answer", "review area", "راجع", "الأخطاء", "اخطائي", "أخطائي", "غلط", "غلطت", "wrong"]):
        return _reply_for_mistakes(payload, weak_title, recommendation_title)
    if any(token in message for token in ["project", "مشروع", "submission", "submit"]):
        return _reply_for_project(payload, weak_title, recommendation_title)
    if any(token in message for token in ["review", "راجع", "revision", "خطأ", "المراجعة"]):
        return _reply_for_revision(payload, weak_title, recommendation_title)
    if any(token in message for token in ["explain", "اشرح", "concept", "مفهوم", "lesson", "درس"]):
        return _reply_for_explanation(payload, weak_title, recommendation_title)
    return _reply_default(payload, weak_title, strength_title, recommendation_title)


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "mode": _model_mode,
        "model": _model_name,
    }


@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    reply = _request_model_reply(payload) or _build_fallback_reply(payload)
    return ChatResponse(
        reply=reply,
        suggestedActions=_build_suggested_actions(payload),
    )
