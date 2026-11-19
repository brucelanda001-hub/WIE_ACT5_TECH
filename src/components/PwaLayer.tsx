"use client";
// Phone-app layer: registers the service worker (production only), offers "add to home screen" once,
// and tells the child kindly when the phone has no internet. No tracking, no nagging: the install card is
// shown at most once every 14 days and can always be closed (UK Children's Code: no nudge techniques).
import { useEffect, useState } from "react";
import type { UiLang } from "@/lib/i18n";

type Strings = { title: string; body: string; add: string; later: string; iosBody: string; ok: string; offline: string };
const S: Record<UiLang, Strings> = {
  en: {
    title: "Put Nouri on your phone!",
    body: "Open EdNova like an app, straight from your home screen.",
    add: "Add to home screen",
    later: "Not now",
    iosBody: "Tap the Share button, then “Add to Home Screen”.",
    ok: "Got it",
    offline: "No internet. Nouri can't think right now, but you can still look around.",
  },
  fr: {
    title: "Mets Nouri sur ton téléphone !",
    body: "Ouvre EdNova comme une appli, depuis ton écran d'accueil.",
    add: "Ajouter à l'écran d'accueil",
    later: "Pas maintenant",
    iosBody: "Touche le bouton Partager, puis « Sur l'écran d'accueil ».",
    ok: "Compris",
    offline: "Pas d'internet. Nouri ne peut pas réfléchir pour l'instant, mais tu peux regarder autour de toi.",
  },
  ar: {
    title: "ضع نوري على هاتفك!",
    body: "افتح إدنوفا كتطبيق مباشرة من الشاشة الرئيسية.",
    add: "أضف إلى الشاشة الرئيسية",
    later: "ليس الآن",
    iosBody: "اضغط زر المشاركة ثم «إضافة إلى الشاشة الرئيسية».",
    ok: "فهمت",
    offline: "لا يوجد إنترنت. نوري لا يستطيع التفكير الآن، لكن يمكنك التجول.",
  },
  darija: {
    title: "حط نوري في تليفونك!",
    body: "حل إدنوفا كيما تطبيق من الشاشة الرئيسية.",
    add: "زيدو للشاشة الرئيسية",
    later: "موش توا",
    iosBody: "اضغط على زر المشاركة وبعد «إضافة إلى الشاشة الرئيسية».",
    ok: "فهمت",
    offline: "ما فماش أنترنات. نوري ما يقدرش يفكر توا، أما تنجم تتفرج.",
  },
};

/** Kind message for the chat when a question can't be sent without internet. */
export function offlineMessage(lang: UiLang) {
  return S[lang].offline;
}

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const SNOOZE_KEY = "ednova_install_snooze";
const SNOOZE_MS = 14 * 24 * 3600 * 1000;

function snoozed() {
  try {
    return Date.now() < Number(localStorage.getItem(SNOOZE_KEY) || 0);
  } catch {
    return false;
  }
}
function snooze() {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
  } catch {}
}

export function PwaLayer({ lang }: { lang: UiLang }) {
  const s = S[lang];
  const [offline, setOffline] = useState(false);
  const [installEvt, setInstallEvt] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- navigator is only readable after hydration
    setOffline(!navigator.onLine);
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);

    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      if (!standalone && !snoozed()) setInstallEvt(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    // iPhone/iPad Safari has no install event: show the two-step hint instead.
    const ua = navigator.userAgent;
    const isIos = /iphone|ipad|ipod/i.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
    if (isIos && !standalone && !snoozed()) setIos(true);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  const close = () => {
    snooze();
    setInstallEvt(null);
    setIos(false);
  };
  const install = async () => {
    if (!installEvt) return;
    await installEvt.prompt();
    await installEvt.userChoice.catch(() => null);
    close();
  };

  return (
    <>
      {offline && (
        <div role="status" className="fixed top-[72px] inset-x-3 z-50 mx-auto max-w-md rounded-2xl bg-marker-soft border-2 border-night px-4 py-3 text-sm font-bold text-night shadow-[3px_3px_0_var(--color-night)]" dir="auto">
          <span aria-hidden>📡 </span>
          {s.offline}
        </div>
      )}
      {(installEvt || ios) && (
        <div
          role="dialog"
          aria-label={s.title}
          className="fixed inset-x-3 bottom-[calc(88px+env(safe-area-inset-bottom))] md:bottom-6 z-50 mx-auto max-w-md rounded-3xl bg-white border-2 border-night p-4 shadow-[4px_4px_0_var(--color-night)] flex items-center gap-3"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" width={56} height={56} className="w-14 h-14 rounded-2xl shrink-0" />
          <div className="flex-1 min-w-0" dir="auto">
            <p className="font-extrabold text-night leading-tight">{s.title}</p>
            <p className="text-sm text-muted mt-0.5">{installEvt ? s.body : s.iosBody}</p>
            <div className="mt-2 flex gap-2">
              {installEvt && (
                <button onClick={install} className="btn-press h-12 px-4 rounded-full bg-magic font-extrabold text-sm">
                  {s.add}
                </button>
              )}
              <button onClick={close} className="h-12 px-4 rounded-full bg-grape-soft text-grape-dark font-bold text-sm">
                {installEvt ? s.later : s.ok}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
