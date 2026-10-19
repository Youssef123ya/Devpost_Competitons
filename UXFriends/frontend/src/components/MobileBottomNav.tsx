import { Home, BookOpen, Trophy, Sparkles, User } from "lucide-react";

export interface MobileBottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  language: "ar" | "en";
}

export function MobileBottomNav({
  currentPage,
  onNavigate,
  language,
}: MobileBottomNavProps) {
  const isArabic = language === "ar";

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
      id: "ai-coach-hub",
      label: isArabic ? "المساعد" : "AI Coach",
      icon: Sparkles,
    },
    {
      id: "profile",
      label: isArabic ? "حسابي" : "Profile",
      icon: User,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentPage === item.id ||
            currentPage.startsWith(item.id) ||
            (item.id === "learn" && currentPage.includes("unit")) ||
            (item.id === "learn" && currentPage.includes("lesson")) ||
            (item.id === "learn" && currentPage.includes("quiz")) ||
            (item.id === "ai-coach-hub" && currentPage.startsWith("ai-coach")) ||
            (item.id === "profile" &&
              (currentPage === "edit-profile" || currentPage === "settings"));

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-col items-center justify-center flex-1 gap-1 py-2 rounded-lg transition-all ${
                isActive ? "text-purple-600" : "text-slate-500"
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
