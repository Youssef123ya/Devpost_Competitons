import { useState } from "react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import {
  User,
  Globe,
  Shield,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Info,
  LogOut,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

export interface SettingsPageProps {
  onNavigate: (page: string, context?: Record<string, unknown>) => void;
  language?: "ar" | "en";
  onLanguageSwitch: (lang: "ar" | "en") => void;
  onLogout?: () => void;
}

export function SettingsPage({
  onNavigate,
  language = "ar",
  onLanguageSwitch,
  onLogout,
}: SettingsPageProps) {
  const isArabic = language === "ar";
  const ChevronIcon = isArabic ? ChevronLeft : ChevronRight;
  const [showAbout, setShowAbout] = useState(false);

  const openHelp = () => {
    window.open(
      "mailto:support@uxfriends.app?subject=" +
        encodeURIComponent(
          isArabic ? "طلب مساعدة من UXFriends" : "UXFriends support request",
        ),
      "_self",
    );
  };

  const handleLanguageClick = (nextLanguage: "ar" | "en") => {
    onLanguageSwitch(nextLanguage);
    toast.success(
      nextLanguage === "ar"
        ? "تم تغيير اللغة إلى العربية"
        : "Language changed to English",
    );
  };

  const settingsSections = [
    {
      title: isArabic ? "الحساب" : "Account",
      items: [
        {
          id: "edit-profile",
          icon: User,
          label: isArabic ? "تعديل الملف الشخصي" : "Edit Profile",
          description: isArabic
            ? "تحديث اسمك وصورتك الشخصية"
            : "Update your name and profile picture",
          action: () => onNavigate(isArabic ? "edit-profile" : "edit-profile-en"),
        },
        {
          id: "email-verification",
          icon: Mail,
          label: isArabic ? "التحقق من البريد الإلكتروني" : "Email Verification",
          description: isArabic
            ? "أرسل رابط التحقق وراجع المهلة المتبقية"
            : "Send a verification link and review the remaining time",
          action: () =>
            onNavigate(
              isArabic ? "email-verification" : "email-verification-en",
            ),
        },
      ],
    },
    {
      title: isArabic ? "التفضيلات" : "Preferences",
      items: [
        {
          id: "privacy",
          icon: Shield,
          label: isArabic ? "خصوصية البورتفوليو" : "Portfolio Privacy",
          description: isArabic
            ? "التحكم في ظهور ملفك العام"
            : "Control the visibility of your public profile",
          action: () => onNavigate(isArabic ? "privacy-settings" : "privacy-settings-en"),
        },
      ],
    },
    {
      title: isArabic ? "الدعم والمساعدة" : "Support & Help",
      items: [
        {
          id: "help",
          icon: HelpCircle,
          label: isArabic ? "مركز المساعدة" : "Help Center",
          description: isArabic
            ? "تواصل معنا عبر البريد الإلكتروني"
            : "Reach out to support by email",
          action: openHelp,
        },
        {
          id: "about",
          icon: Info,
          label: isArabic ? "عن UXFriends" : "About UXFriends",
          description: isArabic ? "معلومات المنصة والإصدار الحالي" : "Platform info and current version",
          action: () => setShowAbout((current) => !current),
        },
      ],
    },
  ];

  return (
    <div className="container-custom py-8">
      <div className="mb-8">
        <h2 className="mb-2">{isArabic ? "الإعدادات" : "Settings"}</h2>
        <p className="text-lg text-slate-600">
          {isArabic
            ? "إدارة حسابك وتفضيلاتك"
            : "Manage your account and preferences"}
        </p>
      </div>

      <div className="max-w-3xl space-y-8">
        <div>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            {isArabic ? "اللغة" : "Language"}
          </h3>
          <Card>
            <div
              className={`flex flex-col gap-4 md:flex-row md:items-center md:justify-between ${isArabic ? "text-right" : "text-left"}`}
            >
              <div className={`flex items-center gap-3 ${isArabic ? "flex-row-reverse" : ""}`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <Globe className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                    {isArabic ? "اللغة المفضلة" : "Preferred language"}
                  </div>
                  <div className="text-sm text-slate-500">
                    {isArabic
                      ? "يمكنك التبديل بين العربية والإنجليزية"
                      : "Switch between Arabic and English across the app"}
                  </div>
                </div>
              </div>

              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  onClick={() => handleLanguageClick("ar")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    language === "ar"
                      ? "bg-white text-purple-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  العربية
                </button>
                <button
                  onClick={() => handleLanguageClick("en")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    language === "en"
                      ? "bg-white text-purple-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </Card>
        </div>

        {settingsSections.map((section) => (
          <div key={section.title}>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              {section.title}
            </h3>
            <Card>
              <div className="divide-y divide-slate-200">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className={`flex w-full items-center gap-4 p-4 transition-colors hover:bg-slate-50 ${isArabic ? "text-right" : "text-left"}`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                        <Icon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className={`flex-1 ${isArabic ? "text-right" : "text-left"}`}>
                        <div className="font-semibold text-slate-900">
                          {item.label}
                        </div>
                        <div className="text-sm text-slate-500">
                          {item.description}
                        </div>
                      </div>
                      <ChevronIcon className="h-5 w-5 text-slate-400" />
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        ))}

        {showAbout && (
          <Card>
            <div className={`flex items-start gap-4 ${isArabic ? "flex-row-reverse text-right" : ""}`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-teal-500">
                <span className="text-lg font-bold text-white">UX</span>
              </div>
              <div className="flex-1">
                <h4 className="mb-2 text-slate-900">
                  {isArabic ? "عن UXFriends" : "About UXFriends"}
                </h4>
                <p className="mb-3 text-sm leading-6 text-slate-600">
                  {isArabic
                    ? "منصة تعلم UX/UI مبنية لتقدم محتوى تدريجي، تحديات عملية، وشهادات مع تجربة عربية وإنجليزية."
                    : "A UX/UI learning platform built around structured lessons, hands-on challenges, and certificates in both Arabic and English."}
                </p>
                <div className={`flex flex-wrap items-center gap-3 text-sm text-slate-500 ${isArabic ? "justify-end" : ""}`}>
                  <span>{isArabic ? "الإصدار" : "Version"} 1.0.0</span>
                  <span>support@uxfriends.app</span>
                </div>
                <div className={`mt-4 flex gap-3 ${isArabic ? "flex-row-reverse" : ""}`}>
                  <Button variant="outline" size="sm" icon={Mail} onClick={openHelp}>
                    {isArabic ? "تواصل معنا" : "Contact Support"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowAbout(false)}>
                    {isArabic ? "إغلاق" : "Close"}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {onLogout && (
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              {isArabic ? "تسجيل الخروج" : "Sign Out"}
            </h3>
            <Card>
              <button
                onClick={onLogout}
                className={`flex w-full items-center gap-4 p-4 transition-colors hover:bg-red-50 ${isArabic ? "text-right" : "text-left"}`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <LogOut className="h-5 w-5 text-red-600" />
                </div>
                <div className={`flex-1 ${isArabic ? "text-right" : "text-left"}`}>
                  <div className="font-semibold text-red-600">
                    {isArabic ? "تسجيل الخروج" : "Sign Out"}
                  </div>
                  <div className="text-sm text-slate-500">
                    {isArabic
                      ? "الخروج من حسابك بأمان"
                      : "Securely sign out of your account"}
                  </div>
                </div>
                <ChevronIcon className="h-5 w-5 text-red-400" />
              </button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
