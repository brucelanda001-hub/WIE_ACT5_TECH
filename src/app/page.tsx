"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Mode = "explain" | "hint" | "example" | "quiz" | "check" | "summary";

const MODES = [
  { v: "explain", label: "Explain", emoji: "💡" },
  { v: "hint", label: "Hint", emoji: "🤫" },
  { v: "example", label: "Example", emoji: "🍎" },
  { v: "quiz", label: "Quiz", emoji: "🎯" },
  { v: "check", label: "Say it back", emoji: "🔁" },
  { v: "summary", label: "Summary", emoji: "📝" }
] as const;

function ChatContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q");
  const initialSubject = searchParams.get("subject") || "Science";

  const [messages, setMessages] = useState<{ role: string; text: string }[]>([
    { role: "assistant", text: `Great observation, Alex! Imagine Earth like a warm, freshly baked pie with a crunchy crust. Deep underneath that crust, it's so hot that rock melts into a glowing liquid called magma. Let's explore ${initialSubject} together!` }
  ]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("explain");
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    if (initialQuery) {
      setInput(initialQuery);
      setTimeout(() => {
        triggerSend(initialQuery);
      }, 500);
    }
  }, [initialQuery]);

  async function triggerSend(query: string) {
    if (!query.trim() || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: query }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: query, 
          mode: mode,
          isGroupMode: isGroupMode,
          companion: "EdNova Buddy",
          subject: initialSubject,
          grade: 4
        })
      });
      
      const data = await res.json();
      
      if (data.ok) {
        setMessages((m) => [...m, { 
          role: "assistant", 
          text: data.answer + (data.fallbackUsed ? " ⚡ (Fast Mode)" : "") 
        }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", text: "I am resting. Please try again." }]);
      }
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: "Something went wrong." }]);
    } finally {
      setLoading(false);
    }
  }

  function send() {
    triggerSend(input);
  }

  return (
    <main className="w-full pt-20 bg-[#f8f9ff] flex-1 max-w-[1280px] mx-auto px-6">
      
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-white/95 backdrop-blur-xl shadow-[0_4px_20px_rgba(39,50,64,0.06)]">
        <div className="h-20 max-w-[1280px] mx-auto px-6 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">E</div>
            <span className="text-xl text-blue-600 tracking-tight font-extrabold">EdNova</span>
          </div>
          <nav className="hidden lg:flex items-center bg-[#eef4ff] p-1 rounded-full gap-1">
            <Link href="/dashboard" className="px-4 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-white transition-all">Dashboard</Link>
            <Link href="/" className="px-4 py-2 rounded-full text-sm font-bold bg-blue-600 text-white shadow-[0_3px_0_#00419c]">Ask EdNova</Link>
            <Link href="/companions" className="px-4 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-white transition-all">My Companions</Link>
            <Link href="/parent" className="px-4 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-white transition-all">Parent Insights</Link>
            <Link href="/explore" className="px-4 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-white transition-all">Explore Subjects</Link>
          </nav>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1 bg-[#ffd9e3] text-[#3e001e] px-3 py-1 rounded-full shadow-[0_2px_0_rgba(142,0,76,0.18)]">
              <span className="material-symbols-outlined text-[#af2464] text-[20px]">local_fire_department</span>
              <span className="text-xs font-bold">5 Day Streak</span>
            </div>
            <div className="flex items-center gap-1 bg-[#ffe087] text-[#231a00] px-3 py-1 rounded-full shadow-[0_2px_0_rgba(87,69,0,0.18)]">
              <span className="material-symbols-outlined text-[#735c00] text-[20px]">monetization_on</span>
              <span className="text-xs font-bold">240 Coins</span>
            </div>
            <div className="flex items-center gap-2 bg-white pl-1 pr-3 py-1 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">A</div>
              <span className="text-sm font-bold text-gray-800">Alex</span>
            </div>
          </div>
        </div>
      </header>

      <header className="sticky top-24 z-30 w-full bg-[#eef4ff]/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-sm mb-6 flex flex-wrap items-center justify-between gap-3 mt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#e5eeff] flex items-center justify-center text-blue-600">
            <span className="material-symbols-outlined text-[22px]">volcano</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#fe64a2] uppercase tracking-wider">Current Exploration</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#fe64a2]"></span>
              <span className="text-xs font-bold text-gray-500">Grade 4 • {initialSubject}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800 truncate">Exploring {initialSubject} 🌋</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsThemeModalOpen(true)} className="flex items-center gap-2 bg-white px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:bg-gray-50 transition-all">
            <span className="flex -space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-300"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-pink-300"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-300"></span>
            </span>
            Message Style 🎨
          </button>
          <button onClick={() => setMessages([])} className="w-10 h-10 rounded-full bg-[#e5eeff] hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-all" title="Clear Chat">
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
          </button>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button key={m.v} onClick={() => setMode(m.v)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${mode === m.v ? "border-blue-600 bg-blue-50 font-bold text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
            {m.emoji} {m.label}
          </button>
        ))}
      </div>

      <section className="flex flex-col gap-6 pb-44 max-w-4xl mx-auto w-full">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex flex-col items-end self-end max-w-xl" : "flex flex-col gap-4"}>
            {m.role === "user" ? (
              <div className="bg-blue-100 text-blue-900 rounded-2xl rounded-tr-sm px-5 py-3 shadow-[0_4px_0_rgba(0,65,156,0.15)]">
                <p className="text-lg font-semibold">{m.text}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-[0_3px_0_#00419c]">
                    <span className="material-symbols-outlined text-[24px]">school</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-blue-600">EdNova Buddy</span>
                      <span className="bg-[#ffe087] text-[#231a00] text-xs font-bold px-2 py-0.5 rounded-full">Guide</span>
                    </div>
                  </div>
                </div>
                <div className="pl-12">
                  <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">{m.text}</p>
                </div>
              </>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3 pl-12">
            <div className="bg-white rounded-2xl px-5 py-3 shadow-sm flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-800">EdNova is brewing an exciting answer...</span>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-40 w-full pb-4 bg-gradient-to-t from-[#f8f9ff] to-transparent">
        <div className="max-w-[1280px] mx-auto px-6 flex flex-col items-center">
          <div className="w-full max-w-4xl relative">
            <div className="absolute -top-16 left-6 z-20 flex items-end">
              <div className="relative w-20 h-20 -mb-2">
                <svg className="w-full h-full drop-shadow-lg" viewBox="0 0 100 100">
                  <ellipse cx="28" cy="42" fill="#7ba8f8" rx="18" ry="22" transform="rotate(-15 28 42)"></ellipse>
                  <ellipse cx="28" cy="42" fill="#ffd9e3" rx="12" ry="15" transform="rotate(-15 28 42)"></ellipse>
                  <ellipse cx="72" cy="42" fill="#7ba8f8" rx="18" ry="22" transform="rotate(15 72 42)"></ellipse>
                  <ellipse cx="72" cy="42" fill="#ffd9e3" rx="12" ry="15" transform="rotate(15 72 42)"></ellipse>
                  <ellipse cx="50" cy="50" fill="#3478F6" rx="30" ry="28"></ellipse>
                  <circle cx="39" cy="48" fill="#ffffff" fillOpacity="0.25" r="10" stroke="#FFE087" strokeWidth="3"></circle>
                  <circle cx="61" cy="48" fill="#ffffff" fillOpacity="0.25" r="10" stroke="#FFE087" strokeWidth="3"></circle>
                  <line stroke="#FFE087" strokeLinecap="round" strokeWidth="3" x1="49" x2="51" y1="48" y2="48"></line>
                  <ellipse cx="40" cy="49" fill="#001945" rx="3.5" ry="4"></ellipse>
                  <ellipse cx="62" cy="49" fill="#001945" rx="3.5" ry="4"></ellipse>
                  <path d="M47 56 C46 64, 44 74, 54 75 C60 76, 61 70, 56 68 C52 66, 52 64, 53 56" fill="#256eec" stroke="#00419c" strokeWidth="1.5"></path>
                </svg>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_12px_32px_rgba(39,50,64,0.12)] p-3 flex flex-col gap-2">
              <textarea 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask EdNova another question..." 
                className="w-full bg-transparent px-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none resize-none max-h-32"
                rows={1}
              />
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button className="w-10 h-10 rounded-full hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined text-[20px]">attach_file</span>
                  </button>
                  
                  {/* DRAW / PHOTO UPLOAD */}
                  <label className={`flex items-center gap-1 px-3 h-10 rounded-full text-sm font-bold transition-colors cursor-pointer ${fileName ? "bg-blue-100 text-blue-700 border-2 border-blue-400" : "bg-gray-50 hover:bg-gray-100 text-gray-800 border-2 border-transparent"}`}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFileName(file.name);
                          setMessages((m) => [...m, { role: "user", text: `📸 Attached a photo: ${file.name}` }]);
                        }
                      }}
                    />
                    <span className={`material-symbols-outlined text-[18px] ${fileName ? "text-blue-600" : "text-blue-500"}`}>draw</span>
                    <span className="hidden sm:inline">{fileName ? "Photo Attached" : "Draw / Photo"}</span>
                  </label>

                  {/* HINTS MODE TOGGLE */}
                  <button 
                    onClick={() => setMode(mode === "hint" ? "explain" : "hint")} 
                    className={`flex items-center gap-1 px-3 h-10 rounded-full text-sm font-bold transition-all ${mode === "hint" ? "bg-pink-100 text-pink-700 border-2 border-pink-400" : "bg-gray-50 hover:bg-gray-100 text-gray-800 border-2 border-transparent"}`}
                  >
                    <span className={`material-symbols-outlined text-[18px] ${mode === "hint" ? "text-pink-600" : "text-pink-500"}`}>psychology</span>
                    <span className="hidden sm:inline">{mode === "hint" ? "Hints ON" : "Hints Mode"}</span>
                  </button>
                </div>
                
                <button onClick={send} disabled={loading} className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-[0_4px_0_#00419c] hover:bg-blue-700 active:translate-y-0.5 transition-all disabled:opacity-50">
                  <span className="material-symbols-outlined text-[22px]">arrow_upward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isThemeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">palette</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Choose Your Bubble Style</h2>
                  <p className="text-sm text-gray-500">Customize your personal chat bubbles!</p>
                </div>
              </div>
              <button onClick={() => setIsThemeModalOpen(false)} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 rounded-xl text-left bg-gray-50 border-2 border-blue-500">
                <span className="text-lg font-bold text-gray-800">Ocean Breeze</span>
                <p className="text-sm text-gray-500">Sky Fresh Blue</p>
              </button>
              <button className="p-4 rounded-xl text-left bg-gray-50 hover:bg-gray-100">
                <span className="text-lg font-bold text-gray-800">Cotton Candy</span>
                <p className="text-sm text-gray-500">Berry Soft Pink</p>
              </button>
            </div>
            <button onClick={() => setIsThemeModalOpen(false)} className="w-full py-3 rounded-full bg-blue-600 text-white font-bold shadow-[0_3px_0_#00419c] active:translate-y-0.5">
              Done & Return to Chat
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading EdNova...</div>}>
      <ChatContent />
    </Suspense>
  );
}