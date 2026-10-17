"use client";
import { useState } from "react";
import Link from "next/link";

export default function Companions() {
  const [coins, setCoins] = useState(240);
  const [sproutXP, setSproutXP] = useState(160);
  const [sproutBloomed, setSproutBloomed] = useState(false);
  const [barnabyUnlocked, setBarnabyUnlocked] = useState(false);
  const [toast, setToast] = useState<{ title: string; desc: string } | null>(null);
  const [filter, setFilter] = useState<"all" | "plant" | "animal">("all");

  function showToast(title: string, desc: string) {
    setToast({ title, desc });
    setTimeout(() => setToast(null), 3500);
  }

  function handleGrowSproutley() {
    if (coins >= 80) {
      setCoins(coins - 80);
      setSproutXP(200);
      setSproutBloomed(true);
      showToast("Sproutley is Blooming!", "You spent 80 coins. Stage 3 perks unlocked!");
    }
  }

  function handleUnlockBarnaby() {
    if (coins >= 180) {
      setCoins(coins - 180);
      setBarnabyUnlocked(true);
      showToast("Welcome Barnaby! 🦉", "Barnaby the Curious Owl joined your companions!");
    } else {
      showToast("Need More Coins!", "Complete learning quests to earn more coins.");
    }
  }

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
            <Link href="/dashboard" className="px-4 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-white transition-all">Dashboard</Link>
            <Link href="/" className="px-4 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-white transition-all">Ask EdNova</Link>
            <Link href="/companions" className="px-4 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-white transition-all">My Companions</Link>
            <Link href="/explore" className="px-4 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-white transition-all">Explore Subjects</Link>
            <a className="px-4 py-2 rounded-full text-sm font-bold text-gray-600 hover:bg-white transition-all" href="#">Explore Subjects</a>
          </nav>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1 bg-[#ffd9e3] text-[#3e001e] px-3 py-1 rounded-full shadow-[0_2px_0_rgba(142,0,76,0.18)]">
              <span className="material-symbols-outlined text-[#af2464] text-[20px]">local_fire_department</span>
              <span className="text-xs font-bold">5 Day Streak</span>
            </div>
            <div className="flex items-center gap-1 bg-[#ffe087] text-[#231a00] px-3 py-1 rounded-full shadow-[0_2px_0_rgba(87,69,0,0.18)]">
              <span className="material-symbols-outlined text-[#735c00] text-[20px]">monetization_on</span>
              <span className="text-xs font-bold">{coins} Coins</span>
            </div>
            <div className="flex items-center gap-2 bg-white pl-1 pr-3 py-1 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">A</div>
              <span className="text-sm font-bold text-gray-800">Alex</span>
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="w-full pt-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#e5eeff] rounded-full text-blue-600 text-xs font-bold shadow-sm mb-2">
              <span className="material-symbols-outlined text-[16px]">potted_plant</span>
              <span>Tactile Sanctuary & Companions</span>
            </div>
            <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">Your Learning Companions & Garden 🌿🐾</h1>
            <p className="text-lg text-gray-500 mt-2">Earn coins by asking questions and doing daily quests. Choose how to nurture your friends!</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm">
              <div className="w-10 h-10 rounded-full bg-[#ffe087] flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">monetization_on</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-500">Coin Balance</span>
                <span className="text-lg font-extrabold text-gray-800 leading-none">{coins} Coins</span>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm">
              <div className="w-10 h-10 rounded-full bg-[#ffd9e3] flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">local_fire_department</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-500">Daily Streak</span>
                <span className="text-lg font-extrabold text-pink-600 leading-none">5 Days Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2">
          <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${filter === "all" ? "bg-blue-600 text-white shadow-[0_3px_0_#00419c]" : "bg-white text-gray-600 shadow-sm"}`}>
            <span className="material-symbols-outlined text-[18px]">apps</span> All Companions
          </button>
          <button onClick={() => setFilter("plant")} className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${filter === "plant" ? "bg-blue-600 text-white shadow-[0_3px_0_#00419c]" : "bg-white text-gray-600 shadow-sm"}`}>
            <span className="material-symbols-outlined text-[18px]">yard</span> Plant Friends (3)
          </button>
          <button onClick={() => setFilter("animal")} className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${filter === "animal" ? "bg-blue-600 text-white shadow-[0_3px_0_#00419c]" : "bg-white text-gray-600 shadow-sm"}`}>
            <span className="material-symbols-outlined text-[18px]">pets</span> Animal Companions (4)
          </button>
        </div>
      </section>

      {/* ACTIVE COMPANION SPOTLIGHT */}
      <section className="w-full mt-4 relative bg-white rounded-2xl p-6 md:p-8 shadow-sm overflow-hidden">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-yellow-100/50 blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#ffe087] text-[#231a00] text-xs font-bold shadow-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">stars</span> Currently Caring For
            </span>
            <span className="px-3 py-1 rounded-full bg-[#e5eeff] text-blue-600 text-xs font-bold">Plant Category</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full text-xs text-gray-500">
            <span className="material-symbols-outlined text-blue-600 text-[18px]">info</span>
            <span>Growth governed by Coins, not Streaks!</span>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="relative w-full max-w-sm aspect-square bg-gray-50 rounded-2xl p-6 flex flex-col items-center justify-center shadow-inner">
              <div className="absolute top-4 left-6 right-6 bg-white p-3 rounded-xl shadow-md flex items-center gap-2">
                <span className="material-symbols-outlined text-yellow-500 text-[20px] shrink-0">wb_sunny</span>
                <p className="text-sm text-gray-700">"Water me with sunshine coins to help me bloom into Stage 3!"</p>
              </div>
              
              <div className="w-48 h-48 flex items-center justify-center mt-8">
                <svg className="w-full h-full drop-shadow-md" fill="none" viewBox="0 0 160 160">
                  <path d="M45 100 L115 100 L108 145 C108 150 102 154 96 154 L64 154 C58 154 52 150 52 145 Z" fill="#E28B59"></path>
                  <rect fill="#F4A261" height="12" rx="6" width="80" x="40" y="94"></rect>
                  <ellipse cx="80" cy="100" fill="#5F3A1D" rx="35" ry="5"></ellipse>
                  <path d="M80 100 Q78 75 80 55" stroke="#489D5B" strokeLinecap="round" strokeWidth="8"></path>
                  <path d="M80 82 C65 82 50 76 46 64 C60 62 76 72 80 82 Z" fill="#59C978"></path>
                  <path d="M80 72 C95 72 110 66 114 54 C100 52 84 62 80 72 Z" fill="#59C978"></path>
                  <g transform="translate(80, 50)">
                    <ellipse cx="0" cy="-22" fill="#FFD447" rx="6" ry="12"></ellipse>
                    <ellipse cx="16" cy="-16" fill="#FFD447" rx="6" ry="12" transform="rotate(45 16 -16)"></ellipse>
                    <ellipse cx="22" cy="0" fill="#FFD447" rx="6" ry="12" transform="rotate(90 22 0)"></ellipse>
                    <ellipse cx="16" cy="16" fill="#FFD447" rx="6" ry="12" transform="rotate(135 16 16)"></ellipse>
                    <ellipse cx="0" cy="22" fill="#FFD447" rx="6" ry="12" transform="rotate(180 0 22)"></ellipse>
                    <ellipse cx="-16" cy="16" fill="#FFD447" rx="6" ry="12" transform="rotate(225 -16 16)"></ellipse>
                    <ellipse cx="-22" cy="0" fill="#FFD447" rx="6" ry="12" transform="rotate(270 -22 0)"></ellipse>
                    <ellipse cx="-16" cy="-16" fill="#FFD447" rx="6" ry="12" transform="rotate(315 -16 -16)"></ellipse>
                    <circle cx="0" cy="0" fill="#735C00" r="16"></circle>
                    <circle cx="0" cy="0" fill="#8B6F00" r="14"></circle>
                    <circle cx="-5" cy="-2" fill="#FFF" r="2.5"></circle>
                    <circle cx="5" cy="-2" fill="#FFF" r="2.5"></circle>
                    <path d="M-3 4 Q0 7 3 4" fill="none" stroke="#FFF" strokeLinecap="round" strokeWidth="1.5"></path>
                  </g>
                </svg>
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
                <span className="text-sm font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">Stage {sproutBloomed ? 3 : 2} of 4</span>
              </div>
              <p className="text-gray-600 mt-2">Sproutley loves curious minds. Every time you ask deep science or nature questions, Sproutley soaks in the excitement.</p>
              
              <div className="mt-6 bg-gray-50 p-4 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow-600 text-[20px]">energy_savings_leaf</span>
                    <span className="text-sm font-bold text-gray-800">Evolution Growth Bar</span>
                  </div>
                  <span className="text-sm font-extrabold text-gray-800">{sproutXP} / 200 XP</span>
                </div>
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full transition-all duration-700" style={{ width: `${(sproutXP / 200) * 100}%` }}></div>
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
                  <span className="text-sm text-gray-600">Unlocks joyful celebration shower animations whenever you ask creative questions to EdNova!</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={handleGrowSproutley}
                disabled={sproutBloomed}
                className={`w-full sm:w-auto px-6 py-3 rounded-full text-lg font-bold transition-all flex items-center justify-center gap-2 ${sproutBloomed ? "bg-gray-200 text-gray-500" : "bg-blue-600 text-white shadow-[0_4px_0_#00419c] active:translate-y-1"}`}
              >
                <span className="material-symbols-outlined text-[22px]">{sproutBloomed ? "auto_awesome" : "water_drop"}</span>
                <span>{sproutBloomed ? "Sproutley Bloomed!" : "Grow Sproutley Now (80 Coins)"}</span>
              </button>
              <span className="text-sm text-gray-500 text-center sm:text-left">
                You have <strong className="text-gray-800">{coins} coins</strong>. Plenty to evolve Sproutley!
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* COMPANIONS GRID */}
      <section className="w-full mt-10 mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-pink-600 text-xs font-bold">
              <span className="material-symbols-outlined text-[18px]">savings</span>
              <span>Strategy Decision</span>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight mt-1">Save for a New Friend</h2>
            <p className="text-gray-500 mt-1">Do you want to spend coins on Sproutley or save up to unlock another companion to learn with?</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Barnaby */}
          {(filter === "all" || filter === "animal") && (
            <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all hover:-translate-y-1">
              <div>
                <div className="flex items-center justify-between">
                  <span className="bg-pink-100 text-pink-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">cruelty_free</span> Animal
                  </span>
                  <div className="flex items-center gap-1 text-yellow-700 text-xs font-bold bg-yellow-100 px-2 py-1 rounded-full">
                    <span className="material-symbols-outlined text-[14px]">monetization_on</span> 180 Coins
                  </div>
                </div>
                <div className="w-full aspect-[4/3] bg-gray-50 rounded-xl mt-4 overflow-hidden flex items-center justify-center p-4">
                  <div className="w-24 h-24 text-6xl flex items-center justify-center">🦉</div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mt-4">Barnaby</h3>
                <p className="text-xs font-bold text-pink-600">The Curious Owl</p>
                <p className="text-sm text-gray-500 mt-2">Loves history & nocturnal mysteries. Asks thoughtful timeline questions!</p>
              </div>
              <div className="mt-4 pt-4">
                <button 
                  onClick={handleUnlockBarnaby}
                  disabled={barnabyUnlocked}
                  className={`w-full py-2 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 ${barnabyUnlocked ? "bg-gray-200 text-gray-500" : "bg-pink-600 text-white shadow-[0_4px_0_#8e004c] active:translate-y-1"}`}
                >
                  <span className="material-symbols-outlined text-[18px]">{barnabyUnlocked ? "favorite" : "lock_open"}</span>
                  <span>{barnabyUnlocked ? "Unlocked & In Garden" : "Unlock Now (180 Coins)"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Fern */}
          {(filter === "all" || filter === "plant") && (
            <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all hover:-translate-y-1">
              <div>
                <div className="flex items-center justify-between">
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">potted_plant</span> Plant
                  </span>
                  <div className="flex items-center gap-1 text-gray-500 text-xs font-bold bg-gray-100 px-2 py-1 rounded-full">
                    <span className="material-symbols-outlined text-[14px]">monetization_on</span> 300 Coins
                  </div>
                </div>
                <div className="w-full aspect-[4/3] bg-gray-50 rounded-xl mt-4 overflow-hidden flex items-center justify-center p-4">
                  <div className="w-24 h-24 text-6xl flex items-center justify-center">🌿</div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mt-4">Fern</h3>
                <p className="text-xs font-bold text-blue-600">The Dino Fern</p>
                <p className="text-sm text-gray-500 mt-2">Prehistoric botanical explorer fascinated by geology, fossils, and dinosaurs.</p>
              </div>
              <div className="mt-4 pt-4">
                <div className="w-full bg-gray-100 rounded-full h-3 mb-2 p-0.5">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: "80%" }}></div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>240 / 300 Coins</span>
                  <span className="text-blue-600 font-bold">60 more</span>
                </div>
                <button className="w-full py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-400 cursor-not-allowed flex items-center justify-center gap-2" disabled>
                  <span className="material-symbols-outlined text-[18px]">savings</span> Saving Coins
                </button>
              </div>
            </div>
          )}

          {/* Pip */}
          {(filter === "all" || filter === "animal") && (
            <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all hover:-translate-y-1">
              <div>
                <div className="flex items-center justify-between">
                  <span className="bg-pink-100 text-pink-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">cruelty_free</span> Animal
                  </span>
                  <div className="flex items-center gap-1 text-gray-500 text-xs font-bold bg-gray-100 px-2 py-1 rounded-full">
                    <span className="material-symbols-outlined text-[14px]">monetization_on</span> 350 Coins
                  </div>
                </div>
                <div className="w-full aspect-[4/3] bg-gray-50 rounded-xl mt-4 overflow-hidden flex items-center justify-center p-4">
                  <div className="w-24 h-24 text-6xl flex items-center justify-center">🦊</div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mt-4">Pip</h3>
                <p className="text-xs font-bold text-pink-600">The Explorer Fox</p>
                <p className="text-sm text-gray-500 mt-2">Quick with math riddles and logic puzzles. Boosts quiz streak bonuses!</p>
              </div>
              <div className="mt-4 pt-4">
                <div className="w-full bg-gray-100 rounded-full h-3 mb-2 p-0.5">
                  <div className="bg-pink-500 h-full rounded-full" style={{ width: "68%" }}></div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>240 / 350 Coins</span>
                  <span className="text-pink-600 font-bold">110 more</span>
                </div>
                <button className="w-full py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-400 cursor-not-allowed flex items-center justify-center gap-2" disabled>
                  <span className="material-symbols-outlined text-[18px]">lock</span> Locked
                </button>
              </div>
            </div>
          )}

          {/* Luna */}
          {(filter === "all" || filter === "plant") && (
            <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all hover:-translate-y-1">
              <div>
                <div className="flex items-center justify-between">
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">potted_plant</span> Plant
                  </span>
                  <div className="flex items-center gap-1 text-gray-500 text-xs font-bold bg-gray-100 px-2 py-1 rounded-full">
                    <span className="material-symbols-outlined text-[14px]">monetization_on</span> 500 Coins
                  </div>
                </div>
                <div className="w-full aspect-[4/3] bg-gray-50 rounded-xl mt-4 overflow-hidden flex items-center justify-center p-4">
                  <div className="w-24 h-24 text-6xl flex items-center justify-center">🌵</div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mt-4">Luna</h3>
                <p className="text-xs font-bold text-blue-600">The Moon Cactus</p>
                <p className="text-sm text-gray-500 mt-2">Blooms under starry night skies. Unlocks evening calm reading rewards.</p>
              </div>
              <div className="mt-4 pt-4">
                <div className="w-full bg-gray-100 rounded-full h-3 mb-2 p-0.5">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: "48%" }}></div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>240 / 500 Coins</span>
                  <span className="text-gray-600 font-bold">260 more</span>
                </div>
                <button className="w-full py-2 rounded-full text-sm font-bold bg-gray-100 text-gray-400 cursor-not-allowed flex items-center justify-center gap-2" disabled>
                  <span className="material-symbols-outlined text-[18px]">lock</span> Locked
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 right-6 max-w-sm bg-white p-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">check</span>
          </div>
          <div>
            <span className="font-bold text-gray-800 block">{toast.title}</span>
            <span className="text-sm text-gray-500">{toast.desc}</span>
          </div>
        </div>
      )}
    </main>
  );
}