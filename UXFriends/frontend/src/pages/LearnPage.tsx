import React, { useEffect, useState } from "react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { ProgressBar } from "../components/ProgressBar";
import {
  learningApi,
  type LearningSection,
  type LearningUnit,
} from "../services/api";
import {
  Search,
  Filter,
  Lock,
  CheckCircle2,
  ArrowLeft,
  RefreshCcw,
} from "lucide-react";

export interface LearnPageProps {
  onNavigate: (page: string, context?: Record<string, unknown>) => void;
  language?: "ar" | "en";
  context?: {
    sectionCode?: string;
  };
}

function getDifficultyLabel(difficulty: string, language: "ar" | "en") {
  const normalized = difficulty.trim().toLowerCase();

  if (language === "ar") {
    if (normalized === "beginner" || normalized === "easy") return "مبتدئ";
    if (normalized === "intermediate" || normalized === "medium") return "متوسط";
    if (normalized === "advanced" || normalized === "hard") return "متقدم";
  }

  if (normalized === "مبتدئ") return "Beginner";
  if (normalized === "متوسط") return "Intermediate";
  if (normalized === "متقدم") return "Advanced";
  return difficulty;
}

function formatDuration(minutes: number, language: "ar" | "en") {
  return language === "ar" ? `${minutes} دقيقة` : `${minutes} min`;
}

function getLevelSummary(level: string, language: "ar" | "en") {
  const normalized = level.trim().toLowerCase();

  if (language === "ar") {
    if (normalized === "beginner") {
      return "ابدأ بالعقلية الصحيحة، مبادئ الوضوح، وأساسيات بناء الواجهات.";
    }
    if (normalized === "intermediate") {
      return "انتقل إلى البحث، التحقق، الأنظمة، والعمل على منتجات أكثر تعقيداً.";
    }
    return "طوّر التفكير الاستراتيجي، إمكانية الوصول، والقرارات المتقدمة داخل المنتج.";
  }

  if (normalized === "beginner") {
    return "Start with mindset, clarity, and the foundations of UX and UI craft.";
  }
  if (normalized === "intermediate") {
    return "Move into research, validation, systems, and more complex product work.";
  }
  return "Build strategic thinking, accessibility depth, and advanced product decisions.";
}

function getSectionStatusVariant(
  state: LearningSection["completionState"],
): "success" | "warning" | "secondary" | "neutral" {
  switch (state) {
    case "completed":
      return "success";
    case "ready-for-final":
      return "warning";
    case "requirements-pending":
      return "secondary";
    default:
      return "neutral";
  }
}

export function LearnPage({
  onNavigate,
  language = "ar",
  context,
}: LearnPageProps) {
  const isArabic = language === "ar";
  const [sections, setSections] = useState<LearningSection[]>([]);
  const [selectedSectionCode, setSelectedSectionCode] = useState<string | null>(null);
  const [unitsBySection, setUnitsBySection] = useState<Record<string, LearningUnit[]>>({});
  const [loadingSections, setLoadingSections] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showLocked, setShowLocked] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadSections = async () => {
      try {
        setLoadingSections(true);
        setError("");
        const response = await learningApi.getSections();

        if (!cancelled) {
          setSections(response.data);
        }
      } catch (requestError) {
        if (!cancelled) {
          console.error("Failed to load learning sections", requestError);
          setError(
            isArabic
              ? "تعذر تحميل المسارات التعليمية."
              : "Unable to load the learning paths.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingSections(false);
        }
      }
    };

    void loadSections();

    return () => {
      cancelled = true;
    };
  }, [isArabic]);

  useEffect(() => {
    if (!selectedSectionCode || unitsBySection[selectedSectionCode]) {
      return;
    }

    let cancelled = false;

    const loadUnits = async () => {
      try {
        setLoadingUnits(true);
        setError("");
        const response = await learningApi.getUnits(selectedSectionCode);

        if (!cancelled) {
          setUnitsBySection((current) => ({
            ...current,
            [selectedSectionCode]: response.data,
          }));
        }
      } catch (requestError) {
        if (!cancelled) {
          console.error("Failed to load units", requestError);
          setError(
            isArabic
              ? "تعذر تحميل وحدات هذا المسار."
              : "Unable to load the units for this path.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingUnits(false);
        }
      }
    };

    void loadUnits();

    return () => {
      cancelled = true;
    };
  }, [isArabic, selectedSectionCode, unitsBySection]);

  useEffect(() => {
    const targetSectionCode = context?.sectionCode;
    if (!targetSectionCode) {
      return;
    }

    const exists = sections.some((section) => section.code === targetSectionCode);
    if (exists && selectedSectionCode !== targetSectionCode) {
      setSelectedSectionCode(targetSectionCode);
    }
  }, [context?.sectionCode, sections, selectedSectionCode]);

  const visibleSections = sections.filter((section) => {
    const text = `${section.titleAr} ${section.titleEn} ${section.descriptionAr} ${section.descriptionEn}`.toLowerCase();
    const matchesSearch = text.includes(searchTerm.trim().toLowerCase());
    const matchesLocked = showLocked || !section.locked;

    return matchesSearch && matchesLocked;
  });
  const groupedSections = ["beginner", "intermediate", "advanced"].map((level) => ({
    level,
    sections: visibleSections.filter(
      (section) => section.difficulty.trim().toLowerCase() === level,
    ),
  }));

  const selectedSection = selectedSectionCode
    ? sections.find((section) => section.code === selectedSectionCode) ?? null
    : null;
  const selectedUnits = selectedSectionCode
    ? unitsBySection[selectedSectionCode] ?? []
    : [];

  const openUnit = (unit: LearningUnit) => {
    const page = language === "ar" ? "unit-overview" : "unit-overview-en";

    onNavigate(page, {
      sectionCode: selectedSectionCode,
      unitCode: unit.code,
    });
  };

  if (selectedSection) {
    return (
      <div className="container-custom py-8">
        <Button
          variant="ghost"
          onClick={() => setSelectedSectionCode(null)}
          className="mb-6"
        >
          {isArabic ? "← العودة للمسارات" : "← Back to paths"}
        </Button>

        <div className="mb-8 rounded-2xl bg-gradient-to-br from-purple-600 to-teal-600 p-8 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="text-6xl">{selectedSection.icon}</div>
              <div>
                <h2 className="mb-2 text-white">
                  {isArabic ? selectedSection.titleAr : selectedSection.titleEn}
                </h2>
                <p className="mb-4 text-lg text-purple-100">
                  {isArabic
                    ? selectedSection.descriptionAr
                    : selectedSection.descriptionEn}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <Badge
                    variant="secondary"
                    size="sm"
                    className="border-white/30 bg-white/20 text-white"
                  >
                    {selectedSection.unitsCount} {isArabic ? "وحدات" : "units"}
                  </Badge>
                  <Badge
                    variant="secondary"
                    size="sm"
                    className="border-white/30 bg-white/20 text-white"
                  >
                    {selectedSection.lessonsCount} {isArabic ? "دروس" : "lessons"}
                  </Badge>
                  <Badge
                    variant="secondary"
                    size="sm"
                    className="border-white/30 bg-white/20 text-white"
                  >
                    {getDifficultyLabel(selectedSection.difficulty, language)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="text-left">
              <div className="mb-1 text-sm text-purple-200">
                {isArabic ? "التقدم" : "Progress"}
              </div>
              <div className="text-4xl font-bold">{selectedSection.progress}%</div>
            </div>
          </div>

          <div className="mt-6">
            <ProgressBar
              value={selectedSection.progress}
              color="secondary"
              size="lg"
            />
          </div>
        </div>

        <div>
          <h3 className="mb-6">
            {isArabic ? "الوحدات التعليمية" : "Learning units"}
          </h3>

          {loadingUnits && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          )}

          {!loadingUnits && selectedUnits.length === 0 && (
            <Card className="p-6 text-center text-slate-600">
              {isArabic
                ? "لا توجد وحدات متاحة لهذا المسار حتى الآن."
                : "No units are available for this path yet."}
            </Card>
          )}

          <div className="space-y-4">
            {selectedUnits.map((unit, index) => {
              const canOpenUnit = !unit.locked;
              const actionLabel = unit.completed
                ? isArabic
                  ? "مراجعة الوحدة"
                  : "Review unit"
                : unit.inProgress
                  ? isArabic
                    ? "متابعة الوحدة"
                    : "Continue unit"
                  : isArabic
                    ? "ابدأ الوحدة"
                    : "Start unit";

              return (
              <Card
                key={unit.code}
                hover={canOpenUnit}
                onClick={canOpenUnit ? () => openUnit(unit) : undefined}
                className={unit.locked ? "opacity-60" : ""}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold ${
                      unit.completed
                        ? "bg-green-100 text-green-700"
                        : unit.inProgress
                          ? "bg-purple-100 text-purple-700"
                          : unit.locked
                            ? "bg-slate-100 text-slate-400"
                            : "bg-teal-100 text-teal-700"
                    }`}
                  >
                    {unit.completed ? (
                      <CheckCircle2 className="h-8 w-8" />
                    ) : unit.locked ? (
                      <Lock className="h-8 w-8" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <h4 className="mb-1">
                          {isArabic ? unit.titleAr : unit.titleEn}
                        </h4>
                        <p className="text-sm text-slate-600">
                          {isArabic ? unit.descriptionAr : unit.descriptionEn}
                        </p>
                      </div>
                      <Badge
                        variant={
                          unit.difficulty === "beginner"
                            ? "success"
                            : unit.difficulty === "intermediate"
                              ? "warning"
                              : "error"
                        }
                        size="sm"
                      >
                        {getDifficultyLabel(unit.difficulty, language)}
                      </Badge>
                    </div>

                    <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      <span>
                        {unit.lessonsCount} {isArabic ? "دروس" : "lessons"}
                      </span>
                      <span>•</span>
                      <span>{formatDuration(unit.durationMinutes, language)}</span>
                      <span>•</span>
                      <span className="font-semibold text-yellow-600">
                        {unit.xpReward} XP
                      </span>
                    </div>

                    {unit.completed && (
                      <div className="flex items-center gap-2 font-semibold text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>{isArabic ? "مكتمل" : "Completed"}</span>
                      </div>
                    )}

                    {unit.inProgress && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">
                            {isArabic ? "التقدم الحالي" : "Current progress"}
                          </span>
                          <span className="font-semibold text-purple-600">
                            {unit.progress}%
                          </span>
                        </div>
                        <ProgressBar value={unit.progress} color="primary" size="sm" />
                      </div>
                    )}

                    {!unit.locked && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => openUnit(unit)}
                      >
                        {actionLabel}
                      </Button>
                    )}

                    {unit.locked && (
                      <p className="mt-4 text-sm text-slate-500">
                        {isArabic
                          ? "سيتم فتح هذه الوحدة بعد إنهاء المتطلبات السابقة."
                          : "This unit unlocks after completing the earlier requirements."}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <div className="mb-8">
        <h2 className="mb-2">
          {isArabic ? "المسارات التعليمية" : "Learning paths"}
        </h2>
        <p className="text-lg text-slate-600">
          {isArabic
            ? "المسارات أدناه تُحمَّل الآن من الخادم مع تقدمك الحقيقي."
            : "The paths below are now loaded from the backend with your real progress."}
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 ${isArabic ? "right-4" : "left-4"}`}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={
              isArabic ? "ابحث عن مسار أو وصف..." : "Search for a path or description..."
            }
            className={`w-full rounded-xl border-2 border-slate-200 py-3 transition-colors focus:border-purple-600 focus:outline-none ${isArabic ? "pl-4 pr-12 text-right" : "pr-4 pl-12"}`}
          />
        </div>
        <Button
          variant="outline"
          icon={Filter}
          iconPosition="right"
          onClick={() => setShowLocked((current) => !current)}
        >
          {showLocked
            ? isArabic
              ? "إخفاء المقفلة"
              : "Hide locked"
            : isArabic
              ? "إظهار المقفلة"
              : "Show locked"}
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-red-700">{error}</p>
            <Button
              variant="outline"
              icon={RefreshCcw}
              onClick={() => window.location.reload()}
            >
              {isArabic ? "إعادة المحاولة" : "Retry"}
            </Button>
          </div>
        </Card>
      )}

      {loadingSections ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {groupedSections
            .filter((group) => group.sections.length > 0)
            .map((group) => (
              <section key={group.level}>
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3>{getDifficultyLabel(group.level, language)}</h3>
                    <p className="mt-1 max-w-3xl text-slate-600">
                      {getLevelSummary(group.level, language)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      group.level === "beginner"
                        ? "success"
                        : group.level === "intermediate"
                          ? "warning"
                          : "error"
                    }
                    size="sm"
                  >
                    {group.sections.length} {isArabic ? "مسارات" : "paths"}
                  </Badge>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {group.sections.map((section) => (
                    <Card
                      key={section.code}
                      hover={!section.locked}
                      onClick={
                        section.locked ? undefined : () => setSelectedSectionCode(section.code)
                      }
                      className={`relative ${section.locked ? "opacity-75" : ""}`}
                    >
                      {section.locked && (
                        <div className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                          <Lock className="h-5 w-5 text-slate-500" />
                        </div>
                      )}

                      <div className="mb-4 text-5xl">{section.icon}</div>

                      <h4 className="mb-2">{isArabic ? section.titleAr : section.titleEn}</h4>
                      <p className="mb-4 text-sm text-slate-600">
                        {isArabic ? section.descriptionAr : section.descriptionEn}
                      </p>

                      <div className="mb-4 flex flex-wrap gap-2">
                        <Badge variant="neutral" size="sm">
                          {section.unitsCount} {isArabic ? "وحدات" : "units"}
                        </Badge>
                        <Badge variant="neutral" size="sm">
                          {section.lessonsCount} {isArabic ? "دروس" : "lessons"}
                        </Badge>
                        {section.estimatedMinutes ? (
                          <Badge variant="neutral" size="sm">
                            {formatDuration(section.estimatedMinutes, language)}
                          </Badge>
                        ) : null}
                        <Badge
                          variant={getSectionStatusVariant(section.completionState)}
                          size="sm"
                        >
                          {isArabic
                            ? section.completionLabelAr
                            : section.completionLabelEn}
                        </Badge>
                      </div>

                      {!section.locked && (
                        <>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-slate-600">
                              {isArabic ? "التقدم" : "Progress"}
                            </span>
                            <span className="font-semibold text-purple-600">
                              {section.progress}%
                            </span>
                          </div>
                          <ProgressBar value={section.progress} color="primary" size="sm" />

                          <div className="mt-4 flex items-center justify-between text-sm font-medium text-purple-600">
                            <span>{isArabic ? "فتح المسار" : "Open path"}</span>
                            <ArrowLeft className="h-4 w-4" />
                          </div>

                          {section.completionState !== "completed" && (
                            <div className="mt-3 text-sm text-slate-500">
                              {isArabic
                                ? section.readyForFinalExam
                                  ? "أنهيت الدروس والمتطلبات. أكمل الاختبار النهائي لإصدار الشهادة."
                                  : "قد يُظهر التقدم 100% للدروس، لكن اكتمال المسار يحتاج الشهادة النهائية."
                                : section.readyForFinalExam
                                  ? "You finished the lessons and requirements. Pass the final exam to issue the certificate."
                                  : "Lesson progress can reach 100%, but the path is only complete after its final certificate."}
                            </div>
                          )}
                        </>
                      )}

                      {section.locked && (
                        <div className="mt-4 text-sm text-slate-500">
                          {isArabic
                            ? "أكمل المسارات السابقة لفتح هذا المسار."
                            : "Complete the earlier paths to unlock this one."}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}

      {!loadingSections && visibleSections.length === 0 && (
        <Card className="p-8 text-center text-slate-600">
          {isArabic
            ? "لا توجد نتائج مطابقة لبحثك الحالي."
            : "No paths match your current search."}
        </Card>
      )}
    </div>
  );
}
