"use client";

import { useEffect, useState } from "react";

type Lang = "es" | "en";

const copy = {
  es: {
    tagline: "Conexiones reales entre Latinoamérica, el Caribe, Estados Unidos y Europa.",
    soon: "Muy pronto",
    toggleLabel: "Cambiar idioma",
  },
  en: {
    tagline: "Real connections between Latin America, the Caribbean, the US and Europe.",
    soon: "Coming soon",
    toggleLabel: "Change language",
  },
} as const;

const STORAGE_KEY = "lves-lang";

export default function Home() {
  const [lang, setLang] = useState<Lang>("es");

  // Pick saved choice, otherwise the browser language (Spanish unless it starts with "en").
  useEffect(() => {
    let initial: Lang = "es";
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "es" || saved === "en") initial = saved;
      else if (navigator.language?.toLowerCase().startsWith("en")) initial = "en";
    } catch {
      /* storage unavailable */
    }
    setLang(initial);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* storage unavailable */
    }
  }, [lang]);

  const t = copy[lang];

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div
        role="group"
        aria-label={t.toggleLabel}
        className="absolute right-4 top-4 flex rounded-full bg-white p-1 text-sm font-semibold shadow-sm ring-1 ring-rose-200"
      >
        {(["es", "en"] as const).map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            aria-pressed={lang === code}
            className={`rounded-full px-3 py-1 transition-colors ${
              lang === code ? "bg-rose-700 text-white" : "text-rose-700 hover:bg-rose-100"
            }`}
          >
            {code.toUpperCase()}
          </button>
        ))}
      </div>

      <h1 className="text-4xl font-bold tracking-tight text-rose-700 sm:text-6xl">
        La Vida En Sueño
      </h1>
      <p className="mt-6 max-w-xl text-lg text-slate-600">{t.tagline}</p>
      <p className="mt-10 rounded-full bg-rose-100 px-5 py-2 text-sm font-medium text-rose-700">
        {t.soon}
      </p>
    </main>
  );
}
