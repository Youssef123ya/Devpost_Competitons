import { useEffect, useRef, useState } from "react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Avatar } from "../components/Avatar";
import { RouteSkeleton } from "../components/AppLoaders";
import {
  ArrowRight,
  ArrowLeft,
  Camera,
  MapPin,
  Save,
  Globe,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { userApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export interface EditProfilePageProps {
  onNavigate: (page: string) => void;
  language?: "ar" | "en";
  user?: {
    name: string;
    avatar?: string;
  };
}

type EditProfileFormState = {
  firstName: string;
  lastName: string;
  avatar: string;
  professionalTitle: string;
  bio: string;
  location: string;
  website: string;
};

export function EditProfilePage({
  onNavigate,
  language = "ar",
  user,
}: EditProfilePageProps) {
  const isArabic = language === "ar";
  const BackIcon = isArabic ? ArrowRight : ArrowLeft;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [formData, setFormData] = useState<EditProfileFormState>({
    firstName: "",
    lastName: "",
    avatar: user?.avatar ?? "",
    professionalTitle: "",
    bio: "",
    location: "",
    website: "",
  });

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await userApi.getProfile();

        if (cancelled) {
          return;
        }

        setFormData({
          firstName: response.data.firstName ?? "",
          lastName: response.data.lastName ?? "",
          avatar: response.data.avatar ?? "",
          professionalTitle: response.data.professionalTitle ?? "",
          bio: response.data.bio ?? "",
          location: response.data.location ?? "",
          website: response.data.website ?? "",
        });
        setEmail(response.data.email ?? "");
      } catch (requestError) {
        if (!cancelled) {
          console.error("Failed to load profile for editing", requestError);
          toast.error(
            isArabic
              ? "تعذر تحميل بيانات الملف الشخصي."
              : "Could not load profile details.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [isArabic]);

  const fullName =
    `${formData.firstName} ${formData.lastName}`.trim() || user?.name || "UXFriends";

  const handleFieldChange = (field: keyof EditProfileFormState, value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error(isArabic ? "اختر صورة صحيحة." : "Please choose a valid image.");
      return;
    }

    if (file.size > 1_500_000) {
      toast.error(
        isArabic
          ? "حجم الصورة كبير. اختر صورة أقل من 1.5 ميجابايت."
          : "Image is too large. Please choose one smaller than 1.5 MB.",
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((current) => ({
        ...current,
        avatar: typeof reader.result === "string" ? reader.result : current.avatar,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error(
        isArabic
          ? "الاسم الأول واسم العائلة مطلوبان."
          : "First and last name are required.",
      );
      return;
    }

    try {
      setSaving(true);
      await userApi.updateProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        avatar: formData.avatar || null,
        professionalTitle: formData.professionalTitle.trim() || null,
        bio: formData.bio.trim() || null,
        location: formData.location.trim() || null,
        website: formData.website.trim() || null,
      });
      await refreshUser();

      toast.success(
        isArabic ? "تم حفظ التغييرات بنجاح." : "Profile updated successfully.",
      );
      onNavigate(isArabic ? "profile" : "profile-en");
    } catch (requestError) {
      console.error("Failed to update profile", requestError);
      toast.error(
        isArabic ? "تعذر حفظ التغييرات." : "Could not save your changes.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <RouteSkeleton language={language} variant="profile" />;
  }

  return (
    <div className="container-custom py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <button
            onClick={() => onNavigate(isArabic ? "profile" : "profile-en")}
            className={`mb-4 flex items-center gap-2 text-slate-600 transition-colors hover:text-slate-900 ${isArabic ? "flex-row-reverse" : ""}`}
          >
            <BackIcon className="h-5 w-5" />
            <span>{isArabic ? "العودة" : "Back"}</span>
          </button>
          <h2 className={`mb-2 ${isArabic ? "text-right" : "text-left"}`}>
            {isArabic ? "تعديل الملف الشخصي" : "Edit Profile"}
          </h2>
          <p className={`text-lg text-slate-600 ${isArabic ? "text-right" : "text-left"}`}>
            {isArabic
              ? "حدّث صورتك وبياناتك التعريفية كما ستظهر في ملفك الشخصي."
              : "Update the profile details that appear on your profile card."}
          </p>
        </div>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="rounded-3xl bg-gradient-to-br from-purple-50 via-white to-teal-50 p-6 sm:p-8">
              <div
                className={`flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between ${
                  isArabic ? "sm:flex-row-reverse" : ""
                }`}
              >
                <div className={`min-w-0 ${isArabic ? "text-right" : "text-left"}`}>
                  <h3 className="mb-2 text-slate-900">
                    {isArabic ? "صورة الملف الشخصي" : "Profile Photo"}
                  </h3>
                  <p className="text-lg text-slate-500">
                    {isArabic
                      ? "انقر على أيقونة الكاميرا لتحديث صورتك"
                      : "Tap the camera icon to update your photo"}
                  </p>
                </div>

                <div className="relative mx-auto shrink-0 sm:mx-0">
                  <Avatar
                    name={fullName}
                    src={formData.avatar || undefined}
                    size="xl"
                    className="h-24 w-24 sm:h-28 sm:w-28"
                  />
                  <button
                    onClick={handleAvatarClick}
                    type="button"
                    className="absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg transition-colors hover:bg-purple-700"
                    aria-label={isArabic ? "تغيير الصورة" : "Change picture"}
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </Card>

          <Card>
            <div className="mb-6">
              <h3 className={`mb-2 font-semibold text-slate-900 ${isArabic ? "text-right" : "text-left"}`}>
                {isArabic ? "المعلومات الأساسية" : "Basic Information"}
              </h3>
              <p className={`text-sm text-slate-500 ${isArabic ? "text-right" : "text-left"}`}>
                {isArabic
                  ? "هذه البيانات تظهر في بطاقة ملفك الشخصي وصفحات المشاركة."
                  : "These details appear on your profile card and share pages."}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={`mb-2 block text-sm font-medium text-slate-700 ${isArabic ? "text-right" : ""}`}>
                  {isArabic ? "الاسم الأول" : "First name"}
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(event) => handleFieldChange("firstName", event.target.value)}
                  className={`w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 ${isArabic ? "text-right" : "text-left"}`}
                />
              </div>
              <div>
                <label className={`mb-2 block text-sm font-medium text-slate-700 ${isArabic ? "text-right" : ""}`}>
                  {isArabic ? "اسم العائلة" : "Last name"}
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(event) => handleFieldChange("lastName", event.target.value)}
                  className={`w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 ${isArabic ? "text-right" : "text-left"}`}
                />
              </div>
              <div>
                <label className={`mb-2 block text-sm font-medium text-slate-700 ${isArabic ? "text-right" : ""}`}>
                  {isArabic ? "المسمى الوظيفي" : "Professional title"}
                </label>
                <input
                  type="text"
                  value={formData.professionalTitle}
                  onChange={(event) => handleFieldChange("professionalTitle", event.target.value)}
                  placeholder={isArabic ? "مثال: Junior UX/UI Designer" : "Example: Junior UX/UI Designer"}
                  className={`w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 ${isArabic ? "text-right" : "text-left"}`}
                />
              </div>
              <div>
                <label className={`mb-2 block text-sm font-medium text-slate-700 ${isArabic ? "text-right" : ""}`}>
                  {isArabic ? "الموقع" : "Location"}
                </label>
                <div className="relative">
                  <MapPin className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${isArabic ? "right-4" : "left-4"}`} />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(event) => handleFieldChange("location", event.target.value)}
                    placeholder={isArabic ? "مثال: القاهرة، مصر" : "Example: Cairo, Egypt"}
                    className={`w-full rounded-xl border border-slate-200 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 ${isArabic ? "pr-11 pl-4 text-right" : "pl-11 pr-4 text-left"}`}
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className={`mb-2 block text-sm font-medium text-slate-700 ${isArabic ? "text-right" : ""}`}>
                  {isArabic ? "نبذة تعريفية" : "Bio"}
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(event) => handleFieldChange("bio", event.target.value)}
                  placeholder={
                    isArabic
                      ? "اكتب نبذة قصيرة عن خبرتك واهتماماتك وطبيعة المشاريع التي تعمل عليها."
                      : "Write a short introduction about your background, interests, and the kind of work you do."
                  }
                  rows={4}
                  className={`w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 ${isArabic ? "text-right" : "text-left"}`}
                />
              </div>
              <div>
                <label className={`mb-2 block text-sm font-medium text-slate-700 ${isArabic ? "text-right" : ""}`}>
                  {isArabic ? "البريد الإلكتروني" : "Email"}
                </label>
                <div className="relative">
                  <Mail className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${isArabic ? "right-4" : "left-4"}`} />
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className={`w-full rounded-xl border border-slate-200 bg-slate-50 py-3 text-slate-500 ${isArabic ? "pr-11 pl-4 text-right" : "pl-11 pr-4 text-left"}`}
                  />
                </div>
              </div>
              <div>
                <label className={`mb-2 block text-sm font-medium text-slate-700 ${isArabic ? "text-right" : ""}`}>
                  {isArabic ? "الموقع الإلكتروني" : "Website"}
                </label>
                <div className="relative">
                  <Globe className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${isArabic ? "right-4" : "left-4"}`} />
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(event) => handleFieldChange("website", event.target.value)}
                    placeholder={isArabic ? "مثال: https://portfolio.com" : "Example: https://portfolio.com"}
                    className={`w-full rounded-xl border border-slate-200 py-3 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 ${isArabic ? "pr-11 pl-4 text-right" : "pl-11 pr-4 text-left"}`}
                  />
                </div>
              </div>
            </div>
          </Card>

          <div className={`flex flex-col gap-3 sm:flex-row ${isArabic ? "sm:flex-row-reverse" : ""}`}>
            <Button
              onClick={handleSave}
              icon={Save}
              size="lg"
              className="flex-1"
              loading={saving}
              disabled={saving}
            >
              {isArabic ? "حفظ التغييرات" : "Save Changes"}
            </Button>
            <Button
              onClick={() => onNavigate(isArabic ? "profile" : "profile-en")}
              variant="outline"
              size="lg"
            >
              {isArabic ? "إلغاء" : "Cancel"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
