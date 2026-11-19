# EdNova: a GenAI learning companion for children

IEEE WIE ACT 5.0, EdNova Technical Challenge. A safe learning buddy for children aged 8–11 (grades 3–6), with parents in control.

## Run it

```bash
npm install
cp .env.example .env.local     # then fill SESSION_SECRET and the LLM_* values
npx prisma db push             # creates/updates the SQLite tables
npm run dev                    # http://localhost:3000
```

No platform key yet? Set `MOCK_MODE=true`. The same pipeline runs offline with simulated latency, quota and errors.

First use:
1. Open `/parent/login` → **Create account** → **Add a learner** (nickname and emoji only).
2. On the child's device, open `/login` → type the **family code** → tap their emoji.
3. A **6-digit code** appears in the parent space ("Sign-in requests"). The parent reads it; the child types it.

## Security: parent-approved sign-in (2FA)

| Factor | What |
|---|---|
| 1. Something the family knows | The family code (`NOVA-XXXX`). It only unlocks the list of nicknames. |
| 2. Something the parent has | A 6-digit code sent to the parent's signed-in space (and by email if SMTP is set). |

- Codes come from `crypto.randomInt`, expire after **5 min**, and are **single use**. The **5th wrong try locks** the code.
- A code is stored as an HMAC bound to its challenge id, plus AES-GCM ciphertext so it can be shown in the parent space. Codes never appear in logs.
- Parent passwords use **scrypt**. Accounts pause for 15 min after 5 wrong passwords, and login errors don't reveal whether an email exists.
- Sessions are HMAC-signed, httpOnly, SameSite=Lax cookies (Secure in production). Child session: 8 h. Approved device: 30 days.
- The parent can **deny** a request or **sign out** a device. Sign-out applies on the device's next request.
- Rate limits: code requests (3 per child per 15 min), code checks, family-code guesses, logins, and chat (12 per child per minute).
- `src/proxy.ts` guards every child page and API, and every parent page and API. It also sets security headers.
- A **security log** in the parent space records each event.

## AI orchestration: which model does what

| Step | Model | Why |
|---|---|---|
| Language detection, personal-data masking, safety and confusion keywords | local | Free and instant |
| Exact arithmetic (`7x8`, `3/4 + 1/4`) given to the model as a verified fact | local | Code is always right; a small model answered "7×8 = 54" in testing |
| Repeated question (same mode, level, language) | cache | Never regenerated |
| Curriculum search (RAG) | local (+ embeddings when available) | Narrows context before generation |
| Triage: intent and safety double-check, **in parallel** with the answer | **compact** | Short JSON; parallel, so no extra wait (the key allows 2 concurrent calls) |
| Confirm an "unsafe" triage verdict before blocking (escalation) | **mid-size** | Compact triage flagged harmless questions in testing; one short mid call decides |
| Explanation, example, hint, quiz, check, summary (EN/FR) | **mid-size** | Final child-facing writing |
| Arabic / Darija with a matching team note | local (team-written note) | No platform model writes reliable Arabic/Darija |
| Quiz format check, repaired from the team's quiz if broken | local | Validate output before a child sees it |
| Same tasks on 503, timeout, or low quota | **compact** | Fallback, and the child is told |

#### Why this split: model comparison on the platform (17 Nov 2026, `scripts/model-bakeoff.mjs`)

Same child tasks sent to every model (28 calls). Findings:
- `llama3.1-8b` (mid) was the fastest usable writer: about 3–5 s, acceptable English and French.
- The compact models (`qwen3.5-0.8b`, `qwen3-0.6b`) took 5–15 s and gave wrong or garbled child-facing text, so they only classify and act as fallback.
- Compact triage returns valid JSON but is unreliable both ways (missed a break-in question, flagged "why do leaves turn yellow?" as unsafe). So the **local filter is the primary safety layer**, a compact "unsafe" verdict is **confirmed by the mid-size model** before blocking, and "off-topic" verdicts never block.
- No model wrote reliable Arabic or Darija, hence the team-written notes in those languages.

Code: `src/lib/ai/` (`config.ts` has the routing table, and `orchestrator.ts` is the pipeline).

### Platform facts (measured with `scripts/check-platform.bat`, 17 Nov 2026)

| | Value |
|---|---|
| Compact model | `qwen3.5-0.8b` (< 3B) |
| Mid-size model | `llama3.1-8b` (≤ 16B) |
| Request budget | 20 requests per minute per key, continuous refill |
| Parallel requests | 2 per key in total → we cap compact 1 + mid 1 |
| Embeddings model / vector collection endpoint | not exposed on `/v1` yet → RAG runs on local keyword retrieval |

Run `scripts\check-platform.bat` (Windows) or `node scripts/check-platform.mjs` to re-check. It reads `.env.local`, never prints the key, and writes `scripts/check-platform.out.json` (git-ignored).

### Handling limited capacity (API Guide §6)

| Platform says | EdNova does | Child sees |
|---|---|---|
| 429 quota exhausted | Waits the stated `Retry-After`, retries (×2), then asks the child to wait | "Waiting for my turn · 3 s", then a countdown and an **Ask again** button |
| 503 mid-size saturated | One short retry if the delay is under 2 s, else falls back to compact | "Deep brain busy: switching to quick brain" |
| 400 beyond a ceiling | Halves `max_tokens`, drops extra context, retries once | "Fixing my request" |
| 200 + quota headers | Reads `x-ratelimit-api_key-remaining-requests` and the per-minute limit. **Paces before sending** so we stay inside the budget instead of collecting 429s. When low, skips triage and uses compact | "Waiting for my turn · 3 s" / "Saving energy" |
| Timeout or network error | Mid falls back to compact. Compact retries once. Otherwise shows an error with **Ask again** | Never a frozen screen |

Other safeguards:
- **Concurrency caps** per model class, with queue positions shown to the child.
- **Answer cache** with in-flight de-duplication.
- **No streaming:** each question is a job, and the UI polls its real stages.

### Metrics (proof for the jury)

The parent space includes **"How the AI was used"**, and the raw data is at `GET /api/metrics`. It shows:
- calls per model and the compact/mid split
- tokens in and out
- cache hits
- 429/503/400 refusals and how each was handled
- the last quota headers
- peak queue length
- the routing table

### Rehearse failures

```bash
# Offline: inject errors into mock mode
MOCK_FAULTS=mid503=1        # every mid-size call → 503 → compact fallback
MOCK_FAULTS=quota429=1      # quota wait + retry, then "come back in N s"
MOCK_FAULTS=bad400=1        # shrink-and-retry

# Against the real HTTP client: local fake platform
FAULT=503 node scripts/fake-llm-server.mjs
# .env.local: MOCK_MODE=false, LLM_BASE_URL=http://localhost:8787/v1, LLM_API_KEY=local-test,
#             LLM_MODEL_COMPACT=compact-test, LLM_MODEL_MID=mid-test
```

## Learning design

- **"See it" cards:** when a question holds a fraction, a multiplication or a division, the app draws it (pizza slices, rows of dots, dates shared into groups with the remainder apart). Drawn locally from the exact numbers: no model call, never wrong, captions in the answer's language, and pieces only animate when the child hasn't asked for reduced motion (`src/components/MathVisual.tsx`).
- **Socratic next steps** after every answer: a hint first, then an example, then a quiz, then "I'll explain it back". Nouri nudges before it tells.
- **Clickable quiz answers** (A/B), read-aloud in the answer's language, and a break reminder after 20 minutes.
- **Nouri, the study buddy:** a full-body mascot (a soft star whose belly is a page of a Tunisian exercise book) in the corner of the chat. Its eyes follow the child's pointer, it dresses for the topic (pencil for maths, goggles for science, an orbiting planet for space, a laurel crown for history, a book for language), its mouth moves during read-aloud, and its antenna-star pulses while thinking. It reacts to what is happening (thinking, "look at the picture", a cheer for a right answer, encouragement for a mistake) and opens a study kit when tapped: a study tip, read-aloud, a quiz on the last question, and a 3-breath breathing break. Local, in 4 languages, no data, no streaks (`src/components/StudyBuddy.tsx`).
- **A living purple sky** behind the child's pages: a slow violet-blue-pink aurora and twinkling stars, dots and maths signs floating up, seen through a see-through exercise-book grid. Text contrast stays high and all motion stops with reduced motion (`src/components/MagicSky.tsx`).
- **A playful start page, all local:** Nouri floats and blinks, and jumps with a fun fact when tapped; question stickers; a picture **puzzle of the day** with gentle "look again" feedback and a short confetti burst for a right answer (also after a correct quiz in the chat). No streaks, no timers, no penalties; all motion stops when the device asks for reduced motion (`src/components/Fun.tsx`).

## Child safety and privacy

- Children are known by a **nickname + emoji + grade**. No real name, photo, voice, address or birthday is collected.
- Questions are **not stored**. Emails, phone numbers, "my name is…" and addresses are **masked before** the text reaches the AI service. Only anonymised text is sent.
- Unsafe topics and signs of distress get a fixed, kind reply that points to a trusted adult. When the local filter catches them, **no model call** is made. The compact triage catches the rest.
- Read-aloud uses the browser's speech synthesis. Nothing is recorded.
- There are no ads and no streak pressure. A break reminder appears after 20 min.
- Touch targets are ≥ 48 px (56–72 px for main actions). The UI supports keyboard focus and reduced motion, and switches to **Arabic RTL** automatically.
- The interface is available in **English, French, Arabic and Tunisian Darija**. Answers come in the child's language and script.
- Designed with COPPA, GDPR and the UK Children's Code in mind. This is **not** a certification claim.

## Project structure

```
src/proxy.ts                 route guard + security headers
src/lib/security/            tokens, scrypt, OTP challenge, delivery, rate limit
src/lib/ai/                  config/routing table, client, queue, cache, RAG, safety, mock, jobs, orchestrator
src/app/login                child sign-in (family code → profile → parent's 6-digit code)
src/app/parent               parent space (requests, learners, devices, AI metrics, security log)
src/app/page.tsx             learning chat with staged progress
scripts/fake-llm-server.mjs  local OpenAI-compatible platform for fault rehearsal
```

Credentials live only in `.env.local`, which is git-ignored. Never paste them in code, logs, screenshots or the video.


## Phone app (PWA)

Most children have a phone, not a laptop, so EdNova is an installable web app (no app store, no extra cost, one code base).

- **Install:** Android Chrome shows "Add to home screen" (our kind card appears once, never more than every 14 days, always closable). iPhone: Share, then "Add to Home Screen" (the card explains it).
- **What the app layer does:** `manifest.ts` (name, icons, standalone, portrait), `public/sw.js` (service worker), `public/offline.html` (calm page with a breathing exercise when there is no internet), `PwaLayer.tsx` (install card, offline banner).
- **Privacy:** the service worker caches only public static files (build assets, icons, offline page). It never caches pages or `/api/*`, so no answers, names or sessions are stored by it. No push notifications, no tracking, no ads.
- **Mobile UX:** bottom tab bar (72 px), dynamic viewport height, safe-area insets (notches), tab bar hides while typing so the keyboard has room, no tap delay, touch targets at least 48 px, reduced motion respected, Arabic RTL.
- **Offline:** if the phone has no internet, sending a question shows a friendly message instead of failing silently; the offline page is shown for navigation.
- **Test on a phone:** service worker and install need HTTPS. Run `npm run build && npm start`, then `cloudflared tunnel --url http://localhost:3000` and open the https link on the phone. Quick layout check without install: `npm run dev -- -H 0.0.0.0` and open `http://<PC-IP>:3000` (same Wi-Fi). Production cookies are `Secure`, so sign-in over plain http needs dev mode.
- **Store apps later:** the same PWA can be wrapped for Google Play (Trusted Web Activity / Bubblewrap) or Capacitor without rewriting.
