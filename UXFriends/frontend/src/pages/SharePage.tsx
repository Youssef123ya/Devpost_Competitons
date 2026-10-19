import { useEffect, useMemo, useState } from "react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { portfolioApi } from "../services/api";
import {
  Link2,
  Linkedin,
  Mail,
  MessageCircle,
  Twitter,
  Facebook,
  Copy,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

export interface SharePageProps {
  onNavigate: (page: string) => void;
  language?: "ar" | "en";
  context?: {
    type?: "profile" | "portfolio" | "project";
    title?: string;
    shareUrl?: string;
    backPage?: string;
  };
}

export function SharePage({
  onNavigate,
  language = "ar",
  context,
}: SharePageProps) {
  const isArabic = language === "ar";
  const BackIcon = isArabic ? ArrowRight : ArrowLeft;
  const [resolvedUrl, setResolvedUrl] = useState(context?.shareUrl ?? "");
  const [loading, setLoading] = useState(!context?.shareUrl);

  useEffect(() => {
    if (context?.shareUrl) {
      setResolvedUrl(context.shareUrl);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadShareUrl = async () => {
      try {
        setLoading(true);
        const response = await portfolioApi.getPortfolio();
        if (!cancelled) {
          setResolvedUrl(response.data.privacy.publicUrl);
        }
      } catch (requestError) {
        if (!cancelled) {
          console.error("Failed to resolve share URL", requestError);
          setResolvedUrl(window.location.origin);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadShareUrl();

    return () => {
      cancelled = true;
    };
  }, [context?.shareUrl]);

  const shareTitle = useMemo(
    () =>
      context?.title ||
      (isArabic ? "ملفي العام على UXFriends" : "My public UXFriends portfolio"),
    [context?.title, isArabic],
  );

  const backPage = context?.backPage || (isArabic ? "profile" : "profile-en");
  const shareUrl = resolvedUrl || window.location.origin;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success(isArabic ? "تم نسخ الرابط" : "Link copied to clipboard");
  };

  const shareOptions = [
    {
      id: "copy",
      icon: Copy,
      labelAr: "نسخ الرابط",
      labelEn: "Copy Link",
      descriptionAr: "انسخ الرابط لمشاركته في أي مكان",
      descriptionEn: "Copy the link to share anywhere",
      color: "bg-purple-100 text-purple-600",
      action: handleCopyLink,
    },
    {
      id: "linkedin",
      icon: Linkedin,
      labelAr: "مشاركة على LinkedIn",
      labelEn: "Share on LinkedIn",
      descriptionAr: "شارك ملفك مع شبكتك المهنية",
      descriptionEn: "Share your page with your professional network",
      color: "bg-blue-100 text-blue-600",
      action: () => {
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
          "_blank",
          "noopener,noreferrer",
        );
      },
    },
    {
      id: "twitter",
      icon: Twitter,
      labelAr: "مشاركة على X",
      labelEn: "Share on X",
      descriptionAr: "شارك الرابط مع متابعيك",
      descriptionEn: "Share the link with your followers",
      color: "bg-sky-100 text-sky-600",
      action: () => {
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
          "_blank",
          "noopener,noreferrer",
        );
      },
    },
    {
      id: "facebook",
      icon: Facebook,
      labelAr: "مشاركة على Facebook",
      labelEn: "Share on Facebook",
      descriptionAr: "شارك مع أصدقائك على Facebook",
      descriptionEn: "Share with your Facebook friends",
      color: "bg-indigo-100 text-indigo-600",
      action: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          "_blank",
          "noopener,noreferrer",
        );
      },
    },
    {
      id: "whatsapp",
      icon: MessageCircle,
      labelAr: "مشاركة عبر WhatsApp",
      labelEn: "Share via WhatsApp",
      descriptionAr: "أرسل الرابط عبر WhatsApp",
      descriptionEn: "Send the link via WhatsApp",
      color: "bg-green-100 text-green-600",
      action: () => {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${shareTitle} ${shareUrl}`)}`,
          "_blank",
          "noopener,noreferrer",
        );
      },
    },
    {
      id: "email",
      icon: Mail,
      labelAr: "مشاركة عبر البريد",
      labelEn: "Share via Email",
      descriptionAr: "أرسل الرابط عبر البريد الإلكتروني",
      descriptionEn: "Send the link by email",
      color: "bg-slate-100 text-slate-600",
      action: () => {
        window.location.href = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareUrl)}`;
      },
    },
  ];

  return (
    <div className="container-custom py-8">
      <div className="mb-8">
        <button
          onClick={() => onNavigate(backPage)}
          className="mb-4 flex items-center gap-2 text-slate-600 transition-colors hover:text-slate-900"
        >
          <BackIcon className="h-5 w-5" />
          <span>{isArabic ? "العودة" : "Back"}</span>
        </button>
        <h2 className="mb-2">{isArabic ? "مشاركة الرابط" : "Share Link"}</h2>
        <p className="text-lg text-slate-600">
          {isArabic
            ? "انسخ الرابط أو شاركه مباشرة مع الآخرين"
            : "Copy the link or share it directly with others"}
        </p>
      </div>

      <div className="mx-auto mb-8 max-w-3xl">
        <Card>
          <div className="mb-4 flex items-center gap-4">
            <Link2 className="h-5 w-5 text-slate-400" />
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {shareTitle}
              </div>
              <div className="text-sm text-slate-500">
                {isArabic ? "رابط المشاركة" : "Share URL"}
              </div>
            </div>
          </div>
          <div className={`flex flex-col gap-3 rounded-lg bg-slate-50 p-4 sm:flex-row ${isArabic ? "sm:flex-row-reverse" : ""}`}>
            <code className="flex-1 truncate text-sm text-slate-700">
              {loading
                ? isArabic
                  ? "جارٍ إنشاء الرابط..."
                  : "Generating link..."
                : shareUrl}
            </code>
            <Button
              onClick={() => void handleCopyLink()}
              variant="outline"
              size="sm"
              icon={Copy}
              disabled={loading}
            >
              {isArabic ? "نسخ" : "Copy"}
            </Button>
          </div>
        </Card>
      </div>

      <div className="mx-auto max-w-3xl">
        <h3 className="mb-4 font-semibold text-slate-900">
          {isArabic ? "مشاركة عبر" : "Share via"}
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {shareOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card key={option.id}>
                <button
                  onClick={() => void option.action()}
                  disabled={loading}
                  className={`w-full rounded-lg p-1 text-left transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${isArabic ? "text-right" : "text-left"}`}
                >
                  <div className={`flex items-center gap-4 ${isArabic ? "flex-row-reverse" : ""}`}>
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${option.color}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="mb-1 font-semibold text-slate-900">
                        {isArabic ? option.labelAr : option.labelEn}
                      </h4>
                      <p className="text-sm text-slate-500">
                        {isArabic ? option.descriptionAr : option.descriptionEn}
                      </p>
                    </div>
                  </div>
                </button>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
