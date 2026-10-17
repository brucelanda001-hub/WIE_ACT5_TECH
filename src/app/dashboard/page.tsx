"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleAsk = () => {
    if (query.trim()) {
      router.push(`/?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <main className="w-full pt-20 bg-[#f8f9ff] flex-1 max-w-[1280px] mx-auto px-6">
      
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-white/95 backdrop-blur-xl shadow-[0_4px_20px_rgba(39,50,64,0.06)]">
        <div className="h-20 max-w-[1280px] mx-auto px-6 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">E</div>
            <span className="text-xl text-blue-600 tracking-tight font-extrabold">EdNova</span>
          </div>
          <nav className="hidden lg:flex items-center bg-[#eef4ff] p-1 rounded-full gap-1">
            <Link href="/dashboard" className="px-4 py-2 rounded-full text-sm font-bold bg-blue-600 text-white shadow-[0_3px_0_#00419c]">Dashboard</Link>
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

      {/* HERO BANNER WITH ANIMATED ELEPHANT */}
      <section className="relative w-full rounded-2xl bg-[#eef4ff] p-6 lg:p-8 shadow-sm overflow-hidden mb-6 mt-4">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-blue-100 blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col-reverse lg:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white shadow-sm mb-3">
              <span className="material-symbols-outlined text-blue-600 text-[18px]">auto_awesome</span>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">EdNova Learning Space</span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Hi, Alex! 👋 Ready to learn something amazing?</h1>
            <p className="text-gray-600 mb-4">Pick up where you left off or ask EdNova any question on your mind!</p>
            <div className="relative bg-white p-4 rounded-xl shadow-md max-w-md">
              <div className="flex items-center gap-2 text-sm font-bold text-blue-600 mb-1">
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                <span>Teacher Nova says:</span>
              </div>
              <p className="text-gray-800">"I'm here to help you explore, discover, and grow!"</p>
            </div>
          </div>
          
          <div className="relative flex-shrink-0 flex items-center justify-center">
            {/* SHAKING STARS */}
            <span className="material-symbols-outlined absolute -top-4 -left-4 text-yellow-500 text-[28px] animate-pulse">star</span>
            <span className="material-symbols-outlined absolute top-2 right-0 text-yellow-500 text-[22px] animate-bounce">hotel_class</span>
            <span className="material-symbols-outlined absolute bottom-4 -left-6 text-yellow-600 text-[24px] animate-pulse">arrow_back_ios_new</span>
            
            {/* THE ELEPHANT SVG */}
            <div className="w-48 h-48 lg:w-56 lg:h-56 relative flex items-center justify-center drop-shadow-md">
              <svg className="w-full h-full" fill="none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="65" cy="85" fill="#256EEC" rx="36" ry="42"></ellipse>
                <ellipse cx="68" cy="85" fill="#FE64A2" rx="24" ry="28"></ellipse>
                <ellipse cx="110" cy="140" fill="#256EEC" rx="55" ry="48"></ellipse>
                <path d="M78 145 C78 175 142 175 142 145 Z" fill="#D9E2FF"></path>
                <ellipse cx="152" cy="88" fill="#256EEC" rx="34" ry="40"></ellipse>
                <ellipse cx="148" cy="88" fill="#FE64A2" rx="22" ry="26"></ellipse>
                <ellipse cx="110" cy="92" fill="#3478F6" rx="44" ry="42"></ellipse>
                <path d="M102 108 C102 125 96 138 90 142 C82 146 72 138 72 128 C72 110 82 86 98 75 C102 72 106 74 105 78 C104 83 95 100 95 116 C95 124 99 127 103 124 C108 118 112 110 114 105" fill="#3478F6" stroke="#00419C" strokeLinecap="round" strokeWidth="2.5"></path>
                <circle cx="94" cy="88" fill="#FFF" r="16" stroke="#FFD447" strokeWidth="4.5"></circle>
                <circle cx="126" cy="88" fill="#FFF" r="16" stroke="#FFD447" strokeWidth="4.5"></circle>
                <path d="M109 88 L111 88" stroke="#FFD447" strokeLinecap="round" strokeWidth="5"></path>
                <circle cx="96" cy="88" fill="#111C29" r="7"></circle>
                <circle cx="99" cy="85" fill="#FFF" r="2.5"></circle>
                <circle cx="128" cy="88" fill="#111C29" r="7"></circle>
                <circle cx="131" cy="85" fill="#FFF" r="2.5"></circle>
                <path d="M106 112 Q112 118 118 112" fill="none" stroke="#001945" strokeLinecap="round" strokeWidth="3"></path>
                <ellipse cx="80" cy="100" fill="#FE64A2" opacity="0.6" rx="6" ry="4"></ellipse>
                <ellipse cx="140" cy="100" fill="#FE64A2" opacity="0.6" rx="6" ry="4"></ellipse>
                <path d="M88 132 L132 132 L128 140 L92 140 Z" fill="#FFE087"></path>
                <path d="M110 138 L116 150 L110 168 L104 150 Z" fill="#0055C7"></path>
                <polygon fill="#FFE087" points="110,147 111.5,151 115.5,151 112.5,153 113.5,157 110,154.5 106.5,157 107.5,153 104.5,151 108.5,151"></polygon>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* SUPER QUESTION STUDIO */}
      <section className="w-full bg-white rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Super Question Studio</span>
          </div>
        </div>
        <div className="relative bg-gray-50 rounded-xl p-3 shadow-inner">
          <textarea 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask EdNova anything about math, science, space, history, or your homework..."
            className="w-full bg-transparent resize-none text-lg text-gray-800 placeholder-gray-400 focus:outline-none p-2"
            rows={2}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center flex-wrap gap-2">
              <button className="flex items-center gap-1.5 px-4 py-1 rounded-full bg-white shadow-sm text-sm font-bold">
                <span className="material-symbols-outlined text-[18px] text-blue-600">category</span>
                <span>All Subjects</span>
              </button>
            </div>
            <button onClick={handleAsk} className="flex items-center justify-center gap-2 px-6 py-2 rounded-full bg-blue-600 text-white font-bold shadow-[0_4px_0_#00419C] active:translate-y-1 transition-all">
              <span>Ask Nova</span>
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </div>
        </div>
      </section>

      {/* MOTIVATION BADGES */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl bg-white p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#ffd9e3] flex items-center justify-center shadow-[0_4px_0_#8E004C]">
              <span className="material-symbols-outlined text-[#af2464] text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-800">5 Days</span>
                <span className="text-xs font-bold uppercase bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">Awesome!</span>
              </div>
              <div className="text-sm font-bold text-gray-800">Learning Streak</div>
              <p className="text-xs text-gray-500">Keep your daily spark alive! 2 days to the Bronze Shield.</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-2xl bg-white p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#ffe087] flex items-center justify-center shadow-[0_4px_0_#574500]">
              <span className="material-symbols-outlined text-[#735c00] text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>monetization_on</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-800">240</span>
                <span className="text-xs font-bold uppercase bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">+20 today</span>
              </div>
              <div className="text-sm font-bold text-gray-800">Coins Earned</div>
              <p className="text-xs text-gray-500">Earned from asking questions, math drills & fun quizzes!</p>
            </div>
          </div>
        </div>
      </section>

      {/* COMPANION SECTION */}
      <section className="w-full bg-white rounded-2xl p-6 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-blue-600 text-xs font-bold mb-2">
              <span className="material-symbols-outlined text-[16px]">potted_plant</span>
              <span>Companion Sanctuary</span>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-800">Your Learning Companion</h2>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5 bg-[#eef4ff] rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden">
            <div className="relative z-10 w-full flex flex-col items-center">
              <div className="px-3 py-1 rounded-full bg-white text-blue-600 text-xs font-bold shadow-sm mb-3">Stage 2: Sprouting Blossom</div>
              <div className="w-44 h-44 flex items-center justify-center my-2 drop-shadow-md">
                <div className="w-full h-full flex items-center justify-center text-[100px] drop-shadow-md">🌻</div>
              </div>
              <div className="mt-4 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-1 rounded-full shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse"></span>
                <span className="text-xs font-bold text-gray-800">Status: Thriving & Hydrated</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <h2 className="text-3xl font-extrabold text-gray-800">Sproutley the Sunflower</h2>
                <span className="text-sm font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">Stage 2 of 4</span>
              </div>
              <p className="text-gray-600 mt-2">Sproutley loves curious minds. Every time you ask deep science or nature questions, Sproutley soaks in the excitement.</p>
              
              <div className="mt-6 bg-gray-50 p-4 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow-600 text-[20px]">energy_savings_leaf</span>
                    <span className="text-sm font-bold text-gray-800">Evolution Growth Bar</span>
                  </div>
                  <span className="text-sm font-extrabold text-gray-800">160 / 200 XP</span>
                </div>
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full transition-all duration-700" style={{ width: "80%" }}></div>
                </div>
                <div className="mt-2 flex items-center justify-between text-gray-500 text-xs">
                  <span>Current: Small Sprout</span>
                  <span className="text-yellow-600 font-bold">Next: Radiant Blossom (Stage 3)</span>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-3 bg-[#e5eeff] p-3 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">celebration</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-800 block">Stage 3 Milestone Perk:</span>
                  <span className="text-sm text-gray-600">Unlocks joyful celebration shower animations whenever you ask creative questions!</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 flex flex-col sm:flex-row items-center gap-4">
              <button className="w-full sm:w-auto px-6 py-3 rounded-full text-lg font-bold transition-all flex items-center justify-center gap-2 bg-blue-600 text-white shadow-[0_4px_0_#00419c] active:translate-y-1">
                <span className="material-symbols-outlined text-[22px]">water_drop</span>
                <span>Grow Sproutley Now (80 Coins)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}