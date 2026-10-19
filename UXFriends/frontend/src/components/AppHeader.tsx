import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Search, LogOut } from "lucide-react";
import { Avatar } from "./Avatar";

export interface AppHeaderProps {
  user?: {
    name: string;
    avatar?: string;
    xp: number;
    level: number;
  };
  language: "ar" | "en";
  currentPage: string;
  searchQuery?: string;
  onLanguageSwitch: (lang: "ar" | "en") => void;
  onNavigate: (
    page: string,
    context?: Record<string, unknown>,
    options?: { replace?: boolean },
  ) => void;
  onLogout?: () => void;
}

export function AppHeader({
  user,
  language,
  currentPage,
  searchQuery = "",
  onLanguageSwitch,
  onNavigate,
  onLogout,
}: AppHeaderProps) {
  const isArabic = language === "ar";
  const isRTL = isArabic;
  const isSearchPage = currentPage.startsWith("search");
  const [searchValue, setSearchValue] = useState(searchQuery);

  useEffect(() => {
    setSearchValue(searchQuery);
  }, [searchQuery]);

  const searchPage = isArabic ? "search" : "search-en";

  const openSearchPage = (nextQuery: string, replace = false) => {
    onNavigate(
      searchPage,
      { searchQuery: nextQuery },
      { replace: replace || isSearchPage },
    );
  };

  const handleSearchFocus = () => {
    if (!isSearchPage) {
      openSearchPage(searchValue);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);

    if (isSearchPage) {
      openSearchPage(value, true);
    }
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    openSearchPage(searchValue, isSearchPage);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center gap-2 px-3 sm:px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-2 md:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-teal-500">
            <span className="text-sm font-bold text-white">UX</span>
          </div>
          <span className="truncate text-lg font-bold text-slate-900">
            UXFriends
          </span>
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="hidden max-w-md flex-1 md:block xl:max-w-xl"
        >
          <div className="relative">
            <Search
              className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${
                isRTL ? "right-4" : "left-4"
              }`}
            />
            <input
              type="search"
              value={searchValue}
              onFocus={handleSearchFocus}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder={
                isArabic
                  ? "ابحث عن الدروس والتحديات والمشاريع..."
                  : "Search lessons, challenges, and projects..."
              }
              className={`w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm text-slate-700 transition-colors placeholder:text-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 ${
                isRTL
                  ? "pr-11 pl-4 text-right placeholder:text-right"
                  : "pl-11 pr-4 text-left placeholder:text-left"
              }`}
            />
          </div>
        </form>

        <div className="ms-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="shrink-0 rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => onLanguageSwitch("ar")}
              className={`rounded px-2.5 py-1 text-sm font-medium transition-all sm:px-3 ${
                language === "ar"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              AR
            </button>
            <button
              onClick={() => onLanguageSwitch("en")}
              className={`rounded px-2.5 py-1 text-sm font-medium transition-all sm:px-3 ${
                language === "en"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              EN
            </button>
          </div>

          <button
            onClick={() => openSearchPage(searchValue)}
            aria-label={isArabic ? "البحث" : "Search"}
            className="rounded-lg p-2 transition-colors hover:bg-slate-100 md:hidden"
          >
            <Search className="h-5 w-5 text-slate-600" />
          </button>

          {user && (
            <>
              <button
                onClick={() => onNavigate(language === "ar" ? "profile" : "profile-en")}
                aria-label={isArabic ? "الملف الشخصي" : "Profile"}
                className="rounded-lg p-1.5 transition-colors hover:bg-slate-100 lg:hidden"
              >
                <Avatar name={user.name} src={user.avatar} status="online" />
              </button>

              <div className="hidden items-center gap-2 lg:flex">
                <button
                  onClick={() => onNavigate(language === "ar" ? "profile" : "profile-en")}
                  className={`flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 transition-colors hover:bg-slate-50 ${
                    isRTL ? "text-right" : "text-left"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {user.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {isArabic ? "المستوى" : "Level"} {user.level} • {user.xp} XP
                    </div>
                  </div>
                  <Avatar name={user.name} src={user.avatar} status="online" />
                </button>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    title={isArabic ? "تسجيل الخروج" : "Sign out"}
                    aria-label={isArabic ? "تسجيل الخروج" : "Sign out"}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
