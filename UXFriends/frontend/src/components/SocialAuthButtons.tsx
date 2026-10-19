interface SocialAuthButtonsProps {
  language: "ar" | "en";
  providerAvailability: {
    google: boolean;
    github: boolean;
  };
  onSocialLogin: (provider: "google" | "github") => void;
}

export function SocialAuthButtons({
  language,
  providerAvailability,
  onSocialLogin,
}: SocialAuthButtonsProps) {
  const isArabic = language === "ar";

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={!providerAvailability.google}
          aria-disabled={!providerAvailability.google}
          title={
            providerAvailability.google
              ? undefined
              : isArabic
                ? "تسجيل الدخول باستخدام Google غير متاح حالياً"
                : "Google sign-in is not available yet"
          }
          onClick={() => onSocialLogin("google")}
          className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            providerAvailability.google
              ? "border-slate-300 hover:bg-slate-50"
              : "border-amber-200 bg-amber-50 text-slate-700 hover:bg-amber-100"
          }`}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-sm font-medium">Google</span>
        </button>

        <button
          type="button"
          disabled={!providerAvailability.github}
          aria-disabled={!providerAvailability.github}
          title={
            providerAvailability.github
              ? undefined
              : isArabic
                ? "تسجيل الدخول باستخدام GitHub غير متاح حالياً"
                : "GitHub sign-in is not available yet"
          }
          onClick={() => onSocialLogin("github")}
          className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            providerAvailability.github
              ? "border-slate-300 hover:bg-slate-50"
              : "border-amber-200 bg-amber-50 text-slate-700 hover:bg-amber-100"
          }`}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.111.793-.26.793-.577 0-.285-.01-1.04-.016-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.655 1.652.243 2.873.12 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .32.192.694.801.576C20.565 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
          <span className="text-sm font-medium">GitHub</span>
        </button>
      </div>

      {(!providerAvailability.google || !providerAvailability.github) && (
        <p className={`text-xs text-amber-700 ${isArabic ? "text-right" : "text-left"}`}>
          {isArabic
            ? "بعض الأزرار الاجتماعية ستعمل بعد اكتمال إعداد OAuth على الخادم."
            : "Some social buttons will activate after OAuth is fully configured on the server."}
        </p>
      )}
    </>
  );
}
