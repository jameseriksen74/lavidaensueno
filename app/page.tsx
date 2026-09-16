"use client";

import { FormEvent, useEffect, useState } from "react";

type Lang = "es" | "en";
type Region = "latam" | "us" | "eu" | "other";
type Status = "idle" | "sending" | "joined" | "already" | "error";

const copy = {
  es: {
    tagline: "Conexiones reales entre Latinoamérica, el Caribe, Estados Unidos y Europa.",
    soon: "Muy pronto",
    toggleLabel: "Cambiar idioma",
    formTitle: "Únete a la lista de espera",
    formIntro: "Sé de los primeros en conocer a alguien especial cuando abramos.",
    firstName: "Nombre (opcional)",
    email: "Correo electrónico",
    regionLabel: "¿Dónde vives?",
    regions: {
      latam: "Latinoamérica o el Caribe",
      us: "Estados Unidos o Canadá",
      eu: "Europa",
      other: "Otro lugar",
    },
    consent: "Acepto recibir correos sobre el lanzamiento de La Vida En Sueño.",
    submit: "Unirme",
    sending: "Enviando…",
    joined: "¡Listo! Estás en la lista. Te escribiremos cuando abramos.",
    already: "Ya estás en la lista. ¡Gracias por tu interés!",
    errors: {
      email: "Por favor escribe un correo válido.",
      region: "Por favor elige dónde vives.",
      consent: "Necesitamos tu permiso para escribirte.",
      rate_limited: "Demasiados intentos. Inténtalo de nuevo en unos minutos.",
      server: "Algo salió mal. Por favor inténtalo de nuevo.",
    },
    privacy: "Nunca compartiremos tu correo.",
  },
  en: {
    tagline: "Real connections between Latin America, the Caribbean, the US and Europe.",
    soon: "Coming soon",
    toggleLabel: "Change language",
    formTitle: "Join the waitlist",
    formIntro: "Be among the first to meet someone special when we open.",
    firstName: "First name (optional)",
    email: "Email",
    regionLabel: "Where do you live?",
    regions: {
      latam: "Latin America or the Caribbean",
      us: "United States or Canada",
      eu: "Europe",
      other: "Somewhere else",
    },
    consent: "I agree to receive emails about the La Vida En Sueño launch.",
    submit: "Join",
    sending: "Sending…",
    joined: "You're on the list! We'll email you when we open.",
    already: "You're already on the list. Thanks for your interest!",
    errors: {
      email: "Please enter a valid email.",
      region: "Please choose where you live.",
      consent: "We need your permission to email you.",
      rate_limited: "Too many attempts. Please try again in a few minutes.",
      server: "Something went wrong. Please try again.",
    },
    privacy: "We'll never share your email.",
  },
} as const;

type ErrorKey = keyof (typeof copy)["es"]["errors"];

const STORAGE_KEY = "lves-lang";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Home() {
  const [lang, setLang] = useState<Lang>("es");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState<Region | "">("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>("idle");
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null);

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

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorKey(null);
    if (!EMAIL_RE.test(email.trim())) return setErrorKey("email");
    if (!region) return setErrorKey("region");
    if (!consent) return setErrorKey("consent");

    setStatus("sending");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, email, region, consent, lang, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setStatus(data.status === "already" ? "already" : "joined");
        return;
      }
      const key = (data.error as ErrorKey) in t.errors ? (data.error as ErrorKey) : "server";
      setErrorKey(key);
      setStatus("error");
    } catch {
      setErrorKey("server");
      setStatus("error");
    }
  }

  const done = status === "joined" || status === "already";
  const inputClass =
    "w-full rounded-lg border border-rose-200 bg-white px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200";

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-20 text-center">
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

      <p className="rounded-full bg-rose-100 px-4 py-1.5 text-sm font-medium text-rose-700">{t.soon}</p>
      <h1 className="mt-6 text-4xl font-bold tracking-tight text-rose-700 sm:text-6xl">La Vida En Sueño</h1>
      <p className="mt-5 max-w-xl text-lg text-slate-600">{t.tagline}</p>

      <section className="mt-10 w-full max-w-md rounded-2xl bg-white p-6 text-left shadow-sm ring-1 ring-rose-100 sm:p-8">
        {done ? (
          <p role="status" className="text-center text-lg font-medium text-rose-700">
            {status === "already" ? t.already : t.joined}
          </p>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <h2 className="text-xl font-semibold text-slate-900">{t.formTitle}</h2>
            <p className="mt-1 text-sm text-slate-600">{t.formIntro}</p>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">{t.firstName}</span>
                <input
                  type="text"
                  autoComplete="given-name"
                  maxLength={60}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">{t.email}</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </label>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-slate-700">{t.regionLabel}</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(Object.keys(t.regions) as Region[]).map((key) => (
                    <label
                      key={key}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                        region === key
                          ? "border-rose-500 bg-rose-50 text-rose-800"
                          : "border-rose-200 text-slate-700 hover:bg-rose-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="region"
                        value={key}
                        checked={region === key}
                        onChange={() => setRegion(key)}
                        className="accent-rose-700"
                      />
                      {t.regions[key]}
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Honeypot field, hidden from people */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>
                  Website
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </label>
              </div>

              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-rose-700"
                />
                <span>{t.consent}</span>
              </label>
            </div>

            {errorKey && (
              <p role="alert" className="mt-4 text-sm font-medium text-red-700">
                {t.errors[errorKey]}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="mt-5 w-full rounded-lg bg-rose-700 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-rose-800 disabled:opacity-60"
            >
              {status === "sending" ? t.sending : t.submit}
            </button>
            <p className="mt-3 text-center text-xs text-slate-500">{t.privacy}</p>
          </form>
        )}
      </section>
    </main>
  );
}
