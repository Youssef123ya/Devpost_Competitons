import {
  Home,
  BookOpen,
  Trophy,
  Award,
  Brain,
  User,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface AppSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  language: "ar" | "en";
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AppSidebar({
  currentPage,
  onNavigate,
  language,
  collapsed = false,
  onToggleCollapse,
}: AppSidebarProps) {
  const isArabic = language === "ar";
  const isRTL = isArabic;

  const navItems = [
    {
      id: "home",
      label: isArabic ? "الرئيسية" : "Home",
      icon: Home,
    },
    {
      id: "learn",
      label: isArabic ? "التعلم" : "Learning",
      icon: BookOpen,
    },
    {
      id: "challenges-hub",
      label: isArabic ? "التحديات" : "Challenges",
      icon: Trophy,
    },
    {
      id: "certificates-library",
      label: isArabic ? "الشهادات" : "Certificates",
      icon: Award,
    },
    {
      id: "ai-analysis",
      label: isArabic ? "التحليل" : "Analysis",
      icon: Brain,
    },
    {
      id: "profile",
      label: isArabic ? "الملف الشخصي" : "Profile",
      icon: User,
    },
  ];

  const bottomItems = [
    {
      id: "settings",
      label: isArabic ? "الإعدادات" : "Settings",
      icon: Settings,
    },
  ];

  return (
    <aside
      className={`
        fixed top-0 ${isRTL ? "right-0" : "left-0"} h-screen
        bg-white ${isRTL ? "border-l" : "border-r"} border-slate-200
        transition-all duration-300 z-40
        ${collapsed ? "w-20" : "w-64"}
        hidden md:flex flex-col
      `}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-teal-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">UX</span>
            </div>
            <span className="font-bold text-slate-900">UXFriends</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-teal-500 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">UX</span>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentPage === item.id ||
              currentPage.startsWith(item.id) ||
              (item.id === "learn" && currentPage.includes("unit")) ||
              (item.id === "learn" && currentPage.includes("lesson")) ||
              (item.id === "learn" && currentPage.includes("quiz"));

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all group relative
                  ${
                    isActive
                      ? "bg-purple-100 text-purple-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-100"
                  }
                  ${collapsed ? "justify-center" : ""}
                `}
                title={collapsed ? item.label : ""}
              >
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                {!collapsed && <span>{item.label}</span>}

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div
                    className={`
                    absolute ${isRTL ? "right-full mr-2" : "left-full ml-2"}
                    px-3 py-2 bg-slate-900 text-white text-sm rounded-lg
                    opacity-0 group-hover:opacity-100 pointer-events-none
                    transition-opacity whitespace-nowrap z-50
                  `}
                  >
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="px-3 py-4 border-t border-slate-200">
        {/* AI Assistant Button */}
        {!collapsed && (
          <button
            onClick={() => onNavigate("ai-coach-hub")}
            className="w-full mb-3 px-4 py-3 bg-gradient-to-r from-purple-600 to-teal-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">
              {isArabic ? "مساعدك الذكي" : "AI Coach"}
            </span>
          </button>
        )}

        {collapsed && (
          <button
            onClick={() => onNavigate("ai-coach-hub")}
            className="w-full mb-3 px-4 py-3 bg-gradient-to-r from-purple-600 to-teal-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center relative group"
            title={isArabic ? "مساعدك الذكي" : "AI Coach"}
          >
            <Sparkles className="w-4 h-4" />

            {/* Tooltip for collapsed state */}
            <div
              className={`
              absolute ${isRTL ? "right-full mr-2" : "left-full ml-2"}
              px-3 py-2 bg-slate-900 text-white text-sm rounded-lg
              opacity-0 group-hover:opacity-100 pointer-events-none
              transition-opacity whitespace-nowrap z-50
            `}
            >
              {isArabic ? "مساعدك الذكي" : "AI Coach"}
            </div>
          </button>
        )}

        {/* Settings */}
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentPage === item.id || currentPage === "edit-profile";

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                transition-all group relative
                ${
                  isActive
                    ? "bg-purple-100 text-purple-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-100"
                }
                ${collapsed ? "justify-center" : ""}
              `}
              title={collapsed ? item.label : ""}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              {!collapsed && <span>{item.label}</span>}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div
                  className={`
                  absolute ${isRTL ? "right-full mr-2" : "left-full ml-2"}
                  px-3 py-2 bg-slate-900 text-white text-sm rounded-lg
                  opacity-0 group-hover:opacity-100 pointer-events-none
                  transition-opacity whitespace-nowrap z-50
                `}
                >
                  {item.label}
                </div>
              )}
            </button>
          );
        })}

        {/* Collapse Toggle */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={`
              w-full mt-2 px-4 py-2 text-slate-600 hover:bg-slate-100 
              rounded-lg transition-all flex items-center gap-2
              ${collapsed ? "justify-center" : ""}
            `}
          >
            {isRTL ? (
              collapsed ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )
            ) : collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
            {!collapsed && (
              <span className="text-sm">
                {isArabic ? "إخفاء القائمة" : "Collapse"}
              </span>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}
