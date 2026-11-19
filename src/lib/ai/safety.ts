// Local, zero-call checks that run before anything is sent to the platform.

export type Lang = "en" | "fr" | "ar" | "darija";

const DARIJA_LATIN = /\b(chnowa|chnoua|chnia|kifech|kifach|3lech|3lach|wa9tech|nheb|n7eb|bech|barcha|mta3|fama|famma|ya5i|yaatik|sa7a|behi|chbik|nfahmch|mafhemtch|ma fhemtch|9addech|qaddech|winou|wa9t|ena|enti|inti|houwa|yesser|chwaya|chouia|chouya)\b|[a-z][3795][a-z]/i;
const DARIJA_ARABIC = /(شنوة|شنية|كيفاش|علاش|نحب|برشا|متاع|فما|باهي|ياخي|قداش|وقتاش|مافهمتش|شوية|يسر)/;
const FRENCH = /\b(le|la|les|un|une|des|est|pourquoi|comment|quoi|combien|je|tu|nous|vous|c'est|qu'est|avec|dans|pour|mais|bonjour|merci|explique|aide)\b|[éèêàùçœ]/i;

export function detectLanguage(text: string, fallback: Lang = "en"): Lang {
  const t = text.trim();
  if (!t) return fallback;
  if (/[؀-ۿ]/.test(t)) return DARIJA_ARABIC.test(t) ? "darija" : "ar";
  if (DARIJA_LATIN.test(t)) return "darija";
  if (FRENCH.test(t)) return "fr";
  if (/[a-z]/i.test(t)) return "en";
  return fallback;
}

export const LANG_NAME: Record<Lang, string> = {
  en: "simple English",
  fr: "simple French",
  ar: "simple Modern Standard Arabic",
  darija: "Tunisian Darija (answer in the same script the child used: Arabic letters or Latin letters with numbers like 3, 7, 9)",
};

/** Masks personal data so only anonymised text reaches the AI service (Spec E: Ethics and Privacy). */
export function maskPersonalData(text: string): { text: string; masked: string[] } {
  const masked: string[] = [];
  let t = text;
  const rules: [RegExp, string, string][] = [
    [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]", "email"],
    [/(?:\+?\d[\s-]?){8,}/g, "[number]", "phone or ID number"],
    [/https?:\/\/\S+/gi, "[link]", "link"],
    [/\b(my name is|i am called|je m'appelle|je suis|esmi|ismi)\s+[\p{L}-]{2,}/giu, "$1 [name]", "name"],
    [/(اسمي|إسمي)\s+\S+/g, "$1 [name]", "name"],
    [/\b(i live (?:at|in|on)|j'habite (?:à|au|en)?|nskon fi)\s+[^.,!?]{2,40}/gi, "$1 [place]", "address"],
  ];
  for (const [re, rep, label] of rules) {
    if (re.test(t)) {
      masked.push(label);
      t = t.replace(re, rep);
    }
    re.lastIndex = 0;
  }
  return { text: t, masked };
}

const UNSAFE =
  /\b(kill|suicide|hurt myself|self[- ]?harm|weapon|gun|bomb|drugs?|porn|sex|nude|naked|poison|knife|steal|hurt (someone|somebody|people|him|her|them)|tuer|arme|drogue|couteau|cambrioler|empoisonner)\b|\b(break|sneak|get) in(to)?\b[^.?!]{0,30}\b(house|home|flat|car|school)\b|انتحار|سلاح|مخدرات|سكين|سرقة|يسرق|نسرق|قتل|نقتل/i;
const SAD = /\b(sad|alone|bullied|scared|afraid|triste|peur|harcel|n7es rou7i|m9ale9)\b|حزين|خايف|وحدي/i;

export type LocalFlag = "unsafe" | "upset" | null;

export function localSafetyFlag(text: string): LocalFlag {
  if (UNSAFE.test(text)) return "unsafe";
  if (SAD.test(text)) return "upset";
  return null;
}

/** Kind, fixed replies that never need a model call. */
export const LOCAL_REPLIES: Record<"unsafe" | "upset" | "greeting" | "offtopic" | "empty", Record<Lang, string>> = {
  unsafe: {
    en: "That's a question for a grown-up you trust, like a parent or teacher. I'm here for learning: want to explore science, maths or reading together? 🌱",
    fr: "Cette question est pour un adulte de confiance, comme un parent ou un enseignant. Moi, je suis là pour apprendre : on explore les sciences, les maths ou la lecture ? 🌱",
    ar: "هذا سؤال لشخص كبير تثق به، مثل أحد والديك أو معلمك. أنا هنا للتعلّم: هل نستكشف العلوم أو الرياضيات أو القراءة معًا؟ 🌱",
    darija: "السؤال هذا لازمو كبير تثق فيه، كيف بابا ولا ماما ولا المعلم. أنا هنا باش نتعلمو: نحكيو على العلوم ولا الحساب؟ 🌱",
  },
  upset: {
    en: "Thank you for telling me. Feelings matter. Please talk to a grown-up you trust today, like a parent or teacher. They can really help. I'm here for learning whenever you're ready. 💛",
    fr: "Merci de me l'avoir dit. Tes émotions comptent. Parle aujourd'hui à un adulte de confiance, comme un parent ou un enseignant : il peut vraiment t'aider. Je suis là pour apprendre quand tu veux. 💛",
    ar: "شكرًا لأنك أخبرتني. مشاعرك مهمة. تحدّث اليوم مع شخص كبير تثق به، مثل أحد والديك أو معلمك، فهو يستطيع مساعدتك. أنا هنا للتعلّم متى كنت مستعدًا. 💛",
    darija: "يعيشك على خاطر قلتلي. إحساسك مهم. احكي اليوم مع كبير تثق فيه، بابا ولا ماما ولا المعلم، ينجمو يعاونوك. وأنا هنا باش نتعلمو وقت ما تحب. 💛",
  },
  greeting: {
    en: "Hi! I'm your EdNova buddy. Ask me anything about maths, science, words or space. What are you curious about today? ✨",
    fr: "Salut ! Je suis ton copain EdNova. Pose-moi une question sur les maths, les sciences, les mots ou l'espace. Qu'est-ce qui te rend curieux aujourd'hui ? ✨",
    ar: "مرحبًا! أنا رفيقك في EdNova. اسألني عن الرياضيات أو العلوم أو الكلمات أو الفضاء. ما الذي يثير فضولك اليوم؟ ✨",
    darija: "عسلامة! أنا صاحبك في EdNova. اسألني على الحساب ولا العلوم ولا الكلمات ولا الفضاء. شنوة تحب تعرف اليوم؟ ✨",
  },
  offtopic: {
    en: "Fun question! I'm best at school topics. Want to turn it into a science or maths question? 🔭",
    fr: "Question amusante ! Je suis plus fort pour l'école. On en fait une question de sciences ou de maths ? 🔭",
    ar: "سؤال طريف! أنا أفضل في مواضيع المدرسة. هل نحوّله إلى سؤال في العلوم أو الرياضيات؟ 🔭",
    darija: "سؤال يضحك! أنا نعرف خير في حاجات القراية. نردوه سؤال في العلوم ولا الحساب؟ 🔭",
  },
  empty: {
    en: "Type a question and I'll help you think it through. 🙂",
    fr: "Écris une question et je t'aide à réfléchir. 🙂",
    ar: "اكتب سؤالًا وسأساعدك على التفكير فيه. 🙂",
    darija: "اكتب سؤال ونعاونك تفكر فيه. 🙂",
  },
};

const GREETING = /^(hi|hello|hey|salut|bonjour|coucou|salam|aslema|3aslema|ahla|مرحبا|السلام عليكم|عسلامة|أهلا)[\s!.]*$/i;
export function isGreeting(text: string) {
  return GREETING.test(text.trim());
}
