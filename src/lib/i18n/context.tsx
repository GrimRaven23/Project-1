"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, TranslationDictionary } from "./types";
import { en } from "./en";
import { fr } from "./fr";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationDictionary;
}

const dictionaries: Record<Language, TranslationDictionary> = { en, fr };

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fr");

  useEffect(() => {
    const saved = localStorage.getItem("telco_app_lang") as Language;
    if (saved && (saved === "fr" || saved === "en")) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("telco_app_lang", lang);
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t: dictionaries[language] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
