import { useEffect, useState } from "react";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { searchApi, type SearchResult } from "../services/api";
import {
  Search,
  BookOpen,
  Briefcase,
  Trophy,
  Award,
  Clock,
  ArrowRight,
  ArrowLeft,
  LayoutGrid,
} from "lucide-react";

interface SearchPageProps {
  onNavigate: (
    page: string,
    context?: Record<string, unknown>,
    options?: { replace?: boolean },
  ) => void;
  language?: "ar" | "en";
  userId?: string;
  context?: {
    searchQuery?: string;
  };
}

const LEGACY_RECENT_SEARCHES_KEY = "uxfriends_recent_searches";

function getRecentSearchesKey(userId?: string) {
  return `uxfriends_recent_searches:${userId?.trim() || "guest"}`;
}

function readUrlSearchQuery() {
  if (typeof window === "undefined") {
    return "";
  }

  return new URLSearchParams(window.location.search).get("q")?.trim() ?? "";
}

function readRecentSearches(userId?: string) {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  try {
    const raw = window.localStorage.getItem(getRecentSearchesKey(userId));
    if (!raw) {
      return [] as string[];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [] as string[];
  }
}

function storeRecentSearch(query: string, userId?: string) {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = query.trim();
  if (!normalized) {
    return;
  }

  const recent = readRecentSearches(userId)
    .filter((item) => item.toLowerCase() !== normalized.toLowerCase())
    .slice(0, 5);

  window.localStorage.setItem(
    getRecentSearchesKey(userId),
    JSON.stringify([normalized, ...recent].slice(0, 6)),
  );
}

export function SearchPage({
  onNavigate,
  language = "ar",
  userId,
  context,
}: SearchPageProps) {
  const isArabic = language === "ar";
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;
  const searchPage = isArabic ? "search" : "search-en";
  const [searchQuery, setSearchQuery] = useState<string>(
    context?.searchQuery ?? readUrlSearchQuery(),
  );
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    readRecentSearches(userId),
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LEGACY_RECENT_SEARCHES_KEY);
    }

    setRecentSearches(readRecentSearches(userId));
  }, [userId]);

  useEffect(() => {
    const nextQuery = context?.searchQuery ?? readUrlSearchQuery();
    setSearchQuery(nextQuery);
  }, [context?.searchQuery]);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      setResults([]);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);
        const response = await searchApi.search(trimmedQuery);
        setResults(response.data);
        storeRecentSearch(trimmedQuery, userId);
        setRecentSearches(readRecentSearches(userId));
      } catch (error) {
        console.error("Search request failed", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery, userId]);

  const updateQuery = (value: string) => {
    setSearchQuery(value);
    onNavigate(searchPage, { searchQuery: value }, { replace: true });
  };

  const openResult = (result: SearchResult) => {
    switch (result.type) {
      case "section":
        onNavigate(isArabic ? "learn" : "learn-en", {
          sectionCode: result.sectionCode ?? result.code,
        });
        return;
      case "lesson":
        if (result.sectionCode && result.unitCode) {
          onNavigate(
            isArabic ? "lesson-player" : "lesson-player-en",
            {
              sectionCode: result.sectionCode,
              unitCode: result.unitCode,
              lessonCode: result.code,
            },
          );
          return;
        }
        onNavigate(isArabic ? "learn" : "learn-en", {
          focusCode: result.code,
        });
        return;
      case "challenge":
        onNavigate(
          isArabic ? "challenge-detail" : "challenge-detail-en",
          { challengeId: result.code },
        );
        return;
      case "project":
        onNavigate(
          isArabic ? "project-brief" : "project-brief-en",
          {
            sectionCode: result.sectionCode,
            unitCode: result.unitCode,
            projectCode: result.code,
          },
        );
        return;
      case "certificate":
        onNavigate(
          isArabic ? "certificate-detail" : "certificate-detail-en",
          { certificateCode: result.code },
        );
        return;
      default:
        onNavigate(isArabic ? "learn" : "learn-en");
    }
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "section":
        return LayoutGrid;
      case "lesson":
        return BookOpen;
      case "project":
        return Briefcase;
      case "challenge":
        return Trophy;
      case "certificate":
        return Award;
    }
  };

  const getIconColor = (type: SearchResult["type"]) => {
    switch (type) {
      case "section":
        return "bg-blue-100 text-blue-600";
      case "lesson":
        return "bg-purple-100 text-purple-600";
      case "project":
        return "bg-teal-100 text-teal-600";
      case "challenge":
        return "bg-orange-100 text-orange-600";
      case "certificate":
        return "bg-emerald-100 text-emerald-600";
    }
  };

  return (
    <div className="container-custom py-8">
      <div className="mb-8">
        <h2 className="mb-4">{isArabic ? "البحث" : "Search"}</h2>

        <div className="relative mb-6">
          <Search
            className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 ${
              isArabic ? "right-4" : "left-4"
            }`}
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder={
              isArabic
                ? "ابحث عن الدروس والتحديات والمشاريع..."
                : "Search lessons, challenges, and projects..."
            }
            className={`w-full rounded-xl border border-slate-200 bg-white py-4 text-lg text-slate-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 ${
              isArabic
                ? "pr-12 pl-4 text-right placeholder:text-right"
                : "pl-12 pr-4 text-left placeholder:text-left"
            }`}
          />
        </div>
      </div>

      <div className="max-w-4xl">
        {searchQuery.trim() ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-slate-600">
                {loading
                  ? isArabic
                    ? "جارٍ البحث..."
                    : "Searching..."
                  : isArabic
                    ? `${results.length} نتيجة`
                    : `${results.length} results`}
              </p>
            </div>

            <div className="space-y-4">
              {results.map((result) => {
                const Icon = getIcon(result.type);

                return (
                  <Card key={result.id}>
                    <button
                      onClick={() => openResult(result)}
                      className={`w-full rounded-lg p-1 transition-colors hover:bg-slate-50 ${isArabic ? "text-right" : "text-left"}`}
                    >
                      <div
                        className={`flex items-start gap-4 ${isArabic ? "flex-row-reverse" : ""}`}
                      >
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${getIconColor(result.type)}`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className={`mb-1 flex items-start justify-between gap-4 ${isArabic ? "flex-row-reverse" : ""}`}
                          >
                            <h3 className="font-semibold text-slate-900">
                              {isArabic ? result.titleAr : result.titleEn}
                            </h3>
                            <Badge variant="secondary" size="sm">
                              {isArabic ? result.badgeAr : result.badgeEn}
                            </Badge>
                          </div>
                          <p className="text-slate-600">
                            {isArabic
                              ? result.descriptionAr
                              : result.descriptionEn}
                          </p>
                        </div>
                        <ArrowIcon className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
                      </div>
                    </button>
                  </Card>
                );
              })}

              {!loading && results.length === 0 && (
                <Card className="text-center">
                  <p className="text-slate-600">
                    {isArabic
                      ? "لا توجد نتائج مطابقة لهذا البحث."
                      : "No results matched this search."}
                  </p>
                </Card>
              )}
            </div>
          </>
        ) : (
          <div>
            <h3 className="mb-4 font-semibold text-slate-900">
              {isArabic ? "عمليات البحث الأخيرة" : "Recent Searches"}
            </h3>
            <div className="space-y-2">
              {recentSearches.length > 0 ? (
                recentSearches.map((item) => (
                  <button
                    key={item}
                    onClick={() => updateQuery(item)}
                    className={`flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:bg-slate-50 ${isArabic ? "flex-row-reverse text-right" : "text-left"}`}
                  >
                    <Clock className="h-5 w-5 text-slate-400" />
                    <span className="flex-1 text-slate-700">{item}</span>
                    <ArrowIcon className="h-5 w-5 text-slate-400" />
                  </button>
                ))
              ) : (
                <Card className="text-center">
                  <p className="text-slate-600">
                    {isArabic
                      ? "ابدأ بكتابة كلمة للعثور على الدروس أو المشاريع أو التحديات."
                      : "Start typing to find lessons, projects, or challenges."}
                  </p>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
