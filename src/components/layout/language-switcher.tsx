"use client";

import React from "react";
import { useI18n } from "@/lib/i18n/context";
import { Globe } from "lucide-react";

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useI18n();

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
      <Globe className="w-3.5 h-3.5 text-slate-500 ml-1" />
      <button
        onClick={() => setLanguage("fr")}
        className={`px-2 py-0.5 text-xs font-semibold rounded transition-colors ${
          language === "fr"
            ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
        }`}
      >
        FR
      </button>
      <button
        onClick={() => setLanguage("en")}
        className={`px-2 py-0.5 text-xs font-semibold rounded transition-colors ${
          language === "en"
            ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
        }`}
      >
        EN
      </button>
    </div>
  );
};
